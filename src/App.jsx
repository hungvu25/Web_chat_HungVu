

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Chat from './Chat';
import PostFeed from './PostFeed';
import Profile from './Profile';
import { authUtils } from './utils/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  const isLoggedIn = authUtils.isLoggedIn();

  return (
    <Router>
      {/* Optionally, you can add a Navbar here if you want it on all pages: */}
      {/* <Navbar user={user} onLogout={handleLogout} /> */}
      <Routes>
        <Route path="/" element={isLoggedIn ? <PostFeed user={user} /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={isLoggedIn ? <Chat user={user} loading={loading} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={isLoggedIn ? <Profile user={user} loading={loading} onUpdate={setUser} /> : <Navigate to="/login" replace />} />
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
