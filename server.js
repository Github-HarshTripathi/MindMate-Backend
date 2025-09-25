// server.js - Updated MongoDB connection
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

// Security & Rate Limit
app.use(helmet());
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://mind-mate-frontend-lime.vercel.app'
];
app.use(cors({ 
  origin: (origin, cb) => !origin || allowedOrigins.includes(origin) ? cb(null,true) : cb(new Error("Not allowed")), 
  credentials:true 
}));

// Body parser
app.use(express.json());

// Health check
app.get('/', (req,res) => res.send('🚀 MindMate Backend Running'));
app.get('/health', (req,res)=>res.json({status:'ok'}));

// ✅ FIXED MongoDB connection (updated options)
let cached = global.mongoose;
if(!cached) cached = global.mongoose = { conn:null, promise:null };

async function connectToDB(){
  if(cached.conn) return cached.conn;
  
  if(!cached.promise){
    // ✅ Updated connection options for Mongoose 8.x
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, options)
      .then(mongoose => {
        console.log('✅ MongoDB Connected Successfully');
        return mongoose;
      })
      .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        cached.promise = null; // Reset on error
        throw err;
      });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('🚨 Database Connection Failed:', error);
    throw error;
  }
}

// Connect DB per request (serverless safe)
app.use(async (req,res,next)=>{
  try {
    await connectToDB();
    next();
  } catch (error) {
    res.status(503).json({ 
      error: 'Service temporarily unavailable', 
      message: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// API routes
app.use('/api/journal', journalRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/ai', aiRoutes);

// Error handler
app.use(errorHandler);

// ===================
// LOCAL DEV
// ===================
if(process.env.NODE_ENV !== 'production'){
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, ()=> console.log(`🚀 Local server running at http://localhost:${PORT}`));
}

// ===================
// VERCEL EXPORT
// ===================
export default serverless(app);