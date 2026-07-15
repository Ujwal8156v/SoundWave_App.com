// Audio Player

const lyricsDatabase = {
  "blue eyes": [
    { time: 0, text: "🎵 Blue Eyes - Yo Yo Honey Singh 🎵" },
    { time: 5, text: "Blue eyes, hypnotise teri kardi ai mennu" },
    { time: 10, text: "I swear! Chhoti dress mein bomb lagdi mennu" },
    { time: 15, text: "Gharon baahar na nikalya kar" },
    { time: 20, text: "Ni taan lag ju nazar tennu" },
    { time: 25, text: "Blue eyes, hypnotise teri kardi ai mennu" },
    { time: 30, text: "I swear! Chhoti dress mein bomb lagdi mennu" },
    { time: 35, text: "🎵 Instrumental Solo 🎵" },
    { time: 45, text: "Gharon baahar na nikalya kar" },
    { time: 50, text: "Ni taan lag ju nazar tennu..." }
  ],
  "default": [
    { time: 0, text: "🎵 Stream original soundtrack on SoundWaves 🎵" },
    { time: 5, text: "Yeah, vibe the moment with SoundWaves..." },
    { time: 12, text: "Feel the base line kickin'..." },
    { time: 18, text: "And the high hats rollin'..." },
    { time: 25, text: "This is a premium streaming experience." },
    { time: 32, text: "Autoplay, dynamic queues, and offline caches." },
    { time: 40, text: "Music is life. Enjoy the beats!" }
  ]
};

class AudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.isPlaying = false;
    this.isDragging = false;
    this.currentSong = null;
    this.sleepTimerInterval = null;
    this.sleepTimerRemaining = 0;
    this.activeTabName = 'UpNext';
    this.canvasCtx = null;
    this.preloadedUrls = {};
    this.preloader = new Audio();
    this.preloader.preload = 'auto';
    this.preloadedSongId = null;
    this.setupEventListeners();
    this.setupVisualizer();
  }

  setupEventListeners() {
    // Progress Bar dragging handlers
    const handleProgressBarInput = (e) => {
      this.isDragging = true;
      const percent = e.target.value;
      const targetTime = (percent / 100) * (this.audio.duration || 0);
      const formatted = this.formatTime(targetTime);
      
      const currentTime = document.getElementById('currentTime');
      const modalCurrentTime = document.getElementById('modalCurrentTime');
      if (currentTime) currentTime.textContent = formatted;
      if (modalCurrentTime) modalCurrentTime.textContent = formatted;
    };

    const handleProgressBarChange = (e) => {
      this.seek(e.target.value);
      this.isDragging = false;
    };

    // Minimized Controls
    document.getElementById('playBtn')?.addEventListener('click', () => this.togglePlay());
    document.getElementById('prevBtn')?.addEventListener('click', () => this.previous());
    document.getElementById('nextBtn')?.addEventListener('click', () => this.next());
    
    const progBar = document.getElementById('progressBar');
    if (progBar) {
      progBar.addEventListener('input', handleProgressBarInput);
      progBar.addEventListener('change', handleProgressBarChange);
    }
    
    document.getElementById('volumeSlider')?.addEventListener('input', (e) => this.setVolume(e.target.value));

    // Playback Speed Controller
    document.getElementById('speedSelect')?.addEventListener('change', (e) => {
      const speed = parseFloat(e.target.value);
      this.audio.playbackRate = speed;
      app.showNotification(`Playback speed set to ${speed}x`);
    });

    // Expanded Controls (Modal)
    document.getElementById('modalPlayBtn')?.addEventListener('click', () => this.togglePlay());
    document.getElementById('modalPrevBtn')?.addEventListener('click', () => this.previous());
    document.getElementById('modalNextBtn')?.addEventListener('click', () => this.next());
    
    const modProgBar = document.getElementById('modalProgressBar');
    if (modProgBar) {
      modProgBar.addEventListener('input', handleProgressBarInput);
      modProgBar.addEventListener('change', handleProgressBarChange);
    }
    
    // Close Modal Button
    document.getElementById('closePlayerModalBtn')?.addEventListener('click', () => {
      document.getElementById('playerModal').style.display = 'none';
    });

    // Actions
    document.getElementById('downloadBtn')?.addEventListener('click', () => this.downloadSong());
    document.getElementById('shareBtn')?.addEventListener('click', () => this.shareSong());
    document.getElementById('likeBtn')?.addEventListener('click', () => this.likeSong());
    document.getElementById('modalLikeBtn')?.addEventListener('click', () => this.likeSong());

    // Sleep Timer trigger button handlers
    const triggerSleepTimer = () => {
      const input = prompt("Set Sleep Timer in minutes (e.g. 1, 5, 15, 30, 60), or enter 0 to disable:");
      if (input === null) return;
      const mins = parseInt(input.trim());
      if (isNaN(mins) || mins < 0) {
        alert("Invalid input");
        return;
      }
      this.setSleepTimer(mins);
    };
    document.getElementById('sleepTimerBtn')?.addEventListener('click', triggerSleepTimer);
    document.getElementById('modalSleepTimerBtn')?.addEventListener('click', triggerSleepTimer);

    // Modal Tabs clicking
    const tabs = ['UpNext', 'Lyrics', 'Related'];
    tabs.forEach(tab => {
      document.getElementById(`modalTab${tab}`)?.addEventListener('click', (e) => {
        document.querySelectorAll('.modal-tab').forEach(el => el.classList.remove('active'));
        e.currentTarget.classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(el => el.style.display = 'none');
        document.getElementById(`pane${tab}`).style.display = 'block';

        this.activeTabName = tab;
        this.renderTabContent();
      });
    });

    // Audio events
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.next());
    this.audio.addEventListener('loadedmetadata', () => this.updateDuration());

    // Error safety listener
    this.audio.addEventListener('error', (e) => {
      console.error('Audio stream load failed:', e);
      app.showNotification('This song is currently unavailable. Please try another track.', 'error');
      this.pause();
    });
  }

  async preloadNextSong(currentSongId) {
    try {
      const playlist = app.playlist;
      const currentIndex = app.currentIndex;
      if (playlist && currentIndex !== -1 && currentIndex < playlist.length - 1) {
        const nextSong = playlist[currentIndex + 1];
        const nextSongId = nextSong.id;

        // If next song is already preloaded, skip
        if (this.preloadedSongId === nextSongId) return;

        console.log(`[Preload] Fetching next stream URL for: ${nextSong.title}`);
        const resolvedUrl = await API.streamSong(nextSongId, nextSong.title, nextSong.artist);
        
        // Cache the resolved URL
        this.preloadedUrls[nextSongId] = resolvedUrl;
        
        // Preload the audio file bytes in background using HTML5 preloader
        this.preloadedSongId = nextSongId;
        this.preloader.src = resolvedUrl;
        this.preloader.load(); // starts buffering in browser!
        console.log(`[Preload] Background buffering started for: ${nextSong.title}`);
      }
    } catch (err) {
      console.warn('[Preload] Failed to preload next song:', err);
    }
  }

  async loadSong(song) {
    this.currentSong = song;
    
    // Check if the URL was already pre-fetched and pre-buffered
    if (this.preloadedUrls[song.id]) {
      console.log(`[Playback] INSTANT PLAY (using pre-buffered URL) for: ${song.title}`);
      this.audio.src = this.preloadedUrls[song.id];
    } else {
      console.log(`[Playback] Normal load (fetching stream URL synchronously) for: ${song.title}`);
      this.audio.src = await API.streamSong(song.id, song.title, song.artist);
    }
    
    // Maintain speed value across song loads
    const speedSelect = document.getElementById('speedSelect');
    const speed = speedSelect ? parseFloat(speedSelect.value) : 1.0;
    this.audio.playbackRate = speed;

    this.play();
    this.updateMetadataUI();
    this.renderTabContent();

    // Trigger preloading for the next song in the queue asynchronously
    this.preloadNextSong(song.id).catch(() => null);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.audio.play().catch(() => null);
    this.isPlaying = true;
    const playBtn = document.getElementById('playBtn');
    const modalPlayBtn = document.getElementById('modalPlayBtn');
    if (playBtn) playBtn.textContent = '⏸';
    if (modalPlayBtn) modalPlayBtn.textContent = '⏸';
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    const playBtn = document.getElementById('playBtn');
    const modalPlayBtn = document.getElementById('modalPlayBtn');
    if (playBtn) playBtn.textContent = '▶';
    if (modalPlayBtn) modalPlayBtn.textContent = '▶';
  }

  previous() {
    if (app.currentIndex > 0) {
      app.currentIndex--;
      app.playSong(app.playlist[app.currentIndex].id, app.playlist);
    }
  }

  next() {
    if (app.currentIndex < app.playlist.length - 1) {
      app.currentIndex++;
      app.playSong(app.playlist[app.currentIndex].id, app.playlist);
    }
  }

  seek(percent) {
    const time = (percent / 100) * this.audio.duration;
    this.audio.currentTime = time;
  }

  setVolume(value) {
    this.audio.volume = value / 100;
  }

  updateProgress() {
    if (this.isDragging) return;
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    
    // Sync minimized
    const progressBar = document.getElementById('progressBar');
    const currentTime = document.getElementById('currentTime');
    if (progressBar) progressBar.value = percent || 0;
    if (currentTime) currentTime.textContent = this.formatTime(this.audio.currentTime);
    
    // Sync expanded
    const modalProgressBar = document.getElementById('modalProgressBar');
    const modalCurrentTime = document.getElementById('modalCurrentTime');
    if (modalProgressBar) modalProgressBar.value = percent || 0;
    if (modalCurrentTime) modalCurrentTime.textContent = this.formatTime(this.audio.currentTime);

    // Sync lyrics scroll
    if (this.activeTabName === 'Lyrics') {
      this.syncLyricsScroll();
    }

    // Sync media session position state for lockscreen timeline matching
    if ('mediaSession' in navigator && !isNaN(this.audio.duration)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: this.audio.duration,
          playbackRate: this.audio.playbackRate || 1.0,
          position: this.audio.currentTime
        });
      } catch (e) {
        // Ignored if browser version limits position API
      }
    }
  }

  updateDuration() {
    const formatted = this.formatTime(this.audio.duration);
    const duration = document.getElementById('duration');
    const modalDuration = document.getElementById('modalDuration');
    if (duration) duration.textContent = formatted;
    if (modalDuration) modalDuration.textContent = formatted;
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  updateMetadataUI() {
    if (this.currentSong) {
      const songTitle = document.getElementById('songTitle');
      const artistName = document.getElementById('artistName');
      const coverArt = document.getElementById('coverArt');
      const likeBtn = document.getElementById('likeBtn');

      const modalTitle = document.getElementById('modalSongTitle');
      const modalArtist = document.getElementById('modalArtistName');
      const modalArt = document.getElementById('modalCoverArt');
      const modalLike = document.getElementById('modalLikeBtn');

      const suffix = this.sleepTimerRemaining > 0 
        ? ` (⏱️ ${this.formatTime(this.sleepTimerRemaining)})` 
        : "";

      if (songTitle) songTitle.textContent = this.currentSong.title + suffix;
      if (artistName) artistName.textContent = this.currentSong.artist;
      if (coverArt) coverArt.src = this.currentSong.coverArt || 'assets/default-cover.png';
      
      const isLiked = app.likedSongsSet && app.likedSongsSet.has(this.currentSong.id);
      if (likeBtn) likeBtn.textContent = isLiked ? '❤️' : '♡';

      if (modalTitle) modalTitle.textContent = this.currentSong.title + suffix;
      if (modalArtist) modalArtist.textContent = this.currentSong.artist;
      if (modalArt) modalArt.src = this.currentSong.coverArt || 'assets/default-cover.png';
      if (modalLike) modalLike.textContent = isLiked ? '❤️' : '♡';

      this.updateMediaSession();
    }
  }

  updateMediaSession() {
    if ('mediaSession' in navigator && this.currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.currentSong.title,
        artist: this.currentSong.artist,
        album: this.currentSong.album || 'SoundWave Single',
        artwork: [
          { src: this.currentSong.coverArt || 'assets/default-cover.png', sizes: '96x96', type: 'image/png' },
          { src: this.currentSong.coverArt || 'assets/default-cover.png', sizes: '128x128', type: 'image/png' },
          { src: this.currentSong.coverArt || 'assets/default-cover.png', sizes: '192x192', type: 'image/png' },
          { src: this.currentSong.coverArt || 'assets/default-cover.png', sizes: '256x256', type: 'image/png' },
          { src: this.currentSong.coverArt || 'assets/default-cover.png', sizes: '384x384', type: 'image/png' },
          { src: this.currentSong.coverArt || 'assets/default-cover.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      // Register system media control callbacks
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      
      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            this.audio.currentTime = details.seekTime;
          }
        });
      } catch (error) {
        // seekto not supported in some older browsers
      }
    }
  }

  setSleepTimer(minutes) {
    if (this.sleepTimerInterval) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
    if (minutes === 0) {
      this.sleepTimerRemaining = 0;
      app.showNotification('Sleep timer disabled');
      this.updateMetadataUI();
      return;
    }
    this.sleepTimerRemaining = minutes * 60;
    app.showNotification(`Sleep timer set for ${minutes} minute(s)`);
    this.updateMetadataUI();

    this.sleepTimerInterval = setInterval(() => {
      if (this.sleepTimerRemaining > 0) {
        this.sleepTimerRemaining--;
        this.updateMetadataUI();
        if (this.sleepTimerRemaining <= 0) {
          this.pause();
          clearInterval(this.sleepTimerInterval);
          this.sleepTimerInterval = null;
          app.showNotification('Sleep timer finished. Playback paused.');
          this.updateMetadataUI();
        }
      }
    }, 1000);
  }

  setupVisualizer() {
    const canvas = document.getElementById('modalVisualizer');
    if (!canvas) return;
    this.canvasCtx = canvas.getContext('2d');
    this.animateVisualizer();
  }

  animateVisualizer() {
    const canvas = document.getElementById('modalVisualizer');
    if (!canvas || !this.canvasCtx) return;
    const ctx = this.canvasCtx;
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      requestAnimationFrame(draw);
      if (!this.isPlaying) {
        ctx.fillStyle = 'rgba(15, 15, 15, 0.2)';
        ctx.fillRect(0, 0, width, height);
        return;
      }

      ctx.fillStyle = 'rgba(15, 15, 15, 0.15)';
      ctx.fillRect(0, 0, width, height);

      const barWidth = 4;
      const gap = 2;
      const totalBars = Math.floor(width / (barWidth + gap));
      
      ctx.beginPath();
      for (let i = 0; i < totalBars; i++) {
        const time = Date.now() * 0.004;
        const factor = Math.sin(time + i * 0.15) * Math.cos(time * 0.5 + i * 0.05);
        const rawVal = Math.abs(factor);
        const barHeight = Math.max(4, rawVal * (height - 10));

        const x = i * (barWidth + gap);
        const y = height - barHeight;

        // Glowing red neon bar color scheme matching YT Music design
        const lightness = 50 + Math.floor(rawVal * 20);
        ctx.fillStyle = `hsl(0, 100%, ${lightness}%)`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'red';
        ctx.fillRect(x, y, barWidth, barHeight);
      }
      ctx.shadowBlur = 0;
    };
    
    draw();
  }

  renderTabContent() {
    if (!this.currentSong) return;

    if (this.activeTabName === 'UpNext') {
      const container = document.getElementById('upNextList');
      if (!container) return;

      const upNextSongs = app.playlist.slice(app.currentIndex + 1);
      if (upNextSongs.length === 0) {
        container.innerHTML = `<li style="text-align: center; color: var(--text-secondary); padding: 1rem; font-size: 0.85rem;">Queue is empty.</li>`;
        return;
      }

      container.innerHTML = upNextSongs.map(song => `
        <li class="modal-song-item" data-id="${song.id}">
          <img class="modal-song-img" src="${song.coverArt || 'assets/default-cover.png'}">
          <div class="modal-song-meta">
            <div class="modal-song-title">${song.title}</div>
            <div class="modal-song-artist">${song.artist}</div>
          </div>
        </li>
      `).join('');

      container.querySelectorAll('.modal-song-item').forEach(item => {
        item.addEventListener('click', () => {
          const songId = item.dataset.id;
          app.playSong(songId, app.playlist);
        });
      });

    } else if (this.activeTabName === 'Lyrics') {
      const container = document.getElementById('lyricsContainer');
      if (!container) return;

      const songTitleLower = this.currentSong.title.toLowerCase();
      let lines = lyricsDatabase.default;
      if (songTitleLower.includes('blue eyes')) {
        lines = lyricsDatabase["blue eyes"];
      }

      container.innerHTML = lines.map((line, idx) => `
        <div class="lyric-line" id="lyricLine_${idx}" data-time="${line.time}">${line.text}</div>
      `).join('');
      
      this.syncLyricsScroll();

    } else if (this.activeTabName === 'Related') {
      const container = document.getElementById('relatedList');
      if (!container) return;

      const related = app.playlist.filter(s => s.id !== this.currentSong.id).slice(0, 4);
      if (related.length === 0) {
        container.innerHTML = `<li style="text-align: center; color: var(--text-secondary); padding: 1rem; font-size: 0.85rem;">No related recommendations.</li>`;
        return;
      }

      container.innerHTML = related.map(song => `
        <li class="modal-song-item" data-id="${song.id}">
          <img class="modal-song-img" src="${song.coverArt || 'assets/default-cover.png'}">
          <div class="modal-song-meta">
            <div class="modal-song-title">${song.title}</div>
            <div class="modal-song-artist">${song.artist}</div>
          </div>
        </li>
      `).join('');

      container.querySelectorAll('.modal-song-item').forEach(item => {
        item.addEventListener('click', () => {
          const songId = item.dataset.id;
          app.playSong(songId, app.playlist);
        });
      });
    }
  }

  syncLyricsScroll() {
    if (this.activeTabName !== 'Lyrics' || !this.currentSong) return;
    const currentTime = this.audio.currentTime;

    const songTitleLower = this.currentSong.title.toLowerCase();
    let lines = lyricsDatabase.default;
    if (songTitleLower.includes('blue eyes')) {
      lines = lyricsDatabase["blue eyes"];
    }

    let activeIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= lines[i].time) {
        activeIdx = i;
      } else {
        break;
      }
    }

    const container = document.getElementById('lyricsContainer');
    if (!container) return;

    const elements = container.querySelectorAll('.lyric-line');
    elements.forEach((el, idx) => {
      el.classList.remove('active');
      if (idx === activeIdx) {
        el.classList.add('active');
        
        const containerHeight = container.clientHeight;
        const elOffsetTop = el.offsetTop;
        const elHeight = el.clientHeight;
        container.scrollTop = elOffsetTop - (containerHeight / 2) + (elHeight / 2);
      }
    });
  }

  async downloadSong() {
    if (!this.currentSong) return;
    try {
      const result = await API.downloadSong(this.currentSong.id);
      window.open(result.data.downloadUrl, '_blank');
      app.showNotification('Download started');
    } catch (error) {
      app.showNotification('Download failed', 'error');
    }
  }

  async shareSong() {
    if (!this.currentSong) return;
    const platform = prompt('Share on (twitter/facebook/whatsapp):');
    if (platform) {
      try {
        await API.shareSong(this.currentSong.id, platform);
        app.showNotification('Song shared successfully');
      } catch (error) {
        app.showNotification('Share failed', 'error');
      }
    }
  }

  async likeSong() {
    if (!this.currentSong) return;
    try {
      await app.toggleLike(this.currentSong.id);
    } catch (error) {
      app.showNotification('Like failed', 'error');
    }
  }
}

window.player = new AudioPlayer();
