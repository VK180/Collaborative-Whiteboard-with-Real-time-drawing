import { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [color, setColor] = useState('#000000');
  const [tool, setTool] = useState('pen');
  const [fontSize, setFontSize] = useState(20);
  const [lineWidth, setLineWidth] = useState(5);
  const whiteboardRef = useRef();
  const [canEdit, setCanEdit] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [creatorId, setCreatorId] = useState('');
  const [username, setUsername] = useState(location.state?.username || '');
  const [showPrompt, setShowPrompt] = useState(!location.state?.username);
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
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(240,245,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
        <form
          onSubmit={e => { e.preventDefault(); if (username.trim()) { setShowPrompt(false); } }}
          style={{
            background: 'rgba(255, 255, 255, 0.25)',
            borderRadius: 20,
            boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
            padding: '2.5rem 2.5rem 2rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 340,
            border: '1.5px solid rgba(255,255,255,0.35)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'box-shadow 0.2s',
          }}
        >
          <h2 style={{ marginBottom: 18, color: '#2563eb', fontWeight: 700, letterSpacing: 0.2 }}>Enter your username</h2>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Your name..."
            style={{
              fontSize: '1.1rem',
              padding: '14px',
              borderRadius: 12,
              border: '1.5px solid #c3cfe2',
              marginBottom: 18,
              width: '100%',
              background: 'rgba(255,255,255,0.7)',
              boxShadow: '0 2px 8px 0 rgba(31,38,135,0.07)',
              outline: 'none',
              color: '#222',
              transition: 'border 0.18s, box-shadow 0.18s',
            }}
            autoFocus
            maxLength={24}
          />
          <button
            type="submit"
            style={{
              padding: '14px 32px',
              borderRadius: 12,
              fontSize: '1.1rem',
              fontWeight: 700,
              border: 'none',
              background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
              color: '#fff',
              boxShadow: '0 2px 12px #4facfe33',
              cursor: 'pointer',
              transition: 'transform 0.13s, box-shadow 0.18s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Continue
          </button>
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
