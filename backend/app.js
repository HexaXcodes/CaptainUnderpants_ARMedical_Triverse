// app.js - Main entry point (v1.1 hardened)
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// ===== Security & logging =====
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' } // allow images from /uploads
  })
);
app.use(morgan('dev')); // logs every request — super useful in hackathon

// ===== CORS =====
app.use(cors({ origin: '*', credentials: true })); // open for hackathon (ngrok)

// ===== Body parsing =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== Rate limiting =====
// Global: 200 req/min — generous, blocks only attackers
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' }
});
app.use(globalLimiter);

// Stricter for AI (protects your OpenAI billing): 30 req/min per IP
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'AI rate limit hit. Wait a minute.' }
});

// Stricter for auth (slows down brute-force): 10 req/min
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts. Try later.' }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== DB =====
connectDB();

// ===== Health check =====
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AR Medical Assistant Backend running',
    version: '1.1.0',
    timestamp: new Date().toISOString()
  });
});

// ===== Routes =====
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/upload', uploadRoutes);

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===== Error handler (LAST) =====
app.use((err, req, res, next) => {
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ error: 'File too large (max 10MB)' });

  console.error('[ERROR]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Expose via: ngrok http ${PORT}\n`);
});

// ===== Graceful shutdown =====
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  // Force exit if hang
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled errors instead of crashing
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});
