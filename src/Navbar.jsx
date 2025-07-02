import React from 'react';
import { DEFAULT_AVATAR } from './constants';

export default function Navbar({ user, onProfile, onLogout, onMobileMenuToggle }) {
  return (
    <nav className="navbar enhanced-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onMobileMenuToggle && (
          <button className="mobile-menu-toggle" onClick={onMobileMenuToggle}>
            ☰
          </button>
        )}
        <div className="navbar-logo">SimpleChat</div>
      </div>
      <div className="navbar-user">
        <img className="navbar-avatar" src={user?.avatar || DEFAULT_AVATAR} alt="avatar" />
        <span className="navbar-username">{user?.username || user?.firstName || user?.email || 'User'}</span>
        <div className="navbar-menu">
          <button className="navbar-btn" onClick={onProfile}>My Profile</button>
          <button className="navbar-btn logout" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
