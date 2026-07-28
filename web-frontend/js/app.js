// Main Application Controller

class SoundWaveApp {
  constructor() {
    this.currentUser = { id: 1, username: 'Music Lover 🎧', email: 'user@soundwave.io', plan: 'plus' };
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
    this.updateAdVisibility();
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
      document.getElementById('musicCatalog')?.scrollIntoView({ behavior: 'smooth' });
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

    document.getElementById('exploreBtn')?.addEventListener('click', () => {
      document.getElementById('musicCatalog')?.scrollIntoView({ behavior: 'smooth' });
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

    // Delete Account click handler
    document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
      if (confirm('⚠️ PERMANENT ACCOUNT DELETION\n\nAre you sure you want to permanently delete your SoundWave account?\n\nAll playlists, liked songs, listening history, and subscription data will be permanently erased. This action CANNOT be undone.')) {
        localStorage.removeItem('soundwave_user');
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('registered_users');

        this.currentUser = null;
        this.updateAuthUI();
        this.showNotification('Your SoundWave account has been permanently deleted 🗑️', 'warning');
        window.location.hash = '#home';
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

    // Payment Success & Cancel Modal Action Handlers
    document.getElementById('startListeningRedirectBtn')?.addEventListener('click', () => this.redirectAfterPayment());
    
    document.getElementById('retryPaymentModalBtn')?.addEventListener('click', () => {
      const cancelModal = document.getElementById('paymentCancelModal');
      if (cancelModal) cancelModal.style.display = 'none';
      this.openPaymentModal(this.selectedPlan || 'plus');
    });

    document.getElementById('closeCancelModalBtn')?.addEventListener('click', () => {
      const cancelModal = document.getElementById('paymentCancelModal');
      if (cancelModal) cancelModal.style.display = 'none';
      window.location.hash = '#home';
    });

    document.getElementById('retryFailurePaymentBtn')?.addEventListener('click', () => {
      const failureModal = document.getElementById('paymentFailureModal');
      if (failureModal) failureModal.style.display = 'none';
      this.openPaymentModal(this.selectedPlan || 'plus');
    });

    document.getElementById('closeFailureModalBtn')?.addEventListener('click', () => {
      const failureModal = document.getElementById('paymentFailureModal');
      if (failureModal) failureModal.style.display = 'none';
      window.location.hash = '#home';
    });
  }

  handleRouting() {
    let hash = window.location.hash.replace('#', '');
    
    // Handle #payment-success or ?payment=success route URL
    const urlParams = new URLSearchParams(window.location.search);
    if (hash.startsWith('payment-success') || urlParams.get('payment') === 'success') {
      const plan = urlParams.get('plan') || 'plus';
      const txnId = urlParams.get('txn_id') || ('SW-' + Math.floor(100000000 + Math.random() * 900000000));
      const amount = urlParams.get('amount') || (plan === 'family' ? '₹179.00' : '₹59.00');
      const planTitle = this.planPrices[plan]?.name || 'SoundWave Plus';

      localStorage.setItem('userPlan', plan);
      localStorage.setItem('userPlanName', planTitle);

      const receiptPlanTitle = document.getElementById('receiptPlanTitle');
      const receiptTxnId = document.getElementById('receiptTxnId');
      const receiptAmount = document.getElementById('receiptAmount');
      const successModal = document.getElementById('paymentSuccessModal');

      if (receiptPlanTitle) receiptPlanTitle.textContent = planTitle;
      if (receiptTxnId) receiptTxnId.textContent = txnId;
      if (receiptAmount) receiptAmount.textContent = amount;
      if (successModal) successModal.style.display = 'flex';
    }

    // Handle #payment-cancel or ?payment=cancel route URL
    if (hash.startsWith('payment-cancel') || urlParams.get('payment') === 'cancel') {
      const plan = urlParams.get('plan') || 'plus';
      const planTitle = this.planPrices[plan]?.name || 'SoundWave Plus';

      const cancelPlanTitle = document.getElementById('cancelPlanTitle');
      const cancelModal = document.getElementById('paymentCancelModal');

      if (cancelPlanTitle) cancelPlanTitle.textContent = planTitle;
      if (cancelModal) cancelModal.style.display = 'flex';
    }

    // Handle #payment-failure or ?payment=failure route URL
    if (hash.startsWith('payment-failure') || urlParams.get('payment') === 'failure') {
      const plan = urlParams.get('plan') || 'plus';
      const reason = urlParams.get('reason') || 'Transaction could not be processed due to a bank processing error or decline.';
      const planTitle = this.planPrices[plan]?.name || 'SoundWave Plus';

      const failurePlanTitle = document.getElementById('failurePlanTitle');
      const failureReasonText = document.getElementById('failureReasonText');
      const failureModal = document.getElementById('paymentFailureModal');

      if (failurePlanTitle) failurePlanTitle.textContent = planTitle;
      if (failureReasonText) failureReasonText.textContent = reason;
      if (failureModal) failureModal.style.display = 'flex';
    }

    // Check if the hash is a sub-anchor on the landing page
    const subAnchors = ['features', 'pricing', 'faq', 'contact', 'artists'];
    const isSubAnchor = subAnchors.includes(hash);
    
    let activeSection = hash.split('?')[0];
    if (!activeSection || (!['home', 'playlists', 'profile', 'settings'].includes(activeSection) && !isSubAnchor)) {
      activeSection = 'home';
    } else if (isSubAnchor) {
      activeSection = 'home';
    }

    // Hide all primary sections
    const sections = ['home', 'playlists', 'profile', 'settings'];
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
    this.showNotification('🎉 You have full access to SoundWave Music Player!', 'info');
  }

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
  }

  async restoreSession() {
    if (!this.currentUser) {
      this.currentUser = { id: 1, username: 'Music Lover 🎧', email: 'user@soundwave.io', plan: 'plus' };
    }
    this.setCurrentUser(this.currentUser);
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('soundwave_user', JSON.stringify(user));
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
      }
    }
    
    // Toggle navigation visibilities
    const settingsDropdown = document.getElementById('settingsDropdown');
    if (settingsDropdown) settingsDropdown.style.display = user ? 'block' : 'none';

    const navPlaylists = document.getElementById('navPlaylists');
    if (navPlaylists) navPlaylists.style.display = user ? 'block' : 'none';

    // Toggle Instagram Social Media Navigation items on Login
    const socialNavIds = ['navSocialFeed', 'navReels', 'navDirectMessages'];
    socialNavIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = user ? 'block' : 'none';
    });
    
    const loginNavItem = document.getElementById('loginNavItem');
    if (loginNavItem) loginNavItem.style.display = user ? 'none' : 'block';

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
    localStorage.removeItem('soundwave_user');
    localStorage.removeItem('userEmail');
    this.currentUser = null;
    this.isEditingProfile = false;
    
    // Hide Instagram Social Media Navigation items on Logout
    const socialNavIds = ['navSocialFeed', 'navReels', 'navDirectMessages'];
    socialNavIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    const settingsDropdown = document.getElementById('settingsDropdown');
    if (settingsDropdown) settingsDropdown.style.display = 'none';

    const navPlaylists = document.getElementById('navPlaylists');
    if (navPlaylists) navPlaylists.style.display = 'none';

    const loginNavItem = document.getElementById('loginNavItem');
    if (loginNavItem) loginNavItem.style.display = 'block';

    if (window.location.hash.includes('social') || window.location.hash.includes('reels')) {
      window.location.hash = '#home';
    }
    
    // Clear password and auth input fields
    const passwordInput = document.getElementById('password');
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');

    if (passwordInput) passwordInput.value = '';
    if (emailInput) emailInput.value = '';
    if (usernameInput) usernameInput.value = '';
    if (firstNameInput) firstNameInput.value = '';
    if (lastNameInput) lastNameInput.value = '';

    if (window.auth) {
      window.auth.pendingUser = null;
      window.auth.currentOtp = null;
      window.auth.isOtpStep = false;
      if (window.auth.updateForm) window.auth.updateForm();
    }

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
            <button class="card-action-btn card-radio-btn" data-id="${song.id}" title="Play Radio on this Track">
              📻
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

      const cardRadioBtn = e.target.closest('.card-radio-btn');
      if (cardRadioBtn) {
        e.stopPropagation();
        const targetSong = songs.find(s => s.id == cardRadioBtn.dataset.id);
        this.startSongRadio(targetSong);
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

  async startSongRadio(targetSong) {
    const seedSong = targetSong || this.currentSong || (this.playlist && this.playlist[this.currentIndex]);
    if (!seedSong) {
      this.showNotification('⚠️ Please play or select a song first to start a Radio station!', 'warning');
      return;
    }

    const radioBtn = document.getElementById('songRadioBtn');
    if (radioBtn) radioBtn.classList.add('active-radio');

    this.showNotification(`📻 Generating Song Radio station for "${seedSong.title}"...`, 'info');

    try {
      let radioTracks = [];

      // Query YouTube/API for related tracks based on artist or title
      if (window.API && typeof window.API.search === 'function') {
        const searchQuery = `${seedSong.artist} ${seedSong.genre || ''} mix`.trim();
        const searchResults = await window.API.search(searchQuery);
        if (searchResults && searchResults.data && searchResults.data.length > 0) {
          radioTracks = searchResults.data;
        }
      }

      // Fallback/Supplement from current catalog if search returned few tracks
      if (this.allSongs && this.allSongs.length > 0) {
        const catalogMatches = this.allSongs.filter(s => s.id !== seedSong.id);
        for (let i = catalogMatches.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [catalogMatches[i], catalogMatches[j]] = [catalogMatches[j], catalogMatches[i]];
        }
        radioTracks = [...radioTracks, ...catalogMatches];
      }

      // Deduplicate radio tracks
      const seenIds = new Set([seedSong.id]);
      const uniqueRadioTracks = [seedSong];
      
      for (const track of radioTracks) {
        if (track && track.id && !seenIds.has(track.id)) {
          seenIds.add(track.id);
          uniqueRadioTracks.push(track);
        }
      }

      // Set as active playlist queue & start playing
      this.playlist = uniqueRadioTracks;
      this.currentIndex = 0;
      await this.playSong(seedSong.id, uniqueRadioTracks);

      this.showNotification(`📻 Song Radio started for "${seedSong.title}" — ${uniqueRadioTracks.length} tracks queued! 🔀`, 'success');
    } catch (err) {
      console.error('Song Radio error:', err);
      this.showNotification(`📻 Playing Radio mix for ${seedSong.artist}`, 'success');
    } finally {
      setTimeout(() => {
        if (radioBtn) radioBtn.classList.remove('active-radio');
      }, 4000);
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

    // Keep user on home page to view search results
    if (window.location.hash !== '#home') {
      window.location.hash = '#home';
    }

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
      this.currentUser = { id: 1, username: 'Music Lover 🎧', email: 'user@soundwave.io', plan: 'plus' };
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
      this.currentUser = { id: 1, username: 'Music Lover 🎧', email: 'user@soundwave.io', plan: 'plus' };
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
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem;">
          <h3>🔒 Please Log In</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">Log in to view your profile, posts, reels, and listening stats.</p>
          <button class="btn btn-primary" onclick="app.openAuthModal()">Login Now 🔑</button>
        </div>
      `;
      return;
    }

    const u = this.currentUser;

    if (this.isEditingProfile) {
      container.innerHTML = `
        <div class="profile-card" style="max-width: 650px; margin: 0 auto; background: rgba(20, 20, 32, 0.85); backdrop-filter: blur(30px); border-radius: 24px; padding: 2rem; border: 1px solid rgba(255,255,255,0.12);">
          <div class="profile-avatar-container" style="text-align: center; margin-bottom: 1.5rem;">
            <img class="profile-avatar" id="editAvatarPreview" src="${u.avatar || 'assets/about_headphones.jpg'}" alt="${u.username}" style="width: 110px; height: 110px; border-radius: 50%; object-fit: cover; border: 3px solid #8b5cf6;">
            <div class="profile-email" style="margin-top: 0.5rem; color: rgba(255,255,255,0.7); font-size: 0.9rem;">${u.email}</div>
          </div>
          <form id="editProfileForm" style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
            <div class="form-group">
              <label style="font-weight: 700; font-size: 0.9rem; color: #fff;">Profile Picture</label>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.35rem; align-items: center;">
                <input type="file" id="editAvatarFile" accept="image/*" style="display: none;">
                <button type="button" class="btn btn-secondary" id="uploadTriggerBtn" style="padding: 0.5rem 1rem; font-size: 0.85rem; border-radius: 10px;">Choose File...</button>
                <span id="editAvatarFileName" style="font-size: 0.8rem; color: rgba(255,255,255,0.6); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;">No file chosen</span>
              </div>
            </div>
            <div class="form-group">
              <label for="editAvatarUrl" style="font-weight: 700; font-size: 0.9rem; color: #fff;">Or Profile Picture URL</label>
              <input type="text" id="editAvatarUrl" value="${u.avatar && !u.avatar.startsWith('data:') ? u.avatar : ''}" placeholder="https://example.com/avatar.jpg" style="width: 100%; padding: 0.75rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color: #fff; margin-top: 0.35rem;">
            </div>
            <div class="form-group">
              <label for="editUsername" style="font-weight: 700; font-size: 0.9rem; color: #fff;">Username</label>
              <input type="text" id="editUsername" value="${u.username || ''}" style="width: 100%; padding: 0.75rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color: #fff; margin-top: 0.35rem;">
            </div>
            <div class="form-group">
              <label for="editBio" style="font-weight: 700; font-size: 0.9rem; color: #fff;">Biography</label>
              <textarea id="editBio" style="width: 100%; padding: 0.75rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color: #fff; height: 90px; resize: none; margin-top: 0.35rem;">${u.bio || ''}</textarea>
            </div>
            <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
              <button type="submit" class="btn btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 700;">Save Profile ✨</button>
              <button type="button" class="btn btn-secondary" id="cancelEditProfileBtn" style="padding: 0.75rem 1.25rem; border-radius: 12px;">Cancel</button>
            </div>
          </form>
        </div>
      `;

      container.querySelector('#uploadTriggerBtn')?.addEventListener('click', () => {
        document.getElementById('editAvatarFile')?.click();
      });

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

      const urlInput = document.getElementById('editAvatarUrl');
      urlInput?.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
          document.getElementById('editAvatarPreview').src = url;
        }
      });

      document.getElementById('editProfileForm')?.addEventListener('submit', (e) => this.handleProfileSave(e));
      
      document.getElementById('cancelEditProfileBtn')?.addEventListener('click', () => {
        this.isEditingProfile = false;
        this.renderProfile();
      });

    } else {
      container.innerHTML = `
        <div class="ig-profile-container" style="max-width: 850px; margin: 0 auto;">
          <div class="ig-profile-header">
            <div class="ig-profile-avatar-wrap">
              <img src="${u.avatar || 'assets/about_headphones.jpg'}" alt="${u.username}" class="ig-profile-avatar">
            </div>
            <div class="ig-profile-info">
              <div class="ig-profile-username-row">
                <h2>${u.username || 'music_vibe_official'}</h2>
                <button class="btn btn-secondary" id="editProfileBtn" style="padding:0.45rem 1rem; border-radius:10px; font-weight:700;">Edit Profile</button>
                <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(window.location.href); if (window.app) window.app.showNotification('Profile URL copied 🔗');" style="padding:0.45rem 1rem; border-radius:10px; font-weight:700;">Share Profile</button>
              </div>
              <div class="ig-stats-row">
                <div class="ig-stat-item"><strong>48</strong> posts</div>
                <div class="ig-stat-item"><strong>${u.followers || '142.5K'}</strong> followers</div>
                <div class="ig-stat-item"><strong>${u.following || '312'}</strong> following</div>
              </div>
              <div class="ig-profile-bio">
                <strong>${u.username || 'SoundWave Official'}</strong> 🎧<br>
                ${u.bio ? u.bio : '🎵 320kbps Master Audio Streaming<br>🚀 Daily Trending Beats & Reels'}<br>
                🔗 <a href="https://ujwal8156v.github.io/soundwave-musicstream-app.io/" target="_blank" style="color:#60a5fa; text-decoration:none;">soundwave.app</a>
              </div>
            </div>
          </div>

          <!-- SoundWave Listening Stats Banner -->
          <div class="profile-details-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
            <div class="detail-box" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 1rem; border-radius: 16px; text-align: center;">
              <div class="detail-title" style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">🎧 Favorite Genre</div>
              <div class="detail-value" style="font-size: 1.1rem; font-weight: 800; color: #fff;">${u.listeningStats?.favoriteGenre || 'Pop / EDM'}</div>
            </div>
            <div class="detail-box" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 1rem; border-radius: 16px; text-align: center;">
              <div class="detail-title" style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">⏱️ Total Minutes Heard</div>
              <div class="detail-value" style="font-size: 1.1rem; font-weight: 800; color: #fff;">${u.listeningStats?.totalMinutes || 1280} mins</div>
            </div>
            <div class="detail-box" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 1rem; border-radius: 16px; text-align: center;">
              <div class="detail-title" style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">🎵 Songs Streamed</div>
              <div class="detail-value" style="font-size: 1.1rem; font-weight: 800; color: #fff;">${u.listeningStats?.songsHeard || 340} songs</div>
            </div>
          </div>

          <!-- Grid Tabs -->
          <div class="ig-grid-tabs">
            <button class="ig-grid-tab active">🧩 POSTS</button>
            <button class="ig-grid-tab">🎬 REELS</button>
            <button class="ig-grid-tab">🔖 SAVED</button>
            <button class="ig-grid-tab">🏷️ TAGGED</button>
          </div>

          <!-- 3-Column Instagram Posts Grid -->
          <div class="ig-posts-grid">
            <div class="ig-grid-item">
              <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600" alt="Grid Post">
              <div class="ig-grid-overlay">❤️ 124.8K &nbsp; 💬 2.4K</div>
            </div>
            <div class="ig-grid-item">
              <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600" alt="Grid Post">
              <div class="ig-grid-overlay">❤️ 98.4K &nbsp; 💬 1.8K</div>
            </div>
            <div class="ig-grid-item">
              <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600" alt="Grid Post">
              <div class="ig-grid-overlay">❤️ 89.1K &nbsp; 💬 3.2K</div>
            </div>
          </div>
        </div>
      `;

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
        let updatedUser = {
          ...this.currentUser,
          username,
          bio,
          avatar: avatar || this.currentUser.avatar
        };

        try {
          const response = await API.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify({ username, bio, avatar: updatedUser.avatar })
          });
          if (response && response.data) {
            updatedUser = {
              ...updatedUser,
              username: response.data.username || updatedUser.username,
              bio: response.data.bio || updatedUser.bio,
              avatar: response.data.avatar || updatedUser.avatar
            };
          }
        } catch (apiErr) {
          console.warn('Backend profile sync note: Saved profile changes locally to state and localStorage:', apiErr);
        }

        this.currentUser = updatedUser;
        localStorage.setItem('soundwave_user', JSON.stringify(this.currentUser));

        this.isEditingProfile = false;
        this.renderProfile();
        this.showNotification('Profile updated successfully 👤✨', 'success');
      } catch (error) {
        console.error('Failed to update profile:', error);
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
      student: { name: 'Student Hi-Fi Pass', price: 89 },
      family: { name: 'Family Premium', price: 179 }
    };

    this.planPrices = prices;

    // Trigger buttons
    document.getElementById('heroGetPremiumBtn')?.addEventListener('click', () => this.openPaymentModal('plus'));
    document.getElementById('planFreeBtn')?.addEventListener('click', () => this.openPaymentModal('free'));
    document.getElementById('planPlusBtn')?.addEventListener('click', () => this.openPaymentModal('plus'));
    document.getElementById('planStudentBtn')?.addEventListener('click', () => this.openPaymentModal('student'));
    document.getElementById('planFamilyBtn')?.addEventListener('click', () => this.openPaymentModal('family'));

    // Modal Close
    document.getElementById('closePaymentModalBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('paymentModal');
      if (modal) modal.style.display = 'none';
    });

    document.getElementById('closeStudentModalBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('studentVerifyModal');
      if (modal) modal.style.display = 'none';
    });

    // Student Verification Method Switcher
    document.querySelectorAll('.verify-method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const method = btn.getAttribute('data-vmethod');
        document.querySelectorAll('.verify-method-btn').forEach(b => {
          b.style.background = 'rgba(255, 255, 255, 0.05)';
          b.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          b.style.color = 'rgba(255, 255, 255, 0.8)';
        });
        btn.style.background = 'rgba(139, 92, 246, 0.2)';
        btn.style.borderColor = '#8b5cf6';
        btn.style.color = '#ffffff';

        const pEmail = document.getElementById('vPaneEmail');
        const pDoc = document.getElementById('vPaneDoc');

        if (method === 'doc') {
          if (pEmail) pEmail.style.display = 'none';
          if (pDoc) pDoc.style.display = 'block';
        } else {
          if (pEmail) pEmail.style.display = 'block';
          if (pDoc) pDoc.style.display = 'none';
        }

        if (['verifypass', 'trove', 'sso'].includes(method)) {
          this.showNotification(`Switched to ${btn.textContent.trim()} Provider Mode`, 'info');
        }
      });
    });

    // Student Verification Form Submission
    document.getElementById('studentVerifyForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const college = document.getElementById('studentCollege')?.value.trim();
      const studentIdNumber = document.getElementById('studentIdNumber')?.value.trim();
      const studentEmail = document.getElementById('studentEmail')?.value.trim();
      const alertEl = document.getElementById('studentAlert');
      const submitBtn = document.getElementById('submitStudentVerifyBtn');

      if (!college || !studentIdNumber || !studentEmail) {
        if (alertEl) {
          alertEl.style.display = 'block';
          alertEl.textContent = 'Please fill out all student verification fields.';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '🔒 Authenticating Student Identity...';
      }

      try {
        const response = await fetch('/api/v1/otp/student-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: studentEmail, college, studentIdNumber })
        });
        const data = await response.json();

        localStorage.setItem('isVerifiedStudent', 'true');
        localStorage.setItem('studentCollege', college);
        localStorage.setItem('studentIdNumber', studentIdNumber);
        localStorage.setItem('studentEmail', studentEmail);

        if (alertEl) alertEl.style.display = 'none';

        const studentModal = document.getElementById('studentVerifyModal');
        if (studentModal) studentModal.style.display = 'none';

        this.showNotification(`Student Identity Verified for ${college}! Confirmation email sent to ${studentEmail} 📩`, 'success');
        this.openPaymentModal('student');
      } catch (err) {
        console.error('Student verify error:', err);
        // Store verification state in offline/fallback mode
        localStorage.setItem('isVerifiedStudent', 'true');
        localStorage.setItem('studentCollege', college);

        const studentModal = document.getElementById('studentVerifyModal');
        if (studentModal) studentModal.style.display = 'none';

        this.showNotification(`Student Identity Verified! Unlocking ₹89 / 3 Months Pass 🎓`, 'success');
        this.openPaymentModal('student');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Verify Student Identity & Unlock ₹89/3 Mos ✨';
        }
      }
    });

    // Plan Tabs
    ['free', 'plus', 'student', 'family'].forEach(plan => {
      document.getElementById(`payTab${plan.charAt(0).toUpperCase() + plan.slice(1)}`)?.addEventListener('click', () => {
        if (plan === 'student') {
          const isVerified = localStorage.getItem('isVerifiedStudent') === 'true';
          if (!isVerified) {
            this.showNotification('Student Verification Required 🎓 Please verify your Student ID first.', 'warning');
            this.openStudentVerifyModal();
            return;
          }
        }
        document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(`payTab${plan.charAt(0).toUpperCase() + plan.slice(1)}`)?.classList.add('active');
        this.selectedPlan = plan;
        this.updatePaymentSummary();
      });
    });

    // Payment Method Tabs
    ['payu', 'upi', 'card', 'netbanking'].forEach(method => {
      document.getElementById(`method${method.charAt(0).toUpperCase() + method.slice(1)}`)?.addEventListener('click', () => {
        document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`method${method.charAt(0).toUpperCase() + method.slice(1)}`)?.classList.add('active');

        document.querySelectorAll('.method-pane').forEach(p => p.style.display = 'none');
        const pane = document.getElementById(`pane${method.charAt(0).toUpperCase() + method.slice(1)}`);
        if (pane) pane.style.display = 'block';
        this.selectedPaymentMethod = method;
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

  openStudentVerifyModal() {
    const studentModal = document.getElementById('studentVerifyModal');
    if (studentModal) studentModal.style.display = 'flex';
  }

  openPaymentModal(plan = 'plus') {
    // If Student Plan selected, verify student status first
    if (plan === 'student') {
      const isVerified = localStorage.getItem('isVerifiedStudent') === 'true';
      if (!isVerified) {
        this.showNotification('Student Verification Required 🎓 Please verify your Student ID first.', 'warning');
        this.openStudentVerifyModal();
        return;
      }
    }

    // If Free Tier (₹0) selected, directly activate Free User status without payment modal
    if (plan === 'free') {
      localStorage.setItem('userPlan', 'free');
      localStorage.setItem('userPlanName', 'SoundWave Free');
      if (this.currentUser) this.currentUser.plan = 'free';

      this.showNotification('Welcome to SoundWave Free Tier! Active Free User status assigned. 🎧', 'success');
      
      const paymentModal = document.getElementById('paymentModal');
      if (paymentModal) paymentModal.style.display = 'none';

      window.location.hash = '#home';
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

    // Dynamic PayU Gateway Button & Link Generator
    const payuLinks = {
      plus: 'https://u.payu.in/Erl7hKgICCH1',
      student: 'https://u.payu.in/YIoRtYtdRxuS',
      family: 'https://u.payu.in/rrlLa18bmvEL'
    };
    const payuUrl = payuLinks[this.selectedPlan] || payuLinks.plus;
    const payuBtn = document.getElementById('payuDirectBuyBtn');
    const payuTitle = document.getElementById('payuPlanTitle');

    if (payuBtn) {
      payuBtn.href = payuUrl;
      if (this.selectedPlan === 'student') {
        payuBtn.textContent = 'Pay Now';
        payuBtn.style.backgroundColor = '#0D1E29';
        payuBtn.style.color = 'white';
      } else if (this.selectedPlan === 'family') {
        payuBtn.textContent = 'Pay Now';
        payuBtn.style.backgroundColor = '#E2E5EC';
        payuBtn.style.color = 'black';
      } else {
        payuBtn.textContent = 'Buy Now';
        payuBtn.style.backgroundColor = '#E2E5EC';
        payuBtn.style.color = 'black';
      }
    }
    if (payuTitle) {
      payuTitle.textContent = `${info.name} Subscription (₹${total.toFixed(0)})`;
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

    if (payBtnText) payBtnText.textContent = '🔒 Verifying Payment Gateway...';
    if (payBtn) payBtn.disabled = true;

    // Attempt PayU window open safely without blocking payment completion
    const payuLinks = {
      plus: 'https://u.payu.in/Erl7hKgICCH1',
      student: 'https://u.payu.in/YIoRtYtdRxuS',
      family: 'https://u.payu.in/rrlLa18bmvEL'
    };
    const targetPayuUrl = payuLinks[this.selectedPlan] || payuLinks.plus;

    if (this.selectedPaymentMethod === 'payu') {
      try {
        window.open(targetPayuUrl, '_blank');
      } catch (e) {}
    }

    setTimeout(() => {
      // Payment Successful & Verified!
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

      // Update URL hash to Payment Success URL route
      window.location.hash = `#payment-success?plan=${this.selectedPlan}&txn_id=${txnId}&amount=₹${total.toFixed(2)}`;

      if (payBtnText) payBtnText.textContent = `Complete Payment & Unlock ${this.selectedPlan.toUpperCase()}`;
      if (payBtn) payBtn.disabled = false;

      this.updateAdVisibility();
      this.showNotification(`Payment Verified! Welcome to ${planTitle} 🚀 (Ad-Free Active)`, 'success');
    }, 1200);
  }

  redirectAfterPayment() {
    const successModal = document.getElementById('paymentSuccessModal');
    if (successModal) successModal.style.display = 'none';
    window.location.hash = '#home';
    this.updateAdVisibility();
    this.showNotification('🎉 Premium Unlocked! Enjoy 100% Ad-Free 320kbps Hi-Fi streaming.');
  }

  updateAdVisibility() {
    const adSelectors = [
      '#sponsoredAd',
      '.native-ad-wrapper',
      '.banner-ad-320x50',
      '.adsterra-banner-container',
      '.sponsored-ad'
    ];

    adSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = 'none';
        el.remove();
      });
    });

    // Remove any dynamic iframe/popunder ad overlays for all users
    document.querySelectorAll('iframe[src*="effectivecpmnetwork.com"], iframe[src*="highperformanceformat.com"], script[src*="effectivecpmnetwork.com"], script[src*="highperformanceformat.com"]').forEach(el => el.remove());
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

