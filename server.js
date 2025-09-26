import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import serverless from 'serverless-http';
// Routes imports
import journalRoutes from './routes/journalRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

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
const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI environment variable is required');
  process.exit(1);
}

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    console.log('✅ Using cached database connection');
    return cachedDb;
  }
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    const client = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      maxPoolSize: 10,
    });
    
    cachedDb = mongoose.connection;
    
    cachedDb.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      cachedDb = null;
    });
    
    cachedDb.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      cachedDb = null;
    });
    
    console.log('✅ MongoDB connected successfully');
    return cachedDb;
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    cachedDb = null;
    throw error;
  }
}

// Improved database connection middleware
app.use(async (req, res, next) => {
  // Skip database for AI routes that don't need it
  if (req.path.startsWith('/api/ai')) {
    return next();
  }
  
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database middleware error:', error);
    res.status(503).json({
      error: 'Service Temporarily Unavailable',
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
