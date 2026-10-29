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
    closeActiveChat,
    messages,
    sendMessage,
    typingMap,
    emitTyping,
    setSearchModalOpen,
    removeContact,
    clearChat,
    subscribeStation,
    unlockChat,
    unlockedContacts,
    unlockModalTarget,
    setUnlockModalTarget,
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [telemetryMode, setTelemetryMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Standby Manual Search State
  const [manualQuery, setManualQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Standby New Contact Setup State
  const [newContactTarget, setNewContactTarget] = useState(null);
  const [newAlias, setNewAlias] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newMask, setNewMask] = useState('Severe Weather Warning');

  // Per-chat PIN unlock state for standby/modal
  const [pinInput, setPinInput] = useState('');
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

  // Manual search on the Standby terminal
  const handleManualSearch = async (e) => {
    e.preventDefault();
    const clean = manualQuery.trim();
    if (!clean) return;

    setSearchError('');
    setSearching(true);

    try {
      const cleanLower = clean.toLowerCase();
      const phoneDigits = clean.replace(/[\s-]/g, '');

      // 1. Check local contacts in stealth IndexedDB (no list rendered)
      const existing = contacts.find((c) => {
        const cPhone = (c.phoneNumber || '').replace(/[\s-]/g, '');
        return (
          (phoneDigits && cPhone === phoneDigits) ||
          (c.alias && c.alias.toLowerCase() === cleanLower) ||
          (c.stationId && c.stationId.toLowerCase() === cleanLower)
        );
      });

      if (existing) {
        if (!existing.chatPin || unlockedContacts[existing.stationId.toLowerCase()]) {
          setActiveContact(existing);
          setManualQuery('');
        } else {
          // Trigger PIN prompt for this existing contact
          setUnlockModalTarget(existing);
          setPinInput('');
          setPinError('');
        }
        return;
      }

      // 2. Not in local contacts: lookup registered user on server
      const isDigits = phoneDigits.length >= 7;
      const res = await api.post('/stations/lookup', isDigits ? { phoneNumber: phoneDigits } : { stationId: cleanLower });

      if (res.found) {
        setNewContactTarget(res);
        setNewAlias(res.phoneNumber || res.stationId);
        setNewPin('');
        setNewMask('Severe Weather Warning');
      }
    } catch (err) {
      setSearchError(err.message || 'No registered station or user found with this query.');
    } finally {
      setSearching(false);
    }
  };

  // Save new contact configuration from standby
  const handleSaveNewContact = async (e) => {
    e.preventDefault();
    if (!newPin.trim() || !newContactTarget) return;

    setSearching(true);
    setSearchError('');
    try {
      await subscribeStation({
        phoneNumber: newContactTarget.phoneNumber,
        stationId: newContactTarget.stationId,
        alias: newAlias.trim() || newContactTarget.phoneNumber,
        pin: newPin.trim(),
        notificationMask: newMask.trim(),
      });
      setNewContactTarget(null);
      setManualQuery('');
    } catch (err) {
      setSearchError('Failed to configure channel: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  // Verify PIN for an existing contact
  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (!unlockModalTarget) return;

    const success = unlockChat(unlockModalTarget, pinInput);
    if (success) {
      setUnlockModalTarget(null);
      setPinInput('');
      setPinError('');
      setManualQuery('');
    } else {
      setPinError('Incorrect security PIN for this channel.');
    }
  };

  const isPartnerTyping = activeContact
    ? typingMap[activeContact.stationId.trim().toLowerCase()]
    : false;

  return (
    <div className="station-feed">
      <Navbar />

      <div className="station-feed-body">
        {activeContact ? (
          /* Active Chat Screen — Full width, Zero contact roster on screen */
          <main className="chat-area active-full">
            <header className="chat-header">
              <div className="chat-header-info">
                <button
                  type="button"
                  className="chat-header-back"
                  onClick={closeActiveChat}
                  title="Lock Channel & Return to Standby"
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
                    PIN Protected · 256-Bit Telemetry Channel
                  </div>
                </div>
              </div>

              <div className="flex-center gap-8">
                {/* Disguise view toggle */}
                <button
                  type="button"
                  className={`btn btn-sm ${telemetryMode ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTelemetryMode(!telemetryMode)}
                  title="Toggle raw telemetry log disguise"
                >
                  {telemetryMode ? '📊 Telemetry Mode' : '💬 Chat Mode'}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={closeActiveChat}
                  title="Lock chat session"
                >
                  🔒 Lock &amp; Exit
                </button>

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setShowOptions(!showOptions)}
                    title="Channel Options"
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
                          if (confirm(`Delete channel with ${activeContact.alias}?`)) {
                            removeContact(activeContact.stationId);
                            setShowOptions(false);
                          }
                        }}
                      >
                        ✕ Delete Channel
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
                  🔒 Zero-Knowledge Local Storage · Protected by Security PIN
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
          </main>
        ) : (
          /* Standby Terminal Gate — Zero contact roster on screen */
          <div className="standby-terminal-container">
            <div className="standby-terminal-card card">
              <div className="standby-radar-header">
                <div className="standby-radar-icon-pulse">
                  <span className="pulse-ring" />
                  <span className="radar-icon">📡</span>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                    Atmospheric Telemetry Terminal
                  </h2>
                  <div className="flex-center gap-8 mt-4" style={{ justifyContent: 'flex-start' }}>
                    <span className="station-status-dot" />
                    <span className="text-xs text-secondary font-mono">
                      MATRIX STANDBY · ENCRYPTED MESH
                    </span>
                  </div>
                </div>
              </div>

              {/* Manual Channel Search & Connect Box */}
              <div className="standby-search-section">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
                  🔑 Manual Channel Access
                </h3>
                <p className="text-xs text-muted mb-16">
                  Zero-Trace Mode Active: No contacts or peer stations are listed on screen. Search by registered mobile number, alias, or station ID and enter your private PIN to open a channel.
                </p>

                <form onSubmit={handleManualSearch} className="standby-search-form">
                  <div className="search-input-wrapper" style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter mobile number, alias, or station ID..."
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={searching || !manualQuery.trim()}
                  >
                    {searching ? 'Probing...' : 'Open Channel ↵'}
                  </button>
                </form>

                {searchError && (
                  <div className="auth-error mt-12">{searchError}</div>
                )}
              </div>

              {/* New Contact Setup Prompt if user not yet saved */}
              {newContactTarget && (
                <div
                  className="card mt-16"
                  style={{
                    background: 'rgba(0, 212, 255, 0.05)',
                    border: '1px solid var(--accent)',
                    padding: '20px',
                  }}
                >
                  <h4 style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                    🛰️ Verified Registered Station Found
                  </h4>
                  <p className="text-xs text-secondary mb-12">
                    Mobile: {newContactTarget.phoneNumber} · Station: {newContactTarget.stationId}
                  </p>

                  <form onSubmit={handleSaveNewContact} className="auth-form">
                    <div className="input-group">
                      <label>Private Local Alias</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Alex, Work Partner, Sensor 4"
                        value={newAlias}
                        onChange={(e) => setNewAlias(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label>Set Per-Chat Security PIN</label>
                      <input
                        type="password"
                        className="input"
                        placeholder="4–8 digit secret PIN"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        required
                      />
                      <span className="text-xs text-muted">
                        Only you will need this PIN to open this channel in the future.
                      </span>
                    </div>

                    <div className="input-group">
                      <label>Notification Mask / Disguise Name</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Severe Weather Warning"
                        value={newMask}
                        onChange={(e) => setNewMask(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setNewContactTarget(null)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={searching}>
                        Save &amp; Open Terminal
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* High-Tech Meteorological Disguise Spec Grid */}
              <div className="standby-stats-grid mt-24">
                <div className="standby-stat-box">
                  <span className="standby-stat-title">DISGUISE MATRIX</span>
                  <span className="standby-stat-val">AeroMet v2.4 Mesh</span>
                </div>
                <div className="standby-stat-box">
                  <span className="standby-stat-title">ZERO-TRACE STORAGE</span>
                  <span className="standby-stat-val">No Roster Display</span>
                </div>
                <div className="standby-stat-box">
                  <span className="standby-stat-title">GATE ACCESS</span>
                  <span className="standby-stat-val">Per-Chat PIN Enforced</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Per-Chat PIN Unlock Modal */}
      {unlockModalTarget && (
        <div
          className="modal-overlay"
          onClick={() => setUnlockModalTarget(null)}
          style={{ zIndex: 10000 }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>🔐 Enter Chat Security PIN</h2>
                <p className="text-xs text-muted">
                  Unlock channel for {unlockModalTarget.alias || unlockModalTarget.phoneNumber}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setUnlockModalTarget(null)}
              >
                ✕
              </button>
            </div>

            {pinError && <div className="auth-error mb-16">{pinError}</div>}

            <form onSubmit={handleVerifyPin} className="auth-form">
              <div className="input-group">
                <label>Security PIN</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your security PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  autoFocus
                  required
                />
                <span className="text-xs text-muted">
                  Private PIN configured exclusively for this conversation.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setUnlockModalTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Decrypt &amp; Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
