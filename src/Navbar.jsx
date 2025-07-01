import React from 'react';

export default function Navbar({ user, onProfile, onLogout }) {
  return (
    <nav className="navbar enhanced-navbar">
      <div className="navbar-logo">SimpleChat</div>
      <div className="navbar-user">
        <img className="navbar-avatar" src={user?.avatar || '/default-avatar.png'} alt="avatar" />
        <span className="navbar-username">{user?.firstName || user?.email || 'User'}</span>
        <div className="navbar-menu">
          <button className="navbar-btn" onClick={onProfile}>My Profile</button>
          <button className="navbar-btn logout" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
