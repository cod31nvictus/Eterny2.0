const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Initialize Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Simple dummy login for development
router.post('/dummy-login', async (req, res) => {
  try {
    // Create or find test user
    let user = await User.findOne({ email: 'demo@eterny.com' });
    
    if (!user) {
      user = new User({
        googleId: 'demo_user_123',
        email: 'demo@eterny.com',
        name: 'Demo User',
        profilePicture: 'https://via.placeholder.com/150/6366f1/ffffff?text=DU'
      });
      await user.save();
      
      // Seed default data for demo user
      const { seedDefaultWellnessCategories, seedDefaultActivityTypes, seedDefaultDayDimensions } = require('../services/seedService');
      await seedDefaultWellnessCategories(user._id);
      await seedDefaultActivityTypes(user._id);
      await seedDefaultDayDimensions(user._id);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Dummy login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Simple login status check
router.get('/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Auth service running',
    timestamp: new Date().toISOString()
  });
});

// Google OAuth login
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: req.user._id,
        email: req.user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  }
);

// Google OAuth mobile endpoint for React Native
router.post('/google/mobile', async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const picture = payload['picture'];

    console.log('Google OAuth mobile - verified user:', { googleId, email, name });

    // Check if user already exists
    let user = await User.findOne({ googleId: googleId });
    
    if (!user) {
      // Check if user exists with same email but different googleId
      user = await User.findOne({ email: email });
      
      if (user) {
        // Update existing user with Google ID
        user.googleId = googleId;
        user.name = name;
        user.profilePicture = picture;
        await user.save();
      } else {
        // Create new user
        user = new User({
          googleId: googleId,
          email: email,
          name: name,
          profilePicture: picture
        });
        
        await user.save();
        
        // Seed default data for new user
        const { seedDefaultWellnessCategories, seedDefaultActivityTypes, seedDefaultDayDimensions } = require('../services/seedService');
        await seedDefaultWellnessCategories(user._id);
        await seedDefaultActivityTypes(user._id);
        await seedDefaultDayDimensions(user._id);
        
        console.log('New user created and seeded with default data:', user._id);
      }
    } else {
      // Update existing user info
      user.name = name;
      user.profilePicture = picture;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
    
  } catch (error) {
    console.error('Google mobile auth error:', error);
    res.status(500).json({ 
      error: 'Authentication failed', 
      details: error.message 
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profilePicture: req.user.profilePicture
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 