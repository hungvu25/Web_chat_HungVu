// API functions for friend management
import { API_BASE_URL } from '../constants.js';

const API_BASE = API_BASE_URL;

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Send friend request
export const sendFriendRequest = async (username) => {
  const response = await fetch(`${API_BASE}/friends/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ username })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send friend request');
  }
  
  return data;
};

// Accept friend request
export const acceptFriendRequest = async (requestId) => {
  const response = await fetch(`${API_BASE}/friends/accept/${requestId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid response from server');
  }
  
  if (!response.ok) {
    console.error('Accept friend request failed:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error(data.message || `Server error: ${response.status}`);
  }
  
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
