import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { api } from '../services/api';
import { getWeatherData } from '../services/weatherNews';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { setSearchModalOpen, setActiveContact } = useChat();
  const navigate = useNavigate();

  const [weather, setWeather] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [w, notes] = await Promise.all([
          getWeatherData('San Francisco'),
          api.get('/notes').catch(() => []),
        ]);
        setWeather(w);
        setRecentNotes(notes.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const openContactChat = (c) => {
    setActiveContact(c);
    navigate('/feed');
  };

  return (
    <div className="dashboard page-enter">
      <div className="dashboard-content">
        <Navbar />

        {/* Station Identification Header */}
        <div className="dashboard-section-header mt-24">
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              Station Hub ·{' '}
              <span className="text-gradient">{user?.stationId}</span>
            </h1>
            <p className="text-sm text-secondary">
              Meteorological observation matrix & peer telemetry telemetry link
            </p>
          </div>
          <div className="flex-center gap-8">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setSearchModalOpen(true)}
            >
              🔍 Connect Peer Relay
            </button>
            <Link to="/feed" className="btn btn-secondary btn-sm">
              📡 Open Feed
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-dim)' }}>
              🟢
            </div>
            <div className="stat-info">
              <h4>Telemetry Link</h4>
              <p>Active · Encrypted Node</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent2-dim)' }}>
              🛰️
            </div>
            <div className="stat-info">
              <h4>Zero-Trace Active</h4>
              <p>Manual Access Only</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              📝
            </div>
            <div className="stat-info">
              <h4>{recentNotes.length} Field Notes</h4>
              <p>Keep Records Stored</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              🌡️
            </div>
            <div className="stat-info">
              <h4>{weather?.temp ?? 22}°C / {weather?.humidity ?? 58}%</h4>
              <p>Atmospheric Ambient</p>
            </div>
          </div>
        </div>

        {/* Main Grid: Weather & Relays */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          {/* Weather Widget Snapshot */}
          <div className="card">
            <div className="flex-between mb-16">
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                Atmospheric Monitor
              </h3>
              <span className="badge badge-accent">Live Telemetry</span>
            </div>
            {weather ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '3rem' }}>{weather.icon}</span>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                      {weather.temp}°C
                    </div>
                    <div className="text-secondary text-sm">
                      {weather.condition} · {weather.city}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <span className="text-xs text-muted">PRESSURE</span>
                    <div style={{ fontWeight: 600 }}>{weather.pressure} hPa</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted">WIND VELOCITY</span>
                    <div style={{ fontWeight: 600 }}>{weather.windSpeed} km/h</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted">DEW POINT VISIBILITY</span>
                    <div style={{ fontWeight: 600 }}>{weather.visibility} km</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted">UV RADIATION</span>
                    <div style={{ fontWeight: 600 }}>Index {weather.uvIndex}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="skeleton" style={{ height: '160px' }} />
            )}
          </div>

          {/* Encrypted Telemetry Gateway Status (Zero-Trace: Zero contacts on screen) */}
          <div className="card">
            <div className="flex-between mb-16">
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                Atmospheric Telemetry Link
              </h3>
              <span className="badge badge-accent">Standby</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  background: 'var(--bg-glass)',
                  padding: '12px 16px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Zero-Trace Security Matrix</div>
                  <div className="text-xs text-muted">No peer station rosters are cached on screen</div>
                </div>
                <span className="station-status-dot" />
              </div>

              <div
                style={{
                  background: 'var(--bg-glass)',
                  padding: '12px 16px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Cipher &amp; Protocol Gate</div>
                  <div className="text-xs text-muted">Per-Chat PIN verification required for channel access</div>
                </div>
                <span style={{ fontSize: '0.85rem' }}>🔐</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate('/feed')}
                >
                  📡 Open Terminal Gateway
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSearchModalOpen(true)}
                >
                  🔍 Connect Relay
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Keep Notes Section */}
        <section className="dashboard-section">
          <div className="flex-between mb-16">
            <h2>📝 Recent Field Observations & Notes</h2>
            <Link to="/notes" className="btn btn-ghost btn-sm">
              View All Notes →
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <div className="card text-center" style={{ padding: '32px' }}>
              <p className="text-muted text-sm">
                No observations logged yet. Keep field logs, weather telemetry, or private memos.
              </p>
              <Link to="/notes" className="btn btn-secondary btn-sm mt-8">
                + Create Note
              </Link>
            </div>
          ) : (
            <div className="notes-grid">
              {recentNotes.map((n) => (
                <div
                  key={n._id}
                  className="note-card"
                  style={{ background: n.color || 'var(--bg-card)' }}
                  onClick={() => navigate('/notes')}
                >
                  {n.title && <h4 className="note-card-title">{n.title}</h4>}
                  <p className="note-card-content">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
