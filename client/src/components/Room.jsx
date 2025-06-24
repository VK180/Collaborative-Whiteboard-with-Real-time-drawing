import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Room = () => {
    const [username, setUsername] = useState('');
    const [showPrompt, setShowPrompt] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const navigate = useNavigate();

    const handleUsernameSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            setShowPrompt(false);
            if (pendingAction === 'private') {
                const newRoomId = Math.random().toString(36).substring(2, 8);
                navigate(`/room/${newRoomId}`, { state: { username: username.trim() } });
            }
            if (pendingAction === 'public') {
                navigate(`/room/public`, { state: { username: username.trim() } });
            }
        }
    };

    const handlePrivateClick = () => {
        setPendingAction('private');
        setShowPrompt(true);
    };
    const handlePublicClick = () => {
        setPendingAction('public');
        setShowPrompt(true);
    };

    const cardIcon = (path) => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {path}
        </svg>
    );

    return (
        <div style={{ ...pageStyle, background: 'linear-gradient(120deg, #e0e7ff 0%, #f0fdfa 100%)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'radial-gradient(ellipse at 60% 40%, #a5b4fc33 0%, #f0fdfa00 80%)',
                zIndex: 0,
                pointerEvents: 'none',
                animation: 'fadeInBg 1.2s',
            }} />
            {showPrompt && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(240,245,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
                    <form
                        onSubmit={handleUsernameSubmit}
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
            )}
            <div style={{display:'flex',flexDirection:'column',alignItems:'center', animation: 'fadeInLogo 1.2s'}}>
                <svg style={{...logoStyle, width: '68px', height: '68px'}} viewBox="0 0 48 48" fill="none"><rect x="6" y="6" width="36" height="36" rx="10" fill="#4facfe"/><path d="M16 32L32 16" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/><circle cx="18.5" cy="18.5" r="2.5" fill="#fff"/><circle cx="29.5" cy="29.5" r="2.5" fill="#fff"/></svg>
                <header style={headerStyle}>
                    <h1 style={h1Style}>Collaborative Whiteboard</h1>
                    <div style={{ fontSize: '1.15rem', color: '#6366f1', fontWeight: 500, marginBottom: 8, marginTop: 2, letterSpacing: 0.2 }}>Real-time, creative, and secure collaboration</div>
                    <p style={pStyle}>Create, share, and brainstorm in real-time. Your canvas awaits.</p>
                </header>
            </div>
            <div style={{...cardsContainerStyle, zIndex: 1}}>
                {/* Public Board Card */}
                <div style={{...cardStyle, animation: 'fadeInCard 1.2s'}} className="modern-card">
                    {cardIcon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>)}
                    <h2 style={h2Style}>Public Board</h2>
                    <p style={cardPStyle}>Jump into a shared space. Open to everyone.</p>
                    <button onClick={handlePublicClick} style={{...buttonStyle, ...publicButtonStyle, fontSize: '1.08rem', boxShadow: '0 2px 12px #4facfe22', position: 'relative', overflow: 'hidden'}}>
                        Enter Public Board
                    </button>
                </div>

                {/* Private Link Card */}
                <div style={{...cardStyle, animation: 'fadeInCard 1.2s 0.1s'}} className="modern-card">
                    {cardIcon(<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></>)}
                    <h2 style={h2Style}>Private Board</h2>
                    <p style={cardPStyle}>Create a secure room and invite others to join.</p>
                    <button onClick={handlePrivateClick} style={{...buttonStyle, ...privateButtonStyle, fontSize: '1.08rem', boxShadow: '0 2px 12px #84fab022', position: 'relative', overflow: 'hidden'}}>
                        Create Private Board
                    </button>
                </div>

            </div>
            <footer style={{...footerStyle, position: 'sticky', bottom: 0, zIndex: 2, background: 'rgba(255,255,255,0.7)', boxShadow: '0 -2px 12px #6366f122', borderRadius: '18px 18px 0 0', padding: '1.2rem 0 0.5rem 0', marginTop: '2.5rem'}}>
                <a href="https://github.com/PV-SAI-SUBHASH/CWB" target="_blank" rel="noopener noreferrer" style={iconStyle}>
                    <svg height="28" viewBox="0 0 16 16" version="1.1" width="28" aria-hidden="true"><path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
                </a>
            </footer>
            <style>{`
                @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInLogo { from { opacity: 0; transform: translateY(-24px);} to { opacity: 1; transform: none; } }
                @keyframes fadeInCard { from { opacity: 0; transform: translateY(32px);} to { opacity: 1; transform: none; } }
                .modern-card { transition: box-shadow 0.22s, transform 0.18s; }
                .modern-card:hover { box-shadow: 0 16px 48px 0 rgba(31, 38, 135, 0.22); transform: translateY(-6px) scale(1.045); }
                button:active { box-shadow: 0 1px 4px #6366f133; }
            `}</style>
        </div>
    );
};

// Styles
const pageStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#333'
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '3rem',
};

const h1Style = {
    fontSize: '3rem',
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: '0.5rem'
};

const pStyle = {
    fontSize: '1.2rem',
    color: '#4a5568',
    maxWidth: '600px',
};

const cardsContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
};

const cardStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    padding: '2rem',
    width: '320px',
    textAlign: 'center',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
};

const h2Style = {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#2d3748',
    margin: 0
};

const cardPStyle = {
    fontSize: '1rem',
    color: '#4a5568',
    lineHeight: 1.5,
    flexGrow: 1
};

const buttonStyle = {
    padding: '12px 25px',
    fontSize: '1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    border: 'none',
    fontWeight: '600',
    transition: 'transform 0.2s',
};

const publicButtonStyle = {
    background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white',
};

const privateButtonStyle = {
    background: 'linear-gradient(90deg, #84fab0 0%, #8fd3f4 100%)',
    color: 'white',
};

const footerStyle = {
    marginTop: '3rem',
    textAlign: 'center'
};

const iconStyle = {
    color: '#4a5568',
    transition: 'color 0.2s'
};

const logoStyle = {
    width: '54px',
    height: '54px',
    marginBottom: '1.2rem',
    filter: 'drop-shadow(0 2px 12px rgba(80,180,255,0.18))',
};

export default Room; 