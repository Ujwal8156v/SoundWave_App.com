// restart
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

const { songs, artists } = require('../data/store');

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

const YOUTUBE_DATA_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBGdoXzyWBgLsp5AO313zFF4QjaCLklQeM';

async function searchYouTubeDataAPI(q, host, protocol) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(q)}&key=${YOUTUBE_DATA_API_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return [];
    const data = await response.json();
    if (!data.items) return [];

    return data.items.map(item => {
      const videoId = item.id.videoId;
      const title = item.snippet?.title || 'YouTube Track';
      const artist = item.snippet?.channelTitle || 'YouTube Artist';
      const coverArt = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url;

      return {
        id: `yt-${videoId}`,
        videoId,
        title: decodeHtmlEntities(title),
        artist: decodeHtmlEntities(artist),
        album: 'YouTube Music',
        duration: 240,
        genre: 'YouTube',
        coverArt: coverArt || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        source: 'youtube',
        plays: 150000,
        rating: 4.9,
        audioUrl: `${protocol}://${host}/api/v1/songs/yt-${videoId}/stream?title=${encodeURIComponent(decodeHtmlEntities(title))}&artist=${encodeURIComponent(decodeHtmlEntities(artist))}`
      };
    });
  } catch (err) {
    logger.warn('YouTube Data API search error:', err.message);
    return [];
  }
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

async function searchiTunesAPI(q) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=10`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(item => ({
      id: `itunes-${item.trackId}`,
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName || 'iTunes Single',
      duration: Math.round((item.trackTimeMillis || 240000) / 1000),
      genre: item.primaryGenreName || 'Pop',
      coverArt: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '400x400bb') : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
      source: 'itunes',
      plays: 500000,
      rating: 4.9,
      audioUrl: item.previewUrl
    }));
  } catch (e) {
    return [];
  }
}

async function searchAudiusAPI(q) {
  try {
    const url = `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=SOUNDWAVE`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map(item => ({
      id: `audius-${item.id}`,
      title: item.title,
      artist: item.user?.name || 'Audius Artist',
      album: 'Audius Web3',
      duration: item.duration || 220,
      genre: item.genre || 'Electronic',
      coverArt: item.artwork?.['480x480'] || item.artwork?.['150x150'] || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
      source: 'audius',
      plays: item.play_count || 100000,
      rating: 4.8,
      audioUrl: `https://api.audius.co/v1/tracks/${item.id}/stream`
    }));
  } catch (e) {
    return [];
  }
}

async function searchArchiveOrgAPI(q) {
  try {
    const url = `https://archive.org/advancedsearch.php?q=mediatype:audio+AND+(${encodeURIComponent(q)})&fl[]=identifier,title,creator,publicdate&sort[]=downloads+desc&rows=10&output=json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.response?.docs || []).map(item => ({
      id: `archive-${item.identifier}`,
      title: item.title || 'Archive Audio Track',
      artist: item.creator || 'Open Music Creator',
      album: 'Internet Archive Open Collection',
      duration: 240,
      genre: 'Classic / Open Music',
      coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
      source: 'archive.org',
      plays: 250000,
      rating: 4.9,
      audioUrl: `https://archive.org/download/${item.identifier}`
    }));
  } catch (e) {
    return [];
  }
}

let spotifyAccessToken = null;
let spotifyTokenExpiresAt = 0;

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID || '814f3d0edc6e4eb0b971676c400ff89f';
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '7b96056ae64a4ba79dddb5cbe9e5afdd';

  if (!clientId || !clientSecret) return null;
  if (spotifyAccessToken && Date.now() < spotifyTokenExpiresAt) {
    return spotifyAccessToken;
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials',
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    spotifyAccessToken = data.access_token;
    spotifyTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return spotifyAccessToken;
  } catch (e) {
    return null;
  }
}

async function searchSpotifyAPI(q) {
  try {
    const token = await getSpotifyAccessToken();
    if (!token) return [];

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.tracks?.items || []).map(item => ({
      id: `spotify-${item.id}`,
      title: item.name,
      artist: item.artists?.map(a => a.name).join(', ') || 'Spotify Artist',
      album: item.album?.name || 'Spotify Single',
      duration: Math.round((item.duration_ms || 240000) / 1000),
      genre: 'Popular',
      coverArt: item.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
      source: 'spotify',
      plays: 1000000,
      rating: 5.0,
      audioUrl: item.preview_url || null,
      externalUrl: item.external_urls?.spotify
    }));
  } catch (e) {
    return [];
  }
}

// Global Search Cache
const searchQueryCache = new Map();
const SEARCH_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_QUERY', message: 'Search query is required' }
      });
    }

    const queryKey = `${q.toLowerCase().trim()}_${type}_${limit}`;
    const cached = searchQueryCache.get(queryKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp < SEARCH_CACHE_TTL)) {
      logger.info(`Search query resolved in 0ms from RAM cache: "${q}"`);
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
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

    // Parallel Multi-Provider Search (Spotify, iTunes, Audius, Archive.org, YouTube Scraper)
    if (type === 'song' || type === 'all') {
      const host = req.headers.host || 'localhost:5000';
      const protocol = req.secure ? 'https' : 'http';

      let ytSongs = await searchYouTubeDataAPI(q, host, protocol);
      if (!ytSongs || ytSongs.length === 0) {
        ytSongs = await searchYouTubeScraper(q, host, protocol);
      }

      const [spotifySongs, itunesSongs, audiusSongs, archiveSongs] = await Promise.all([
        searchSpotifyAPI(q),
        searchiTunesAPI(q),
        searchAudiusAPI(q),
        searchArchiveOrgAPI(q)
      ]);

      const seen = new Set(results.songs.map(s => String(s.id)));
      const combined = [...results.songs];

      [...spotifySongs, ...itunesSongs, ...audiusSongs, ...archiveSongs, ...ytSongs].forEach(song => {
        if (song && song.id && !seen.has(String(song.id))) {
          seen.add(String(song.id));
          combined.push(song);
        }
      });

      results.songs = combined.slice(0, limit);
    }

    logger.info(`Search performed: ${q}`);

    const responseData = {
      success: true,
      data: results,
      meta: {
        totalSongs: results.songs.length,
        totalArtists: results.artists.length
      }
    };

    searchQueryCache.set(queryKey, { data: responseData, timestamp: Date.now() });
    res.setHeader('X-Cache', 'MISS');
    res.json(responseData);
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: 'Search failed' }
    });
  }
});

module.exports = router;
