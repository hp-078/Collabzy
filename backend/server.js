const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');
const { initializeSocket } = require('./config/socket');

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Connect to MongoDB
connectDB();

// ===========================================
// MIDDLEWARE
// ===========================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173' || "http://10.157.110.207:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ===========================================
// API ROUTES
// ===========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Collabzy API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const influencerRoutes = require('./routes/influencer.routes');
const brandRoutes = require('./routes/brand.routes');
const campaignRoutes = require('./routes/campaign.routes');
const applicationRoutes = require('./routes/application.routes');
const dealRoutes = require('./routes/deal.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
const reviewRoutes = require('./routes/review.routes');
const youtubeRoutes = require('./routes/youtube.routes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/influencer', influencerRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/youtube', youtubeRoutes);

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===========================================
// START SERVER
// ===========================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║        🚀 COLLABZY API SERVER STARTED 🚀       ║
║                                                ║
╚════════════════════════════════════════════════╝

📡 Server running in ${process.env.NODE_ENV || 'development'} mode
🌐 Listening on port: ${PORT}
🔗 API URL: http://localhost:${PORT}
💚 Health Check: http://localhost:${PORT}/api/health

Press Ctrl+C to stop the server
`);
});

module.exports = { app, server, io };
