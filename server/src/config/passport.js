const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { seedDefaultWellnessCategories, seedDefaultActivityTypes, seedDefaultDayDimensions } = require('../services/seedService');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      // Update existing user with new tokens
      user.googleAccessToken = accessToken;
      if (refreshToken) user.googleRefreshToken = refreshToken;
      await user.save();
      return done(null, user);
    }
    
    // Create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      profilePicture: profile.photos[0].value,
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken
    });
    
    await user.save();
    
    // Seed default wellness categories for new user
    await seedDefaultWellnessCategories(user._id);
    
    // Seed default activity types for new user
    await seedDefaultActivityTypes(user._id);
    
    // Seed default day dimensions for new user
    await seedDefaultDayDimensions(user._id);
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport; 