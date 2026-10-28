import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { getWeatherData, getNewsData } from '../services/weatherNews';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const { setSearchModalOpen } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  const [weather, setWeather] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityInput, setCityInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Read ?q= from query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    setActiveSearch(query || '');

    const fetchData = async () => {
      setLoading(true);
      try {
        const targetCity = query || 'San Francisco';
        const [wData, nData] = await Promise.all([
          getWeatherData(targetCity),
          getNewsData('general'),
        ]);

        setWeather(wData);

        // If query exists, filter news or show relevant articles
        if (query) {
          const lower = query.toLowerCase();
          const filtered = nData.filter(
            (item) =>
              item.title.toLowerCase().includes(lower) ||
              item.description.toLowerCase().includes(lower) ||
              item.category.toLowerCase().includes(lower)
          );
          setNews(filtered.length > 0 ? filtered : nData);
        } else {
          setNews(nData);
        }
      } catch (err) {
        console.error('Data fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]);

  const handleCitySearch = async (e) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    navigate(`/?q=${encodeURIComponent(cityInput.trim())}`);
    setCityInput('');
  };

  const handleSecretEntry = () => {
    if (isAuthenticated) {
      setSearchModalOpen(true);
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="landing page-enter">
      <div className="landing-bg" />
      <div className="landing-content">
        <Navbar />

        {/* Search Active Notification Banner */}
        {activeSearch && (
          <div
            className="flex-between"
            style={{
              marginTop: '16px',
              padding: '12px 18px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--r-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span>🔍</span>
              <span>
                Atmospheric radar search results for: <strong>&quot;{activeSearch}&quot;</strong>
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/')}
            >
              Reset to Global View ✕
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section className="landing-hero">
          <div
            className="badge badge-accent mb-16"
            style={{ animation: 'pulse-glow 3s infinite' }}
          >
            Atmospheric Matrix &amp; Distributed Sensors
          </div>
          <h1>
            Global Weather Telemetry &amp;{' '}
            <span className="text-gradient">Real-Time Intelligence</span>
          </h1>
          <p>
            Continuous multi-vector meteorological streams, atmospheric pressure telemetry, and
            curated global wire feeds from remote orbital sensors.
          </p>

          <div className="flex-center gap-12" style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSecretEntry}
            >
              🔍 Explore Sensor Relays
            </button>
            <Link
              to={isAuthenticated ? '/dashboard' : '/auth'}
              className="btn btn-secondary"
            >
              {isAuthenticated ? 'Open Station Hub' : 'Set Up Weather Station'}
            </Link>
          </div>
        </section>

        {/* Main Weather Widget */}
        <section className="landing-grid">
          <div className="landing-weather-main">
            {weather ? (
              <div className="weather-main-card">
                <div className="weather-info">
                  <div className="weather-icon-large">{weather.icon}</div>
                  <div>
                    <div className="weather-temp">{weather.temp}°C</div>
                    <div className="weather-desc">{weather.description}</div>
                    <div className="weather-location">
                      📍 {weather.city}, {weather.country}
                    </div>
                  </div>
                </div>

                <div className="weather-details">
                  <div className="weather-detail">
                    <div className="weather-detail-value">{weather.humidity}%</div>
                    <div className="weather-detail-label">Humidity</div>
                  </div>
                  <div className="weather-detail">
                    <div className="weather-detail-value">{weather.windSpeed} km/h</div>
                    <div className="weather-detail-label">Wind Speed</div>
                  </div>
                  <div className="weather-detail">
                    <div className="weather-detail-value">{weather.pressure} hPa</div>
                    <div className="weather-detail-label">Barometer</div>
                  </div>
                  <div className="weather-detail">
                    <div className="weather-detail-value">{weather.uvIndex}</div>
                    <div className="weather-detail-label">UV Index</div>
                  </div>
                </div>

                <form
                  onSubmit={handleCitySearch}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    width: '100%',
                    maxWidth: '320px',
                    marginTop: '8px',
                  }}
                >
                  <input
                    type="text"
                    className="input"
                    placeholder="Query region (e.g. Tokyo, London)..."
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm">
                    Probe
                  </button>
                </form>
              </div>
            ) : (
              <div className="weather-main-card skeleton" style={{ height: '180px' }} />
            )}
          </div>

          {/* 5-Day Forecast Card */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="weather-forecast-card">
              <h3>5-Day Atmospheric Forecast</h3>
              <div className="forecast-list">
                {weather?.forecast?.map((f, idx) => (
                  <div key={idx} className="forecast-day">
                    <div className="forecast-day-name">{f.day}</div>
                    <div className="forecast-day-icon">{f.icon}</div>
                    <div className="forecast-day-temp">{f.temp}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Global News Wire Section */}
        <section className="news-section">
          <div className="section-header">
            <div>
              <h2>Global Satellite &amp; Intelligence Wire</h2>
              <p className="text-xs text-muted">
                Direct updates synchronized across planetary reporting corridors
              </p>
            </div>
            <span className="badge badge-purple">Live Feed</span>
          </div>

          <div className="news-grid">
            {news.map((item) => (
              <article key={item.id} className="news-card">
                <img
                  src={item.image}
                  alt={item.title}
                  className="news-card-img"
                  loading="lazy"
                />
                <div className="news-card-body">
                  <span className="news-card-source">{item.source} · {item.category}</span>
                  <h3 className="news-card-title">{item.title}</h3>
                  <p
                    className="text-xs text-secondary mt-8"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.description}
                  </p>
                  <div className="news-card-time">
                    ⏱️ {new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid var(--border)',
            padding: '32px 0 60px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
          }}
        >
          <div className="flex-center gap-8 mb-8">
            <span style={{ fontSize: '1rem' }}>🌤️</span>
            <strong>SkyPulse Meteorological System</strong>
          </div>
          <p>
            Encrypted Telemetry Protocol · Micro-Node Architecture · All local data stored on device
          </p>
        </footer>
      </div>
    </div>
  );
};
