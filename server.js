import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import journalRoutes from './routes/journalRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// =======================
// ✅ Load environment variables
// =======================
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// ✅ Security Middleware
// =======================
app.use(helmet());

// =======================
// ✅ Rate Limiting (15 min window)
// =======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // Limit each IP to 100 requests
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// =======================
// ✅ CORS Configuration
// =======================
const allowedOrigins = [
  'http://localhost:5173',
  'https://mind-mate-frontend-lime.vercel.app' // ✅ your frontend live domain
];

app.use(cors({
  origin: function (origin, callback) {
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
// ✅ API Routes
// =======================
app.use('/api/journal', journalRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/ai', aiRoutes);

// =======================
// ✅ Error Handler
// =======================
app.use(errorHandler);

// =======================
// ✅ MongoDB Connection
// =======================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
})
.catch((err) => {
  console.error('❌ MongoDB Connection Failed:', err.message);
  process.exit(1);
});

// =======================
// ✅ Start Express Server
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
