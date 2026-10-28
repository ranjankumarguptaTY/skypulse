import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PendingMessage from '../models/PendingMessage.js';
import { sendDisguisedNotification } from '../services/pushNotification.js';

/** stationId → socket */
const onlineUsers = new Map();

export const setupSocket = (io) => {
  /* ── JWT auth middleware ── */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
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
    const stationId = socket.user.stationId;
    console.log(`Station online: ${stationId}`);

    onlineUsers.set(stationId, socket);
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });

    /* ── Flush pending messages ── */
    try {
      const pending = await PendingMessage.find({
        toStation: stationId,
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
        const msgPayload = {
          fromStation: stationId,
          toStation,
          encryptedPayload,
          type: type || 'text',
          fileMetadata: fileMetadata || null,
          timestamp: new Date().toISOString(),
        };

        const recipientSocket = onlineUsers.get(toStation);

        if (recipientSocket) {
          recipientSocket.emit('new-message', msgPayload);
          socket.emit('message-delivered', {
            toStation,
            timestamp: msgPayload.timestamp,
          });
        } else {
          await PendingMessage.create(msgPayload);

          // Disguised push notification using receiver's custom mask for sender
          const recipient = await User.findOne({ stationId: toStation });
          if (recipient?.fcmTokens?.length) {
            await sendDisguisedNotification(recipient, stationId);
          }

          socket.emit('message-stored', {
            toStation,
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
      onlineUsers.get(toStation)?.emit('user-typing', { fromStation: stationId });
    });
    socket.on('stop-typing', ({ toStation }) => {
      onlineUsers.get(toStation)?.emit('user-stop-typing', { fromStation: stationId });
    });

    /* ── Read receipts ── */
    socket.on('message-read', ({ toStation, timestamp }) => {
      onlineUsers
        .get(toStation)
        ?.emit('message-read-receipt', { fromStation: stationId, timestamp });
    });

    /* ── Disconnect ── */
    socket.on('disconnect', async () => {
      console.log(`Station offline: ${stationId}`);
      onlineUsers.delete(stationId);
      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: false,
        lastSeen: new Date(),
      });
    });
  });
};
