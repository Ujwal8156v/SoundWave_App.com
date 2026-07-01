const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

// Get current user profile
router.get('/profile', verifyToken, (req, res) => {
  try {
    const user = {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      avatar: 'https://via.placeholder.com/150',
      followers: 100,
      following: 50,
      likedSongs: 500,
      listeningStats: {
        totalMinutes: 5000,
        songsHeard: 1000,
        favoriteGenre: 'Pop'
      }
    };

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch profile' }
    });
  }
});

// Update user profile
router.put('/profile', verifyToken, (req, res) => {
  try {
    const { username, bio, avatar } = req.body;

    const updatedUser = {
      id: req.user.id,
      email: req.user.email,
      username: username || req.user.username,
      bio,
      avatar: avatar || 'https://via.placeholder.com/150'
    };

    logger.info(`User profile updated: ${req.user.email}`);

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update profile' }
    });
  }
});

module.exports = router;
