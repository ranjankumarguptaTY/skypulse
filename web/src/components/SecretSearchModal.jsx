import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SecretSearchModal = () => {
  const { searchModalOpen, setSearchModalOpen, subscribeStation } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phoneInput, setPhoneInput] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [chatPin, setChatPin] = useState('');
  const [alias, setAlias] = useState('');
  const [notificationMask, setNotificationMask] = useState('Severe Weather Warning');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!searchModalOpen) return null;

  const handleClose = () => {
    setSearchModalOpen(false);
    setPhoneInput('');
    setFoundUser(null);
    setChatPin('');
    setAlias('');
    setNotificationMask('Severe Weather Warning');
    setError('');
    setSuccess('');
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim().replace(/[\s-]/g, '');
    if (!cleanPhone) return;

    if (cleanPhone === user?.phoneNumber) {
      setError('Cannot add your own mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/stations/lookup', { phoneNumber: cleanPhone });
      if (res.found) {
        setFoundUser(res);
      }
    } catch (err) {
      setError(
        err.message || 'No registered user found with this mobile number. User must register first.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddChat = async (e) => {
    e.preventDefault();
    if (!chatPin.trim()) {
      setError('Please set a security PIN for this chat.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await subscribeStation({
        phoneNumber: foundUser.phoneNumber,
        stationId: foundUser.stationId,
        alias: alias.trim() || foundUser.phoneNumber,
        pin: chatPin.trim(),
        notificationMask: notificationMask.trim(),
      });

      setSuccess('User verified & secret chat configured! Opening chat feed...');
      setTimeout(() => {
        handleClose();
        navigate('/feed');
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to initialize secret chat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>📡 Add Registered Contact</h2>
            <p className="text-xs text-muted">
              Connect to a registered user by mobile number &amp; set per-chat PIN
            </p>
          </div>
          <button type="button" className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {error && <div className="auth-error mb-16">{error}</div>}
        {success && (
          <div
            className="mb-16"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--success)',
              padding: '10px 14px',
              borderRadius: 'var(--r-md)',
              fontSize: '0.85rem',
            }}
          >
            {success}
          </div>
        )}

        {!foundUser ? (
          <form onSubmit={handleLookup} className="auth-form">
            <div className="input-group">
              <label>Target User Mobile Number</label>
              <input
                type="tel"
                className="input"
                placeholder="e.g. +1 555 123 4567 or 9876543210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                autoFocus
                required
              />
              <span className="text-xs text-muted mt-8">
                The contact must already be registered on SkyPulse with this mobile number.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-16"
              disabled={loading || !phoneInput.trim()}
            >
              {loading ? 'Verifying Registration...' : 'Verify Mobile Number'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAddChat} className="auth-form">
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--accent-dim)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--r-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '14px',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>📱</span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  User Verified: {foundUser.phoneNumber}
                </div>
                <div className="text-xs text-secondary">
                  Registered Node: {foundUser.stationId} · Ready to pair
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>Set Per-Chat Security PIN</label>
              <input
                type="password"
                className="input"
                placeholder="4–8 digit PIN chosen by you"
                value={chatPin}
                onChange={(e) => setChatPin(e.target.value)}
                autoFocus
                required
              />
              <span className="text-xs text-muted">
                Only you will need this PIN to open and read this chat. Protects this specific conversation.
              </span>
            </div>

            <div className="input-group">
              <label>Custom Secret Name / Alias</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Alex, Station Echo, Work Partner"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
              <span className="text-xs text-muted">
                Private name shown on your device only.
              </span>
            </div>

            <div className="input-group">
              <label>Notification Disguise Name / Mask</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Severe Weather Warning, AeroMet Alert"
                value={notificationMask}
                onChange={(e) => setNotificationMask(e.target.value)}
              />
              <span className="text-xs text-muted">
                The fake title that displays on lockscreen notifications when this person messages you.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFoundUser(null)}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading || !chatPin}
              >
                {loading ? 'Saving Secret Relay...' : 'Save & Open Chat'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
