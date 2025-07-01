import React, { useRef, useEffect } from 'react';

export default function ChatWindow({ messages, onSend, input, setInput, recipient }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <section className="chat-window">
      <header className="chat-header">
        <img className="chat-avatar" src={recipient?.avatar || '/default-avatar.png'} alt="avatar" />
        <div className="chat-title">{recipient?.name || 'Select a conversation'}</div>
        <span className={`chat-status${recipient?.online ? ' online' : ''}`}>{recipient?.online ? 'Online' : 'Offline'}</span>
      </header>
      <div className="chat-history">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble${msg.sent ? ' sent' : ' received'}`}> 
            <div className="chat-text">{msg.text}</div>
            <div className="chat-time">{msg.time}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="chat-input" onSubmit={e => { e.preventDefault(); onSend(); }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          rows={1}
        />
        <button type="submit" disabled={!input.trim()}>Send</button>
      </form>
    </section>
  );
}
