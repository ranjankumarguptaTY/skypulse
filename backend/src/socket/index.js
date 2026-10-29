import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PendingMessage from '../models/PendingMessage.js';
import { sendDisguisedNotification } from '../services/pushNotification.js';

export const setupSocket = (io) => {
  /* ── JWT auth middleware ── */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -connectionPin');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const rawStationId = socket.user.stationId;
    const stationId = rawStationId.trim().toLowerCase();
    const userRoom = `station:${stationId}`;

    // Join personal station room (supports multiple tabs/devices)
    socket.join(userRoom);
    console.log(`Station online: ${stationId} (socket: ${socket.id})`);

    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });

    /* ── Flush pending messages ── */
    try {
      const pending = await PendingMessage.find({
        toStation: { $regex: new RegExp(`^${stationId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        delivered: false,
      }).sort({ createdAt: 1 });

      if (pending.length) {
        socket.emit('pending-messages', pending);
        await PendingMessage.updateMany(
          { _id: { $in: pending.map((m) => m._id) } },
          { delivered: true }
        );
      }
    } catch (err) {
      console.error('Error flushing pending messages:', err);
    }

    /* ── Send message ── */
    socket.on('send-message', async (data) => {
      try {
        const { toStation, encryptedPayload, type, fileMetadata } = data;
        if (!toStation) return;

        const targetStation = toStation.trim().toLowerCase();
        const targetRoom = `station:${targetStation}`;

        const msgPayload = {
          fromStation: stationId,
          toStation: targetStation,
          encryptedPayload: encryptedPayload || '',
          type: type || 'text',
          fileMetadata: fileMetadata || null,
          timestamp: new Date().toISOString(),
        };

        // Check if recipient has any active sockets in their station room
        const roomSockets = io.sockets.adapter.rooms.get(targetRoom);
        const isRecipientOnline = roomSockets && roomSockets.size > 0;

        if (isRecipientOnline) {
          // Direct real-time delivery to all active recipient sockets
          io.to(targetRoom).emit('new-message', msgPayload);
          socket.emit('message-delivered', {
            toStation: targetStation,
            timestamp: msgPayload.timestamp,
          });
        } else {
          // Recipient currently offline: store in pending messages for next connect
          await PendingMessage.create(msgPayload);

          // Disguised push notification using receiver's custom mask
          const recipient = await User.findOne({ stationId: targetStation });
          if (recipient?.fcmTokens?.length) {
            await sendDisguisedNotification(recipient, stationId);
          }

          socket.emit('message-stored', {
            toStation: targetStation,
            timestamp: msgPayload.timestamp,
          });
        }
      } catch (err) {
        console.error('send-message error:', err);
        socket.emit('message-error', { error: 'Failed to send' });
      }
    });

    /* ── Typing indicators ── */
    socket.on('typing', ({ toStation }) => {
      if (toStation) {
        io.to(`station:${toStation.trim().toLowerCase()}`).emit('user-typing', {
          fromStation: stationId,
        });
      }
    });

    socket.on('stop-typing', ({ toStation }) => {
      if (toStation) {
        io.to(`station:${toStation.trim().toLowerCase()}`).emit('user-stop-typing', {
          fromStation: stationId,
        });
      }
    });

    /* ── Read receipts ── */
    socket.on('message-read', ({ toStation, timestamp }) => {
      if (toStation) {
        io.to(`station:${toStation.trim().toLowerCase()}`).emit('message-read-receipt', {
          fromStation: stationId,
          timestamp,
        });
      }
    });

    /* ── Disconnect ── */
    socket.on('disconnect', async () => {
      console.log(`Station socket disconnected: ${stationId} (${socket.id})`);
      const remainingSockets = io.sockets.adapter.rooms.get(userRoom);
      if (!remainingSockets || remainingSockets.size === 0) {
        await User.findByIdAndUpdate(socket.user._id, {
          isOnline: false,
          lastSeen: new Date(),
        });
      }
    });
  });
};
