export const DEFAULT_AVATAR = 'https://i.ibb.co/hpp4RXR/avatar-trang-4.jpg';

const isBrowser = typeof window !== 'undefined';
const isNgrokHost = isBrowser && window.location.hostname.endsWith('ngrok-free.app');

// Environment-based configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://web-production-084d.up.railway.app/api'  // Your Railway backend domain
    : (isNgrokHost ? '/api' : 'http://localhost:3001/api')); // Use proxy when serving via ngrok

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD 
    ? 'https://web-production-084d.up.railway.app'  // Your Railway backend domain
    : (isNgrokHost && isBrowser ? window.location.origin : 'http://localhost:3001')); // Avoid mixed content on ngrok