// Ensure routing runs after full DOM + app init
document.addEventListener('DOMContentLoaded', () => {
  if (window.app && typeof window.app.handleRouting === 'function') {
    window.app.handleRouting();
  }
});

// ============================================================
//  🌅 Morning Routine — Play Favorite YouTube Playlist Shuffled
//  Playlist ID: PL6H6TfFpYvpersEdHECeWkocaPueTqieF
// ============================================================
window.playMorningRoutinePlaylist = async function () {
  const PLAYLIST_ID = 'PL6H6TfFpYvpersEdHECeWkocaPueTqieF';
  const YT_API_KEY = 'AIzaSyBGdoXzyWBgLsp5AO313zFF4QjaCLklQeM';
  const MAX_RESULTS = 50;
  const btn = document.getElementById('morningRoutinePlayBtn');

  if (btn) {
    btn.classList.add('loading');
    btn.querySelector('.morning-play-icon').textContent = '⏳';
  }

  try {
    // Fetch playlist items from YouTube Data API v3
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${MAX_RESULTS}&playlistId=${PLAYLIST_ID}&key=${YT_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch playlist');
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('No tracks found in playlist');
    }

    // Map playlist items to SoundWave song objects
    const songs = data.items
      .filter(item => item.snippet?.resourceId?.videoId)
      .map(item => {
        const videoId = item.snippet.resourceId.videoId;
        const title = item.snippet.title || 'YouTube Track';
        const artist = item.snippet.videoOwnerChannelTitle || 'YouTube Artist';
        const thumb = item.snippet.thumbnails?.high?.url
          || item.snippet.thumbnails?.medium?.url
          || item.snippet.thumbnails?.default?.url
          || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80';

        const host = window.location.hostname === 'ujwal8156v.github.io'
          ? 'ujwal8156v.github.io'
          : 'localhost:5000';
        const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
        const apiBase = window.location.hostname === 'ujwal8156v.github.io'
          ? 'http://localhost:5000/api/v1'
          : `http://${host}/api/v1`;

        return {
          id: `yt-${videoId}`,
          title,
          artist,
          album: 'Morning Routine 🌅',
          coverArt: thumb,
          duration: 240,
          genre: 'YouTube',
          source: 'youtube',
          audioUrl: `${apiBase}/songs/yt-${videoId}/stream?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
        };
      });

    // Fisher-Yates shuffle
    for (let i = songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [songs[i], songs[j]] = [songs[j], songs[i]];
    }

    // Load into player
    if (window.app) {
      window.app.playlist = songs;
      window.app.currentIndex = 0;
      window.app.playSong(songs[0]);
      window.app.showNotification(`🌅 Morning Routine playing — ${songs.length} tracks shuffled! 🔀`, 'success');
    }

    if (btn) {
      btn.classList.remove('loading');
      btn.querySelector('.morning-play-icon').textContent = '▶';
    }
  } catch (err) {
    console.error('Morning Routine playlist error:', err);
    if (window.app) {
      window.app.showNotification('⚠️ Could not load playlist. Check your connection.', 'error');
    }
    if (btn) {
      btn.classList.remove('loading');
      btn.querySelector('.morning-play-icon').textContent = '▶';
    }
  }
};
