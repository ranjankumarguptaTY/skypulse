import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const StationFeedPage = () => {
  const { user } = useAuth();
  const {
    contacts,
    activeContact,
    setActiveContact,
    messages,
    sendMessage,
    typingMap,
    emitTyping,
    setSearchModalOpen,
    removeContact,
    clearChat,
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [telemetryMode, setTelemetryMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Per-chat PIN unlock states
  const [unlockedContacts, setUnlockedContacts] = useState({}); // { [stationId]: true }
  const [pinPromptContact, setPinPromptContact] = useState(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeContact) return;

    sendMessage(inputMessage.trim(), null, 'text');
    setInputMessage('');
    emitTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  // Download tracked file
  const handleFileDownload = async (fileMetadata) => {
    if (!fileMetadata?.cloudinaryId) {
      window.open(fileMetadata?.cloudinaryUrl, '_blank');
      return;
    }
    try {
      const res = await api.get(`/files/${fileMetadata.cloudinaryId}/download`);
      window.open(res.url || fileMetadata.cloudinaryUrl, '_blank');
    } catch {
      window.open(fileMetadata.cloudinaryUrl, '_blank');
    }
  };

  // Click on contact: check if per-chat PIN is required
  const handleSelectContact = (contact) => {
    // If no chatPin was set, or already unlocked in this session:
    if (!contact.chatPin || unlockedContacts[contact.stationId]) {
      setActiveContact(contact);
    } else {
      // Require PIN entry to unlock
      setPinPromptContact(contact);
      setEnteredPin('');
      setPinError('');
    }
  };

  const handleVerifyChatPin = (e) => {
    e.preventDefault();
    if (!pinPromptContact) return;

    if (!pinPromptContact.chatPin || pinPromptContact.chatPin === enteredPin.trim()) {
      setUnlockedContacts((prev) => ({ ...prev, [pinPromptContact.stationId]: true }));
      setActiveContact(pinPromptContact);
      setPinPromptContact(null);
      setEnteredPin('');
      setPinError('');
    } else {
      setPinError('Incorrect security PIN for this chat.');
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.alias?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.stationId?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.phoneNumber?.includes(filterQuery)
  );

  const isPartnerTyping = activeContact ? typingMap[activeContact.stationId] : false;

  return (
    <div className="station-feed">
      <Navbar />

      <div className="station-feed-body">
        {/* Left Sidebar: Subscribed Stations */}
        <aside className={`station-sidebar ${activeContact ? 'hidden' : ''}`}>
          <div className="sidebar-header">
            <div>
              <h2>Subscribed Sensor Relays</h2>
              <span className="text-xs text-muted">
                {contacts.length} Encrypted Peer Nodes
              </span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              title="Add Registered Contact by Mobile"
              onClick={() => setSearchModalOpen(true)}
            >
              + Add
            </button>
          </div>

          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="sidebar-search-input"
                placeholder="Filter by name or mobile..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="station-list">
            {filteredContacts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 16px',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📱</div>
                <p className="text-xs">No registered contacts added yet.</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm mt-8"
                  onClick={() => setSearchModalOpen(true)}
                >
                  Add Registered User
                </button>
              </div>
            ) : (
              filteredContacts.map((c) => {
                const isActive = activeContact?.stationId === c.stationId;
                const isLocked = c.chatPin && !unlockedContacts[c.stationId];
                return (
                  <div
                    key={c.stationId}
                    className={`station-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectContact(c)}
                  >
                    <div className="station-avatar">
                      {c.alias?.[0]?.toUpperCase() || c.stationId?.[0]?.toUpperCase() || 'S'}
                    </div>

                    <div className="station-info">
                      <div className="station-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{c.alias || c.phoneNumber || c.stationId}</span>
                        {isLocked && <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>🔒</span>}
                      </div>
                      <div className="station-last-msg">
                        {typingMap[c.stationId]
                          ? 'Transmitting data...'
                          : c.lastMessage || 'Ready for telemetry stream'}
                      </div>
                    </div>

                    <div className="station-meta">
                      {c.lastMessageTime && (
                        <span className="station-time">
                          {new Date(c.lastMessageTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {c.unreadCount > 0 && (
                        <span className="station-unread">{c.unreadCount}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Area: Active Chat / Telemetry */}
        <main className={`chat-area ${activeContact ? 'visible' : ''}`}>
          {activeContact ? (
            <>
              {/* Chat Header */}
              <header className="chat-header">
                <div className="chat-header-info">
                  <button
                    type="button"
                    className="chat-header-back"
                    onClick={() => setActiveContact(null)}
                    title="Back to Stations"
                  >
                    ←
                  </button>
                  <div className="station-avatar" style={{ width: '38px', height: '38px' }}>
                    {activeContact.alias?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <div className="chat-header-name">
                      {activeContact.alias || activeContact.phoneNumber || activeContact.stationId}
                    </div>
                    <div className="chat-header-status">
                      <span
                        style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--online)',
                          marginRight: '6px',
                        }}
                      />
                      {activeContact.phoneNumber ? `Mobile: ${activeContact.phoneNumber} · ` : ''}
                      PIN Protected · AES Encrypted
                    </div>
                  </div>
                </div>

                <div className="flex-center gap-8">
                  {/* Disguise view toggle */}
                  <button
                    type="button"
                    className={`btn btn-sm ${telemetryMode ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTelemetryMode(!telemetryMode)}
                    title="Toggle raw observation log disguise"
                  >
                    {telemetryMode ? '📊 Telemetry Mode' : '💬 Chat Mode'}
                  </button>

                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setShowOptions(!showOptions)}
                      title="Chat Options"
                    >
                      ⋮
                    </button>

                    {showOptions && (
                      <div
                        className="card"
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '44px',
                          zIndex: 100,
                          padding: '8px',
                          minWidth: '200px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ justifyContent: 'flex-start' }}
                          onClick={() => {
                            // Lock chat again
                            setUnlockedContacts((prev) => ({ ...prev, [activeContact.stationId]: false }));
                            setActiveContact(null);
                            setShowOptions(false);
                          }}
                        >
                          🔒 Lock Chat with PIN
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ justifyContent: 'flex-start' }}
                          onClick={() => {
                            clearChat(activeContact.stationId);
                            setShowOptions(false);
                          }}
                        >
                          🧹 Clear Log Cache
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ justifyContent: 'flex-start' }}
                          onClick={() => {
                            if (confirm(`Remove contact ${activeContact.alias}?`)) {
                              removeContact(activeContact.stationId);
                              setShowOptions(false);
                            }
                          }}
                        >
                          ✕ Delete Contact
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              {/* Messages / Observation Logs */}
              <div
                className="chat-messages"
                style={{
                  fontFamily: telemetryMode ? 'monospace' : 'var(--font)',
                  fontSize: telemetryMode ? '0.85rem' : '0.9rem',
                }}
              >
                <div className="chat-date-divider">
                  <span>
                    🔒 Local-First End-to-End Encrypted · Protected by Security PIN
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">🛰️</div>
                    <p className="text-sm">Secure peer telemetry channel open.</p>
                    <p className="text-xs text-muted">
                      No logs exchanged with {activeContact.alias || activeContact.phoneNumber} yet.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isSelf = m.fromSelf || m.fromStation === user?.stationId;
                    const timeStr = new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    if (telemetryMode) {
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '6px 10px',
                            background: isSelf ? 'rgba(0, 212, 255, 0.05)' : 'var(--bg-glass)',
                            borderLeft: `3px solid ${isSelf ? 'var(--accent)' : 'var(--accent2)'}`,
                            borderRadius: '4px',
                            marginBottom: '4px',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>[{timeStr}] </span>
                          <strong style={{ color: isSelf ? 'var(--accent)' : 'var(--accent2)' }}>
                            {isSelf ? 'LOCAL_TX' : 'REMOTE_RX'}:{' '}
                          </strong>
                          <span>{m.encryptedPayload}</span>
                          {m.type === 'file' && m.fileMetadata && (
                            <div
                              onClick={() => handleFileDownload(m.fileMetadata)}
                              style={{
                                cursor: 'pointer',
                                color: 'var(--accent)',
                                marginTop: '4px',
                                textDecoration: 'underline',
                              }}
                            >
                              📥 Download Packet ({m.fileMetadata.fileName || 'file'})
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`message-bubble ${
                          isSelf ? 'message-sent' : 'message-received'
                        }`}
                      >
                        <div>{m.encryptedPayload}</div>

                        {/* File Attachment Card */}
                        {m.type === 'file' && m.fileMetadata && (
                          <div
                            className="message-file"
                            onClick={() => handleFileDownload(m.fileMetadata)}
                          >
                            <span className="message-file-icon">
                              {m.fileMetadata.fileType?.includes('image') ? '🖼️' : '📄'}
                            </span>
                            <div className="message-file-info">
                              <div className="message-file-name">
                                {m.fileMetadata.fileName || 'Telemetry File'}
                              </div>
                              <div className="message-file-size">
                                {m.fileMetadata.fileSize
                                  ? `${Math.round(m.fileMetadata.fileSize / 1024)} KB`
                                  : 'Data Packet'}{' '}
                                · Click to download
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="message-time">{timeStr}</div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {isPartnerTyping && (
                  <div className="typing-indicator">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="chat-input-area">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !activeContact) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    setUploading(true);
                    api.upload('/files/upload', formData)
                      .then((res) => {
                        sendMessage(`📎 [Data Attachment: ${file.name}]`, res, 'file');
                      })
                      .catch((err) => alert('Upload failed: ' + err.message))
                      .finally(() => {
                        setUploading(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      });
                  }}
                />
                <button
                  type="button"
                  className="btn-icon"
                  title="Attach File (Auto-expires in 5 days)"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? '⏳' : '📎'}
                </button>

                <div className="chat-input-wrapper">
                  <textarea
                    className="chat-input"
                    placeholder="Log telemetry observation or message..."
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    rows={1}
                  />
                </div>

                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!inputMessage.trim()}
                  title="Transmit Entry"
                >
                  ➤
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              <div className="chat-empty-icon">📡</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Encrypted Station Monitor
              </h3>
              <p className="text-sm text-secondary" style={{ maxWidth: '400px', textAlign: 'center' }}>
                Select a contact from the sidebar and enter your security PIN to open the conversation,
                or search by mobile number to add a new registered user.
              </p>
              <button
                type="button"
                className="btn btn-primary mt-8"
                onClick={() => setSearchModalOpen(true)}
              >
                📱 Add Registered Contact
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Per-Chat PIN Unlock Modal */}
      {pinPromptContact && (
        <div
          className="modal-overlay"
          onClick={() => setPinPromptContact(null)}
          style={{ zIndex: 10000 }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>🔐 Enter Chat Security PIN</h2>
                <p className="text-xs text-muted">
                  Unlock chat with {pinPromptContact.alias || pinPromptContact.phoneNumber}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setPinPromptContact(null)}
              >
                ✕
              </button>
            </div>

            {pinError && <div className="auth-error mb-16">{pinError}</div>}

            <form onSubmit={handleVerifyChatPin} className="auth-form">
              <div className="input-group">
                <label>Security PIN for this Chat</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your security PIN"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  autoFocus
                  required
                />
                <span className="text-xs text-muted">
                  The private PIN you configured for this chat.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPinPromptContact(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={!enteredPin}
                >
                  Unlock &amp; Open Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
