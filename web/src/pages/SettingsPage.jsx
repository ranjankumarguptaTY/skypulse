import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { api } from '../services/api';

export const SettingsPage = () => {
  const { user, updateNotificationConfig, logout } = useAuth();
  const { reloadContacts } = useChat();

  const [displayName, setDisplayName] = useState(
    user?.notificationConfig?.displayName || 'Weather Alert Service'
  );
  const [messageTemplate, setMessageTemplate] = useState(
    user?.notificationConfig?.messageTemplate || 'weather'
  );

  // Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');

  const [savingConfig, setSavingConfig] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [msg, setMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    setMsg('');
    setErrMsg('');
    try {
      await updateNotificationConfig(displayName, messageTemplate);
      setMsg('Disguised notification profile saved.');
    } catch (err) {
      setErrMsg(err.message || 'Failed to update preferences.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setSavingPass(true);
    setMsg('');
    setErrMsg('');
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setMsg('Master access password updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setErrMsg(err.message || 'Password update failed.');
    } finally {
      setSavingPass(false);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPin) return;
    setSavingPin(true);
    setMsg('');
    setErrMsg('');
    try {
      await api.put('/auth/change-pin', {
        currentPassword,
        newPin,
      });
      setMsg('Station security PIN updated.');
      setNewPin('');
      setCurrentPassword('');
    } catch (err) {
      setErrMsg(err.message || 'PIN update failed.');
    } finally {
      setSavingPin(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm('Clear all local offline messages and contact caches on this device?')) {
      indexedDB.deleteDatabase('skypulse_local');
      await reloadContacts();
      setMsg('Local device cache wiped clean.');
    }
  };

  return (
    <div className="settings-page page-enter">
      <div className="settings-content">
        <Navbar />

        <div className="mt-24 mb-24">
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Station Configuration & Disguise Matrix
          </h1>
          <p className="text-sm text-secondary">
            Manage undercover push notifications, station security codes, and device storage
          </p>
        </div>

        {msg && (
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
            {msg}
          </div>
        )}

        {errMsg && <div className="auth-error mb-16">{errMsg}</div>}

        {/* Section 1: Push Disguise */}
        <section className="settings-section">
          <h3>DISGUISED NOTIFICATION MASK</h3>
          <form onSubmit={handleSaveNotifications} className="settings-card">
            <div className="settings-item">
              <div>
                <div className="settings-item-label">Broadcast Disguise Channel</div>
                <div className="settings-item-desc">
                  Incoming message alerts will appear on device screen disguised as this feed
                </div>
              </div>
              <select
                className="settings-select"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
              >
                <option value="weather">☁️ Weather Alerts & Severe Radar</option>
                <option value="news">📰 Breaking Global News Wire</option>
                <option value="random">🛰️ SkyPulse Satellite Telemetry</option>
              </select>
            </div>

            <div className="settings-item">
              <div>
                <div className="settings-item-label">Alert Sender Name</div>
                <div className="settings-item-desc">
                  The name displayed on system lockscreen notifications
                </div>
              </div>
              <input
                type="text"
                className="input"
                style={{ maxWidth: '200px', padding: '6px 12px', fontSize: '0.85rem' }}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div style={{ padding: '12px 20px', background: 'var(--bg-glass)' }}>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={savingConfig}
              >
                {savingConfig ? 'Saving...' : 'Apply Disguise Profile'}
              </button>
            </div>
          </form>
        </section>

        {/* Section 2: Peer Access Code (PIN) */}
        <section className="settings-section">
          <h3>STATION PEER SECURITY CODE (PIN)</h3>
          <form onSubmit={handleChangePin} className="settings-card">
            <div style={{ padding: '16px 20px' }}>
              <p className="text-xs text-muted mb-16">
                This is the authorization PIN other stations must enter to pair with your feed.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Current Master Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Verify password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>New Peer PIN (4–8 chars)</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="New PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-secondary btn-sm mt-16"
                disabled={savingPin}
              >
                {savingPin ? 'Updating PIN...' : 'Update Peer Access PIN'}
              </button>
            </div>
          </form>
        </section>

        {/* Section 3: Master Password */}
        <section className="settings-section">
          <h3>MASTER ACCESS PASSWORD</h3>
          <form onSubmit={handleChangePassword} className="settings-card">
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Current Master Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Current"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>New Master Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-secondary btn-sm mt-16"
                disabled={savingPass}
              >
                {savingPass ? 'Updating...' : 'Change Master Password'}
              </button>
            </div>
          </form>
        </section>

        {/* Section 4: Local Device Storage */}
        <section className="settings-section">
          <h3>DEVICE DATA PRIVACY</h3>
          <div className="settings-card">
            <div className="settings-item">
              <div>
                <div className="settings-item-label">Station Identifier</div>
                <div className="settings-item-desc">
                  Active node: <strong>{user?.stationId}</strong>
                </div>
              </div>
              <span className="badge badge-accent">Operational</span>
            </div>

            <div className="settings-item">
              <div>
                <div className="settings-item-label">Purge Local Messages Cache</div>
                <div className="settings-item-desc">
                  Wipes all IndexedDB messages and contacts stored on this local computer
                </div>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleClearCache}
              >
                Purge Local Data
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
