// Simple Node.js + Express + Socket.IO backend for real-time chat

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';
import jwt from 'jsonwebtoken';
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

console.log('🔧 Configured CORS origins:', allowedOrigins);
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);

// More flexible CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

const io = new Server(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cors: allowedOrigins 
  });
});

// JWT Debug endpoint (remove in production)
app.get('/api/debug/token', (req, res) => {
  const header = req.headers['authorization'];
  console.log('🔍 Debug token request');
  console.log('🔍 Authorization header:', header);
  
  if (!header) {
    return res.json({ error: 'No authorization header' });
  }
  
  const token = header.split(' ')[1];
  console.log('🔍 Token:', token ? token.substring(0, 50) + '...' : 'No token');
  
  if (!token) {
    return res.json({ error: 'No token in header' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 Token decoded successfully:', decoded);
    res.json({ valid: true, decoded });
  } catch (error) {
    console.log('🔍 Token error:', error.message);
    res.json({ 
      valid: false, 
      error: error.message,
      name: error.name,
      jwtSecretExists: !!process.env.JWT_SECRET
    });
  }
});

// CORS debugging middleware
app.use((req, res, next) => {
  // console.log(`📡 ${req.method} ${req.path} from origin: ${req.headers.origin || 'no-origin'}`);
  next();
});

// User registration
app.post('/api/register', registerUser);
// User login
app.post('/api/login', loginUser);
// User logout - clear token on client side
app.post('/api/logout', auth, async (req, res) => {
  try {
    // Set user offline when logging out
    await User.findByIdAndUpdate(req.user._id, { 
      online: false, 
      lastSeen: new Date() 
    });
    
    // console.log(`👋 User ${req.user.username} logged out`);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logout:', error);
    res.status(500).json({ error: error.message });
  }
});
// Profile routes
app.get('/api/profile', auth, getProfile);
app.put('/api/profile', auth, updateProfile);

// Friendship routes
// Send friend request
app.post('/api/friends/request', auth, async (req, res) => {
  // console.log(`📨 Friend request: ${req.user.username} -> ${req.body.username}`);
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
    
    // console.log(`🎯 Sending notification to room: ${roomName}`);
    // console.log(`📦 Notification data:`, notificationData);
    // console.log(`👥 Clients in room:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
    
    io.to(roomName).emit('friend_request_received', notificationData);
    // console.log(`🔔 Real-time notification sent to ${targetUser.username}`);
    
    // console.log(`✅ Friend request sent: ${req.user.username} -> ${targetUser.username}`);
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
  // console.log(`✅ Accepting friend request ${req.params.id} by ${req.user.username} (ID: ${req.user._id})`);
  try {
    const friendship = await Friendship.findById(req.params.id);
    
    if (!friendship) {
      // console.error(`❌ Friend request ${req.params.id} not found`);
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // console.log(`📝 Friendship details:`, {
    //   id: friendship._id,
    //   user_id_1: friendship.user_id_1,
    //   user_id_2: friendship.user_id_2,
    //   requester: friendship.requester,
    //   status: friendship.status
    // });

    // Check if current user is the recipient of the request (not the requester)
    if (friendship.requester.toString() === req.user._id.toString()) {
      // console.error(`❌ User ${req.user.username} trying to accept their own request`);
      return res.status(403).json({ message: 'You cannot accept your own friend request' });
    }
    
    // Check if current user is one of the participants and is the recipient
    const isRecipient = (friendship.user_id_1.toString() === req.user._id.toString() && friendship.requester.toString() !== req.user._id.toString()) ||
                       (friendship.user_id_2.toString() === req.user._id.toString() && friendship.requester.toString() !== req.user._id.toString());
    
    if (!isRecipient) {
      // console.error(`❌ User ${req.user.username} not authorized to accept this request`);
      // console.error(`📋 Auth check: user=${req.user._id}, user1=${friendship.user_id_1}, user2=${friendship.user_id_2}, requester=${friendship.requester}`);
      return res.status(403).json({ message: 'You are not authorized to accept this request' });
    }
    
    // Check if already accepted
    if (friendship.status === 'accepted') {
      // console.warn(`⚠️ Friend request ${req.params.id} already accepted`);
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
    // console.log(`🔔 Friend acceptance notification sent to requester ${requesterId}`);
    
    // console.log(`✅ Friend request ${req.params.id} accepted by ${req.user.username}`);
    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('❌ Error in PUT /api/friends/accept:', error);
    // console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Decline friend request
app.put('/api/friends/decline/:id', auth, async (req, res) => {
  // console.log(`❌ Declining friend request ${req.params.id} by ${req.user.username}`);
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
    // console.log(`❌ Friend request ${req.params.id} declined by ${req.user.username}`);
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
  // console.log(`📋 Getting friend requests for: ${req.user.username}`);
  try {
    const friendRequests = await Friendship.find({
      $or: [
        { user_id_1: req.user._id, status: 'pending' },
        { user_id_2: req.user._id, status: 'pending' }
      ]
    }).populate('user_id_1 user_id_2 requester', 'username firstName avatar');
    
    // console.log(`📝 Raw friend requests found: ${friendRequests.length}`);
    // friendRequests.forEach(req => {
    //   console.log(`📝 Request: ${req._id}, requester: ${req.requester._id}, user1: ${req.user_id_1._id}, user2: ${req.user_id_2._id}`);
    // });
    
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
    
    // console.log(`✅ Found ${formattedRequests.length} friend requests for ${req.user.username}`);
    // console.log(`📝 Formatted requests:`, formattedRequests.map(r => `${r.type}: ${r.sender.username}`));
    res.json(formattedRequests);
  } catch (error) {
    console.error('Error in GET /api/friends/requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cleanup offline users - manual endpoint
app.post('/api/cleanup-offline-users', auth, async (req, res) => {
  try {
    // Set all users offline except currently connected ones
    const connectedUserIds = Array.from(io.sockets.sockets.values())
      .map(socket => socket.userId)
      .filter(Boolean);
    
    console.log('🧹 Connected user IDs:', connectedUserIds);
    
    const result = await User.updateMany(
      { 
        _id: { $nin: connectedUserIds },
        online: true 
      },
      { 
        online: false,
        lastSeen: new Date()
      }
    );
    
    console.log(`🧹 Cleanup: Set ${result.modifiedCount} users offline`);
    
    // Broadcast status changes for all affected users
    const affectedUsers = await User.find({
      _id: { $nin: connectedUserIds },
      online: false
    }).select('_id');
    
    affectedUsers.forEach(user => {
      io.emit('user_status_change', { userId: user._id, online: false });
    });
    
    res.json({ 
      message: 'Offline users cleaned up', 
      usersSetOffline: result.modifiedCount,
      connectedUsers: connectedUserIds.length
    });
  } catch (error) {
    console.error('Error cleaning up offline users:', error);
    res.status(500).json({ error: error.message });
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
      
      return {
        ...friend.toObject(),
        friendshipId: friendship._id // Include friendship ID for deletion
      };
    });
    
    console.log(`✅ Found ${friends.length} friends for ${req.user.username}:`);
    friends.forEach(friend => {
      console.log(`  👤 ${friend.firstName || friend.username}: online=${friend.online}, lastSeen=${friend.lastSeen}`);
    });
    
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
      
      const updatedUser = await User.findByIdAndUpdate(userId, { 
        online: true, 
        lastSeen: new Date() 
      }, { new: true });
      console.log(`🟢 ${updatedUser.username} (${userId}) set online in database: ${updatedUser.online}`);
      
      // Notify friends that user is online
      console.log(`📡 Broadcasting user online status for ${userId}`);
      socket.broadcast.emit('user_status_change', { userId, online: true });
      
      // Also emit to all sockets to make sure friends receive it
      io.emit('user_status_change', { userId, online: true });
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

  // Handle heartbeat to keep user online
  socket.on('heartbeat', async (userId) => {
    try {
      if (socket.userId === userId) {
        await User.findByIdAndUpdate(userId, { 
          lastSeen: new Date() 
        });
        // console.log(`💓 Heartbeat from ${userId}`);
      }
    } catch (error) {
      console.error('Error processing heartbeat:', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`🔌 Disconnected: ${socket.id}`);
    
    // Set user offline when disconnected
    if (socket.userId) {
      try {
        const updatedUser = await User.findByIdAndUpdate(socket.userId, { 
          online: false, 
          lastSeen: new Date() 
        }, { new: true });
        console.log(`🔴 ${updatedUser.username} (${socket.userId}) set offline in database: ${updatedUser.online}`);
        
        // Notify friends that user is offline
        console.log(`📡 Broadcasting user offline status for ${socket.userId}`);
        socket.broadcast.emit('user_status_change', { userId: socket.userId, online: false });
        
        // Also emit to all sockets to make sure friends receive it
        io.emit('user_status_change', { userId: socket.userId, online: false });
      } catch (error) {
        console.error('Error setting user offline:', error);
      }
    }
  });
});

// Auto cleanup function - chạy định kỳ
const autoCleanupOfflineUsers = async () => {
  try {
    const connectedUserIds = Array.from(io.sockets.sockets.values())
      .map(socket => socket.userId)
      .filter(Boolean);
    
    // Set offline users who are not connected AND haven't been seen in last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const result = await User.updateMany(
      { 
        $or: [
          { _id: { $nin: connectedUserIds }, online: true },
          { lastSeen: { $lt: tenMinutesAgo }, online: true }
        ]
      },
      { 
        online: false,
        lastSeen: new Date()
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`🧹 Auto cleanup: Set ${result.modifiedCount} users offline (not connected or inactive > 10min)`);
      
      // Broadcast status changes for affected users
      const affectedUsers = await User.find({
        $or: [
          { _id: { $nin: connectedUserIds }, online: false },
          { lastSeen: { $lt: tenMinutesAgo }, online: false }
        ]
      }).select('_id');
      
      affectedUsers.forEach(user => {
        io.emit('user_status_change', { userId: user._id, online: false });
      });
    }
  } catch (error) {
    console.error('Error in auto cleanup:', error);
  }
};

// Initial cleanup when server starts - set all users offline
const initialCleanup = async () => {
  try {
    const result = await User.updateMany(
      { online: true },
      { 
        online: false,
        lastSeen: new Date()
      }
    );
    console.log(`🧹 Server startup: Set ${result.modifiedCount} users offline`);
  } catch (error) {
    console.error('Error in initial cleanup:', error);
  }
};

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Chat Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Allowed origins: ${allowedOrigins.join(', ')}`);
  
  // Set all users offline on server start
  await initialCleanup();
  
  // Run auto cleanup every 5 minutes
  setInterval(autoCleanupOfflineUsers, 5 * 60 * 1000); // 5 minutes
  console.log('🕐 Auto cleanup scheduled every 5 minutes');
});
