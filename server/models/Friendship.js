import mongoose from 'mongoose';

const friendshipSchema = new mongoose.Schema({
  user_id_1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user_id_2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending'
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure unique friendship between two users
friendshipSchema.index({ user_id_1: 1, user_id_2: 1 }, { unique: true });

// Helper method to check if two users are friends
friendshipSchema.statics.areFriends = async function(userId1, userId2) {
  const friendship = await this.findOne({
    $or: [
      { user_id_1: userId1, user_id_2: userId2 },
      { user_id_1: userId2, user_id_2: userId1 }
    ],
    status: 'accepted'
  });
  return !!friendship;
};

// Helper method to get friendship status
friendshipSchema.statics.getStatus = async function(userId1, userId2) {
  const friendship = await this.findOne({
    $or: [
      { user_id_1: userId1, user_id_2: userId2 },
      { user_id_1: userId2, user_id_2: userId1 }
    ]
  });
  return friendship ? friendship.status : null;
};

// Helper method to send friend request
friendshipSchema.statics.sendRequest = async function(fromUserId, toUserId) {
  // Ensure user_id_1 is always the smaller ID for consistency
  const [userId1, userId2] = [fromUserId, toUserId].sort();
  
  const existingFriendship = await this.findOne({
    user_id_1: userId1,
    user_id_2: userId2
  });
  
  if (existingFriendship) {
    throw new Error('Friendship request already exists');
  }
  
  return this.create({
    user_id_1: userId1,
    user_id_2: userId2,
    requester: fromUserId,
    status: 'pending'
  });
};

export default mongoose.model('Friendship', friendshipSchema);
