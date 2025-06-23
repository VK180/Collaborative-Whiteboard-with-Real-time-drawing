import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ socket, room, initialMessages, users, creatorId, currentUserId, activeUserId }) => {
    const [messages, setMessages] = useState(initialMessages || []);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current) {
            setMessages(initialMessages || []);
            initializedRef.current = true;
        }
    }, [initialMessages]);

    useEffect(() => {
        const handleNewMessage = (message) => {
            setMessages(prevMessages => [...prevMessages, message]);
        };

        socket.on('new-message', handleNewMessage);

        return () => {
            socket.off('new-message', handleNewMessage);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            socket.emit('send-message', { room, messageContent: newMessage });
            setNewMessage('');
        }
    };

    const handlePermissionChange = (targetUserId, newPermission) => {
        socket.emit('change-permissions', {
            roomId: room,
            targetUserId,
            newPermission
        });
    };
    
    return (
        <div style={chatContainerStyle}>
            {room !== 'public' && (
                <div style={userListStyle}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#444' }}>Users ({users.length})</h4>
                    {users.map(user => (
                        <div key={user.id} style={userItemStyle}>
                            <span style={{ fontWeight: 600, color: '#2563eb', marginRight: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                {user.name ? user.name : `User...${user.id.slice(-4)}`}
                                {user.id === creatorId && ' (Creator)'}
                                {activeUserId === user.id && (
                                    <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 4px #22c55e88', marginLeft: 2 }} title="Active now"></span>
                                )}
                            </span>
                            {currentUserId === creatorId && user.id !== creatorId ? (
                                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <select
                                        value={user.permissions}
                                        onChange={(e) => handlePermissionChange(user.id, e.target.value)}
                                        style={permissionSelectStyle}
                                    >
                                        <option value="edit">Edit</option>
                                        <option value="view">View</option>
                                    </select>
                                    <span style={{ fontSize: '0.85em', color: '#888' }}>({user.permissions})</span>
                                </label>
                            ) : (
                                <span style={{ color: '#666', textTransform: 'capitalize', marginLeft: 6 }}>{user.permissions}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <div style={messagesContainerStyle}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={msg.senderId === currentUserId ? myMessageStyle : messageStyle}
                    >
                        <div style={{ fontWeight: 700, fontSize: '0.93em', color: msg.senderId === currentUserId ? '#fff' : '#2563eb', marginBottom: 2, letterSpacing: 0.2 }}>{msg.senderName === 'Anonymous' ? `User...${msg.senderId.slice(-4)}` : msg.senderName}</div>
                        <div style={{ marginTop: 2, fontSize: '1em', color: msg.senderId === currentUserId ? '#fff' : '#222', wordBreak: 'break-word' }}>{msg.content}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} style={{
                display: 'flex',
                background: '#fff',
                padding: '10px 12px',
                borderRadius: '0 0 18px 18px',
                boxShadow: '0 -2px 8px 0 rgba(31, 38, 135, 0.04)',
                width: '100%',
            }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        outline: 'none',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        background: '#fff',
                        color: '#222',
                        marginRight: '10px',
                        boxShadow: '0 1px 4px 0 rgba(31, 38, 135, 0.04)',
                    }}
                />
                <button type="submit" style={buttonStyle}>Send</button>
            </form>
        </div>
    );
};

const userListStyle = {
    maxHeight: '150px',
    overflowY: 'auto',
    padding: '10px',
    borderBottom: '1px solid #ddd',
    background: '#f9f9f9',
};

const userItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    fontSize: '0.9rem',
};

const permissionSelectStyle = {
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1.5px solid #c3cfe2',
    background: 'rgba(245, 247, 250, 0.95)',
    color: '#2563eb',
    fontWeight: 600,
    fontSize: '0.97em',
    boxShadow: '0 1px 4px 0 rgba(80,180,255,0.07)',
    outline: 'none',
    transition: 'border 0.18s, box-shadow 0.18s',
};

const chatContainerStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '340px',
    height: '480px',
    border: 'none',
    borderRadius: '18px',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
    zIndex: 1000,
    overflow: 'hidden',
};

const messagesContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '18px 14px 12px 14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px',
    background: '#fff',
};

const messageStyle = {
    padding: '10px 16px',
    borderRadius: '16px',
    background: '#fff',
    color: '#222',
    maxWidth: '85%',
    wordWrap: 'break-word',
    boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.07)',
    fontSize: '1rem',
    fontWeight: 500,
    border: '1px solid #e3e8ee',
};

const myMessageStyle = {
    ...messageStyle,
    alignSelf: 'flex-end',
    background: 'linear-gradient(90deg, #1976d2 0%, #00c6ff 100%)',
    color: '#fff',
    border: 'none',
};

const buttonStyle = {
    padding: '10px 22px',
    border: 'none',
    background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '1rem',
    borderRadius: '12px',
    fontWeight: 600,
    boxShadow: '0 1px 4px 0 rgba(31, 38, 135, 0.08)',
    transition: 'background 0.2s',
};

export default Chat; 