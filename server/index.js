// Simple Node.js + Express + Socket.IO backend for real-time chat

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerUser, loginUser, auth, getProfile, updateProfile } from './auth.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// User registration
app.post('/api/register', registerUser);
// User login
app.post('/api/login', loginUser);
// Profile routes
app.get('/api/profile', auth, getProfile);
app.put('/api/profile', auth, updateProfile);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
