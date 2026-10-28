import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { SearchBar } from './SearchBar';
import { HelpManualModal } from './HelpManualModal';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { contacts, activeContact } = useChat();
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const totalUnread = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // Hide mobile bottom nav during an active 1-on-1 chat in /feed so chat input has full bottom screen space
  const showMobileNav = isAuthenticated && (!activeContact || location.pathname !== '/feed');

  return (
    <>
      <header className="app-header">
        {/* Left: Brand & Telemetry Badge */}
        <div className="header-left">
          <Link to="/" className="landing-logo">
            <div className="landing-logo-icon">🌤️</div>
            <span className="text-gradient">SkyPulse</span>
          </Link>

          {/* Discreet Help Key Badge (hidden on mobile to save space) */}
          <button
            type="button"
            className="badge badge-accent header-telemetry-badge"
            onClick={() => setHelpOpen(true)}
            title="SkyPulse Meteorological Documentation"
            style={{
              cursor: 'pointer',
              border: 'none',
              fontSize: '0.65rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>v2.4 Telemetry</span>
            <span style={{ opacity: 0.6, fontSize: '0.6rem' }}>[?]</span>
          </button>
        </div>

        {/* Center: Real Omnibar Search (full width row on mobile) */}
        <div className="header-search-container">
          <SearchBar onHelpOpen={() => setHelpOpen(true)} />
        </div>

        {/* Right: Navigation Controls */}
        <nav className="header-right">
          {isAuthenticated ? (
            <>
              {/* Desktop-only Navigation Links (Hidden on mobile) */}
              <div className="desktop-nav-links">
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
                    <span className="station-unread">
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
              </div>

              {/* Station Badge & Disconnect */}
              <div className="station-user-badge">
                <span className="station-status-dot" />
                <span className="station-user-id" title={user?.stationId}>
                  {user?.stationId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="station-disconnect-btn"
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

      {/* Mobile Bottom Navigation Bar (Active on Mobile, Hidden on Desktop) */}
      {showMobileNav && (
        <nav className="mobile-nav">
          <ul className="mobile-nav-items">
            <li>
              <Link
                to="/"
                className={`mobile-nav-item ${
                  location.pathname === '/' ? 'active' : ''
                }`}
              >
                <span className="mobile-nav-icon">🌤️</span>
                <span>Weather</span>
              </Link>
            </li>
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
                to="/feed"
                className={`mobile-nav-item ${
                  location.pathname === '/feed' ? 'active' : ''
                }`}
                style={{ position: 'relative' }}
              >
                <span className="mobile-nav-icon">📡</span>
                <span>Feed</span>
                {totalUnread > 0 && (
                  <span className="mobile-unread-dot">
                    {totalUnread}
                  </span>
                )}
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
