import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('sp_token');
        if (storedToken) {
          setToken(storedToken);
          const profile = await api.get('/auth/me');
          setUser(profile);
          await connectSocket(storedToken);
        }
      } catch (err) {
        console.warn('Mobile session restore error:', err);
        await logout();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const register = async (phoneNumber, password, stationId) => {
    const res = await api.post('/auth/register', {
      phoneNumber,
      password,
      stationId,
    });
    await AsyncStorage.setItem('sp_token', res.token);
    await AsyncStorage.setItem('sp_phone', res.phoneNumber);
    await AsyncStorage.setItem('sp_station_id', res.stationId);
    setToken(res.token);
    setUser({
      _id: res._id,
      phoneNumber: res.phoneNumber,
      stationId: res.stationId,
      notificationConfig: res.notificationConfig,
    });
    await connectSocket(res.token);
    return res;
  };

  const login = async (phoneNumber, password) => {
    const res = await api.post('/auth/login', {
      phoneNumber,
      password,
    });
    await AsyncStorage.setItem('sp_token', res.token);
    await AsyncStorage.setItem('sp_phone', res.phoneNumber);
    await AsyncStorage.setItem('sp_station_id', res.stationId);
    setToken(res.token);
    setUser({
      _id: res._id,
      phoneNumber: res.phoneNumber,
      stationId: res.stationId,
      notificationConfig: res.notificationConfig,
    });
    await connectSocket(res.token);
    return res;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('sp_token');
    await AsyncStorage.removeItem('sp_phone');
    await AsyncStorage.removeItem('sp_station_id');
    disconnectSocket();
    setToken(null);
    setUser(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
