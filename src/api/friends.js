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
  console.log(`🤝 Accepting friend request: ${requestId}`);
  console.log(`🔐 Auth token present: ${!!authUtils.getToken()}`);
  
  try {
    const response = await authUtils.apiRequest(`${API_BASE}/friends/accept/${requestId}`, {
      method: 'PUT'
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log(`📦 Response data:`, data);
    return data;
  } catch (error) {
    console.error('❌ Error accepting friend request:', error);
    throw error;
  }
    console.error('❌ Failed to parse response JSON:', error);
    throw new Error('Invalid response from server');
  }
  
  if (!response.ok) {
    console.error('❌ Accept friend request failed:', {
      status: response.status,
      statusText: response.statusText,
      data,
      requestId
    });
    
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
  
  console.log(`✅ Friend request ${requestId} accepted successfully`);
  return data;
};

// Reject friend request
export const rejectFriendRequest = async (requestId) => {
  const response = await fetch(`${API_BASE}/friends/decline/${requestId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to reject friend request');
  }
  
  return data;
};

// Get pending friend requests
export const getFriendRequests = async () => {
  const response = await fetch(`${API_BASE}/friends/requests`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get friend requests');
  }
  
  return data;
};

// Get friends list
export const getFriends = async () => {
  const response = await fetch(`${API_BASE}/friends`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get friends');
  }
  
  return data;
};
