require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());

// --- Database Connection ---
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Successfully connected to MongoDB Atlas'))
    .catch(err => console.error('Database connection error:', err));

// --- Mongoose Schema and Model ---
const messageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    senderName: { type: String, default: 'Anonymous' },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    isPrivate: { type: Boolean, default: false },
    creator: { type: String, required: true },
    users: [{ 
        id: { type: String, required: true },
        name: { type: String, default: 'Anonymous' },
        permissions: { type: String, enum: ['edit', 'view'], default: 'view' }
    }],
    strokes: [mongoose.Schema.Types.Mixed],
    undoStack: [[mongoose.Schema.Types.Mixed]],
    redoStack: [[mongoose.Schema.Types.Mixed]],
    messages: [messageSchema]
});

const Room = mongoose.model('Room', roomSchema);

const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://collaborative-whiteboard-with-real-sable.vercel.app"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

const hasEditPermission = async (socketId, roomId) => {
    const room = await Room.findOne({ roomId });
    if (!room) return false;
    const user = room.users.find(u => u.id === socketId);
    return user && user.permissions === 'edit';
};

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('join-room', async (roomId, username, callback) => {
    try {
      let room = await Room.findOne({ roomId });
      let isCreator = false;

      if (!room) {
        const isPrivate = roomId !== 'public';
        isCreator = true;
        
        room = new Room({ 
            roomId, 
            isPrivate,
            creator: socket.id,
            users: [], 
            strokes: [], 
            undoStack: [], 
            redoStack: [],
            messages: [] 
        });
      }
      
      // If public room and no users, clear messages
      if (room.roomId === 'public' && (!room.users || room.users.length === 0)) {
        room.messages = [];
      }
      
      let user = room.users.find(u => u.id === socket.id);
      if (!user) {
          const permissions = (isCreator || !room.isPrivate) ? 'edit' : 'view';
          user = { 
              id: socket.id, 
              name: username || 'Anonymous',
              permissions: permissions
          };
          room.users.push(user);
      } else {
          if (username && user.name !== username) {
              user.name = username;
          }
          if (user.id === room.creator) {
              user.permissions = 'edit';
          }
      }
      
      await room.save();
      socket.join(roomId);

      if (callback) callback(true);

      console.log('EMIT room-joined:', {
        userId: socket.id,
        permissions: user.permissions,
        isCreator,
        isPrivate: room.isPrivate,
        creator: room.creator,
        users: room.users.map(u => ({ id: u.id, permissions: u.permissions }))
      });
      socket.emit('room-joined', { 
        roomId: room.roomId, 
        strokes: room.strokes, 
        permissions: user.permissions,
        messages: room.roomId === 'public' ? [] : room.messages,
        users: room.users,
        creatorId: room.creator
      });

      io.to(roomId).emit('user-list-updated', { users: room.users });

      console.log(`User ${socket.id} joined room ${roomId} with ${user.permissions} permissions as ${user.name}.`);

    } catch (error) {
      console.error('Error joining room:', error);
      if (callback) callback(false);
    }
  });

  socket.on('change-permissions', async ({ roomId, targetUserId, newPermission }) => {
    try {
        const roomDoc = await Room.findOne({ roomId });
        if (!roomDoc || roomDoc.creator !== socket.id) {
            // Only the creator can change permissions
            return; 
        }

        const userToUpdate = roomDoc.users.find(u => u.id === targetUserId);
        if (userToUpdate) {
            userToUpdate.permissions = newPermission;
            roomDoc.markModified('users');
            await roomDoc.save();

            // Notify the specific user about their new permissions
            io.to(targetUserId).emit('my-permissions-updated', { permissions: newPermission });
            // Notify everyone in the room about the updated user list
            io.to(roomId).emit('user-list-updated', { users: roomDoc.users });
        }
    } catch (error) {
        console.error('Error changing permissions:', error);
    }
  });

  socket.on('live-erase', async ({ room, data }) => {
    if (!(await hasEditPermission(socket.id, room))) return;
    socket.to(room).emit('live-erase', data);
  });

  socket.on('send-message', async ({ room, messageContent }) => {
    try {
        const roomDoc = await Room.findOne({ roomId: room });
        if (roomDoc) {
            const user = roomDoc.users.find(u => u.id === socket.id);
            const newMessage = {
                senderId: socket.id,
                senderName: user ? user.name : 'Anonymous',
                content: messageContent,
            };
            roomDoc.messages.push(newMessage);
            await roomDoc.save();
            io.to(room).emit('new-message', newMessage);
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
  });

  socket.on('drawing', async ({ room, data }) => {
    if (!(await hasEditPermission(socket.id, room))) return;
    try {
      const roomDoc = await Room.findOne({ roomId: room });
      if (roomDoc) {
        roomDoc.undoStack.push(JSON.parse(JSON.stringify(roomDoc.strokes)));
        roomDoc.strokes.push(data);
        roomDoc.redoStack = []; 
        await roomDoc.save();
        console.log('DRAWING EVENT:', { room, strokesLength: roomDoc.strokes.length });
        io.to(room).emit('strokes', roomDoc.strokes);
      }
    } catch (error) {
      console.error('Error saving drawing:', error);
    }
  });

  socket.on('clear', async (room) => {
    if (!(await hasEditPermission(socket.id, room))) return;
    try {
      const roomDoc = await Room.findOne({ roomId: room });
      if (roomDoc) {
        roomDoc.undoStack.push(JSON.parse(JSON.stringify(roomDoc.strokes)));
        roomDoc.strokes = [];
        roomDoc.redoStack = [];
        await roomDoc.save();
        io.to(room).emit('strokes', roomDoc.strokes);
      }
    } catch (error) {
      console.error('Error clearing canvas:', error);
    }
  });

  socket.on('undo', async (room) => {
    if (!(await hasEditPermission(socket.id, room))) return;
    try {
      const roomDoc = await Room.findOne({ roomId: room });
      if (!roomDoc || roomDoc.undoStack.length === 0) return;

      const currentStrokes = JSON.parse(JSON.stringify(roomDoc.strokes));
      roomDoc.redoStack.push(currentStrokes);

      const previousStrokes = roomDoc.undoStack.pop();
      roomDoc.strokes = previousStrokes;
      
      await roomDoc.save();
      io.to(room).emit('strokes', roomDoc.strokes);

    } catch (error) {
      console.error('Error during undo:', error);
    }
  });

  socket.on('redo', async (room) => {
    if (!(await hasEditPermission(socket.id, room))) return;
    try {
      const roomDoc = await Room.findOne({ roomId: room });
      if (!roomDoc || roomDoc.redoStack.length === 0) return;

      const currentStrokes = JSON.parse(JSON.stringify(roomDoc.strokes));
      roomDoc.undoStack.push(currentStrokes);

      const nextStrokes = roomDoc.redoStack.pop();
      roomDoc.strokes = nextStrokes;

      await roomDoc.save();
      io.to(room).emit('strokes', roomDoc.strokes);

    } catch (error) {
      console.error('Error during redo:', error);
    }
  });

  socket.on('erase-commit', async ({ room, originalStrokes, finalStrokes }) => {
    if (!(await hasEditPermission(socket.id, room))) return;
    try {
      const roomDoc = await Room.findOne({ roomId: room });
      if (!roomDoc) return;
      
      roomDoc.undoStack.push(originalStrokes);
      roomDoc.strokes = finalStrokes;
      roomDoc.redoStack = [];
      await roomDoc.save();
      
      io.to(room).emit('strokes', roomDoc.strokes);

    } catch (error) {
      console.error('Error during erase commit:', error);
    }
  });

  socket.on('text', async ({ room, data }) => {
    if (!(await hasEditPermission(socket.id, room))) return;
    try {
        const roomDoc = await Room.findOne({ roomId: room });
        if (roomDoc) {
            roomDoc.undoStack.push(JSON.parse(JSON.stringify(roomDoc.strokes)));
            roomDoc.strokes.push(data);
            roomDoc.redoStack = []; 
            await roomDoc.save();
            io.to(room).emit('strokes', roomDoc.strokes);
        }
    } catch (error) {
        console.error('Error saving text:', error);
    }
  });

  socket.on('updateText', async ({ room, data }) => {
    if (!(await hasEditPermission(socket.id, room))) return;
    try {
      const roomDoc = await Room.findOne({ roomId: room });
      if (!roomDoc) return;

      const originalStrokes = JSON.parse(JSON.stringify(roomDoc.strokes));
      const strokeIndex = roomDoc.strokes.findIndex(s => s.id === data.id);

      if (strokeIndex !== -1) {
        roomDoc.undoStack.push(originalStrokes);
        roomDoc.strokes[strokeIndex] = data;
        roomDoc.redoStack = [];
        roomDoc.markModified('strokes');
        await roomDoc.save();
        io.to(room).emit('strokes', roomDoc.strokes);
      }
    } catch (error) {
      console.error('Error updating text:', error);
    }
  });

  socket.on('disconnect', async () => {
    try {
      // Remove user from all rooms
      const rooms = await Room.find({ 'users.id': socket.id });
      for (const room of rooms) {
        room.users = room.users.filter(u => u.id !== socket.id);
        await room.save();
        io.to(room.roomId).emit('user-list-updated', { users: room.users });
        // If this is the public room and now empty, clear messages
        if (room.roomId === 'public' && room.users.length === 0) {
          room.messages = [];
          await room.save();
        }
      }
    } catch (err) {
      console.error('Error during disconnect cleanup:', err);
    }
  });

  // --- WebRTC Signaling Events ---
  socket.on('join-voice', (roomId) => {
    const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
    const otherUsers = [];
    if (socketsInRoom) {
      socketsInRoom.forEach(socketId => {
        if (socketId !== socket.id) {
          otherUsers.push(socketId);
        }
      });
    }
    socket.emit('all-other-users', otherUsers);
  });

  socket.on('sending-signal', payload => {
    io.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerID: payload.callerID });
  });

  socket.on('returning-signal', payload => {
    io.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
  });

});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});