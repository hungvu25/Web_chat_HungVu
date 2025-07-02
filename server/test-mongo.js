// Test MongoDB connection
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

console.log('🔧 Testing MongoDB connection...');
console.log('🔧 Environment variables loaded:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - MONGODB_URI present:', !!process.env.MONGODB_URI);
console.log('  - MONGO_URI present:', !!process.env.MONGO_URI);
console.log('  - JWT_SECRET present:', !!process.env.JWT_SECRET);
console.log('  - ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);

if (!MONGO_URI) {
  console.error('❌ No MongoDB URI found');
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB...');

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB connection successful!');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:', error);
  process.exit(1);
});
