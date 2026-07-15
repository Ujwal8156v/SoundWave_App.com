// API Service

const API_BASE_URL = (window.ENV && window.ENV.API_BASE_URL && !window.ENV.API_BASE_URL.startsWith('%'))
  ? window.ENV.API_BASE_URL
  : 'http://10.46.71.106:5000/api/v1';
class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: this.getHeaders(),
        ...options
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API Error');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async register(data) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (response.token) {
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
    }
    return response;
  }

  async getCurrentUser() {
    return this.request('/users/profile');
  }

  // Songs
  async getSongs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/songs?${queryString}`);
  }

  async getSongDetails(id) {
    return this.request(`/songs/${id}`);
  }

  async streamSong(id, title = '', artist = '') {
    const params = new URLSearchParams({
      token: localStorage.getItem('token') || '',
      _cb: Date.now(),
      ...(title && { title }),
      ...(artist && { artist })
    });
    return `${this.baseURL}/songs/${id}/stream?${params.toString()}`;
  }

  async downloadSong(id, quality = '320') {
    return this.request(`/songs/${id}/download`, {
      method: 'POST',
      body: JSON.stringify({ quality })
    });
  }

  // Search
  async search(query) {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // Playlists
  async getPlaylists() {
    return this.request('/playlists');
  }

  async createPlaylist(data) {
    return this.request('/playlists', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async addToPlaylist(playlistId, songId) {
    return this.request(`/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: JSON.stringify({ songId })
    });
  }

  // Social
  async likeSong(songId) {
    return this.request(`/social/like/${songId}`, { method: 'POST' });
  }

  async addComment(songId, text) {
    return this.request('/social/comments', {
      method: 'POST',
      body: JSON.stringify({ songId, text })
    });
  }

  async shareSong(songId, platform) {
    return this.request('/social/share', {
      method: 'POST',
      body: JSON.stringify({ songId, platform })
    });
  }
}

window.API = new APIService();
