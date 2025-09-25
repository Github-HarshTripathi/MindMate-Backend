import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import serverless from 'serverless-http';
// Routes imports
import journalRoutes from '../routes/journalRoutes.js';
import moodRoutes from '../routes/moodRoutes.js';
import aiRoutes from '../routes/aiRoutes.js';
import { errorHandler } from '../middleware/errorHandler.js';

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://mind-mate-frontend-lime.vercel.app'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('CORS policy does not allow requested origin.'), false);
    }
    callback(null, true);
  },
  credentials: true
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check Routes
app.get('/', (req, res) => {
  res.json({
    message: '🚀 MindMate Backend Running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// MongoDB Connection (Optimized for Serverless)
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindmate';
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cachedDb = mongoose.connection;
    return cachedDb;
  } catch (error) {
    throw error;
  }
}

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/journal', journalRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/ai', aiRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error Handler
app.use(errorHandler);

// Serverless Handler
const handler = serverless(app);
export { handler };

// Local Development Server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
export default app;
