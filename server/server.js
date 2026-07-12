require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const tmdbRoutes = require('./routes/tmdb');
const listsRoutes = require('./routes/lists');

// Initialize database (creates tables on import)
require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging (dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/lists', listsRoutes);

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Flikpix API',
    timestamp: new Date().toISOString()
  });
});

// ─── Serve Frontend (Production) ─────────────────────────────
// In production, serve the built React app from client/dist
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Catch-all: serve index.html for any non-API route (client-side routing)
app.get('*', (req, res, next) => {
  // Don't catch API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// ─── Error Handling ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎬 Flikpix API Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}\n`);
});
