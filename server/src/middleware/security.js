const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Rate limiting middleware
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Production-optimized rate limiting
const isProduction = process.env.NODE_ENV === 'production';

// General API rate limiting
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  isProduction ? 100 : 200, // Stricter in production
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiting for auth endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  isProduction ? 20 : 100, // Much stricter in production
  'Too many authentication attempts, please try again later.'
);

// User info endpoints rate limiting
const userInfoLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  isProduction ? 150 : 300, // Stricter in production
  'Too many user info requests, please try again later.'
);

// CORS configuration
const corsOptions = {
  origin: isProduction 
    ? [
        'https://eterny-app.ddns.net',
        'http://eterny-app.ddns.net', // Temporary fallback during transition
        ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
      ]
    : true, // Allow all origins only in development
  credentials: true,
  optionsSuccessStatus: 200
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: !isProduction // Only disable in development
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation error', details: errors });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate entry' });
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({ error: message });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    // Only log errors and slow requests in production
    if (process.env.NODE_ENV === 'production') {
      if (res.statusCode >= 400 || duration > 1000) {
        console.log('Request:', JSON.stringify(logData));
      }
    } else {
      console.log('Request:', JSON.stringify(logData));
    }
  });
  
  next();
};

module.exports = {
  apiLimiter,
  authLimiter,
  userInfoLimiter,
  corsOptions,
  securityHeaders,
  errorHandler,
  requestLogger
}; 