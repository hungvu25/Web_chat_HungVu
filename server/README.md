# Chattera Backend

Real-time chat application backend built with Node.js, Express, Socket.IO, and MongoDB.

## Features

- User authentication (register/login)
- Real-time messaging with Socket.IO
- Friend system (send/accept/decline requests)
- User profiles
- Online/offline status
- Message history
- CORS configuration for frontend integration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Password Hashing**: bcrypt

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=3001
NODE_ENV=production

# CORS Origins
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with required variables
4. Start development server: `npm run dev`

## Deployment

This project is configured for Railway deployment with:
- Automatic builds via Nixpacks
- Environment variable configuration
- Health checks and restart policies

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Friends
- `POST /api/friends/request` - Send friend request
- `PUT /api/friends/accept/:id` - Accept friend request
- `PUT /api/friends/decline/:id` - Decline friend request
- `DELETE /api/friends/:id` - Remove friend
- `GET /api/friends/requests` - Get friend requests
- `GET /api/friends` - Get friends list

### Conversations
- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:friendId` - Get/create conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message
- `PUT /api/conversations/:id/messages/read` - Mark as read

## Socket Events

### Client to Server
- `user_connect` - User authentication
- `join_conversation` - Join chat room
- `leave_conversation` - Leave chat room
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server to Client
- `friend_request_received` - New friend request
- `friend_request_accepted` - Friend request accepted
- `new_message` - New chat message
- `user_status_change` - User online/offline
- `user_typing` - Typing indicators
