// Simple Node.js + Express + Socket.IO backend for real-time chat

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerUser, loginUser, auth, getProfile, updateProfile } from './auth.js';
import User from './models/User.mjs';
import Friendship from './models/Friendship.mjs';
import Message from './models/Message.mjs';
import Conversation from './models/Conversation.mjs';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure allowed origins from environment
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// User registration
app.post('/api/register', registerUser);
// User login
app.post('/api/login', loginUser);
// Profile routes
app.get('/api/profile', auth, getProfile);
app.put('/api/profile', auth, updateProfile);

// Friendship routes
// Send friend request
app.post('/api/friends/request', auth, async (req, res) => {
  console.log(`📨 Friend request: ${req.user.username} -> ${req.body.username}`);
  try {
    const { username } = req.body;
    const targetUser = await User.findOne({ username });
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }
    
    const friendship = await Friendship.sendRequest(req.user._id, targetUser._id);
    
    // Emit real-time notification to the target user using room system
    const roomName = `user_${targetUser._id}`;
    const notificationData = {
      id: friendship._id,
      type: 'friend_request',
      sender: {
        _id: req.user._id,
        username: req.user.username,
        firstName: req.user.firstName,
        avatar: req.user.avatar
      },
      createdAt: friendship.createdAt
    };
    
    console.log(`🎯 Sending notification to room: ${roomName}`);
    console.log(`📦 Notification data:`, notificationData);
    console.log(`👥 Clients in room:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
    
    io.to(roomName).emit('friend_request_received', notificationData);
    console.log(`🔔 Real-time notification sent to ${targetUser.username}`);
    
    console.log(`✅ Friend request sent: ${req.user.username} -> ${targetUser.username}`);
    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Error in POST /api/friends/request:', error);
    if (error.message === 'Friendship request already exists') {
      return res.status(400).json({ message: 'Friend request already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept friend request
app.put('/api/friends/accept/:id', auth, async (req, res) => {
  console.log(`✅ Accepting friend request ${req.params.id} by ${req.user.username}`);
  try {
    const friendship = await Friendship.findById(req.params.id);
    
    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Check if current user is the recipient of the request (not the requester)
    if (friendship.requester.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot accept your own friend request' });
    }
    
    // Check if current user is one of the participants
    const isParticipant = (friendship.user_id_1.toString() === req.user._id.toString()) ||
                         (friendship.user_id_2.toString() === req.user._id.toString());
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not authorized to accept this request' });
    }
    
    // Check if already accepted
    if (friendship.status === 'accepted') {
      return res.status(400).json({ message: 'Friend request already accepted' });
    }
    
    await Friendship.acceptRequest(req.params.id);
    
    // Get the requester to notify them
    const requesterId = friendship.requester.toString();
    
    // Emit real-time notification to the requester
    io.to(`user_${requesterId}`).emit('friend_request_accepted', {
      id: friendship._id,
      type: 'friend_accepted',
      sender: {
        _id: req.user._id,
        username: req.user.username,
        firstName: req.user.firstName,
        avatar: req.user.avatar
      },
      createdAt: new Date()
    });
    console.log(`🔔 Friend acceptance notification sent to requester`);
    
    console.log(`✅ Friend request ${req.params.id} accepted by ${req.user.username}`);
    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error in PUT /api/friends/accept:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Decline friend request
app.put('/api/friends/decline/:id', auth, async (req, res) => {
  console.log(`❌ Declining friend request ${req.params.id} by ${req.user.username}`);
  try {
    const friendship = await Friendship.findById(req.params.id);
    
    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Check if current user is the recipient of the request
    const isRecipient = (friendship.requester.toString() !== req.user._id.toString()) &&
                       ((friendship.user_id_1.toString() === req.user._id.toString()) ||
                        (friendship.user_id_2.toString() === req.user._id.toString()));
    
    if (!isRecipient) {
      return res.status(403).json({ message: 'You can only decline requests sent to you' });
    }
    
    await Friendship.declineRequest(req.params.id);
    console.log(`❌ Friend request ${req.params.id} declined by ${req.user.username}`);
    res.json({ message: 'Friend request declined' });
  } catch (error) {
    console.error('Error in PUT /api/friends/decline:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove friend
app.delete('/api/friends/:id', auth, async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      _id: req.params.id,
      $or: [
        { user_id_1: req.user._id },
        { user_id_2: req.user._id }
      ]
    });
    
    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }
    
    await Friendship.removeFriend(req.params.id);
    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error in DELETE /api/friends:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get friend requests
app.get('/api/friends/requests', auth, async (req, res) => {
  console.log(`📋 Getting friend requests for: ${req.user.username}`);
  try {
    const friendRequests = await Friendship.find({
      $or: [
        { user_id_1: req.user._id, status: 'pending' },
        { user_id_2: req.user._id, status: 'pending' }
      ]
    }).populate('user_id_1 user_id_2 requester', 'username firstName avatar');
    
    console.log(`📝 Raw friend requests found: ${friendRequests.length}`);
    friendRequests.forEach(req => {
      console.log(`📝 Request: ${req._id}, requester: ${req.requester._id}, user1: ${req.user_id_1._id}, user2: ${req.user_id_2._id}`);
    });
    
    // Format the response to show who sent the request
    const formattedRequests = friendRequests.map(request => {
      const isRequester = request.requester._id.toString() === req.user._id.toString();
      const sender = isRequester ? 
        (request.user_id_1._id.toString() === req.user._id.toString() ? request.user_id_2 : request.user_id_1) :
        request.requester;
      
      return {
        _id: request._id, // Include _id for compatibility
        id: request._id,
        sender: sender,
        requester: request.requester,
        type: isRequester ? 'sent' : 'received',
        createdAt: request.createdAt,
        status: request.status
      };
    });
    
    console.log(`✅ Found ${formattedRequests.length} friend requests for ${req.user.username}`);
    console.log(`📝 Formatted requests:`, formattedRequests.map(r => `${r.type}: ${r.sender.username}`));
    res.json(formattedRequests);
  } catch (error) {
    console.error('Error in GET /api/friends/requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get friends list
app.get('/api/friends', auth, async (req, res) => {
  console.log(`👥 Getting friends list for: ${req.user.username}`);
  try {
    const friendships = await Friendship.find({
      $or: [
        { user_id_1: req.user._id, status: 'accepted' },
        { user_id_2: req.user._id, status: 'accepted' }
      ]
    }).populate('user_id_1 user_id_2', 'username firstName avatar online lastSeen');
    
    const friends = friendships.map(friendship => {
      const friend = friendship.user_id_1._id.toString() === req.user._id.toString() ? 
        friendship.user_id_2 : friendship.user_id_1;
      return friend;
    });
    
    console.log(`✅ Found ${friends.length} friends for ${req.user.username}`);
    res.json(friends);
  } catch (error) {
    console.error('Error in GET /api/friends:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Conversation routes
// Get or create conversation
app.get('/api/conversations/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    
    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, friendId] }
    }).populate('participants', 'username firstName avatar')
     .populate('lastMessage');
    
    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, friendId]
      });
      await conversation.save();
      await conversation.populate('participants', 'username firstName avatar');
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a conversation
app.get('/api/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username firstName avatar')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);
    
    res.json({
      messages: messages.reverse(),
      page,
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Error in GET /api/conversations/messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message
app.post('/api/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    
    const message = new Message({
      conversation: conversationId,
      sender: req.user._id,
      content
    });
    
    await message.save();
    await message.populate('sender', 'username firstName avatar');
    
    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date()
    });
    
    // Emit the message to all users in the conversation room
    io.to(`conversation_${conversationId}`).emit('new_message', message);
    
    res.json(message);
  } catch (error) {
    console.error('Error in POST /api/conversations/messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark messages as read
app.put('/api/conversations/:conversationId/messages/read', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    await Message.updateMany(
      { 
        conversation: conversationId,
        sender: { $ne: req.user._id },
        read: false
      },
      { 
        read: true,
        readAt: new Date()
      }
    );
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error in PUT /api/conversations/messages/read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all conversations for a user
app.get('/api/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', 'username firstName avatar online lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
    
    res.json(conversations);
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  // Handle user authentication and set online status
  socket.on('user_connect', async (userId) => {
    try {
      socket.userId = userId;
      const roomName = `user_${userId}`;
      socket.join(roomName); // Join user-specific room
      console.log(`🏠 User ${userId} joined room: ${roomName}`);
      console.log(`🏠 Socket ${socket.id} joined room: ${roomName}`);
      
      await User.findByIdAndUpdate(userId, { 
        online: true, 
        lastSeen: new Date() 
      });
      console.log(`🟢 ${userId} online`);
      
      // Notify friends that user is online
      socket.broadcast.emit('user_status_change', { userId, online: true });
    } catch (error) {
      console.error('Error setting user online:', error);
    }
  });

  // Handle joining conversation rooms
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`💬 User joined conversation`);
  });

  // Handle leaving conversation rooms
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`👋 User left conversation`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: socket.userId,
      conversationId: data.conversationId,
      typing: true
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: socket.userId,
      conversationId: data.conversationId,
      typing: false
    });
  });

  socket.on('disconnect', async () => {
    console.log(`🔌 Disconnected: ${socket.id}`);
    
    // Set user offline when disconnected
    if (socket.userId) {
      try {
        await User.findByIdAndUpdate(socket.userId, { 
          online: false, 
          lastSeen: new Date() 
        });
        console.log(`🔴 ${socket.userId} offline`);
        
        // Notify friends that user is offline
        socket.broadcast.emit('user_status_change', { userId: socket.userId, online: false });
      } catch (error) {
        console.error('Error setting user offline:', error);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chat Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Allowed origins: ${allowedOrigins.join(', ')}`);
});
