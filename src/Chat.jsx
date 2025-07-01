import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getFriendRequests, getFriends } from './api/friends';
import { getOrCreateConversation, getMessages, sendMessage, markMessagesAsRead } from './api/messages';
import { socket } from './socket';

// Empty initial data
const DUMMY_CONVERSATIONS = [];
const DUMMY_MESSAGES = [];

export default function Chat({ user, loading, onLogout }) {
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [messagesData, setMessagesData] = useState({});
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [_loadingMessages, setLoadingMessages] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  // Convert friends to conversations format
  const conversationsList = friends.filter(friend => 
    friend.username.toLowerCase().includes(search.toLowerCase()) ||
    (friend.firstName && friend.firstName.toLowerCase().includes(search.toLowerCase()))
  ).map(friend => ({
    id: friend._id,
    name: friend.firstName || friend.username,
    avatar: friend.avatar,
    lastMessage: 'Start a conversation',
    time: '',
    online: friend.online || false // Use actual online status from database
  }));
  
  const recipient = conversationsList.find(c => c.id === selectedId);
  const currentMessages = currentConversationId ? (messagesData[currentConversationId] || []) : [];
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Show/hide offline banner based on socket connection
  useEffect(() => {
    if (user && !socketConnected && !bannerDismissed) {
      const timer = setTimeout(() => {
        setShowOfflineBanner(true);
      }, 10000); // Show banner after 10 seconds of being offline
      return () => clearTimeout(timer);
    } else {
      setShowOfflineBanner(false);
    }
  }, [user, socketConnected, bannerDismissed]);

  const dismissBanner = () => {
    setBannerDismissed(true);
    setShowOfflineBanner(false);
  };

  // Polling mechanism for notifications when socket is not connected
  useEffect(() => {
    if (!user || socketConnected) return;
    
    console.log('🔄 Socket not connected, starting notification polling...');
    let pollLogCount = 0;
    const MAX_POLL_LOGS = 2; // Limit polling logs
    
    const pollInterval = setInterval(async () => {
      try {
        const requests = await getFriendRequests();
        // Convert friend requests to notifications format
        const newNotifications = requests.map(req => ({
          id: req._id,
          type: 'friend_request',
          sender: req.requester,
          read: false,
          createdAt: req.createdAt
        }));
        
        // Only update if there are new notifications
        setNotifications(prev => {
          const existingIds = prev.map(n => n.id);
          const truly_new = newNotifications.filter(n => !existingIds.includes(n.id));
          if (truly_new.length > 0) {
            // Only log first few polling results to prevent spam
            if (pollLogCount < MAX_POLL_LOGS) {
              console.log('📨 Polling found new notifications:', truly_new);
              pollLogCount++;
            }
            return [...truly_new, ...prev];
          }
          return prev;
        });
      } catch (error) {
        // Only log polling errors occasionally
        if (pollLogCount < MAX_POLL_LOGS) {
          console.error('❌ Error polling notifications:', error);
        }
      }
    }, 10000); // Reduce polling frequency to 10 seconds
    
    return () => clearInterval(pollInterval);
  }, [user, socketConnected]);

  // Load friends and notifications when component mounts
  useEffect(() => {
    if (user) {
      loadFriendsAndNotifications();
      
      // Connect to socket and set user online
      console.log('🔌 Connecting to socket...', socket.io?.uri);
      socket.connect();
      socket.emit('user_connect', user._id);
      console.log('👤 User connected:', user._id);
      
      // Debug connection status
      socket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        setSocketConnected(true);
        setBannerDismissed(false); // Reset banner when connected
      });
      
      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setSocketConnected(false);
      });
      
      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        setSocketConnected(false);
      });
      
      // Listen for user status changes
      socket.on('user_status_change', (data) => {
        console.log('👥 User status change:', data);
        setFriends(prevFriends => 
          prevFriends.map(friend => 
            friend._id === data.userId 
              ? { ...friend, online: data.online }
              : friend
          )
        );
      });

      // Listen for new messages
      socket.on('new_message', (data) => {
        console.log('💬 New message received:', data);
        // Only add message if it's from someone else (not from current user)
        if (data.sender._id !== user._id) {
          setMessagesData(prev => ({
            ...prev,
            [data.conversation]: [...(prev[data.conversation] || []), {
              id: data._id,
              text: data.content,
              sent: false, // Always false for received messages
              time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sender: data.sender
            }]
          }));
        }
      });

      // Listen for friend requests
      socket.on('friend_request_received', (data) => {
        console.log('🔔 New friend request received:', data);
        console.log('🔔 Socket room should be:', `user_${user._id}`);
        const notification = {
          id: data.id,
          type: 'friend_request',
          sender: data.sender,
          read: false,
          createdAt: data.createdAt
        };
        setNotifications(prev => [notification, ...prev]);
        
        // Show alert for immediate feedback
        alert(`${data.sender.username} sent you a friend request!`);
      });

      // Listen for friend request acceptances
      socket.on('friend_request_accepted', (data) => {
        console.log('🎉 Friend request accepted:', data);
        const notification = {
          id: data.id,
          type: 'friend_accepted',
          sender: data.sender,
          read: false,
          createdAt: data.createdAt
        };
        setNotifications(prev => [notification, ...prev]);
        
        // Reload friends list to include the new friend
        loadFriendsAndNotifications();
        
        // Show alert for immediate feedback
        alert(`${data.sender.username} accepted your friend request!`);
      });
      
      // Cleanup on unmount
      return () => {
        console.log('🧹 Cleaning up socket listeners');
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        socket.off('user_status_change');
        socket.off('new_message');
        socket.off('friend_request_received');
        socket.off('friend_request_accepted');
        socket.disconnect();
      };
    }
  }, [user]);

  // Load conversation when a friend is selected
  useEffect(() => {
    const loadConversation = async (friendId) => {
      try {
        setLoadingMessages(true);
        
        // Get or create conversation
        const conversation = await getOrCreateConversation(friendId);
        setCurrentConversationId(conversation._id);
        
        // Load messages for this conversation
        const messagesResponse = await getMessages(conversation._id);
        
        // Handle different response formats
        const messagesList = Array.isArray(messagesResponse) 
          ? messagesResponse 
          : (messagesResponse.messages || []);
          
        const formattedMessages = messagesList.map(msg => ({
          id: msg._id,
          text: msg.content,
          sent: msg.sender._id === user._id,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: msg.sender
        }));
        
        console.log('✅ Messages loaded successfully'); // Simple log
        
        setMessagesData(prev => ({
          ...prev,
          [conversation._id]: formattedMessages
        }));
        
        // Join the conversation room for real-time updates
        socket.emit('join_conversation', conversation._id);
        
        // Mark messages as read
        await markMessagesAsRead(conversation._id);
        
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    if (selectedId && user) {
      loadConversation(selectedId);
    }
  }, [selectedId, user]);

  const loadFriendsAndNotifications = async () => {
    setLoadingFriends(true);
    try {
      // Load friends list
      const friendsData = await getFriends();
      setFriends(friendsData);

      // Load friend requests (notifications)
      const requestsData = await getFriendRequests();
      const formattedNotifications = requestsData
        .filter(request => request.type === 'received') // Only show received requests
        .map(request => ({
          id: request.id,
          type: 'friend_request',
          sender: request.sender,
          read: false,
          createdAt: request.createdAt
        }));
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error loading friends and notifications:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentConversationId) return;
    
    const messageText = input.trim();
    setInput(''); // Clear input immediately for better UX
    
    try {
      // Add message to local state immediately for better UX
      const tempMessage = {
        id: `temp-${Date.now()}`, // Temporary ID
        text: messageText,
        sent: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: user,
        pending: true // Mark as pending
      };
      
      setMessagesData(prev => ({
        ...prev,
        [currentConversationId]: [...(prev[currentConversationId] || []), tempMessage]
      }));
      
      // Send message to server
      const sentMessage = await sendMessage(currentConversationId, messageText);
      
      // Replace temp message with real message
      setMessagesData(prev => ({
        ...prev,
        [currentConversationId]: prev[currentConversationId].map(msg => 
          msg.id === tempMessage.id 
            ? {
                id: sentMessage._id,
                text: messageText,
                sent: true,
                time: new Date(sentMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sender: user,
                pending: false
              }
            : msg
        )
      }));
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove failed message from state
      setMessagesData(prev => ({
        ...prev,
        [currentConversationId]: prev[currentConversationId].filter(msg => !msg.pending)
      }));
      alert('Failed to send message. Please try again.');
    }
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleAddFriend = async () => {
    if (!friendUsername.trim()) return;
    
    try {
      await sendFriendRequest(friendUsername);
      alert(`Friend request sent to ${friendUsername} successfully!`);
      setFriendUsername('');
      setShowAddFriend(false);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleAcceptFriend = async (requestId) => {
    try {
      console.log(`🤝 Accepting friend request: ${requestId}`);
      await acceptFriendRequest(requestId);
      // Remove notification and reload friends list
      setNotifications(prev => prev.filter(n => n.id !== requestId));
      loadFriendsAndNotifications(); // Reload to get updated friends list
      console.log(`✅ Friend request ${requestId} accepted successfully`);
      alert('Friend request accepted!');
    } catch (error) {
      console.error(`❌ Failed to accept friend request ${requestId}:`, error);
      alert(`Error accepting friend request: ${error.message}`);
    }
  };

  const handleRejectFriend = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      // Remove notification
      setNotifications(prev => prev.filter(n => n.id !== requestId));
      alert('Friend request rejected!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  return (
    <div className="chat-layout">
      {showOfflineBanner && (
        <div className="offline-banner">
          ⚠️ Connection to server lost. Notifications may be delayed.
          <button onClick={dismissBanner} className="banner-dismiss">×</button>
        </div>
      )}
      <div className="chat-main">
        <Sidebar
          conversations={conversationsList}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onSearch={setSearch}
          search={search}
          showAddFriend={showAddFriend}
          setShowAddFriend={setShowAddFriend}
          friendUsername={friendUsername}
          setFriendUsername={setFriendUsername}
          onAddFriend={handleAddFriend}
          loading={loadingFriends}
          inputStyle={{ color: 'black' }}
        />
        <ChatWindow
          messages={currentMessages}
          onSend={handleSend}
          input={input}
          setInput={setInput}
          recipient={recipient}
          user={user}
          onProfile={handleProfile}
          onLogout={onLogout}
          notifications={notifications}
          onAcceptFriend={handleAcceptFriend}
          onRejectFriend={handleRejectFriend}
          onMarkAsRead={handleMarkAsRead}
          inputStyle={{ color: 'black' }}
        />
      </div>
    </div>
  );
}
