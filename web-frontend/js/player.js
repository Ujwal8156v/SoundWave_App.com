// Audio Player

class AudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.isPlaying = false;
    this.currentSong = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Play/Pause
    document.getElementById('playBtn')?.addEventListener('click', () => this.togglePlay());

    // Previous/Next
    document.getElementById('prevBtn')?.addEventListener('click', () => this.previous());
    document.getElementById('nextBtn')?.addEventListener('click', () => this.next());

    // Progress
    document.getElementById('progressBar')?.addEventListener('change', (e) => this.seek(e.target.value));

    // Volume
    document.getElementById('volumeSlider')?.addEventListener('change', (e) => this.setVolume(e.target.value));

    // Actions
    document.getElementById('downloadBtn')?.addEventListener('click', () => this.downloadSong());
    document.getElementById('shareBtn')?.addEventListener('click', () => this.shareSong());
    document.getElementById('likeBtn')?.addEventListener('click', () => this.likeSong());

    // Audio events
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.next());
    this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
  }

  async loadSong(song) {
    this.currentSong = song;
    this.audio.src = await API.streamSong(song.id);
    this.play();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.audio.play();
    this.isPlaying = true;
    document.getElementById('playBtn').textContent = '⏸';
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    document.getElementById('playBtn').textContent = '▶';
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
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    document.getElementById('progressBar').value = percent;
    document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
  }

  updateDuration() {
    document.getElementById('duration').textContent = this.formatTime(this.audio.duration);
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      await API.likeSong(this.currentSong.id);
      document.getElementById('likeBtn').style.color = '#ef4444';
      app.showNotification('Song liked');
    } catch (error) {
      app.showNotification('Like failed', 'error');
    }
  }
}

const player = new AudioPlayer();
