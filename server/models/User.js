import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String }, // made optional
  lastName: { type: String },  // made optional
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  avatar: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  joinDate: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  online: { type: Boolean, default: false }
});

export default mongoose.model('User', userSchema);
