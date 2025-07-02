import { API_BASE_URL } from '../constants.js';

// Auth utility functions
export const authUtils = {
  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
  },

  // Set token in localStorage
  setToken(token) {
    localStorage.setItem('token', token);
  },

  // Remove token from localStorage
  removeToken() {
    localStorage.removeItem('token');
  },

  // Check if user is logged in
  isLoggedIn() {
    const token = this.getToken();
    return !!token;
  },

  // Logout user
  async logout() {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }
    
    this.removeToken();
    window.location.href = '/login';
  },

  // Handle auth errors (token expired, invalid, etc.)
  handleAuthError(error) {
    console.error('Auth error:', error);
    
    if (error.status === 401 || error.message?.includes('token') || error.message?.includes('401')) {
      console.log('🔄 Token expired or invalid, logging out...');
      this.removeToken();
      window.location.href = '/login';
      return true;
    }
    
    return false;
  },

  // Make authenticated API request
  async apiRequest(url, options = {}) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        this.handleAuthError({ status: 401 });
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        this.handleAuthError(error);
      }
      throw error;
    }
  }
};

export default authUtils;
