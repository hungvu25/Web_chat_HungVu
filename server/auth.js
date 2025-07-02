import mongoose from 'mongoose';
import User from './models/User.mjs';
import Conversation from './models/Conversation.mjs';
import Message from './models/Message.mjs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import process from 'process';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

console.log('🔧 MongoDB URI available:', !!MONGO_URI);
console.log('🔧 JWT Secret available:', !!JWT_SECRET);

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET not found in environment variables');
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Register
export async function registerUser(req, res) {
  const { firstName, lastName, gender, email, password, phone, avatar, dateOfBirth, address } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    const hashed = await bcrypt.hash(password, 10);
    let username;
    do {
      username = `${email.split('@')[0]}${Math.floor(10000 + Math.random() * 90000)}`;
    } while (await User.findOne({ username }));
    const user = new User({ firstName, lastName, gender, email, username, password: hashed, phone, avatar, dateOfBirth, address });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Login
export async function loginUser(req, res) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    
    // Set user online when logging in
    const updatedUser = await User.findByIdAndUpdate(user._id, { 
      online: true, 
      lastSeen: new Date() 
    }, { new: true });
    
    console.log(`🟢 Login: Set user ${user.username} (${user._id}) online in database`);
    console.log(`📊 User online status:`, updatedUser.online);
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get current user's profile
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update profile details
export async function updateProfile(req, res) {
  const { firstName, lastName, avatar, dateOfBirth, address, username, bio, phone, website, coverPhoto } = req.body;
  try {
    // Get current user to compare username
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Only check username uniqueness if username is being changed
    if (username && username !== currentUser.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }
    
    // Build update object with all possible fields
    const update = { 
      firstName, 
      lastName, 
      avatar, 
      dateOfBirth, 
      address,
      bio,
      phone,
      website,
      coverPhoto
    };
    
    // Only update username if it's provided and different from current
    if (username && username !== currentUser.username) {
      update.username = username;
    }
    
    const updated = await User.findByIdAndUpdate(
      req.userId,
      update,
      { new: true }
    ).lean();
    
    if (!updated) return res.status(404).json({ error: 'User not found' });
    
    // console.log(`✅ Profile updated for user: ${updated.username}`);
    res.json(updated);
  } catch (err) {
    console.error('❌ Error updating profile:', err);
    res.status(500).json({ error: err.message });
  }
}

// Auth middleware
export async function auth(req, res, next) {
  const header = req.headers['authorization'];
  // console.log(`🔐 Auth middleware - URL: ${req.path}, Method: ${req.method}`);
  // console.log(`🔐 Authorization header present: ${!!header}`);
  
  if (!header) {
    // console.error('❌ No authorization header provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = header.split(' ')[1];
  // console.log(`🔐 Token present: ${!!token}`);
  // console.log(`🔐 Token preview: ${token ? token.substring(0, 20) + '...' : 'No token'}`);
  
  if (!token) {
    // console.error('❌ No token found in authorization header');
    return res.status(401).json({ error: 'Invalid authorization format' });
  }
  
  try {
    // console.log(`🔐 Verifying token with JWT_SECRET...`);
    // console.log(`🔐 JWT_SECRET exists: ${!!JWT_SECRET}`);
    // console.log(`🔐 JWT_SECRET length: ${JWT_SECRET ? JWT_SECRET.length : 0}`);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    // console.log(`🔐 Token decoded successfully, user ID: ${decoded.id}`);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      // console.error(`❌ User not found for ID: ${decoded.id}`);
      return res.status(401).json({ error: 'User not found' });
    }
    
    // console.log(`✅ Auth successful for user: ${user.username} (${user._id})`);
    req.user = user;
    req.userId = user._id; // Add userId for backward compatibility
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    // console.error('❌ Error name:', error.name);
    // console.error('❌ Full error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      // console.error('❌ Invalid token signature - possible JWT_SECRET mismatch');
      return res.status(401).json({ 
        error: 'Invalid token', 
        details: 'Token signature verification failed',
        suggestion: 'Please login again'
      });
    } else if (error.name === 'TokenExpiredError') {
      // console.error('❌ Token has expired');
      return res.status(401).json({ 
        error: 'Token expired',
        suggestion: 'Please login again'
      });
    } else {
      // console.error('❌ Unknown token verification error');
      return res.status(401).json({ 
        error: 'Token verification failed',
        suggestion: 'Please login again'
      });
    }
  }
}
