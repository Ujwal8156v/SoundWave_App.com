/**
 * SoundWave FX Studio - Web Audio Equalizer, 3D Spatial Audio & Karaoke Engine
 */
class AudioFXEngine {
  constructor() {
    this.ctx = null;
    this.sourceNode = null;
    this.eqFilters = [];
    this.spatialNode = null;
    this.spatialGain = null;
    this.karaokeFilter = null;
    this.analyser = null;
    this.isInitialized = false;

    // Default EQ Frequencies (Hz)
    this.frequencies = [60, 230, 910, 3600, 14000];
    this.bands = ['bass', 'lowMid', 'mid', 'highMid', 'treble'];

    // Presets
    this.presets = {
      flat: [0, 0, 0, 0, 0],
      bassBoost: [8, 5, 1, 0, -1],
      vocalEnhancer: [-2, 1, 6, 4, 1],
      electronicHype: [6, 4, -1, 3, 6],
      acousticWarmth: [4, 2, 1, 3, 2],
      cyberpunk: [7, 2, -2, 4, 8]
    };

    this.currentPreset = 'flat';
    this.spatialMode = 'off'; // 'off', 'studio', 'concert', 'cyberspace'
    this.isKaraokeActive = false;
  }

  init(audioElement) {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Create MediaElement Source
      this.sourceNode = this.ctx.createMediaElementSource(audioElement);

      // Create 5-Band EQ Filters
      this.eqFilters = this.frequencies.map((freq, index) => {
        const filter = this.ctx.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === this.frequencies.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Karaoke Notch Filter (Vocal Frequency Attenuator)
      this.karaokeFilter = this.ctx.createBiquadFilter();
      this.karaokeFilter.type = 'notch';
      this.karaokeFilter.frequency.value = 1400; // Human vocal center frequency
      this.karaokeFilter.Q.value = 1.2;
      this.karaokeFilter.gain.value = 0; // inactive by default

      // Spatial Delay & Reverb Node
      this.spatialDelay = this.ctx.createDelay();
      this.spatialDelay.delayTime.value = 0.03; // 30ms initial delay

      this.spatialFeedback = this.ctx.createGain();
      this.spatialFeedback.gain.value = 0.3;

      this.spatialGain = this.ctx.createGain();
      this.spatialGain.gain.value = 0; // Off by default

      // Connect Spatial Loop: Delay -> Feedback -> Delay
      this.spatialDelay.connect(this.spatialFeedback);
      this.spatialFeedback.connect(this.spatialDelay);

      // Analyser Node for Visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.85;

      // Connect Node Chain:
      // Source -> EQ Filter 0..4 -> Karaoke -> Spatial Gain Split -> Analyser -> Destination
      let currentNode = this.sourceNode;

      for (let i = 0; i < this.eqFilters.length; i++) {
        currentNode.connect(this.eqFilters[i]);
        currentNode = this.eqFilters[i];
      }

      currentNode.connect(this.karaokeFilter);
      currentNode = this.karaokeFilter;

      // Connect Spatial Parallel Loop
      currentNode.connect(this.spatialDelay);
      this.spatialDelay.connect(this.spatialGain);
      this.spatialGain.connect(this.analyser);

      // Direct dry path to Analyser
      currentNode.connect(this.analyser);

      // Output to Speakers
      this.analyser.connect(this.ctx.destination);

      this.isInitialized = true;
      console.log('[SoundWave FX] Audio Engine & Web Audio nodes initialized successfully.');
    } catch (err) {
      console.error('[SoundWave FX] Audio Context Initialization Error:', err);
    }
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        console.log('[SoundWave FX] AudioContext resumed.');
      });
    }
  }

  setBandGain(index, gainDb) {
    if (this.eqFilters[index]) {
      const db = Math.max(-12, Math.min(12, gainDb));
      this.eqFilters[index].gain.setTargetAtTime(db, this.ctx.currentTime, 0.05);
    }
  }

  applyPreset(presetName) {
    if (this.presets[presetName]) {
      this.currentPreset = presetName;
      const gains = this.presets[presetName];
      gains.forEach((gainDb, index) => {
        this.setBandGain(index, gainDb);
      });
      console.log(`[SoundWave FX] Applied EQ Preset: ${presetName}`);
    }
  }

  setSpatialMode(mode) {
    if (!this.ctx || !this.spatialGain) return;
    this.spatialMode = mode;

    switch (mode) {
      case 'studio':
        this.spatialDelay.delayTime.setTargetAtTime(0.025, this.ctx.currentTime, 0.05);
        this.spatialFeedback.gain.setTargetAtTime(0.2, this.ctx.currentTime, 0.05);
        this.spatialGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 0.05);
        break;
      case 'concert':
        this.spatialDelay.delayTime.setTargetAtTime(0.065, this.ctx.currentTime, 0.05);
        this.spatialFeedback.gain.setTargetAtTime(0.45, this.ctx.currentTime, 0.05);
        this.spatialGain.gain.setTargetAtTime(0.6, this.ctx.currentTime, 0.05);
        break;
      case 'cyberspace':
        this.spatialDelay.delayTime.setTargetAtTime(0.12, this.ctx.currentTime, 0.05);
        this.spatialFeedback.gain.setTargetAtTime(0.65, this.ctx.currentTime, 0.05);
        this.spatialGain.gain.setTargetAtTime(0.75, this.ctx.currentTime, 0.05);
        break;
      case 'off':
      default:
        this.spatialGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        break;
    }
    console.log(`[SoundWave FX] Spatial Audio Mode set to: ${mode}`);
  }

  toggleKaraoke() {
    if (!this.ctx || !this.karaokeFilter) return false;
    this.isKaraokeActive = !this.isKaraokeActive;

    if (this.isKaraokeActive) {
      // Activate notch filter to attenuate vocal center frequencies
      this.karaokeFilter.frequency.setTargetAtTime(1400, this.ctx.currentTime, 0.05);
      this.karaokeFilter.Q.setTargetAtTime(2.5, this.ctx.currentTime, 0.05);
      console.log('[SoundWave FX] Karaoke Vocal Isolator ENABLED.');
    } else {
      // Flatten notch filter
      this.karaokeFilter.Q.setTargetAtTime(0.001, this.ctx.currentTime, 0.05);
      console.log('[SoundWave FX] Karaoke Vocal Isolator DISABLED.');
    }

    return this.isKaraokeActive;
  }

  getFrequencyData(array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array);
    }
  }

  getWaveformData(array) {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(array);
    }
  }
}

window.AudioFX = new AudioFXEngine();
