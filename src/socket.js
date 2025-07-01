// src/socket.js
import { io } from 'socket.io-client';
import { SOCKET_URL } from './constants.js';

console.log('🔗 Socket URL:', SOCKET_URL);
console.log('🌐 Environment:', import.meta.env.MODE);
console.log('🏗️ Production?', import.meta.env.PROD);

export const socket = io(SOCKET_URL, { autoConnect: false });
