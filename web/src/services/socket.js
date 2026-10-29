import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

export const connectSocket = (token) => {
  if (socket) {
    if (token && socket.auth?.token !== token) {
      socket.auth = { token };
      if (socket.connected) {
        socket.disconnect().connect();
      } else {
        socket.connect();
      }
    } else if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('🟢 SkyPulse telemetry link established:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔴 SkyPulse telemetry link suspended:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('Telemetry link connection retry:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
