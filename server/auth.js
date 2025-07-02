import mongoose from 'mongoose';
import User from './models/User.mjs';
import Conversation from './models/Conversation.mjs';
import Message from './models/Message.mjs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI ;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
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
    await User.findByIdAndUpdate(user._id, { 
      online: true, 
      lastSeen: new Date() 
    });
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
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
  const { firstName, lastName, avatar, dateOfBirth, address, username } = req.body;
  try {
    if (username) {
      const existing = await User.findOne({ username });
      if (existing && existing._id.toString() !== req.userId) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }
    const update = { firstName, lastName, avatar, dateOfBirth, address };
    if (username) update.username = username;
    const updated = await User.findByIdAndUpdate(
      req.userId,
      update,
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Auth middleware
export async function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    req.userId = user._id; // Add userId for backward compatibility
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
