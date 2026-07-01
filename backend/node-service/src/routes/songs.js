const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

// Mock songs data
const songs = [
  {
    id: 1,
    title: 'Midnight Dreams',
    artist: 'Luna Echo',
    album: 'Nocturne',
    duration: 245,
    genre: 'Electronic',
    coverArt: 'https://via.placeholder.com/200?text=Midnight+Dreams',
    source: 'spotify',
    plays: 15000,
    rating: 4.5
  },
  {
    id: 2,
    title: 'Summer Vibes',
    artist: 'Sunny Days',
    album: 'Tropical Paradise',
    duration: 210,
    genre: 'Pop',
    coverArt: 'https://via.placeholder.com/200?text=Summer+Vibes',
    source: 'youtube',
    plays: 20000,
    rating: 4.7
  },
  {
    id: 3,
    title: 'Rhythm of Life',
    artist: 'Urban Sound',
    album: 'City Nights',
    duration: 280,
    genre: 'Hip-Hop',
    coverArt: 'https://via.placeholder.com/200?text=Rhythm+of+Life',
    source: 'soundcloud',
    plays: 18000,
    rating: 4.3
  }
];

// Get all songs
router.get('/', optionalAuth, (req, res) => {
  try {
    const { page = 1, limit = 20, search, genre, sortBy = 'createdAt' } = req.query;

    let filtered = [...songs];

    // Search filter
    if (search) {
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Genre filter
    if (genre) {
      filtered = filtered.filter(s => s.genre.toLowerCase() === genre.toLowerCase());
    }

    // Sorting
    if (sortBy === 'popularity') {
      filtered.sort((a, b) => b.plays - a.plays);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedSongs = filtered.slice(skip, skip + limit);

    res.json({
      success: true,
      data: paginatedSongs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching songs:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch songs' }
    });
  }
});

// Get song by ID
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const song = songs.find(s => s.id == req.params.id);

    if (!song) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Song not found' }
      });
    }

    res.json({
      success: true,
      data: song
    });
  } catch (error) {
    logger.error('Error fetching song:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch song' }
    });
  }
});

// Stream song
router.get('/:id/stream', (req, res) => {
  try {
    const song = songs.find(s => s.id == req.params.id);

    if (!song) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Song not found' }
      });
    }

    logger.info(`Song streamed: ${song.title}`);

    // In production, stream actual audio file
    res.json({
      success: true,
      data: {
        streamUrl: `https://example.com/stream/${song.id}`,
        title: song.title,
        artist: song.artist
      }
    });
  } catch (error) {
    logger.error('Error streaming song:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STREAM_ERROR', message: 'Failed to stream song' }
    });
  }
});

module.exports = router;
