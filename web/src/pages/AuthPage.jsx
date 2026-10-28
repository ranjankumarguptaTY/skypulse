import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [stationId, setStationId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, '');
      if (cleanPhone.length < 8) {
        setError('Please enter a valid mobile number (min 8 digits).');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }

      if (isRegister) {
        await register(cleanPhone, password, stationId.trim() || undefined);
      } else {
        await login(cleanPhone, password);
      }
      // Navigate to Home Screen once registered / logged in
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="landing-logo-icon">🌤️</div>
            <span className="text-gradient">SkyPulse</span>
          </div>
          <p className="auth-subtitle">
            {isRegister
              ? 'Register with your mobile number to deploy your encrypted weather station'
              : 'Sign in with your registered mobile number to access your station'}
          </p>

          {error && <div className="auth-error mb-16">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Registered Mobile Number</label>
              <input
                type="tel"
                className="input"
                placeholder="e.g. +1 555 123 4567 or 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                autoFocus
              />
              <span className="text-xs text-muted">
                {isRegister
                  ? 'Your unique identifier used by authorized peers to connect with you.'
                  : 'The mobile number you registered with.'}
              </span>
            </div>

            <div className="input-group">
              <label>Master Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="text-xs text-muted">
                Maintains your authenticated session for months.
              </span>
            </div>

            {isRegister && (
              <div className="input-group">
                <label>Station Call-Sign / Alias (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. echo-station-01, apex-node"
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                />
                <span className="text-xs text-muted">
                  Optional friendly node identifier (auto-assigned if left blank).
                </span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full mt-16"
              disabled={loading}
            >
              {loading
                ? 'Authenticating...'
                : isRegister
                ? 'Register & Deploy Station'
                : 'Sign In to SkyPulse'}
            </button>
          </form>

          <div className="auth-toggle">
            {isRegister ? (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                  }}
                >
                  Sign In with Mobile
                </button>
              </p>
            ) : (
              <p>
                First time using SkyPulse?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError('');
                  }}
                >
                  Register New Mobile Account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
