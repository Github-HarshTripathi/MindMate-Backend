import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import serverless from 'serverless-http';

// Routes
import journalRoutes from './routes/journalRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://mind-mate-frontend-lime.vercel.app',
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        return callback(
          new Error(
            'The CORS policy for this site does not allow access from the specified Origin.'
          ),
          false
        );
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/', (req, res) =>
  res.json({ message: '🚀 MindMate Backend Running', timestamp: new Date().toISOString() })
);
app.get('/health', (req, res) =>
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  })
);

// MongoDB Connection
const MONGODB_URI = process.env.MONGO_URI;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cachedDb = mongoose.connection;
    console.log('✅ MongoDB connected');
    return cachedDb;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
}

// Database middleware
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(503).json({ error: 'Database connection failed', timestamp: new Date().toISOString() });
  }
});

// API Routes
app.use('/api/journal', journalRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/ai', aiRoutes);

// Catch-all for React frontend (if serving build from same project)
import path from 'path';
app.use(express.static(path.join(process.cwd(), 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client/build', 'index.html'));
});

// 404 Handler
app.use('*', (req, res) =>
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  })
);

// Error Handler
app.use(errorHandler);

// Serverless Export
const handler = serverless(app);
export { handler };

// Local Dev
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;
