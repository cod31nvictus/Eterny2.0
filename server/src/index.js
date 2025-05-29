const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/database');
const { 
  apiLimiter, 
  authLimiter, 
  userInfoLimiter,
  corsOptions, 
  securityHeaders, 
  errorHandler, 
  requestLogger 
} = require('./middleware/security');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Passport config
require('./config/passport');

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_session_secret_change_this_in_production_immediately',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes with rate limiting
app.use('/auth', userInfoLimiter, require('./routes/auth'));
app.use('/api', apiLimiter); // Apply rate limiting to all API routes
app.use('/api/categories', require('./routes/wellnessCategories'));
app.use('/api/activities', require('./routes/activityTypes'));
app.use('/api/dimensions', require('./routes/dayDimensions'));
app.use('/api/templates', require('./routes/dayTemplates'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/profile', require('./routes/profile'));
app.use('/sync', apiLimiter, require('./routes/sync'));

// Backward compatibility routes
app.use('/quick-stats', apiLimiter, require('./routes/summary'));
app.use('/completion', apiLimiter, require('./routes/profile'));

// Test route (no rate limiting for health checks)
app.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for emulator access
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server is running on ${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security middleware enabled`);
  console.log(`📱 Accessible from Android emulator at 10.0.2.2:${PORT}`);
}); 