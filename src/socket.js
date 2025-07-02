// src/socket.js
import { io } from 'socket.io-client';
import { SOCKET_URL } from './constants.js';

// console.log('🔗 Socket URL:', SOCKET_URL);
// console.log('🌐 Environment:', import.meta.env.MODE);
// console.log('🏗️ Production?', import.meta.env.PROD);

// Track connection state to reduce spam logs
let isConnectionLogged = false;
let errorLogCount = 0;
const MAX_ERROR_LOGS = 3; // Limit error logs to reduce spam

// Create socket with improved error handling
export const socket = io(SOCKET_URL, { 
  autoConnect: false,
  transports: ['websocket', 'polling'],
  timeout: 10000, // Increase timeout
  reconnection: true,
  reconnectionAttempts: 5, // Increase attempts
  reconnectionDelay: 3000, // Increase delay
  reconnectionDelayMax: 10000, // Max delay between attempts
  maxReconnectionAttempts: 5
});

// Add connection error handling with spam prevention
socket.on('connect_error', (error) => {
  // Only log first few errors to prevent spam
  if (errorLogCount < MAX_ERROR_LOGS) {
    console.error('❌ Socket connection failed:', error.message);
    errorLogCount++;
    
    if (errorLogCount === MAX_ERROR_LOGS) {
      console.warn('⚠️ Further connection errors will be suppressed to prevent console spam');
    }
  }
  
  // If in production and connection fails, show warning once
  if (import.meta.env.PROD && SOCKET_URL.includes('dichvutot.site') && !isConnectionLogged) {
    console.warn('⚠️ Production server unavailable, notifications may not work in real-time');
    isConnectionLogged = true;
  }
});

socket.on('connect', () => {
  // console.log('✅ Socket connected successfully');
  // Reset error logging when connected
  errorLogCount = 0;
  isConnectionLogged = false;
});

socket.on('disconnect', (reason) => {
  // console.log('🔌 Socket disconnected:', reason);
  // Reset error logging on disconnect
  errorLogCount = 0;
});

// Export a function to check if socket is connected
export const isSocketConnected = () => socket.connected;

// Export a function to manually reconnect
export const reconnectSocket = () => {
  if (!socket.connected) {
    // console.log('🔄 Attempting to reconnect socket...');
    socket.connect();
  }
};
