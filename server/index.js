const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const timeBlockRoutes = require('./src/routes/timeBlockRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Test endpoint
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Routes
app.use('/api/users', authRoutes);
app.use('/api/timeblocks', timeBlockRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 