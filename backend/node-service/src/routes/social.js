const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { findSongById } = require('../data/store');
const { logger } = require('../middleware/logger');

// Mock social data
const comments = new Map();
const likes = new Set();
let commentId = 1;

// Add comment
router.post('/comments', verifyToken, (req, res) => {
  try {
    const { songId, text } = req.body;

    if (!songId || !text) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'songId and text required' }
      });
    }

    const song = findSongById(songId);
    if (!song) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Song not found' }
      });
    }

    const newComment = {
      id: commentId++,
      songId: song.id,
      userId: req.user.id,
      text,
      likes: 0,
      createdAt: new Date()
    };

    comments.set(newComment.id, newComment);

    logger.info(`Comment added to song ${songId} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: { code: 'COMMENT_ERROR', message: 'Failed to add comment' }
    });
  }
});

// Like song
router.post('/like/:songId', verifyToken, (req, res) => {
  try {
    const song = findSongById(req.params.songId);
    if (!song) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Song not found' }
      });
    }

    const likeKey = `${req.user.id}_${song.id}`;

    if (likes.has(likeKey)) {
      likes.delete(likeKey);
      logger.info(`Song ${song.id} unliked by user ${req.user.id}`);

      return res.json({
        success: true,
        message: 'Song unliked',
        liked: false
      });
    }

    likes.add(likeKey);
    logger.info(`Song ${song.id} liked by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Song liked',
      liked: true
    });
  } catch (error) {
    logger.error('Error liking song:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LIKE_ERROR', message: 'Failed to like song' }
    });
  }
});

// Share song
router.post('/share', verifyToken, (req, res) => {
  try {
    const { songId, platform } = req.body;

    if (!songId || !platform) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'songId and platform required' }
      });
    }

    const song = findSongById(songId);
    if (!song) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Song not found' }
      });
    }

    logger.info(`Song ${song.id} shared on ${platform}`);

    res.json({
      success: true,
      message: 'Song shared successfully',
      data: {
        shareUrl: `https://soundwave.app/share/${song.id}`,
        platform
      }
    });
  } catch (error) {
    logger.error('Error sharing song:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SHARE_ERROR', message: 'Failed to share song' }
    });
  }
});

module.exports = router;
