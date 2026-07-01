const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

// Mock data
const songs = [
  { id: 1, title: 'Midnight Dreams', artist: 'Luna Echo' },
  { id: 2, title: 'Summer Vibes', artist: 'Sunny Days' },
  { id: 3, title: 'Rhythm of Life', artist: 'Urban Sound' }
];

const artists = [
  { id: 1, name: 'Luna Echo', followers: 50000 },
  { id: 2, name: 'Sunny Days', followers: 75000 },
  { id: 3, name: 'Urban Sound', followers: 60000 }
];

// Global search
router.get('/', optionalAuth, (req, res) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_QUERY', message: 'Search query is required' }
      });
    }

    const query = q.toLowerCase();
    const results = {};

    if (type === 'song' || type === 'all') {
      results.songs = songs.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.artist.toLowerCase().includes(query)
      ).slice(0, limit);
    }

    if (type === 'artist' || type === 'all') {
      results.artists = artists.filter(a =>
        a.name.toLowerCase().includes(query)
      ).slice(0, limit);
    }

    logger.info(`Search performed: ${q}`);

    res.json({
      success: true,
      data: results,
      query: q
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: 'Search failed' }
    });
  }
});

module.exports = router;
