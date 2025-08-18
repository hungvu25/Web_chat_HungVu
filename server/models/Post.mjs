import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{ type: String }], // Lưu username hoặc userId đã like
  shares: {
    type: Number,
    default: 0
  },
  comments: [
    {
      user: String,
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

const Post = mongoose.model('Post', PostSchema);
export default Post;
