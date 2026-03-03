const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
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

// Connect to MongoDB (legacy). Postgres is handled via Prisma with DATABASE_URL.
// TODO: remove MongoDB once all models are migrated to Postgres.
connectDB();

// Initialize Passport config
require('./config/passport');

const app = express();

// Trust proxy for reverse proxies (nginx, Railway, etc.)
app.set('trust proxy', 1);

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
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
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
app.use('/api/todo', require('./routes/todo'));
app.use('/api/habits', require('./routes/habits'));
app.use('/sync', apiLimiter, require('./routes/sync'));

// Backward compatibility routes
app.use('/quick-stats', apiLimiter, require('./routes/summary'));
app.use('/completion', apiLimiter, require('./routes/profile'));

// Simple healthcheck for Railway and other orchestrators
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';
const IS_RAILWAY = !!process.env.RAILWAY_ENV;

if (IS_RAILWAY) {
  // Railway terminates SSL at the edge; run HTTP only inside the container
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Railway server running on ${HOST}:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
  });
} else if (process.env.NODE_ENV === 'production') {
  // Existing on-prem/VM HTTPS setup
  const HTTPS_PORT = process.env.HTTPS_PORT || 443;
  const sslKeyPath = process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/eterny-app.ddns.net/privkey.pem';
  const sslCertPath = process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/eterny-app.ddns.net/fullchain.pem';

  try {
    if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
      const httpsOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      };

      https.createServer(httpsOptions, app).listen(HTTPS_PORT, HOST, () => {
        console.log(`🔒 HTTPS Server is running on ${HOST}:${HTTPS_PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV}`);
        console.log(`🔐 SSL certificates loaded successfully`);
      });

      const httpApp = express();
      httpApp.use((req, res) => {
        res.redirect(301, `https://${req.headers.host}${req.url}`);
      });

      http.createServer(httpApp).listen(80, HOST, () => {
        console.log(`🔄 HTTP redirect server running on ${HOST}:80`);
      });
    } else {
      console.log('⚠️  SSL certificates not found. Starting HTTP server only.');

      app.listen(PORT, HOST, () => {
        console.log(`🚀 HTTP Server is running on ${HOST}:${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      });
    }
  } catch (error) {
    console.error('❌ Error loading SSL certificates:', error.message);
    console.log('📝 Falling back to HTTP server');

    app.listen(PORT, HOST, () => {
      console.log(`🚀 HTTP Server is running on ${HOST}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  }
} else {
  // Development server (HTTP only)
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Development server running on ${HOST}:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security middleware enabled`);
    console.log(`📱 Accessible from Android emulator at 10.0.2.2:${PORT}`);
  });
}