// src/socket.js
import { io } from 'socket.io-client';
import { SOCKET_URL } from './constants.js';

console.log('🔗 Socket URL:', SOCKET_URL);
console.log('🌐 Environment:', import.meta.env.MODE);
console.log('🏗️ Production?', import.meta.env.PROD);

// Create socket with improved error handling
export const socket = io(SOCKET_URL, { 
  autoConnect: false,
  transports: ['websocket', 'polling'],
  timeout: 5000,
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 2000
});

// Add connection error handling
socket.on('connect_error', (error) => {
  console.error('❌ Socket connection failed:', error.message);
  
  // If in production and connection fails, try fallback
  if (import.meta.env.PROD && SOCKET_URL.includes('dichvutot.site')) {
    console.warn('⚠️ Production server unavailable, notifications may not work in real-time');
    
    // Optionally try to reconnect to localhost for development
    // This is useful if you're testing production build locally
    if (window.location.hostname === 'localhost') {
      console.log('🔄 Attempting fallback to localhost...');
      socket.io.uri = 'http://localhost:3001';
      socket.connect();
    }
  }
});

socket.on('connect', () => {
  console.log('✅ Socket connected successfully');
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket disconnected:', reason);
});

// Export a function to check if socket is connected
export const isSocketConnected = () => socket.connected;

// Export a function to manually reconnect
export const reconnectSocket = () => {
  if (!socket.connected) {
    console.log('🔄 Attempting to reconnect socket...');
    socket.connect();
  }
};
