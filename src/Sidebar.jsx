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

  const formatTime = (time) => {
    if (!time) return '';
    // If time is already formatted, return as is
    if (typeof time === 'string' && time.includes(':')) return time;
    // Otherwise, try to format it
    try {
      const date = new Date(time);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return time;
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
          <div className="search-container">
            <input
              className="sidebar-search"
              placeholder="Search"
              value={search}
              onChange={e => onSearch(e.target.value)}
            />
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L16.5 16.5M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button 
            className="add-friend-btn"
            onClick={() => setShowAddFriend(!showAddFriend)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5v14m-7-7h14"/>
            </svg>
            New Chat
          </button>
          
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
        </div>
        
        <ul className="sidebar-list">
          {loading ? (
            <div className="loading-friends">
              <div className="loading-spinner">⟳</div>
              Loading chats...
            </div>
          ) : conversations.length === 0 ? (
            <div className="no-friends">
              <div className="empty-state-icon">💬</div>
              <p>No chats yet</p>
              <span>Start a conversation by adding friends!</span>
            </div>
          ) : (
            conversations.map(conv => (
              <li
                key={conv.id}
                className={`sidebar-item${conv.id === selectedId ? ' selected' : ''}`}
                onClick={() => handleItemSelect(conv.id)}
              >
                <div className="avatar-container">
                  <img className="sidebar-avatar" src={conv.avatar || DEFAULT_AVATAR} alt="avatar" />
                  {conv.online && <div className="online-indicator"></div>}
                </div>
                <div className="sidebar-info">
                  <div className="sidebar-name">{conv.name}</div>
                  <div className="sidebar-last">{conv.lastMessage || 'Start a conversation'}</div>
                </div>
                <div className="sidebar-meta">
                  <span className="sidebar-time">{formatTime(conv.time)}</span>
                  {conv.online && <span className="online-text">online</span>}
                </div>
              </li>
            ))
          )}
        </ul>
      </aside>
    </>
  );
}
