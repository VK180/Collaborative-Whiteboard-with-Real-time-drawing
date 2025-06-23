import { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './App.css'
import Whiteboard from './components/Whiteboard'
import Toolbar from './components/Toolbar';
import Room from './components/Room';
import Chat from './components/Chat';
import { socket } from './socket';

const HomePage = () => {
  const navigate = useNavigate();

  const handleGoToPublic = () => {
    navigate(`/room/public`);
  };

  const handleCreatePrivate = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    navigate(`/room/${newRoomId}`);
  };

  return <Room 
    onGoToPublic={handleGoToPublic} 
    onCreatePrivate={handleCreatePrivate} 
  />;
};

const WhiteboardPage = () => {
  const { roomId } = useParams();
  const [color, setColor] = useState('#000000');
  const [tool, setTool] = useState('pen');
  const [fontSize, setFontSize] = useState(20);
  const [lineWidth, setLineWidth] = useState(5);
  const whiteboardRef = useRef();
  const [canEdit, setCanEdit] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [creatorId, setCreatorId] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [showPrompt, setShowPrompt] = useState(!localStorage.getItem('username'));
  const [activeUserId, setActiveUserId] = useState(null);

  useEffect(() => {
    if (!showPrompt) {
      if (!socket.connected) {
        socket.connect();
      }
      let joined = false;
      function joinRoom() {
        if (joined) return;
        joined = true;
        localStorage.setItem('username', username.trim());
        socket.emit('join-room', roomId, username.trim(), (success) => {
          if (!success) {
            alert('Room does not exist!');
            window.location.href = '/';
          }
        });
      }
      if (socket.connected) {
        joinRoom();
      } else {
        socket.on('connect', joinRoom);
      }

      const handleRoomJoined = ({ strokes, permissions, messages: initialMessages, users: userList, creatorId: roomCreator, roomId: joinedRoomId }) => {
        if ((roomId || joinedRoomId) === "public") {
          setCanEdit(true);
        } else {
          setCanEdit(permissions === 'edit');
        }
        whiteboardRef.current?.setStrokes(strokes);
        setMessages(initialMessages || []);
        setUsers(userList || []);
        setCreatorId(roomCreator || '');
      };

      const handleUserListUpdate = ({ users: updatedUsers }) => {
        setUsers(updatedUsers || []);
        if (roomId === "public") {
          setCanEdit(true);
          return;
        }
        const me = updatedUsers.find(u => u.id === socket.id);
        if (me) {
          setCanEdit(me.permissions === 'edit');
        }
      };

      const handleMyPermissionsUpdate = ({ permissions }) => {
        console.log(`My permissions updated to: ${permissions}`);
        setCanEdit(permissions === 'edit');
      };

      socket.on('room-joined', handleRoomJoined);
      socket.on('user-list-updated', handleUserListUpdate);
      socket.on('my-permissions-updated', handleMyPermissionsUpdate);

      return () => {
        socket.off('room-joined', handleRoomJoined);
        socket.off('user-list-updated', handleUserListUpdate);
        socket.off('my-permissions-updated', handleMyPermissionsUpdate);
        socket.off('connect', joinRoom);
      };
    }
  }, [roomId, socket, showPrompt, username]);

  useEffect(() => {
    console.log('App Render: socket.id =', socket.id, 'canEdit =', canEdit, 'roomId =', roomId);
  }, [canEdit, roomId]);

  const handleColorChange = (newColor) => {
    setColor(newColor);
  };

  const handleToolChange = (newTool) => {
    setTool(newTool);
  };

  const handleFontSizeChange = (newSize) => {
    setFontSize(parseInt(newSize, 10));
  };

  const handleLineWidthChange = (newWidth) => {
    setLineWidth(parseInt(newWidth, 10));
  };

  const handleClear = () => {
    socket.emit('clear', roomId);
  };

  const handleUndo = () => {
    if (whiteboardRef.current) {
      whiteboardRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (whiteboardRef.current) {
      whiteboardRef.current.redo();
    }
  };

  const handleExport = (format) => {
    if (whiteboardRef.current) {
      whiteboardRef.current.exportCanvas(format);
    }
  };

  if (showPrompt) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
        <form onSubmit={e => { e.preventDefault(); if (username.trim()) { setShowPrompt(false); } }} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)', padding: '2.5rem 2.5rem 2rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 320 }}>
          <h2 style={{ marginBottom: 18, color: '#2563eb' }}>Enter your username</h2>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Your name..."
            style={{ fontSize: '1.1rem', padding: '12px', borderRadius: 8, border: '1.5px solid #c3cfe2', marginBottom: 18, width: '100%' }}
            autoFocus
            maxLength={24}
          />
          <button type="submit" style={{ padding: '12px 25px', fontSize: '1rem', borderRadius: '8px', cursor: 'pointer', width: '100%', border: 'none', fontWeight: '600', background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)', color: '#fff' }}>Continue</button>
        </form>
      </div>
    );
  }

  return (
    <div className="whiteboard-page-container">
      <div className="main-content" style={{height: 'calc(100vh - 0px)'}}>
        <Toolbar
          color={color}
          onColorChange={handleColorChange}
          onClear={handleClear}
          onUndo={handleUndo}
          onRedo={handleRedo}
          tool={tool}
          onToolChange={handleToolChange}
          fontSize={fontSize}
          onFontSizeChange={handleFontSizeChange}
          lineWidth={lineWidth}
          onLineWidthChange={handleLineWidthChange}
          onExport={handleExport}
          canEdit={canEdit}
          room={roomId}
        />
        <Whiteboard
          ref={whiteboardRef}
          socket={socket}
          color={color}
          tool={tool}
          fontSize={fontSize}
          lineWidth={lineWidth}
          room={roomId}
          canEdit={canEdit}
          setActiveUserId={setActiveUserId}
        />
      </div>
      <Chat
        socket={socket}
        room={roomId}
        initialMessages={roomId === 'public' ? [] : messages}
        users={users}
        creatorId={creatorId}
        currentUserId={socket.id}
        activeUserId={activeUserId}
      />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<WhiteboardPage />} />
      </Routes>
    </div>
  )
}

export default App
