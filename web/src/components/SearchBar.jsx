import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SearchBar = ({ onHelpOpen }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Per-chat PIN unlock prompt for already added contacts
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // New contact configuration if not yet added
  const [newContactTarget, setNewContactTarget] = useState(null);
  const [newChatPin, setNewChatPin] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [newNotifMask, setNewNotifMask] = useState('Severe Weather Warning');
  const [probing, setProbing] = useState(false);

  const { contacts, subscribeStation, unlockChat, setActiveContact } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    // Check for help trigger
    if (
      cleanQuery.toLowerCase() === 'help' ||
      cleanQuery === '?' ||
      cleanQuery.toLowerCase() === '/help' ||
      cleanQuery.toLowerCase() === 'manual' ||
      cleanQuery.toLowerCase() === 'guide'
    ) {
      setIsOpen(false);
      setQuery('');
      onHelpOpen?.();
      return;
    }

    // 1. Check if query matches an ALREADY ADDED contact (by mobile number, alias, or stationId)
    const existing = contacts.find((c) => {
      const qClean = cleanQuery.replace(/[\s-]/g, '').toLowerCase();
      const phoneClean = (c.phoneNumber || '').replace(/[\s-]/g, '').toLowerCase();
      return (
        (phoneClean && phoneClean === qClean) ||
        (c.alias && c.alias.toLowerCase() === cleanQuery.toLowerCase()) ||
        (c.stationId && c.stationId.toLowerCase() === cleanQuery.toLowerCase())
      );
    });

    if (existing) {
      // Once added, just search that user and enter pin -> done, chat opens!
      setUnlockTarget(existing);
      setUnlockPin('');
      setUnlockError('');
      setIsOpen(false);
      return;
    }

    // 2. Check if cleanQuery looks like a mobile number or station lookup
    const digitsOnly = cleanQuery.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 7 || cleanQuery.startsWith('station:') || cleanQuery.startsWith('+')) {
      await probeUser(cleanQuery);
      return;
    }

    // 3. Normal Search: Navigate to home / weather search with the query
    setIsOpen(false);
    navigate(`/?q=${encodeURIComponent(cleanQuery)}`);
  };

  const probeUser = async (targetPhoneOrStation) => {
    const clean = targetPhoneOrStation.replace(/^(station:)/i, '').trim();
    setProbing(true);
    setUnlockError('');
    try {
      const isDigits = clean.replace(/[^0-9]/g, '').length >= 7;
      const res = await api.post('/stations/lookup', isDigits ? { phoneNumber: clean } : { stationId: clean });
      if (res.found) {
        setNewContactTarget(res);
        setNewChatPin('');
        setNewAlias(res.phoneNumber || res.stationId);
        setNewNotifMask('Severe Weather Warning');
      }
    } catch (err) {
      setUnlockError(err.message || 'No registered user found with this mobile number.');
      navigate(`/?q=${encodeURIComponent(clean)}`);
    } finally {
      setProbing(false);
      setIsOpen(false);
    }
  };

  // Submit PIN for ALREADY ADDED contact
  const handleUnlockExisting = (e) => {
    e.preventDefault();
    if (!unlockTarget) return;

    const ok = unlockChat(unlockTarget, unlockPin);
    if (ok) {
      setUnlockTarget(null);
      setUnlockPin('');
      setUnlockError('');
      setQuery('');
      navigate('/feed');
    } else {
      setUnlockError('Incorrect security PIN for this chat.');
    }
  };

  // Submit configuration for NEW contact
  const handleAddNewContact = async (e) => {
    e.preventDefault();
    if (!newChatPin.trim() || !newContactTarget) return;

    setProbing(true);
    setUnlockError('');
    try {
      await subscribeStation({
        phoneNumber: newContactTarget.phoneNumber,
        stationId: newContactTarget.stationId,
        alias: newAlias.trim() || newContactTarget.phoneNumber,
        pin: newChatPin.trim(),
        notificationMask: newNotifMask.trim(),
      });

      setNewContactTarget(null);
      setNewChatPin('');
      setNewAlias('');
      setQuery('');
      navigate('/feed');
    } catch (err) {
      setUnlockError('Failed to configure chat: ' + (err.message || 'Error'));
    } finally {
      setProbing(false);
    }
  };

  const isHelpQuery =
    query.toLowerCase().includes('help') ||
    query.includes('?') ||
    query.toLowerCase().includes('guide');

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', width: '100%', maxWidth: '400px' }}
    >
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            className="input"
            placeholder="Search cities, radar, or news..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            style={{
              paddingLeft: '36px',
              paddingRight: '30px',
              fontSize: '0.85rem',
              borderRadius: 'var(--r-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.85rem',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>

          {query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {/* Dynamic Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            padding: '8px',
            boxShadow: 'var(--shadow-lg)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--r-lg)',
          }}
        >
          {/* Help Manual Suggestion */}
          {isHelpQuery && (
            <div
              className="station-item"
              style={{ padding: '8px 12px', background: 'var(--accent-dim)' }}
              onClick={() => {
                setIsOpen(false);
                setQuery('');
                onHelpOpen?.();
              }}
            >
              <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>📖</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                  SkyPulse Operator Manual &amp; Secret Help
                </div>
                <div className="text-xs text-secondary">
                  Complete guide: How to register with mobile &amp; set chat PIN
                </div>
              </div>
            </div>
          )}

          {/* Normal Weather / News Search Action */}
          <div
            className="station-item"
            style={{ padding: '8px 12px' }}
            onClick={() => handleSearchSubmit()}
          >
            <span style={{ fontSize: '1.1rem', marginRight: '8px' }}>🌤️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Query Weather Radar for &quot;{query}&quot;
              </div>
              <div className="text-xs text-muted">
                Search global atmospheric forecasts and satellite news
              </div>
            </div>
          </div>

          {/* Connect Station Relay / Peer Node */}
          <div
            className="station-item"
            style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}
            onClick={() => probeUser(query.trim())}
          >
            <span style={{ fontSize: '1.1rem', marginRight: '8px' }}>📡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent2)' }}>
                Sensor Relay / Station Node: &quot;{query.trim()}&quot;
              </div>
              <div className="text-xs text-muted">
                Connect peer node or unlock observation feed with PIN
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. PIN Unlock Modal for ALREADY ADDED Contact */}
      {unlockTarget && (
        <div
          className="modal-overlay"
          onClick={() => setUnlockTarget(null)}
          style={{ zIndex: 10000 }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>🔐 Enter Chat Security PIN</h2>
                <p className="text-xs text-muted">
                  Unlock chat with {unlockTarget.alias || unlockTarget.phoneNumber}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setUnlockTarget(null)}
              >
                ✕
              </button>
            </div>

            {unlockError ? <div className="auth-error mb-16">{unlockError}</div> : null}

            <form onSubmit={handleUnlockExisting} className="auth-form">
              <div className="input-group">
                <label>Security PIN for this Chat</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your security PIN"
                  value={unlockPin}
                  onChange={(e) => setUnlockPin(e.target.value)}
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
                  onClick={() => setUnlockTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={!unlockPin}
                >
                  Unlock &amp; Open Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Configure NEW Registered Mobile Contact */}
      {newContactTarget && (
        <div
          className="modal-overlay"
          onClick={() => setNewContactTarget(null)}
          style={{ zIndex: 10000 }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>📱 Add Registered User</h2>
                <p className="text-xs text-muted">
                  Mobile Verified: {newContactTarget.phoneNumber}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setNewContactTarget(null)}
              >
                ✕
              </button>
            </div>

            {unlockError ? <div className="auth-error mb-16">{unlockError}</div> : null}

            <form onSubmit={handleAddNewContact} className="auth-form">
              <div className="input-group">
                <label>Set Per-Chat Security PIN</label>
                <input
                  type="password"
                  className="input"
                  placeholder="4–8 digit PIN chosen by you"
                  value={newChatPin}
                  onChange={(e) => setNewChatPin(e.target.value)}
                  autoFocus
                  required
                />
                <span className="text-xs text-muted">
                  Protects this specific chat. You will enter this PIN whenever you open this conversation.
                </span>
              </div>

              <div className="input-group">
                <label>Custom Secret Alias</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Alex, Work Relay, Secret Contact"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                />
                <span className="text-xs text-muted">
                  Private name stored only on your local system.
                </span>
              </div>

              <div className="input-group">
                <label>Notification Disguise Name / Mask</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Severe Weather Warning, AeroMet Alert"
                  value={newNotifMask}
                  onChange={(e) => setNewNotifMask(e.target.value)}
                />
                <span className="text-xs text-muted">
                  The fake title that displays on lockscreen notifications when this person messages you.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setNewContactTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={probing || !newChatPin}
                >
                  {probing ? 'Saving Chat...' : 'Save &amp; Open Chat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
