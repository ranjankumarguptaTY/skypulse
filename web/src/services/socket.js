import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => console.log('🟢 SkyPulse network connected'));
  socket.on('disconnect', () => console.log('🔴 SkyPulse network disconnected'));
  socket.on('connect_error', (err) => console.error('Connection error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
