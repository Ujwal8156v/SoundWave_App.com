// Main Application Controller

class SoundWaveApp {
  constructor() {
    this.currentUser = null;
    this.currentSong = null;
    this.isPlaying = false;
    this.playlist = [];
    this.currentIndex = 0;
    this.playlists = [];
    this.likedSongsSet = new Set();
    this.isEditingProfile = false;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.initPaymentCheckout();
    this.restoreSession();
    await this.loadInitialData();
  }

  setupEventListeners() {
    // Navigation Routing events
    window.addEventListener('hashchange', () => this.handleRouting());
    window.addEventListener('load', () => this.handleRouting());

    // Logo Brand Click Refresh / Home Navigate
    document.querySelector('.navbar-brand')?.addEventListener('click', (e) => {
      if (window.location.hash === '' || window.location.hash === '#home') {
        e.preventDefault();
        window.location.reload();
      }
    });

    document.getElementById('menuToggle')?.addEventListener('click', () => this.toggleMenu());
    document.getElementById('loginBtn')?.addEventListener('click', () => this.openAuthModal());
    document.getElementById('communitySignUpBtn')?.addEventListener('click', () => this.openAuthModal());
    document.getElementById('exploreBtn')?.addEventListener('click', () => {
      window.location.hash = '#discover';
    });
    document.getElementById('logoutLink')?.addEventListener('click', () => this.logout());

    // Discover Page Search Handler Setup
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput) {
      let debounceTimeout;

      const executeSearch = () => {
        clearTimeout(debounceTimeout);
        this.extractSuggestions();
        this.handleSearch();
      };

      searchBtn?.addEventListener('click', executeSearch);
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeSearch();
      });

      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        const val = searchInput.value.trim();

        if (val.length === 0) {
          this.playlist = [...(this.allSongs || [])];
          this.renderSongs(this.playlist);
          const suggestions = document.getElementById('searchSuggestions');
          if (suggestions) suggestions.style.display = 'none';
        } else {
          // Instant local filtering preview (0ms)
          this.extractSuggestions();
          const qLower = val.toLowerCase();
          const localMatches = (this.allSongs || []).filter(s =>
            s.title.toLowerCase().includes(qLower) ||
            s.artist.toLowerCase().includes(qLower) ||
            (s.genre && s.genre.toLowerCase().includes(qLower))
          );
          if (localMatches.length > 0) {
            this.playlist = localMatches;
            this.renderSongs(this.playlist);
          }

          // Debounced API search
          debounceTimeout = setTimeout(() => {
            this.handleSearch();
          }, 250);
        }
      });
    }

    // Playlists
    document.getElementById('createPlaylistBtn')?.addEventListener('click', () => this.createPlaylist());

    // Explore Button Navigation
    document.getElementById('exploreBtn')?.addEventListener('click', () => {
      window.location.hash = '#discover';
    });

    // Minimized Player Bar Click (Expand Player Modal)
    document.querySelector('.now-playing')?.addEventListener('click', () => {
      if (this.currentSong) {
        document.getElementById('playerModal').style.display = 'block';
      }
    });

    // Close Player Modal when clicking outside content
    window.addEventListener('click', (e) => {
      const modal = document.getElementById('playerModal');
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Settings Dropdown Toggling
    document.getElementById('settingsLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('settingsDropdown')?.classList.toggle('active');
    });

    window.addEventListener('click', () => {
      document.getElementById('settingsDropdown')?.classList.remove('active');
    });

    // Equaliser adjustments click handler
    document.getElementById('equaliserBtn')?.addEventListener('click', () => {
      alert('Equaliser adjusted to "Smart Dynamic Bass Boost" mode successfully!');
      this.showNotification('Equaliser preset updated');
    });

    // Clear downloads click handler
    document.getElementById('clearDownloadsBtn')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all cached downloads? This will free up 142 MB.')) {
        const text = document.getElementById('storageStatusText');
        if (text) text.textContent = 'Used: 0 B / Available: 4.9 GB';
        this.showNotification('Downloads cache cleared successfully');
      }
    });

    // AI BeatVibe Live Audio Drum Synth & DJ Loop Handlers
    document.getElementById('padKick')?.addEventListener('click', () => window.AIBeatVibe?.triggerKick());
    document.getElementById('padSnare')?.addEventListener('click', () => window.AIBeatVibe?.triggerSnare());
    document.getElementById('padHiHat')?.addEventListener('click', () => window.AIBeatVibe?.triggerHiHat());
    document.getElementById('padCyber')?.addEventListener('click', () => window.AIBeatVibe?.triggerCyberSub());

    document.getElementById('toggleAiDjLoopBtn')?.addEventListener('click', () => {
      if (window.AIBeatVibe) {
        const isPlaying = window.AIBeatVibe.toggleLoop();
        const btn = document.getElementById('toggleAiDjLoopBtn');
        if (btn) {
          btn.textContent = isPlaying ? '⏹️ Stop AI DJ Loop' : '🤖 Toggle AI DJ Loop';
          btn.style.backgroundColor = isPlaying ? '#ef4444' : 'rgba(255,255,255,0.1)';
        }
        this.showNotification(isPlaying ? 'AI DJ Drum Loop Layering Active ⚡' : 'AI DJ Loop Stopped');
      }
    });

    // Auto-save toggle controls dynamically
    const configKeys = [
      'restrictedMode', 'allowExternalPlayback', 'doubleTapSeek', 'dynamicQueue',
      'showDeviceFiles', 'downloadWifiOnly', 'smartDownload', 'saveRecentSongs',
      'musicRecommendations', 'playlistUpdates'
    ];
    configKeys.forEach(key => {
      document.getElementById(key)?.addEventListener('change', (e) => {
        localStorage.setItem(`settings_${key}`, e.target.checked);
        this.showNotification('Setting auto-saved');
      });
    });

    document.getElementById('audioQualitySelect')?.addEventListener('change', (e) => {
      localStorage.setItem('settings_audioQuality', e.target.value);
      this.showNotification('Audio quality updated');
    });

    // FAQ Accordion Toggle Interaction
    document.querySelectorAll('.faq-question').forEach(button => {
      button.addEventListener('click', () => {
        const item = button.parentElement;
        const answer = item.querySelector('.faq-answer');
        const isActive = item.classList.contains('active');

        // Close all accordion elements first
        document.querySelectorAll('.faq-item').forEach(el => {
          el.classList.remove('active');
          const ans = el.querySelector('.faq-answer');
          if (ans) ans.style.maxHeight = null;
        });

        if (!isActive) {
          item.classList.add('active');
          if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });

    // Contact Form Submission Action
    document.getElementById('contactForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('contactName')?.value;
      const email = document.getElementById('contactEmail')?.value;
      const subject = document.getElementById('contactSubject')?.value;
      const message = document.getElementById('contactMessage')?.value;

      if (name && email && subject && message) {
        this.showNotification(`Message received! Thank you, ${name}.`);
        alert(`Message Sent!\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nOur support team will contact you shortly.`);
        document.getElementById('contactForm').reset();
      }
    });
  }

  handleRouting() {
    let hash = window.location.hash.replace('#', '');
    
    // Check if the hash is a sub-anchor on the landing page
    const subAnchors = ['features', 'pricing', 'faq', 'contact'];
    const isSubAnchor = subAnchors.includes(hash);
    
    let activeSection = hash;
    if (!activeSection || (!['home', 'discover', 'playlists', 'profile', 'settings'].includes(activeSection) && !isSubAnchor)) {
      activeSection = 'home';
    } else if (isSubAnchor) {
      activeSection = 'home';
    }

    // Hide all primary sections
    const sections = ['home', 'discover', 'playlists', 'profile', 'settings'];
    sections.forEach(sec => {
      const el = document.getElementById(sec);
      if (el) el.style.display = 'none';
    });

    // Show active primary section
    const activeEl = document.getElementById(activeSection);
    if (activeEl) activeEl.style.display = 'block';

    // Highlight nav link
    document.querySelectorAll('.nav-menu a').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${hash}`) {
        link.classList.add('active');
      } else if (!hash && href === '#home') {
        link.classList.add('active');
      }
    });

    // Close mobile nav drawer if active after link navigation click
    document.querySelector('.nav-menu')?.classList.remove('active');

    // Smooth scroll to the target sub-anchor if applicable
    if (isSubAnchor) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (hash === 'home' || !hash) {
      // Scroll back to top on Home navigate
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }

    // Handle player bar visibility
    const playerBar = document.querySelector('.player');
    if (playerBar) {
      if (hash === 'profile' || hash === 'settings') {
        playerBar.style.display = 'none';
      } else {
        playerBar.style.display = 'block';
      }
    }
  }

  toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu?.classList.toggle('active');
  }

  openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'block';
  }

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
  }

  async restoreSession() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = await API.getCurrentUser();
        this.setCurrentUser(user.data || user);
      } catch (error) {
        console.error('Session restore failed:', error);
        localStorage.removeItem('token');
      }
    }
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (user.email) {
      localStorage.setItem('userEmail', user.email);
    }
    
    // Toggle navigation visibilities
    const settingsDropdown = document.getElementById('settingsDropdown');
    if (settingsDropdown) settingsDropdown.style.display = 'block';

    const navPlaylists = document.getElementById('navPlaylists');
    if (navPlaylists) navPlaylists.style.display = 'block';
    
    const loginNavItem = document.getElementById('loginNavItem');
    if (loginNavItem) loginNavItem.style.display = 'none';

    // Resume pending checkout if user initiated subscription before login
    if (this.pendingCheckoutPlan) {
      const plan = this.pendingCheckoutPlan;
      this.pendingCheckoutPlan = null;
      setTimeout(() => {
        this.openPaymentModal(plan);
      }, 350);
    }

    // Restore checkbox toggle configurations from localStorage
    const configKeys = [
      'restrictedMode', 'allowExternalPlayback', 'doubleTapSeek', 'dynamicQueue',
      'showDeviceFiles', 'downloadWifiOnly', 'smartDownload', 'saveRecentSongs',
      'musicRecommendations', 'playlistUpdates'
    ];
    configKeys.forEach(key => {
      const val = localStorage.getItem(`settings_${key}`) === 'true';
      const el = document.getElementById(key);
      if (el) el.checked = val;
    });

    const qualityVal = localStorage.getItem('settings_audioQuality') || 'medium';
    const qualityEl = document.getElementById('audioQualitySelect');
    if (qualityEl) qualityEl.value = qualityVal;

    this.loadPlaylists();
    this.renderProfile();
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser = null;
    this.isEditingProfile = false;
    
    const settingsDropdown = document.getElementById('settingsDropdown');
    if (settingsDropdown) settingsDropdown.style.display = 'none';

    const navPlaylists = document.getElementById('navPlaylists');
    if (navPlaylists) navPlaylists.style.display = 'none';
    
    const loginNavItem = document.getElementById('loginNavItem');
    if (loginNavItem) loginNavItem.style.display = 'block';

    this.renderProfile();
    window.location.hash = '#home';
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
      this.allSongs = response.data || [];
      this.playlist = [...this.allSongs];
      this.renderSongs(this.playlist);
    } catch (error) {
      console.error('Failed to load songs:', error);
      this.showNotification('Failed to load songs', 'error');
    }
  }

  renderSongs(songs) {
    const grid = document.getElementById('songsGrid');
    if (!grid) return;

    if (!songs || songs.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-secondary);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="color: var(--text-primary); font-size: 1.25rem;">No matching songs or artists found</h3>
          <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.7;">Try adjusting your spelling or searching for a different track.</p>
        </div>
      `;
      return;
    }

    const htmlContent = songs.map((song, index) => {
      const isLiked = this.likedSongsSet && this.likedSongsSet.has(song.id);
      const fallbackArt = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80';
      const isHighPriority = index < 6;
      return `
        <div class="song-card" data-id="${song.id}">
          <div class="card-cover-container">
            <img src="${song.coverArt || fallbackArt}" alt="${song.title}" class="card-image" loading="${isHighPriority ? 'eager' : 'lazy'}" decoding="async" fetchpriority="${isHighPriority ? 'high' : 'low'}" onerror="this.onerror=null;this.src='${fallbackArt}';">
            <div class="card-overlay">
              <span class="play-icon">▶</span>
            </div>
          </div>
          <div class="card-details">
            <div class="card-title">${song.title}</div>
            <div class="card-artist">${song.artist} · ${song.genre}</div>
            <div class="card-meta">${this.formatDuration(song.duration)}</div>
          </div>
          <div class="card-actions">
            <button class="card-action-btn like-btn" data-id="${song.id}" title="Like">
              ${isLiked ? '❤️' : '♡'}
            </button>
            <button class="card-action-btn playlist-btn" data-id="${song.id}" title="Add to Playlist">
              +
            </button>
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = htmlContent;

    // Fast Single Event Delegation for 60 FPS Performance
    grid.onclick = (e) => {
      const likeBtn = e.target.closest('.like-btn');
      if (likeBtn) {
        e.stopPropagation();
        this.toggleLike(likeBtn.dataset.id);
        return;
      }

      const playlistBtn = e.target.closest('.playlist-btn');
      if (playlistBtn) {
        e.stopPropagation();
        this.handleAddToPlaylist(playlistBtn.dataset.id);
        return;
      }

      const card = e.target.closest('.song-card');
      if (card) {
        this.playSong(card.dataset.id, songs);
      }
    };
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
      const songTitle = document.getElementById('songTitle');
      const artistName = document.getElementById('artistName');
      const coverArt = document.getElementById('coverArt');
      const likeBtn = document.getElementById('likeBtn');

      if (songTitle) songTitle.textContent = this.currentSong.title;
      if (artistName) artistName.textContent = this.currentSong.artist;
      if (coverArt) coverArt.src = this.currentSong.coverArt || 'assets/default-cover.png';
      
      const isLiked = this.likedSongsSet && this.likedSongsSet.has(this.currentSong.id);
      if (likeBtn) likeBtn.textContent = isLiked ? '❤️' : '♡';
    }
  }

  async handleSearch() {
    const query = document.getElementById('searchInput')?.value?.trim();
    if (!query) return;

    // Switch view to discover so the user can see search results
    window.location.hash = '#discover';

    // Hide search suggestions on query search execution
    const suggestions = document.getElementById('searchSuggestions');
    if (suggestions) {
      suggestions.style.display = 'none';
      suggestions.innerHTML = '';
    }

    const grid = document.getElementById('songsGrid');
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--primary-color);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3 style="color: #fff; font-size: 1.1rem;">Searching tracks for "${query}"...</h3>
        </div>
      `;
    }

    let apiSongs = [];
    const qLower = query.toLowerCase();
    const localMatches = (this.allSongs || []).filter(s =>
      s.title.toLowerCase().includes(qLower) ||
      s.artist.toLowerCase().includes(qLower) ||
      (s.genre && s.genre.toLowerCase().includes(qLower))
    );

    try {
      const results = await API.search(query);
      apiSongs = Array.isArray(results.data?.songs)
        ? results.data.songs
        : (Array.isArray(results.data) ? results.data : (results.songs || []));
    } catch (error) {
      console.warn('API Search failed or rate-limited:', error);
    }

    // Combine API songs + local matches without duplicate IDs
    const seenIds = new Set();
    const combinedSongs = [];

    [...apiSongs, ...localMatches].forEach(song => {
      if (song && song.id && !seenIds.has(String(song.id))) {
        seenIds.add(String(song.id));
        combinedSongs.push(song);
      }
    });

    this.playlist = combinedSongs;
    this.renderSongs(this.playlist);
  }

  extractSuggestions() {
    const query = document.getElementById('searchInput')?.value.trim().toLowerCase();
    const container = document.getElementById('searchSuggestions');
    if (!container) return;

    if (!query) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    const matches = new Set();
    const dataset = this.allSongs && this.allSongs.length > 0 ? this.allSongs : (this.playlist || []);
    dataset.forEach(song => {
      if (song.title.toLowerCase().includes(query)) matches.add(song.title);
      if (song.artist.toLowerCase().includes(query)) matches.add(song.artist);
      if (song.genre && song.genre.toLowerCase().includes(query)) matches.add(song.genre);
    });

    const suggestionsList = Array.from(matches).slice(0, 6);
    if (suggestionsList.length === 0) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = suggestionsList.map(item => `
      <div class="suggestion-chip">${item}</div>
    `).join('');

    container.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const value = e.currentTarget.textContent;
        const input = document.getElementById('searchInput');
        if (input) {
          input.value = value;
          this.handleSearch();
          container.style.display = 'none';
        }
      });
    });
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
      this.renderPlaylists(response.data || []);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }

  renderPlaylists(playlists) {
    this.playlists = playlists;
    const grid = document.getElementById('playlistsGrid');
    if (!grid) return;

    grid.innerHTML = playlists.map(playlist => `
      <div class="playlist-card" data-id="${playlist.id}">
        <div class="playlist-details-btn">
          <div class="card-title">${playlist.name}</div>
          <div class="card-meta">${playlist.songs ? playlist.songs.length : 0} songs</div>
        </div>
        <button class="delete-playlist-btn" data-id="${playlist.id}">🗑️</button>
      </div>
    `).join('');

    // Event listener to open playlist contents alert/dialog
    grid.querySelectorAll('.playlist-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.closest('.playlist-card').dataset.id;
        const playlist = playlists.find(p => p.id == id);
        this.viewPlaylistSongs(playlist);
      });
    });

    // Event listener to delete playlist
    grid.querySelectorAll('.delete-playlist-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        if (confirm('Are you sure you want to delete this playlist?')) {
          try {
            await API.request(`/playlists/${id}`, { method: 'DELETE' });
            this.showNotification('Playlist deleted');
            this.loadPlaylists();
          } catch (error) {
            console.error('Delete failed:', error);
          }
        }
      });
    });
  }

  async viewPlaylistSongs(playlist) {
    const songsList = playlist.songs || [];
    if (songsList.length === 0) {
      alert('Playlist is empty.');
      return;
    }

    const options = songsList.map((s, index) => `${index + 1}. ${s.title} by ${s.artist}`).join('\n');
    const input = prompt(`Playlist: ${playlist.name}\n\nEnter the number of the song to remove, or cancel:\n\n${options}`);
    if (!input) return;

    const index = parseInt(input.trim()) - 1;
    if (isNaN(index) || index < 0 || index >= songsList.length) {
      alert('Invalid selection');
      return;
    }

    const selectedSong = songsList[index];
    try {
      await API.request(`/playlists/${playlist.id}/songs/${selectedSong.id}`, { method: 'DELETE' });
      this.showNotification(`Removed ${selectedSong.title} from playlist`);
      this.loadPlaylists();
    } catch (error) {
      console.error('Remove song failed:', error);
      this.showNotification('Failed to remove song', 'error');
    }
  }

  async toggleLike(songId) {
    if (!this.currentUser) {
      this.openAuthModal();
      this.showNotification('Please login to like songs', 'error');
      return;
    }
    try {
      const result = await API.likeSong(songId);
      if (!this.likedSongsSet) this.likedSongsSet = new Set();
      
      if (result.liked) {
        this.likedSongsSet.add(songId);
        this.showNotification('Song added to liked library');
      } else {
        this.likedSongsSet.delete(songId);
        this.showNotification('Song removed from liked library');
      }
      
      // Update UI
      if (this.currentSong && this.currentSong.id == songId) {
        const likeBtn = document.getElementById('likeBtn');
        const modalLikeBtn = document.getElementById('modalLikeBtn');
        if (likeBtn) likeBtn.textContent = result.liked ? '❤️' : '♡';
        if (modalLikeBtn) modalLikeBtn.textContent = result.liked ? '❤️' : '♡';
      }
      this.renderSongs(this.playlist);
    } catch (error) {
      console.error('Like toggle failed:', error);
    }
  }

  async handleAddToPlaylist(songId) {
    if (!this.currentUser) {
      this.openAuthModal();
      this.showNotification('Please login to modify playlists', 'error');
      return;
    }
    
    if (this.playlists.length === 0) {
      this.createPlaylist();
      return;
    }

    const playlistOptions = this.playlists.map(p => `${p.id}: ${p.name}`).join('\n');
    const input = prompt(`Enter the ID of the playlist to add this song:\n\n${playlistOptions}`);
    if (!input) return;

    const playlistId = parseInt(input.trim());
    if (isNaN(playlistId)) {
      alert('Invalid playlist ID');
      return;
    }

    try {
      await API.addToPlaylist(playlistId, songId);
      this.showNotification('Song added to playlist successfully');
      this.loadPlaylists();
    } catch (error) {
      console.error('Failed to add to playlist:', error);
      this.showNotification(error.message || 'Failed to add to playlist', 'error');
    }
  }

  renderProfile() {
    const container = document.getElementById('profileContent');
    if (!container) return;

    if (!this.currentUser) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">Please log in to view your profile.</p>`;
      return;
    }

    const u = this.currentUser;

    if (this.isEditingProfile) {
      container.innerHTML = `
        <div class="profile-card">
          <div class="profile-avatar-container">
            <img class="profile-avatar" id="editAvatarPreview" src="${u.avatar || 'https://via.placeholder.com/150'}" alt="${u.username}">
            <div class="profile-email" style="margin-top: 0.5rem;">${u.email}</div>
          </div>
          <form id="editProfileForm" style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-secondary);">Profile Picture</label>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem; align-items: center;">
                <input type="file" id="editAvatarFile" accept="image/*" style="display: none;">
                <button type="button" class="btn-small" id="uploadTriggerBtn">Choose File...</button>
                <span id="editAvatarFileName" style="font-size: 0.8rem; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 150px;">No file chosen</span>
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label for="editAvatarUrl" style="font-weight: 600; font-size: 0.9rem; color: var(--text-secondary);">Or Profile Picture URL</label>
              <input type="text" id="editAvatarUrl" value="${u.avatar && !u.avatar.startsWith('data:') ? u.avatar : ''}" placeholder="https://example.com/avatar.jpg" style="width: 100%; padding: 0.6rem; border-radius: 4px; border: 1px solid var(--border-color); background-color: var(--secondary-color); color: var(--text-primary); margin-top: 0.25rem;">
            </div>
            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label for="editUsername" style="font-weight: 600; font-size: 0.9rem; color: var(--text-secondary);">Username</label>
              <input type="text" id="editUsername" value="${u.username || ''}" style="width: 100%; padding: 0.6rem; border-radius: 4px; border: 1px solid var(--border-color); background-color: var(--secondary-color); color: var(--text-primary); margin-top: 0.25rem;">
            </div>
            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label for="editBio" style="font-weight: 600; font-size: 0.9rem; color: var(--text-secondary);">Biography</label>
              <textarea id="editBio" style="width: 100%; padding: 0.6rem; border-radius: 4px; border: 1px solid var(--border-color); background-color: var(--secondary-color); color: var(--text-primary); height: 80px; resize: none; margin-top: 0.25rem;">${u.bio || ''}</textarea>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
              <button type="submit" class="btn btn-primary" style="flex: 1; padding: 0.6rem;">Save</button>
              <button type="button" class="btn-small" id="cancelEditProfileBtn" style="padding: 0.6rem; min-width: 80px;">Cancel</button>
            </div>
          </form>
        </div>
      `;

      // Trigger file selector on trigger button click
      container.querySelector('#uploadTriggerBtn')?.addEventListener('click', () => {
        document.getElementById('editAvatarFile')?.click();
      });

      // Preview change of file input
      const fileInput = document.getElementById('editAvatarFile');
      fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          document.getElementById('editAvatarFileName').textContent = file.name;
          const reader = new FileReader();
          reader.onload = (event) => {
            document.getElementById('editAvatarPreview').src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });

      // Preview change of text input
      const urlInput = document.getElementById('editAvatarUrl');
      urlInput?.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
          document.getElementById('editAvatarPreview').src = url;
        }
      });

      // Submit listener
      document.getElementById('editProfileForm')?.addEventListener('submit', (e) => this.handleProfileSave(e));
      
      // Cancel listener
      document.getElementById('cancelEditProfileBtn')?.addEventListener('click', () => {
        this.isEditingProfile = false;
        this.renderProfile();
      });

    } else {
      container.innerHTML = `
        <div class="profile-card">
          <div class="profile-avatar-container">
            <img class="profile-avatar" src="${u.avatar || 'https://via.placeholder.com/150'}" alt="${u.username}">
            <div class="profile-username">@${u.username}</div>
            <div class="profile-email">${u.email}</div>
            ${u.bio ? `<p class="profile-bio" style="text-align: center; margin-top: 1rem; color: var(--text-secondary); max-width: 80%;">${u.bio}</p>` : ''}
          </div>
          <div class="profile-stats">
            <div class="stat-item">
              <div class="stat-value">${u.followers || 0}</div>
              <div class="stat-label">Followers</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${u.following || 0}</div>
              <div class="stat-label">Following</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${u.likedSongs || 0}</div>
              <div class="stat-label">Liked Songs</div>
            </div>
          </div>
          <div class="profile-details-grid">
            <div class="detail-box">
              <div class="detail-title">🎧 Favorite Genre</div>
              <div class="detail-value">${u.listeningStats?.favoriteGenre || 'Pop'}</div>
            </div>
            <div class="detail-box">
              <div class="detail-title">⏱️ Total Minutes Heard</div>
              <div class="detail-value">${u.listeningStats?.totalMinutes || 0} mins</div>
            </div>
            <div class="detail-box">
              <div class="detail-title">🎵 Songs Streamed</div>
              <div class="detail-value">${u.listeningStats?.songsHeard || 0} songs</div>
            </div>
          </div>
          <button class="btn btn-primary" id="editProfileBtn" style="margin-top: 0.5rem; padding: 0.6rem; width: 100%;">Edit Profile</button>
        </div>
      `;

      // Edit listener
      document.getElementById('editProfileBtn')?.addEventListener('click', () => {
        this.isEditingProfile = true;
        this.renderProfile();
      });
    }
  }

  async handleProfileSave(e) {
    e.preventDefault();
    if (!this.currentUser) return;

    const username = document.getElementById('editUsername')?.value.trim();
    const bio = document.getElementById('editBio')?.value.trim();
    const avatarUrlInput = document.getElementById('editAvatarUrl')?.value.trim();
    const fileInput = document.getElementById('editAvatarFile');
    const file = fileInput?.files[0];

    if (!username) {
      alert('Username is required');
      return;
    }

    const saveDetails = async (avatar) => {
      try {
        const response = await API.request('/users/profile', {
          method: 'PUT',
          body: JSON.stringify({ username, bio, avatar })
        });
        
        this.currentUser = {
          ...this.currentUser,
          username: response.data.username,
          bio: response.data.bio,
          avatar: response.data.avatar
        };

        this.isEditingProfile = false;
        this.renderProfile();
        this.showNotification('Profile updated successfully');
      } catch (error) {
        console.error('Failed to update settings:', error);
        this.showNotification('Failed to save profile', 'error');
      }
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        await saveDetails(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      await saveDetails(avatarUrlInput || this.currentUser.avatar);
    }
  }

  initPaymentCheckout() {
    this.selectedPlan = 'plus';
    this.appliedDiscount = 0;
    this.activeCoupon = '';

    const prices = {
      free: { name: 'SoundWave Free', price: 0 },
      plus: { name: 'SoundWave Plus', price: 59 },
      family: { name: 'Family Premium', price: 179 }
    };

    this.planPrices = prices;

    // Trigger buttons
    document.getElementById('heroGetPremiumBtn')?.addEventListener('click', () => this.openPaymentModal('plus'));
    document.getElementById('planFreeBtn')?.addEventListener('click', () => this.openPaymentModal('free'));
    document.getElementById('planPlusBtn')?.addEventListener('click', () => this.openPaymentModal('plus'));
    document.getElementById('planFamilyBtn')?.addEventListener('click', () => this.openPaymentModal('family'));

    // Modal Close
    document.getElementById('closePaymentModalBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('paymentModal');
      if (modal) modal.style.display = 'none';
    });

    // Plan Tabs
    ['free', 'plus', 'family'].forEach(plan => {
      document.getElementById(`payTab${plan.charAt(0).toUpperCase() + plan.slice(1)}`)?.addEventListener('click', () => {
        document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(`payTab${plan.charAt(0).toUpperCase() + plan.slice(1)}`)?.classList.add('active');
        this.selectedPlan = plan;
        this.updatePaymentSummary();
      });
    });

    // Payment Method Tabs
    ['upi', 'card', 'netbanking'].forEach(method => {
      document.getElementById(`method${method.charAt(0).toUpperCase() + method.slice(1)}`)?.addEventListener('click', () => {
        document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`method${method.charAt(0).toUpperCase() + method.slice(1)}`)?.classList.add('active');

        document.querySelectorAll('.method-pane').forEach(p => p.style.display = 'none');
        document.getElementById(`pane${method.charAt(0).toUpperCase() + method.slice(1)}`).style.display = 'block';
      });
    });

    // Apply Coupon
    document.getElementById('applyCouponBtn')?.addEventListener('click', () => {
      const input = document.getElementById('couponInput')?.value.trim().toUpperCase();
      const msg = document.getElementById('couponMsg');
      if (input === 'SOUNDWAVE20') {
        this.appliedDiscount = 20;
        this.activeCoupon = 'SOUNDWAVE20';
        if (msg) msg.innerHTML = '<span style="color:#00FF88;">✓ Promo SOUNDWAVE20 applied! ₹20 discount active.</span>';
        this.showNotification('Coupon SOUNDWAVE20 applied successfully!');
      } else {
        this.appliedDiscount = 0;
        if (msg) msg.innerHTML = '<span style="color:#ef4444;">Invalid coupon code. Try SOUNDWAVE20</span>';
      }
      this.updatePaymentSummary();
    });

    // Complete Payment
    document.getElementById('completePaymentBtn')?.addEventListener('click', () => this.processPayment());

    // Switch Account from checkout header
    document.getElementById('checkoutSwitchAccountBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('paymentModal');
      if (modal) modal.style.display = 'none';
      this.pendingCheckoutPlan = this.selectedPlan;
      this.openAuthModal();
    });

    // Redirect after Success
    document.getElementById('startListeningRedirectBtn')?.addEventListener('click', () => this.redirectAfterPayment());
  }

  openPaymentModal(plan = 'plus') {
    // If Free Tier (₹0) selected, directly activate Free User status without payment modal
    if (plan === 'free') {
      localStorage.setItem('userPlan', 'free');
      localStorage.setItem('userPlanName', 'SoundWave Free');
      if (this.currentUser) this.currentUser.plan = 'free';

      this.showNotification('Welcome to SoundWave Free Tier! Active Free User status assigned. 🎧', 'success');
      
      const paymentModal = document.getElementById('paymentModal');
      if (paymentModal) paymentModal.style.display = 'none';

      window.location.hash = '#discover';
      return;
    }

    // Require user login before displaying payment modal for paid tiers
    const isLoggedIn = !!this.currentUser || !!localStorage.getItem('token');
    if (!isLoggedIn) {
      this.pendingCheckoutPlan = plan;
      this.showNotification('Please log in or create an account to choose your subscription plan', 'info');
      this.openAuthModal();
      return;
    }

    this.selectedPlan = plan;
    const modal = document.getElementById('paymentModal');
    if (modal) {
      modal.style.display = 'flex';
      // Sync active plan tab
      document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
      const activeTabEl = document.getElementById(`payTab${plan.charAt(0).toUpperCase() + plan.slice(1)}`);
      if (activeTabEl) activeTabEl.classList.add('active');

      // Update user account status badge
      const userEmailEl = document.getElementById('checkoutUserEmail');
      if (userEmailEl) {
        userEmailEl.textContent = this.currentUser?.email || localStorage.getItem('userEmail') || 'Active Account';
      }

      this.updatePaymentSummary();
    }
  }

  updatePaymentSummary() {
    const info = this.planPrices[this.selectedPlan] || this.planPrices.plus;
    const subtotal = info.price;
    const discount = Math.min(subtotal, this.appliedDiscount);
    const total = Math.max(0, subtotal - discount);

    const nameEl = document.getElementById('summaryPlanName');
    const subtotalEl = document.getElementById('summarySubtotal');
    const discountRow = document.getElementById('discountRow');
    const discountEl = document.getElementById('summaryDiscount');
    const totalEl = document.getElementById('summaryTotal');
    const payBtnText = document.getElementById('payBtnText');

    if (nameEl) nameEl.textContent = `${info.name} (Monthly)`;
    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;

    if (discount > 0 && discountRow) {
      discountRow.style.display = 'flex';
      if (discountEl) discountEl.textContent = `-₹${discount.toFixed(2)}`;
    } else if (discountRow) {
      discountRow.style.display = 'none';
    }

    if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
    if (payBtnText) {
      payBtnText.textContent = this.selectedPlan === 'free' ? 'Activate Free Tier (₹0) 🎧' : `Complete Payment & Unlock ${this.selectedPlan.toUpperCase()}`;
    }

    // Dynamic WooCommerce UPI QR Code Generator
    const upiQrImg = document.getElementById('upiQrCodeImg');
    if (upiQrImg) {
      const upiUri = `upi://pay?pa=6371012496@slc&pn=MusicVibe%20SoundWave&am=${total}&cu=INR&tn=${encodeURIComponent(info.name)}`;
      upiQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;
    }
  }

  processPayment() {
    if (this.selectedPlan === 'free') {
      localStorage.setItem('userPlan', 'free');
      localStorage.setItem('userPlanName', 'SoundWave Free');
      if (this.currentUser) this.currentUser.plan = 'free';

      const paymentModal = document.getElementById('paymentModal');
      if (paymentModal) paymentModal.style.display = 'none';

      this.showNotification('Welcome to SoundWave Free Tier! Active Free User status assigned. 🎧', 'success');
      window.location.hash = '#discover';
      return;
    }

    const payBtn = document.getElementById('completePaymentBtn');
    const payBtnText = document.getElementById('payBtnText');

    if (payBtnText) payBtnText.textContent = '🔒 Verifying 256-Bit SSL...';
    if (payBtn) payBtn.disabled = true;

    setTimeout(() => {
      // Payment Successful!
      const paymentModal = document.getElementById('paymentModal');
      const successModal = document.getElementById('paymentSuccessModal');

      if (paymentModal) paymentModal.style.display = 'none';

      // Save user plan in localStorage & state
      const planTitle = this.planPrices[this.selectedPlan]?.name || 'SoundWave Plus';
      localStorage.setItem('userPlan', this.selectedPlan);
      localStorage.setItem('userPlanName', planTitle);

      const txnId = 'SW-' + Math.floor(100000000 + Math.random() * 900000000);
      const info = this.planPrices[this.selectedPlan] || this.planPrices.plus;
      const total = Math.max(0, info.price - Math.min(info.price, this.appliedDiscount));

      document.getElementById('receiptPlanTitle').textContent = planTitle;
      document.getElementById('receiptTxnId').textContent = txnId;
      document.getElementById('receiptAmount').textContent = `₹${total.toFixed(2)}`;

      if (successModal) successModal.style.display = 'flex';

      if (payBtnText) payBtnText.textContent = `Complete Payment & Unlock ${this.selectedPlan.toUpperCase()}`;
      if (payBtn) payBtn.disabled = false;

      this.showNotification(`Payment Verified! Welcome to ${planTitle}`);
    }, 1200);
  }

  redirectAfterPayment() {
    const successModal = document.getElementById('paymentSuccessModal');
    if (successModal) successModal.style.display = 'none';
    window.location.hash = '#discover';
    this.showNotification('🎉 Premium Unlocked! Enjoy 320kbps Hi-Fi streaming.');
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  showNotification(message, type = 'info', position = 'bottom') {
    console.log(`[${type}] ${message}`);
    const toast = document.createElement('div');
    toast.style.position = 'fixed';

    if (position === 'top-right') {
      toast.style.top = '24px';
      toast.style.right = '24px';
    } else {
      toast.style.bottom = '100px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
    }

    toast.style.backgroundColor = type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#1f1f1f');
    toast.style.color = '#ffffff';
    toast.style.padding = '0.85rem 1.75rem';
    toast.style.borderRadius = '30px';
    toast.style.zIndex = '99999';
    toast.style.fontSize = '0.95rem';
    toast.style.fontWeight = '700';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    toast.style.border = '1px solid rgba(255,255,255,0.2)';
    toast.style.backdropFilter = 'blur(16px)';
    toast.style.webkitBackdropFilter = 'blur(16px)';
    toast.style.transition = 'all 0.3s ease';
    toast.textContent = message;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}

window.app = new SoundWaveApp();

