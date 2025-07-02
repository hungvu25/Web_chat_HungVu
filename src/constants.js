export const DEFAULT_AVATAR = 'https://i.ibb.co/hpp4RXR/avatar-trang-4.jpg';

// Environment-based configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://web-production-084d.up.railway.app/api'  // Your Railway backend domain
    : 'http://localhost:3001/api');

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD 
    ? 'https://web-production-084d.up.railway.app'  // Your Railway backend domain
    : 'http://localhost:3001');
