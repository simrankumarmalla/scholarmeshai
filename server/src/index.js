import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDb } from './config/db.js';
import { seedDemoData } from './db/seed.js';

import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import sourceRoutes from './routes/sourceRoutes.js';
import synthesisRoutes from './routes/synthesisRoutes.js';
import copilotRoutes from './routes/copilotRoutes.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// General Rate Limiter (150 requests per 15 mins)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Stricter Rate Limiter for AI Generation Routes (30 requests per 15 mins)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI generation quota exceeded for this interval. Please try again shortly.' }
});

app.use('/api/', generalLimiter);
app.use('/api/workspaces/:workspaceId/sources', (req, res, next) => {
  if (req.method === 'POST') return aiLimiter(req, res, next);
  next();
});
app.use('/api/workspaces/:workspaceId/synthesize', aiLimiter);
app.use('/api/workspaces/:workspaceId/copilot', (req, res, next) => {
  if (req.method === 'POST') return aiLimiter(req, res, next);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'ScholarMesh AI',
    timestamp: new Date().toISOString()
  });
});

// Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:workspaceId/sources', sourceRoutes);
app.use('/api', synthesisRoutes);
app.use('/api/workspaces/:workspaceId/copilot', copilotRoutes);

// Centralized Error Handler
app.use(errorHandler);

// Server startup
async function startServer() {
  try {
    // 1. Initialize Database Schema
    await initDb();

    // 2. Seed Initial Demo Researcher and Multi-Source Workspace
    await seedDemoData();

    // 3. Listen on PORT
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🚀 ScholarMesh AI Server active on http://localhost:${PORT}`);
      console.log(`🔐 Demo login available: demo@scholarmesh.ai / DemoPass123!`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal server boot error:', err);
    process.exit(1);
  }
}

startServer();
