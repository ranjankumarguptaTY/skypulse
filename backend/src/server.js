import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { initCloudinary } from './config/cloudinary.js';
import { initFirebase } from './config/firebase.js';
import { setupSocket } from './socket/index.js';
import { startFileCleanup } from './schedulers/fileCleanup.js';

import authRoutes from './routes/auth.js';
import stationRoutes from './routes/stations.js';
import fileRoutes from './routes/files.js';
import noteRoutes from './routes/notes.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ── Express & HTTP ── */
const app = express();
const httpServer = createServer(app);

const clientOrigin = process.env.CLIENT_URL || true;

/* ── Socket.io ── */
const io = new Server(httpServer, {
  cors: {
    origin: clientOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

/* ── Middleware ── */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

/* ── Routes ── */
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SkyPulse Weather Service' });
});

/* ── Static Frontend Serving (Single Deployment) ── */
const distPath = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

/* ── Boot ── */
const start = async () => {
  try {
    await connectDB();
    initCloudinary();
    initFirebase();
    setupSocket(io);
    startFileCleanup();

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () =>
      console.log(`SkyPulse service running → http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

export { io };
