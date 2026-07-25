const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import routes
const authRoutes = require('./routes/auth');
const songsRoutes = require('./routes/songs');
const playlistRoutes = require('./routes/playlists');
const userRoutes = require('./routes/users');
const searchRoutes = require('./routes/search');
const socialRoutes = require('./routes/social');
const otpGatewayRoutes = require('./routes/otpGateway');

// Import middleware & SoundWave WAF Shield
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const {
  checkBannedIP,
  wafInspector,
  globalRateLimiter,
  authRateLimiter,
  searchRateLimiter,
  getSecurityStatus
} = require('./middleware/firewall');

const app = express();

// Enable Gzip/Deflate HTTP Response Compression
app.use(compression());

// Hardened HTTP Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

app.use(cors({
  origin: true,
  credentials: true
}));

// Body parser middleware (Reduced to 2mb for payload protection)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// SoundWave Web Application Firewall (WAF) & Rate Limiting Stack
app.use(checkBannedIP);
app.use(wafInspector);
app.use(globalRateLimiter);

// Logging middleware
app.use(morgan('combined'));
app.use(requestLogger);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// WAF Security Shield Status & Metrics Endpoint
app.get('/api/v1/security/status', (req, res) => {
  res.json({
    success: true,
    data: getSecurityStatus()
  });
});

// API Routes with Endpoint-Specific Protection
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/otp', authRateLimiter, otpGatewayRoutes);
app.use('/api/v1/songs', songsRoutes);
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/search', searchRateLimiter, searchRoutes);
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
const HOST = process.env.HOST || '0.0.0.0';

module.exports = app;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🎵 SoundWave API Server & WAF Shield`);
    console.log(`🚀 Running on port ${PORT}`);
    console.log(`🛡️ Web Application Firewall (WAF): ACTIVE`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n✅ Server is ready to accept secure requests!\n`);
  });
}
