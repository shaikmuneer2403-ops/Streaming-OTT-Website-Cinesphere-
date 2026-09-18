import http from 'http';
import path from 'path';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './backend/server.js';
import { connectDB } from './backend/config/database.js';
import { errorHandler, notFoundHandler } from './backend/middleware/errorMiddleware.js';

const PORT = 3000;

interface LiveViewer {
  socketId: string;
  userId: string;
  name: string;
  email: string;
  profileImage: string;
  role: string;
  watching: string | null;
  progressText?: string;
  connectedAt: string;
  lastActive: string;
  ip: string;
}

async function startServer() {
  // 1. Connect to database
  await connectDB();

  // 2. Initialize Express application
  const app = createExpressApp();
  const server = http.createServer(app);

  // 3. Initialize Socket.IO with CORS
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Share Socket.IO instance with Express controllers
  app.set('io', io);

  // Active users in-memory live monitoring state
  const liveMonitoringState = new Map<string, LiveViewer>();
  app.set('liveMonitoringState', Array.from(liveMonitoringState.values()));

  function broadcastLiveViewers() {
    const list = Array.from(liveMonitoringState.values());
    app.set('liveMonitoringState', list);
    io.to('admin_room').emit('live_monitoring_update', {
      count: list.length,
      viewers: list
    });
  }

  // Real-Time Socket.IO event handling
  io.on('connection', (socket) => {
    const clientIp = socket.handshake.address || '127.0.0.1';

    // User identifies themselves upon login/app start
    socket.on('user_online', (userData) => {
      if (!userData || !userData._id) return;

      const viewer: LiveViewer = {
        socketId: socket.id,
        userId: userData._id || userData.id,
        name: userData.name || 'Anonymous User',
        email: userData.email || '',
        profileImage: userData.profileImage || '',
        role: userData.role || 'user',
        watching: null,
        connectedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        ip: clientIp
      };

      liveMonitoringState.set(socket.id, viewer);
      broadcastLiveViewers();
    });

    // When a user starts/resumes watching a movie in the player
    socket.on('watch_activity', (data) => {
      const viewer = liveMonitoringState.get(socket.id);
      if (viewer) {
        viewer.watching = data.title || null;
        viewer.progressText = data.progressText || '';
        viewer.lastActive = new Date().toISOString();
        broadcastLiveViewers();
      }
    });

    // Movie room join (for real-time live comments)
    socket.on('join_movie', (movieId) => {
      socket.join(`movie_${movieId}`);
    });

    socket.on('leave_movie', (movieId) => {
      socket.leave(`movie_${movieId}`);
    });

    // Admin dashboard joins admin room for instant metrics & live user monitoring
    socket.on('admin_join', () => {
      socket.join('admin_room');
      socket.emit('live_monitoring_update', {
        count: liveMonitoringState.size,
        viewers: Array.from(liveMonitoringState.values())
      });
    });

    // Disconnect event
    socket.on('disconnect', () => {
      if (liveMonitoringState.has(socket.id)) {
        liveMonitoringState.delete(socket.id);
        broadcastLiveViewers();
      }
    });
  });

  // 4. Serve Static standalone frontend/ directory for direct HTML/CSS/JS viewing
  const frontendPath = path.join(process.cwd(), 'frontend');
  app.use('/frontend', express.static(frontendPath));

  // 5. Mount Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 6. Centralized Error Handlers for unmatched API routes
  app.use(notFoundHandler);
  app.use(errorHandler);

  // 7. Start listening on 0.0.0.0:3000
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CineSphere OTT Platform is running at http://localhost:${PORT}`);
    console.log(`📡 Socket.IO Real-time service active`);
    console.log(`🛡️ Admin Demo Credentials: admin@cinesphere.tv / AdminPassword123!`);
    console.log(`👤 User Demo Credentials: user@cinesphere.tv / UserPassword123!`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
});
