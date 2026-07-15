// restart
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

const { songs, artists } = require('../data/store');
const { getYouTubeAudioUrl } = require('../utils/youtube');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&tilde;/g, '~');
}

async function searchYouTubeScraper(q, host, protocol) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) return [];
    const html = await response.text();

    const regex = /ytInitialData\s*=\s*({.+?});/s;
    const match = html.match(regex);
    if (!match) return [];

    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) return [];

    const videoItems = [];
    for (const content of contents) {
      const itemSectionRenderer = content.itemSectionRenderer;
      if (!itemSectionRenderer) continue;

      const items = itemSectionRenderer.contents;
      if (!items) continue;

      for (const item of items) {
        const videoRenderer = item.videoRenderer;
        if (videoRenderer) {
          const videoId = videoRenderer.videoId;
          const title = videoRenderer.title?.runs?.[0]?.text;
          const artist = videoRenderer.ownerText?.runs?.[0]?.text || 'YouTube Creator';
          const coverArt = videoRenderer.thumbnail?.thumbnails?.[2]?.url || videoRenderer.thumbnail?.thumbnails?.[0]?.url;

          if (videoId && title) {
            videoItems.push({
              id: `yt-${videoId}`,
              title: decodeHtmlEntities(title),
              artist: decodeHtmlEntities(artist),
              album: 'YouTube Music',
              duration: 240,
              genre: 'YouTube',
              coverArt: coverArt || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
              source: 'youtube',
              plays: 150000,
              rating: 4.9,
              audioUrl: `${protocol}://${host}/api/v1/songs/yt-${videoId}/stream?title=${encodeURIComponent(decodeHtmlEntities(title))}&artist=${encodeURIComponent(decodeHtmlEntities(artist))}`
            });
          }
        }
      }
    }
    return videoItems.slice(0, 10);
  } catch (error) {
    logger.error('YouTube scraper search failed:', error);
  }
  return [];
}

// Global search
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_QUERY', message: 'Search query is required' }
      });
    }

    const query = q.toLowerCase();
    const results = { songs: [], artists: [] };

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

    // Integrate YouTube Search
    if (type === 'song' || type === 'all') {
      const keysEnv = process.env.YOUTUBE_API_KEYS || process.env.YOUTUBE_API_KEY;
      const apiKeys = keysEnv ? keysEnv.split(',').map(k => k.trim()).filter(Boolean) : [];
      const host = req.headers.host || 'localhost:5000';
      const protocol = req.secure ? 'https' : 'http';
      let ytSongs = [];
      let success = false;

      // Rotate through available API keys
      for (let i = 0; i < apiKeys.length; i++) {
        const key = apiKeys[i];
        try {
          const ytUrl = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(q)}&type=video&key=${key}&maxResults=10`;
          const response = await fetch(ytUrl);
          if (response.ok) {
            const data = await response.json();
            ytSongs = (data.items || []).map((item) => {
              const videoId = item.id.videoId;
              const title = decodeHtmlEntities(item.snippet.title);
              const artist = decodeHtmlEntities(item.snippet.channelTitle);
              return {
                id: `yt-${videoId}`,
                title: title,
                artist: artist,
                album: 'YouTube Music',
                duration: 240,
                genre: 'YouTube',
                coverArt: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
                source: 'youtube',
                plays: 125000,
                rating: 4.9,
                audioUrl: `${protocol}://${host}/api/v1/songs/yt-${videoId}/stream?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
              };
            });
            success = true;
            logger.info(`YouTube search API succeeded using key index ${i}`);
            break; // Exit keys loop on success
          } else {
            logger.warn(`YouTube search API returned status ${response.status} using key index ${i}. Trying next key...`);
          }
        } catch (err) {
          logger.error(`YouTube search API fetch failed using key index ${i}:`, err.message);
        }
      }

      // Fallback to scraping if API key is missing or failed (quota exceeded, block, etc.)
      if (!success) {
        ytSongs = await searchYouTubeScraper(q, host, protocol);
      }

      results.songs = [...results.songs, ...ytSongs];
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
