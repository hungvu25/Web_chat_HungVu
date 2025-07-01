import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

// Dummy data for layout demonstration
const DUMMY_CONVERSATIONS = [
  { id: 1, name: 'Alice', avatar: '', lastMessage: 'Hey there!', time: '10:30', online: true },
  { id: 2, name: 'Bob', avatar: '', lastMessage: 'See you soon.', time: '09:15', online: false },
];
const DUMMY_MESSAGES = [
  { text: 'Hello!', sent: true, time: '10:00' },
  { text: 'Hi! How are you?', sent: false, time: '10:01' },
];

export default function Chat({ user, loading, onLogout }) {
  const [selectedId, setSelectedId] = useState(DUMMY_CONVERSATIONS[0].id);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const conversations = DUMMY_CONVERSATIONS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const recipient = conversations.find(c => c.id === selectedId);
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, sent: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="chat-layout">
      <Navbar user={user} onProfile={handleProfile} onLogout={onLogout} />
      <div className="chat-main">
        <Sidebar
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onSearch={setSearch}
          search={search}
        />
        <ChatWindow
          messages={messages}
          onSend={handleSend}
          input={input}
          setInput={setInput}
          recipient={recipient}
        />
        {/* Optional right panel for future use */}
      </div>
    </div>
  );
}
