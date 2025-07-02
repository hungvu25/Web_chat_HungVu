// API functions for friend management
import { API_BASE_URL } from '../constants.js';
import { authUtils } from '../utils/auth.js';

const API_BASE = API_BASE_URL;

// Send friend request
export const sendFriendRequest = async (username) => {
  try {
    const response = await authUtils.apiRequest(`${API_BASE}/friends/request`, {
      method: 'POST',
      body: JSON.stringify({ username })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

// Accept friend request
export const acceptFriendRequest = async (requestId) => {
  // console.log(`🤝 Accepting friend request: ${requestId}`);
  // console.log(`🔐 Auth token present: ${!!authUtils.getToken()}`);
  
  try {
    const response = await authUtils.apiRequest(`${API_BASE}/friends/accept/${requestId}`, {
      method: 'PUT'
    });
    
    // console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    // console.log(`📦 Response data:`, data);
    
    if (!response.ok) {
      // console.error('❌ Accept friend request failed:', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   data,
      //   requestId
      // });
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (response.status === 403) {
        throw new Error(data.message || 'You are not authorized to accept this request');
      } else if (response.status === 404) {
        throw new Error('Friend request not found. It may have been already processed.');
      } else {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
    }
    
    // console.log(`✅ Friend request ${requestId} accepted successfully`);
    return data;
  } catch (error) {
    console.error('❌ Error accepting friend request:', error);
    throw error;
  }
};

// Reject friend request
export const rejectFriendRequest = async (requestId) => {
  try {
    const response = await authUtils.apiRequest(`${API_BASE}/friends/decline/${requestId}`, {
      method: 'PUT'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reject friend request');
    }
    
    return data;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
};

// Get pending friend requests
export const getFriendRequests = async () => {
  try {
    const response = await authUtils.apiRequest(`${API_BASE}/friends/requests`, {
      method: 'GET'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get friend requests');
    }
    
    return data;
  } catch (error) {
    console.error('Error getting friend requests:', error);
    throw error;
  }
};

// Get friends list
export const getFriends = async () => {
  try {
    const response = await authUtils.apiRequest(`${API_BASE}/friends`, {
      method: 'GET'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get friends');
    }
    
    return data;
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error;
  }
};

// Remove friend
export const removeFriend = async (friendshipId) => {
  try {
    // console.log(`🗑️ Removing friendship: ${friendshipId}`);
    
    const response = await authUtils.apiRequest(`${API_BASE}/friends/${friendshipId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // console.error('❌ Remove friend failed:', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   data,
      //   friendshipId
      // });
      throw new Error(data.message || 'Failed to remove friend');
    }
    
    // console.log(`✅ Friend removed successfully: ${friendshipId}`);
    return data;
  } catch (error) {
    console.error('❌ Error removing friend:', error);
    throw error;
  }
};
