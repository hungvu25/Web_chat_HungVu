import React, { useState } from 'react';
import { DEFAULT_AVATAR } from './constants';

export default function NotificationPanel({ 
  notifications, 
  onAcceptFriend, 
  onRejectFriend, 
  onMarkAsRead 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-container">
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                >
                  {notification.type === 'friend_request' && (
                    <div className="friend-request-notification">
                      <img 
                        src={notification.sender?.avatar || DEFAULT_AVATAR} 
                        alt="avatar" 
                        className="notification-avatar"
                      />
                      <div className="notification-content">
                        <p>
                          <strong>{notification.sender?.username || notification.sender?.firstName}</strong> 
                          {' '}sent you a friend request
                        </p>
                        <div className="notification-actions">
                          <button 
                            className="accept-btn"
                            onClick={() => {
                              onAcceptFriend(notification.id);
                              onMarkAsRead(notification.id);
                            }}
                          >
                            Accept
                          </button>
                          <button 
                            className="reject-btn"
                            onClick={() => {
                              onRejectFriend(notification.id);
                              onMarkAsRead(notification.id);
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {notification.type === 'friend_accepted' && (
                    <div className="friend-accepted-notification">
                      <img 
                        src={notification.sender?.avatar || DEFAULT_AVATAR} 
                        alt="avatar" 
                        className="notification-avatar"
                      />
                      <div className="notification-content">
                        <p>
                          <strong>{notification.sender?.username || notification.sender?.firstName}</strong> 
                          {' '}accepted your friend request
                        </p>
                        <button 
                          className="mark-read-btn"
                          onClick={() => onMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
