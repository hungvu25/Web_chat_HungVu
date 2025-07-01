export const DEFAULT_AVATAR = 'https://i.ibb.co/hpp4RXR/avatar-trang-4.jpg';

// Environment-based configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://dichvutot.site/api' 
    : 'http://localhost:3001/api');

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD 
    ? 'https://dichvutot.site' 
    : 'http://localhost:3001');
