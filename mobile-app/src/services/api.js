import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

async function headers() {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(await headers()),
      ...(options.headers || {})
    }
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || body?.detail || 'Request failed');
  }

  return body;
}

export const api = {
  getSongs: () => request('/songs?limit=30'),
  search: (query) => request(`/search?q=${encodeURIComponent(query)}`),
  likeSong: (songId) => request(`/social/like/${songId}`, { method: 'POST' }),
  shareSong: (songId, platform = 'mobile') =>
    request('/social/share', {
      method: 'POST',
      body: JSON.stringify({ songId, platform })
    }),
  createPlaylist: (name) =>
    request('/playlists', {
      method: 'POST',
      body: JSON.stringify({ name, isPublic: false })
    }),
  getPlaylists: () => request('/playlists'),
  deletePlaylist: (playlistId) => request(`/playlists/${playlistId}`, { method: 'DELETE' }),
  addSongToPlaylist: (playlistId, songId) =>
    request(`/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: JSON.stringify({ songId })
    }),
  removeSongFromPlaylist: (playlistId, songId) =>
    request(`/playlists/${playlistId}/songs/${songId}`, { method: 'DELETE' }),
  login: async (email, password) => {
    const body = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (body.token) {
      await AsyncStorage.setItem('token', body.token);
    }
    return body;
  },
  register: async (payload) => {
    const body = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (body.token) {
      await AsyncStorage.setItem('token', body.token);
    }
    return body;
  },
  getCurrentUser: () => request('/users/profile'),
  updateProfile: (payload) =>
    request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
};