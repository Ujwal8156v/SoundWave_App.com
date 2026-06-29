// Main Application Controller

class SoundWaveApp {
  constructor() {
    this.currentUser = null;
    this.currentSong = null;
    this.isPlaying = false;
    this.playlist = [];
    this.currentIndex = 0;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.restoreSession();
    await this.loadInitialData();
  }

  setupEventListeners() {
    // Navigation
    document.getElementById('menuToggle')?.addEventListener('click', () => this.toggleMenu());
    document.getElementById('loginBtn')?.addEventListener('click', () => this.openAuthModal());
    document.getElementById('logoutLink')?.addEventListener('click', () => this.logout());

    // Search
    document.getElementById('searchBtn')?.addEventListener('click', () => this.handleSearch());
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });

    // Playlists
    document.getElementById('createPlaylistBtn')?.addEventListener('click', () => this.createPlaylist());

    // Explore
    document.getElementById('exploreBtn')?.addEventListener('click', () => {
      document.getElementById('discover').scrollIntoView({ behavior: 'smooth' });
    });
  }

  toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu?.classList.toggle('active');
  }

  openAuthModal() {
    document.getElementById('authModal').style.display = 'block';
  }

  closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
  }

  async restoreSession() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = await API.getCurrentUser();
        this.setCurrentUser(user);
      } catch (error) {
        console.error('Session restore failed:', error);
        localStorage.removeItem('token');
      }
    }
  }

  setCurrentUser(user) {
    this.currentUser = user;
    document.getElementById('profileLink')?.style.display = 'block';
    document.getElementById('loginBtn')?.style.display = 'none';
    document.getElementById('logoutLink')?.style.display = 'block';
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser = null;
    document.getElementById('profileLink')?.style.display = 'none';
    document.getElementById('loginBtn')?.style.display = 'block';
    document.getElementById('logoutLink')?.style.display = 'none';
    this.showNotification('Logged out successfully');
  }

  async loadInitialData() {
    try {
      await this.loadSongs();
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  async loadSongs() {
    try {
      const response = await API.getSongs({ limit: 20 });
      this.renderSongs(response.data);
    } catch (error) {
      console.error('Failed to load songs:', error);
      this.showNotification('Failed to load songs', 'error');
    }
  }

  renderSongs(songs) {
    const grid = document.getElementById('songsGrid');
    if (!grid) return;

    grid.innerHTML = songs.map(song => `
      <div class="song-card" data-id="${song.id}">
        <img src="${song.coverArt}" alt="${song.title}" class="card-image">
        <div class="card-title">${song.title}</div>
        <div class="card-artist">${song.artist}</div>
        <div class="card-meta">${this.formatDuration(song.duration)}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.song-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const songId = e.currentTarget.dataset.id;
        this.playSong(songId, songs);
      });
    });
  }

  async playSong(songId, songs) {
    const song = songs.find(s => s.id == songId);
    if (song) {
      this.currentSong = song;
      this.playlist = songs;
      this.currentIndex = songs.findIndex(s => s.id == songId);
      await player.loadSong(song);
      this.updatePlayerUI();
    }
  }

  updatePlayerUI() {
    if (this.currentSong) {
      document.getElementById('songTitle').textContent = this.currentSong.title;
      document.getElementById('artistName').textContent = this.currentSong.artist;
      document.getElementById('coverArt').src = this.currentSong.coverArt;
    }
  }

  async handleSearch() {
    const query = document.getElementById('searchInput')?.value;
    if (!query) return;

    try {
      const results = await API.search(query);
      this.renderSongs(results.data.songs || []);
    } catch (error) {
      console.error('Search failed:', error);
      this.showNotification('Search failed', 'error');
    }
  }

  async createPlaylist() {
    const name = prompt('Enter playlist name:');
    if (!name) return;

    try {
      await API.createPlaylist({ name, description: '' });
      this.showNotification('Playlist created successfully');
      await this.loadPlaylists();
    } catch (error) {
      console.error('Failed to create playlist:', error);
      this.showNotification('Failed to create playlist', 'error');
    }
  }

  async loadPlaylists() {
    if (!this.currentUser) return;

    try {
      const response = await API.getPlaylists();
      this.renderPlaylists(response.data);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }

  renderPlaylists(playlists) {
    const grid = document.getElementById('playlistsGrid');
    if (!grid) return;

    grid.innerHTML = playlists.map(playlist => `
      <div class="playlist-card">
        <div class="card-title">${playlist.name}</div>
        <div class="card-meta">${playlist.songCount || 0} songs</div>
      </div>
    `).join('');
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  showNotification(message, type = 'info') {
    // Simple notification
    console.log(`[${type}] ${message}`);
    // TODO: Implement proper notification UI
  }
}

// Initialize app
const app = new SoundWaveApp();
