const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

// Mock playlists
const playlists = new Map();
let playlistId = 1;

// Get user playlists
router.get('/', verifyToken, (req, res) => {
  try {
    const userPlaylists = Array.from(playlists.values()).filter(
      p => p.owner === req.user.id
    );

    res.json({
      success: true,
      data: userPlaylists
    });
  } catch (error) {
    logger.error('Error fetching playlists:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch playlists' }
    });
  }
});

// Create playlist
router.post('/', verifyToken, (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_NAME', message: 'Playlist name is required' }
      });
    }

    const newPlaylist = {
      id: playlistId++,
      name,
      description,
      owner: req.user.id,
      songs: [],
      isPublic: isPublic || false,
      followers: 0,
      createdAt: new Date()
    };

    playlists.set(newPlaylist.id, newPlaylist);

    logger.info(`Playlist created: ${name} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: newPlaylist,
      message: 'Playlist created successfully'
    });
  } catch (error) {
    logger.error('Error creating playlist:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: 'Failed to create playlist' }
    });
  }
});

// Add song to playlist
router.post('/:playlistId/songs', verifyToken, (req, res) => {
  try {
    const { songId } = req.body;
    const playlist = playlists.get(parseInt(req.params.playlistId));

    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Playlist not found' }
      });
    }

    if (playlist.owner !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not own this playlist' }
      });
    }

    if (!playlist.songs.includes(songId)) {
      playlist.songs.push(songId);
    }

    logger.info(`Song added to playlist: ${req.params.playlistId}`);

    res.json({
      success: true,
      message: 'Song added to playlist',
      data: playlist
    });
  } catch (error) {
    logger.error('Error adding song to playlist:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ADD_ERROR', message: 'Failed to add song to playlist' }
    });
  }
});

// Delete playlist
router.delete('/:playlistId', verifyToken, (req, res) => {
  try {
    const playlist = playlists.get(parseInt(req.params.playlistId));

    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Playlist not found' }
      });
    }

    if (playlist.owner !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not own this playlist' }
      });
    }

    playlists.delete(playlist.id);
    logger.info(`Playlist deleted: ${req.params.playlistId}`);

    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting playlist:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete playlist' }
    });
  }
});

// Remove song from playlist
router.delete('/:playlistId/songs/:songId', verifyToken, (req, res) => {
  try {
    const playlist = playlists.get(parseInt(req.params.playlistId));
    const songId = parseInt(req.params.songId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Playlist not found' }
      });
    }

    if (playlist.owner !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not own this playlist' }
      });
    }

    playlist.songs = playlist.songs.filter(id => id !== songId);
    logger.info(`Song ${songId} removed from playlist ${req.params.playlistId}`);

    res.json({
      success: true,
      message: 'Song removed from playlist',
      data: playlist
    });
  } catch (error) {
    logger.error('Error removing song from playlist:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REMOVE_ERROR', message: 'Failed to remove song from playlist' }
    });
  }
});

module.exports = router;
