// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import serverless from 'serverless-http';

import journalRoutes from './routes/journalRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// =======================
// ✅ Security Middleware
// =======================
app.use(helmet());

// =======================
// ✅ Rate Limiting
// =======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// =======================
// ✅ CORS Configuration
// =======================
const allowedOrigins = [
  'http://localhost:5173',
  'https://mind-mate-frontend-lime.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// =======================
// ✅ Body Parser
// =======================
app.use(express.json());

// =======================
// ✅ Health Check
// =======================
app.get('/', (req, res) => res.send('🚀 MindMate Backend is Running ✅'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// =======================
// ✅ MongoDB Connection (Serverless Safe)
// =======================
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectToDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    }).then(mongoose => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// =======================
// ✅ API Routes (MongoDB connected per request)
// =======================
app.use(async (req, res, next) => {
  await connectToDB();
  next();
});

app.use('/api/journal', journalRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/ai', aiRoutes);

// =======================
// ✅ Error Handler
// =======================
app.use(errorHandler);

// =======================
// ✅ Export for Vercel Serverless
// =======================
export default serverless(app);
