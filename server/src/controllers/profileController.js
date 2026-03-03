const Profile = require('../models/Profile');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Format date for frontend
    const formattedProfile = {
      fullName: profile.fullName,
      dateOfBirth: profile.dateOfBirth.toISOString().split('T')[0], // YYYY-MM-DD format
      gender: profile.gender,
      isProfileComplete: profile.isProfileComplete
    };
    
    res.json(formattedProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, dateOfBirth, gender } = req.body;
    
    // Validate required fields
    if (!fullName || !dateOfBirth || !gender) {
      return res.status(400).json({ error: 'Full name, date of birth, and gender are required' });
    }
    
    // Validate gender enum
    const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender value' });
    }
    
    // Validate date format and convert to Date object
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return res.status(400).json({ error: 'Date of birth must be in YYYY-MM-DD format' });
    }
    
    const dobDate = new Date(dateOfBirth);
    if (isNaN(dobDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date of birth' });
    }
    
    // Check if date is not in the future
    if (dobDate > new Date()) {
      return res.status(400).json({ error: 'Date of birth cannot be in the future' });
    }
    
    // Update or create profile
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      {
        fullName: fullName.trim(),
        dateOfBirth: dobDate,
        gender,
        isProfileComplete: true
      },
      { 
        new: true, 
        upsert: true, // Create if doesn't exist
        runValidators: true 
      }
    );
    
    // Format response
    const formattedProfile = {
      fullName: profile.fullName,
      dateOfBirth: profile.dateOfBirth.toISOString().split('T')[0],
      gender: profile.gender,
      isProfileComplete: profile.isProfileComplete
    };
    
    res.json(formattedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error: ' + error.message });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Check if user has completed profile
const checkProfileCompletion = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    
    res.json({
      hasProfile: !!profile,
      isComplete: profile ? profile.isProfileComplete : false
    });
  } catch (error) {
    console.error('Error checking profile completion:', error);
    res.status(500).json({ error: 'Failed to check profile completion' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  checkProfileCompletion
}; 