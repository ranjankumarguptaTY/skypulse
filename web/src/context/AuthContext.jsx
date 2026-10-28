import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sp_token'));
  const [loading, setLoading] = useState(true);

  // Initialize session from stored token (maintained for months)
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('sp_token');
      if (storedToken) {
        try {
          const profile = await api.get('/auth/me');
          setUser(profile);
          connectSocket(storedToken);
        } catch (err) {
          console.warn('Stored session invalid or expired:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const register = async (phoneNumber, password, stationId) => {
    const res = await api.post('/auth/register', {
      phoneNumber,
      password,
      stationId,
    });
    localStorage.setItem('sp_token', res.token);
    localStorage.setItem('sp_phone', res.phoneNumber);
    localStorage.setItem('sp_station_id', res.stationId);
    setToken(res.token);
    setUser({
      _id: res._id,
      phoneNumber: res.phoneNumber,
      stationId: res.stationId,
      notificationConfig: res.notificationConfig,
    });
    connectSocket(res.token);
    return res;
  };

  const login = async (phoneNumber, password) => {
    const res = await api.post('/auth/login', {
      phoneNumber,
      password,
    });
    localStorage.setItem('sp_token', res.token);
    localStorage.setItem('sp_phone', res.phoneNumber);
    localStorage.setItem('sp_station_id', res.stationId);
    setToken(res.token);
    setUser({
      _id: res._id,
      phoneNumber: res.phoneNumber,
      stationId: res.stationId,
      notificationConfig: res.notificationConfig,
    });
    connectSocket(res.token);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_phone');
    localStorage.removeItem('sp_station_id');
    disconnectSocket();
    setToken(null);
    setUser(null);
  };

  const updateNotificationConfig = async (displayName, messageTemplate) => {
    const updated = await api.put('/auth/notification-config', {
      displayName,
      messageTemplate,
    });
    setUser((prev) => (prev ? { ...prev, notificationConfig: updated } : prev));
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        updateNotificationConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
