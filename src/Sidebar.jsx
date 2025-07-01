import React from 'react';

export default function Sidebar({ conversations, selectedId, onSelect, onSearch, search }) {
  return (
    <aside className="sidebar">
      <input
        className="sidebar-search"
        placeholder="Search..."
        value={search}
        onChange={e => onSearch(e.target.value)}
      />
      <ul className="sidebar-list">
        {conversations.map(conv => (
          <li
            key={conv.id}
            className={`sidebar-item${conv.id === selectedId ? ' selected' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            <img className="sidebar-avatar" src={conv.avatar || '/default-avatar.png'} alt="avatar" />
            <div className="sidebar-info">
              <div className="sidebar-name">{conv.name}</div>
              <div className="sidebar-last">{conv.lastMessage}</div>
            </div>
            <div className="sidebar-meta">
              <span className={`sidebar-status${conv.online ? ' online' : ''}`}></span>
              <span className="sidebar-time">{conv.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
