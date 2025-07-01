import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile({ user }) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/chat');
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <img className="profile-avatar" src={user.avatar || '/default-avatar.png'} alt="avatar" />
        <h2 className="profile-name">{user.firstName || user.email}</h2>
        <p className="profile-email">{user.email}</p>
        <button className="profile-back" onClick={handleBack}>Back to Chat</button>
      </div>
    </div>
  );
}
