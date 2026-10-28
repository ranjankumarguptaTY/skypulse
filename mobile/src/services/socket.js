import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_SOCKET_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

let socket = null;

export const connectSocket = async (token) => {
  if (socket?.connected) return socket;

  const stored = await AsyncStorage.getItem('skypulse_api_url');
  const url = stored ? stored.replace('/api', '') : DEFAULT_SOCKET_URL;

  socket = io(url, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => console.log('🟢 Mobile SkyPulse telemetry socket connected'));
  socket.on('disconnect', () => console.log('🔴 Mobile SkyPulse socket disconnected'));
  socket.on('connect_error', (err) => console.log('Socket error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
