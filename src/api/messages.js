// API functions for messages and conversations
import { API_BASE_URL } from '../constants.js';

const API_URL = API_BASE_URL;

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Get or create conversation with a friend
export const getOrCreateConversation = async (friendId) => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_URL}/conversations/${friendId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get conversation');
  }

  return response.json();
};

// Get messages for a conversation
export const getMessages = async (conversationId, page = 1, limit = 50) => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get messages');
  }

  const result = await response.json();
  return result;
};

// Send a message
export const sendMessage = async (conversationId, content) => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send message');
  }

  return response.json();
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId) => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark messages as read');
  }

  return response.json();
};
