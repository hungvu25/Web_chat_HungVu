# Railway Deployment Fix

## 🚨 Current Issue
MongoDB connection failing because environment variables are not properly set on Railway.

## 🔧 **CRITICAL: Railway Environment Variables Setup**

Go to your Railway project dashboard and set these environment variables:

### Required Environment Variables:
```
MONGODB_URI=mongodb+srv://hungvuwebchat:Hungvu07082005@cluster0.envzvlc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=3f83197b8ac01ea494d950be19551830a588c4791508ff0cd72f80b44b45f394a68a32c2e3157d9dd78440269197c8174ca5378bcd83d661ecec491473ad6a7f

NODE_ENV=production

ALLOWED_ORIGINS=https://web-chat-hung-vu.vercel.app,https://web-production-084d.up.railway.app,http://localhost:5173,http://localhost:3000

PORT=8080
```

### Steps to Add Environment Variables:

1. **Open Railway Dashboard**
   - Go to https://railway.app
   - Select your project: `web-production-084d`

2. **Navigate to Variables Tab**
   - Click on your service
   - Go to "Variables" tab

3. **Add Each Variable**
   - Click "New Variable"
   - Add each variable name and value from above
   - Save each one

4. **Redeploy**
   - After adding all variables, Railway will automatically redeploy
   - Or manually trigger a redeploy

## 🧪 **Testing**

After setting the environment variables:

1. **Check Railway logs** for:
   ```
   ✅ Connected to MongoDB successfully
   🔧 Configured CORS origins: https://web-chat-hung-vu.vercel.app,...
   ```

2. **Test the health endpoint**:
   ```
   https://web-production-084d.up.railway.app/api/health
   ```

3. **Test from your local environment**:
   ```bash
   cd server
   npm run test-mongo
   ```

## 🔍 **Debugging**

If it still fails:

1. Check Railway logs for exact error messages
2. Verify the MongoDB Atlas connection string is correct
3. Make sure your MongoDB Atlas cluster allows connections from Railway IPs (0.0.0.0/0)

## 📝 **Files Changed**
- ✅ Fixed `auth.js` - corrected environment variable name
- ✅ Added better error handling and logging
- ✅ Created `test-mongo.js` for debugging
- ✅ Updated CORS configuration
