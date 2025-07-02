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
  const textareaRef = useRef(null);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [input]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSend();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend();
    }
  };

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
              <div className="chat-info">
                <div className="chat-title">{recipient?.name || 'Select a conversation'}</div>
                <span className={`chat-status${recipient?.online ? ' online' : ''}`}>
                  {recipient?.online ? 'online' : 'last seen recently'}
                </span>
              </div>
            </>
          )}
          {!recipient && (
            <div className="chat-title">Chattera</div>
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
        {!recipient && (
          <div className="chat-welcome">
            <div className="welcome-icon">💬</div>
            <h3>Welcome to Chattera</h3>
            <p>Select a chat from the sidebar to start messaging</p>
          </div>
        )}
        {recipient && messages.length === 0 && (
          <div className="chat-welcome">
            <div className="welcome-icon">👋</div>
            <h3>Start chatting with {recipient.name}</h3>
            <p>Send your first message below</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`chat-bubble${msg.sent ? ' sent' : ' received'}`}> 
            <div className="chat-text">{msg.text}</div>
            <div className="chat-time">
              {msg.time}
              {msg.sent && <span className="message-status">✓</span>}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      
      {recipient && (
        <form className="chat-input" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Write a message..."
            rows={1}
          />
          <button type="submit" disabled={!input.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
            </svg>
          </button>
        </form>
      )}
    </section>
  );
}
