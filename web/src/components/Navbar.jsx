import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { SearchBar } from './SearchBar';
import { HelpManualModal } from './HelpManualModal';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { contacts } = useChat();
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const totalUnread = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <>
      <header className="app-header" style={{ gap: '16px' }}>
        {/* Left: Brand & Help Key */}
        <div className="header-left" style={{ flexShrink: 0 }}>
          <Link to="/" className="landing-logo">
            <div className="landing-logo-icon">🌤️</div>
            <span className="text-gradient">SkyPulse</span>
          </Link>

          {/* Discreet Help Key Badge */}
          <button
            type="button"
            className="badge badge-accent"
            onClick={() => setHelpOpen(true)}
            title="SkyPulse Meteorological Information & Documentation"
            style={{
              cursor: 'pointer',
              border: 'none',
              fontSize: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>v2.4 Live Telemetry</span>
            <span style={{ opacity: 0.6, fontSize: '0.6rem' }}>[?]</span>
          </button>
        </div>

        {/* Center: Real Omnibar Search */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <SearchBar onHelpOpen={() => setHelpOpen(true)} />
        </div>

        {/* Right: Navigation Controls */}
        <nav className="header-right" style={{ flexShrink: 0 }}>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`btn btn-ghost btn-sm ${
                  location.pathname === '/dashboard' ? 'active' : ''
                }`}
              >
                📊 Dashboard
              </Link>
              <Link
                to="/notes"
                className={`btn btn-ghost btn-sm ${
                  location.pathname === '/notes' ? 'active' : ''
                }`}
              >
                📝 Notes
              </Link>
              <Link
                to="/feed"
                className={`btn btn-ghost btn-sm ${
                  location.pathname === '/feed' ? 'active' : ''
                }`}
                style={{ position: 'relative' }}
              >
                📡 Station Feed
                {totalUnread > 0 && (
                  <span
                    className="station-unread"
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '-6px',
                      width: '18px',
                      height: '18px',
                    }}
                  >
                    {totalUnread}
                  </span>
                )}
              </Link>

              <Link
                to="/settings"
                className="btn-icon"
                title="Telemetry & Station Config"
              >
                ⚙️
              </Link>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px',
                  background: 'var(--bg-glass)',
                  borderRadius: 'var(--r-full)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--online)',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {user?.stationId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                  title="Disconnect Station"
                >
                  ✕
                </button>
              </div>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm">
              Access Station
            </Link>
          )}
        </nav>
      </header>

      {/* Secret Help Manual Modal */}
      <HelpManualModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && (
        <nav className="mobile-nav">
          <ul className="mobile-nav-items">
            <li>
              <Link
                to="/dashboard"
                className={`mobile-nav-item ${
                  location.pathname === '/dashboard' ? 'active' : ''
                }`}
              >
                <span className="mobile-nav-icon">📊</span>
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/notes"
                className={`mobile-nav-item ${
                  location.pathname === '/notes' ? 'active' : ''
                }`}
              >
                <span className="mobile-nav-icon">📝</span>
                <span>Notes</span>
              </Link>
            </li>
            <li>
              <Link
                to="/feed"
                className={`mobile-nav-item ${
                  location.pathname === '/feed' ? 'active' : ''
                }`}
              >
                <span className="mobile-nav-icon">📡</span>
                <span>Feed</span>
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="mobile-nav-item"
                style={{ background: 'none', border: 'none' }}
              >
                <span className="mobile-nav-icon">📖</span>
                <span>Manual</span>
              </button>
            </li>
            <li>
              <Link
                to="/settings"
                className={`mobile-nav-item ${
                  location.pathname === '/settings' ? 'active' : ''
                }`}
              >
                <span className="mobile-nav-icon">⚙️</span>
                <span>Config</span>
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
};
