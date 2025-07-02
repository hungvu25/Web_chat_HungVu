import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_AVATAR } from './constants';
import { getFriends, removeFriend } from './api/friends';

export default function Profile({ user, loading, onUpdate }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    firstName: '', 
    lastName: '', 
    username: '', 
    address: '', 
    dateOfBirth: '', 
    avatar: '',
    bio: '',
    phone: '',
    website: '',
    coverPhoto: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
        avatar: user.avatar || '',
        bio: user.bio || '',
        phone: user.phone || '',
        website: user.website || '',
        coverPhoto: user.coverPhoto || ''
      });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Load friends list when component mounts or when user changes
    if (user) {
      loadFriends();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      setFriendsLoading(true);
      const friendsData = await getFriends();
      // console.log('📥 Loaded friends:', friendsData);
      setFriends(friendsData || []);
    } catch (err) {
      console.error('❌ Error loading friends:', err);
      setError('Failed to load friends');
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  if (!user) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=77e2e30d9f873158f6e93e44cc303cb8`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.success) {
        setForm(f => ({ ...f, [type]: data.data.url }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      setSaving(true);
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      localStorage.setItem('user', JSON.stringify(data));
      onUpdate?.(data);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFriend = async (friend) => {
    try {
      setError('');
      // console.log('🗑️ Removing friend:', friend);
      
      // Call API to remove friend using friendship ID
      await removeFriend(friend.friendshipId);
      
      // Remove from local state
      setFriends(prev => prev.filter(f => f._id !== friend._id));
      setShowRemoveConfirm(null);
      
      // console.log('✅ Friend removed successfully');
    } catch (err) {
      console.error('❌ Error removing friend:', err);
      setError(`Failed to remove friend: ${err.message}`);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="profile-page">
      {/* Remove Friend Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="modal-overlay" onClick={() => setShowRemoveConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Remove Friend</h3>
              <button className="modal-close" onClick={() => setShowRemoveConfirm(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="remove-friend-content">
                <img 
                  src={showRemoveConfirm.avatar || DEFAULT_AVATAR} 
                  alt={showRemoveConfirm.firstName || showRemoveConfirm.username}
                  className="remove-friend-avatar"
                />
                <p>Are you sure you want to remove <strong>{showRemoveConfirm.firstName || showRemoveConfirm.username}</strong> from your friends?</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowRemoveConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-remove" 
                onClick={() => handleRemoveFriend(showRemoveConfirm)}
              >
                Remove Friend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Photo Section */}
      <div className="profile-cover">
        <img 
          className="cover-photo" 
          src={form.coverPhoto || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1474&q=80'} 
          alt="Cover" 
        />
        <div className="cover-overlay">
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleFileUpload(e, 'coverPhoto')}
            id="cover-upload"
            className="file-input"
          />
          <label htmlFor="cover-upload" className="edit-cover-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Edit Cover
          </label>
        </div>
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="avatar-container-large">
            <img className="profile-avatar-large" src={form.avatar || DEFAULT_AVATAR} alt="Profile" />
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileUpload(e, 'avatar')}
              id="avatar-upload"
              className="file-input"
            />
            <label htmlFor="avatar-upload" className="edit-avatar-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </label>
          </div>
          <div className="profile-info">
            <h1 className="profile-name">
              {form.firstName} {form.lastName}
              {calculateAge(form.dateOfBirth) && (
                <span className="age">({calculateAge(form.dateOfBirth)} tuổi)</span>
              )}
            </h1>
            <p className="profile-username">@{form.username}</p>
            {form.bio && <p className="profile-bio">{form.bio}</p>}
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-number">{friends.length}</span>
                <span className="stat-label">Friends</span>
              </div>
              <div className="stat">
                <span className="stat-number">24</span>
                <span className="stat-label">Messages</span>
              </div>
              <div className="stat">
                <span className="stat-number">5</span>
                <span className="stat-label">Groups</span>
              </div>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <button 
            className={`action-btn ${isEditing ? 'primary' : 'secondary'}`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
          <button className="action-btn secondary" onClick={() => navigate('/chat')}>
            Back to Chat
          </button>
        </div>
      </div>

      {/* Profile Navigation */}
      <div className="profile-nav">
        <button 
          className={`nav-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
        <button 
          className={`nav-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
        <button 
          className={`nav-btn ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
        </button>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="about-section">
            {isEditing ? (
              <form className="edit-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input 
                      name="firstName" 
                      value={form.firstName} 
                      onChange={handleChange}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input 
                      name="lastName" 
                      value={form.lastName} 
                      onChange={handleChange}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input 
                      name="username" 
                      value={form.username} 
                      onChange={handleChange}
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input 
                      name="dateOfBirth" 
                      type="date" 
                      value={form.dateOfBirth} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Bio</label>
                    <textarea 
                      name="bio" 
                      value={form.bio} 
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input 
                      name="phone" 
                      value={form.phone} 
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Website</label>
                    <input 
                      name="website" 
                      value={form.website} 
                      onChange={handleChange}
                      placeholder="Enter website URL"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <input 
                      name="address" 
                      value={form.address} 
                      onChange={handleChange}
                      placeholder="Enter address"
                    />
                  </div>
                </div>
                {error && <div className="error-message">{error}</div>}
                <div className="form-actions">
                  <button type="submit" disabled={saving} className="save-btn">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="info-cards">
                <div className="info-card">
                  <h3>Basic Information</h3>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-icon">📧</span>
                      <div>
                        <strong>Email</strong>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">🎂</span>
                      <div>
                        <strong>Birthday</strong>
                        <p>{formatDate(form.dateOfBirth)}</p>
                      </div>
                    </div>
                    {form.phone && (
                      <div className="info-item">
                        <span className="info-icon">📱</span>
                        <div>
                          <strong>Phone</strong>
                          <p>{form.phone}</p>
                        </div>
                      </div>
                    )}
                    {form.website && (
                      <div className="info-item">
                        <span className="info-icon">🌐</span>
                        <div>
                          <strong>Website</strong>
                          <p><a href={form.website} target="_blank" rel="noopener noreferrer">{form.website}</a></p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {form.address && (
                  <div className="info-card">
                    <h3>Location</h3>
                    <div className="info-list">
                      <div className="info-item">
                        <span className="info-icon">📍</span>
                        <div>
                          <strong>Address</strong>
                          <p>{form.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-section">
            <div className="activity-card">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">💬</div>
                  <div className="activity-content">
                    <p><strong>Sent a message</strong> to {friends.length > 0 ? friends[0].firstName || friends[0].username : 'a friend'}</p>
                    <span className="activity-time">2 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">👤</div>
                  <div className="activity-content">
                    <p><strong>Updated profile</strong> picture</p>
                    <span className="activity-time">1 day ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">🔗</div>
                  <div className="activity-content">
                    <p><strong>Added a new friend</strong></p>
                    <span className="activity-time">3 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="friends-section">
            <div className="friends-card">
              <div className="friends-header">
                <h3>Friends ({friends.length})</h3>
                <button 
                  className="refresh-friends-btn" 
                  onClick={loadFriends}
                  disabled={friendsLoading}
                  title="Refresh friends list"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={friendsLoading ? 'spinning' : ''}>
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                </button>
              </div>
              
              {friendsLoading ? (
                <div className="friends-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading friends...</p>
                </div>
              ) : (
                <>
                  <div className="friends-grid">
                    {friends.map(friend => (
                      <div key={friend._id} className="friend-item">
                        <button 
                          className="remove-friend-btn"
                          onClick={() => setShowRemoveConfirm(friend)}
                          title="Remove friend"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        </button>
                        <img src={friend.avatar || DEFAULT_AVATAR} alt="Friend" className="friend-avatar" />
                        <p className="friend-name">{friend.firstName ? `${friend.firstName} ${friend.lastName || ''}`.trim() : friend.username}</p>
                        <span className={`friend-status ${friend.online ? 'online' : ''}`}>
                          {friend.online ? 'online' : 'offline'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {friends.length === 0 && (
                    <div className="no-friends-message">
                      <div className="empty-friends-icon">👥</div>
                      <p>No friends yet</p>
                      <span>Start connecting with people!</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
