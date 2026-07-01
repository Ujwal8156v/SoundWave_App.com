const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const songsRoutes = require('./routes/songs');
const playlistRoutes = require('./routes/playlists');
const userRoutes = require('./routes/users');
const searchRoutes = require('./routes/search');
const socialRoutes = require('./routes/social');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware
app.use(morgan('combined'));
app.use(requestLogger);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/songs', songsRoutes);
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/social', socialRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`\n🎵 SoundWave API Server`);
  console.log(`🚀 Running on http://${HOST}:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`\n✅ Server is ready to accept requests!\n`);
});

module.exports = app;
