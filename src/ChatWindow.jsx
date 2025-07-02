import React, { useRef, useEffect } from 'react';
import { DEFAULT_AVATAR } from './constants';
import NotificationPanel from './NotificationPanel';

export default function ChatWindow({ 
  messages, 
  onSend, 
  input, 
  setInput, 
  recipient, 
  user, 
  onProfile, 
  onLogout,
  notifications,
  onAcceptFriend,
  onRejectFriend,
  onMarkAsRead,
  onMobileMenuToggle
}) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <section className="chat-window">
      <header className="chat-header">
        <div className="chat-header-left">
          {onMobileMenuToggle && (
            <button className="mobile-menu-toggle" onClick={onMobileMenuToggle}>
              ☰
            </button>
          )}
          {recipient && (
            <>
              <img className="chat-avatar" src={recipient?.avatar || DEFAULT_AVATAR} alt="avatar" />
              <div className="chat-title">{recipient?.name || 'Select a conversation'}</div>
              <span className={`chat-status${recipient?.online ? ' online' : ''}`}>
                {recipient?.online ? 'Online' : 'Offline'}
              </span>
            </>
          )}
          {!recipient && (
            <div className="chat-title">Select a conversation to start chatting</div>
          )}
        </div>
        <div className="chat-header-right">
          <NotificationPanel
            notifications={notifications}
            onAcceptFriend={onAcceptFriend}
            onRejectFriend={onRejectFriend}
            onMarkAsRead={onMarkAsRead}
          />
          <img 
            className="user-avatar" 
            src={user?.avatar || DEFAULT_AVATAR} 
            alt="user avatar"
            onClick={onProfile}
          />
          <div className="user-menu">
            <span className="user-name">{user?.username || user?.firstName || user?.email || 'User'}</span>
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>
      <div className="chat-history">
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`chat-bubble${msg.sent ? ' sent' : ' received'}`}> 
            <div className="chat-text">{msg.text}</div>
            <div className="chat-time">{msg.time}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {recipient && (
        <form className="chat-input" onSubmit={e => { e.preventDefault(); onSend(); }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            rows={1}
          />
          <button type="submit" disabled={!input.trim()}>Send</button>
        </form>
      )}
    </section>
  );
}
