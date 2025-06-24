import { io } from 'socket.io-client';

// Use Render backend URL in production, localhost in development
const URL = process.env.NODE_ENV === 'production'
  ? 'https://collaborative-whiteboard-with-real-time-ir8n.onrender.com'
  : 'http://localhost:3001';

export const socket = io(URL, {
    autoConnect: false
}); 