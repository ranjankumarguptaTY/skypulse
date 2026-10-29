import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    clearAllNotifications,
    contacts,
    setActiveContact,
    setUnlockModalTarget,
    unlockedContacts,
  } = useChat();

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpenNotification = (notif) => {
    markNotificationAsRead(notif.id);
    setIsOpen(false);

    // Look for matching contact
    const targetStation = notif.stationId?.trim()?.toLowerCase();
    const contact = contacts.find(
      (c) => c.stationId?.trim()?.toLowerCase() === targetStation
    );

    if (contact) {
      if (!contact.chatPin || unlockedContacts[targetStation]) {
        setActiveContact(contact);
        navigate('/feed');
      } else {
        // Prompt for PIN
        setUnlockModalTarget(contact);
        navigate('/feed');
      }
    } else {
      // Discovered contact without pre-saved alias
      const discovered = {
        stationId: targetStation,
        phoneNumber: '',
        alias: notif.title || targetStation,
        chatPin: '',
        notificationMask: notif.title || 'Weather Alert Service',
      };
      setActiveContact(discovered);
      navigate('/feed');
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="notif-dropdown-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Meteorological Alerts & Telemetry Broadcasts"
        aria-label="Notifications"
      >
        <span className="notif-bell-icon">🔔</span>
        {unreadNotificationCount > 0 && (
          <span className="notif-bell-badge">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-popup-menu card">
          <div className="notif-popup-header">
            <div className="flex-center gap-6">
              <span style={{ fontSize: '0.95rem' }}>📡</span>
              <span className="notif-popup-title">Telemetry Alerts</span>
              {unreadNotificationCount > 0 && (
                <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                  {unreadNotificationCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={clearAllNotifications}
                style={{ fontSize: '0.7rem', padding: '2px 6px' }}
              >
                Clear all
              </button>
            )}
          </div>

          <div className="notif-popup-list">
            {notifications.length === 0 ? (
              <div className="notif-popup-empty">
                <span style={{ fontSize: '1.8rem', opacity: 0.5 }}>🌤️</span>
                <p className="text-xs text-muted mt-8">
                  All atmospheric sensors calm. No incoming telemetry broadcasts.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-popup-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => handleOpenNotification(n)}
                >
                  <div className="notif-item-icon">
                    <span>⚡</span>
                  </div>
                  <div className="notif-item-body">
                    <div className="notif-item-top">
                      <span className="notif-item-title">{n.title}</span>
                      <span className="notif-item-time">{formatTime(n.timestamp)}</span>
                    </div>
                    <p className="notif-item-desc">{n.body}</p>
                    <span className="notif-item-action">Click to decrypt & open ↵</span>
                  </div>
                  {!n.read && <span className="notif-item-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

