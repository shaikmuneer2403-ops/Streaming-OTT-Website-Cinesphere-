import express from 'express';
import cors from 'cors';
import { connectDB, isDbConnected, getDatabaseInfo } from './config/database.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import seriesRoutes from './routes/seriesRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

export function createExpressApp() {
  const app = express();

  // Basic security and parsing middleware
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Simple in-memory rate limiter per IP
  const requestCounts = new Map();
  app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 250;

    let record = requestCounts.get(ip);
    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      requestCounts.set(ip, record);
    } else {
      record.count++;
      if (record.count > maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Rate limit exceeded, please wait a minute.'
        });
      }
    }
    next();
  });

  // Database Health check endpoint (Requirement 8)
  app.get('/api/health', (req, res) => {
    const dbInfo = getDatabaseInfo();
    const isConnected = isDbConnected();

    if (isConnected) {
      return res.json({
        success: true,
        database: 'connected',
        databaseName: dbInfo.databaseName || 'cinesphere',
        engine: dbInfo.connectionType,
        atlasConnected: dbInfo.connectionType === 'Atlas',
        atlasError: dbInfo.error || null,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(503).json({
        success: false,
        database: 'disconnected',
        error: dbInfo.error || 'MongoDB connection offline',
        timestamp: new Date().toISOString()
      });
    }
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/series', seriesRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/favorites', favoriteRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);

  return app;
}
