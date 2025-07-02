import React from 'react';
import { DEFAULT_AVATAR } from './constants';

export default function Sidebar({ 
  conversations, 
  selectedId, 
  onSelect, 
  onSearch, 
  search, 
  showAddFriend, 
  setShowAddFriend, 
  friendUsername, 
  setFriendUsername, 
  onAddFriend,
  loading,
  isMobileOpen,
  onMobileToggle
}) {
  const handleItemSelect = (id) => {
    onSelect(id);
    // Close mobile sidebar when item is selected
    if (onMobileToggle) {
      onMobileToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
          onClick={onMobileToggle}
        />
      )}
      
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <input
            className="sidebar-search"
            placeholder="Search..."
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
          <button 
            className="add-friend-btn"
            onClick={() => setShowAddFriend(!showAddFriend)}
          >
            + Add Friend
          </button>
        </div>
        
        {showAddFriend && (
          <div className="add-friend-form">
            <input
              className="friend-username-input"
              placeholder="Enter username..."
              value={friendUsername}
              onChange={e => setFriendUsername(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && onAddFriend()}
            />
            <div className="add-friend-actions">
              <button onClick={onAddFriend} className="add-btn">Add</button>
              <button onClick={() => setShowAddFriend(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        )}
        
        <ul className="sidebar-list">
          {loading ? (
            <div className="loading-friends">Loading friends...</div>
          ) : conversations.length === 0 ? (
            <div className="no-friends">No friends yet. Add some friends to start chatting!</div>
          ) : (
            conversations.map(conv => (
              <li
                key={conv.id}
                className={`sidebar-item${conv.id === selectedId ? ' selected' : ''}`}
                onClick={() => handleItemSelect(conv.id)}
              >
                <img className="sidebar-avatar" src={conv.avatar || DEFAULT_AVATAR} alt="avatar" />
                <div className="sidebar-info">
                  <div className="sidebar-name">{conv.name}</div>
                  <div className="sidebar-last">{conv.lastMessage}</div>
                </div>
                <div className="sidebar-meta">
                  <span className={`sidebar-status${conv.online ? ' online' : ''}`}></span>
                  <span className="sidebar-time">{conv.time}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      </aside>
    </>
  );
}
