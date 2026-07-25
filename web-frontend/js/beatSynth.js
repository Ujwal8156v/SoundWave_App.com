/**
 * SoundWave AI BeatVibe Live Audio Synthesizer Engine
 * Real-Time Web Audio API Synthesis for Kick, Snare, Hi-Hat, Cyber Sub, and Auto-Loop DJ Layering
 */

class AIBeatVibeEngine {
  constructor() {
    this.audioCtx = null;
    this.bpm = 120;
    this.isPlayingLoop = false;
    this.loopTimer = null;
    this.step = 0;

    // Pattern: 16 steps
    this.pattern = {
      kick:  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      synth: [1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0]
    };
  }

  initCtx() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // 1. Kick Drum Synth (Pitch Drop Oscillator + Exponential Gain Envelope)
  triggerKick() {
    this.initCtx();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // 2. Snare Drum Synth (White Noise Burst + High-pass Filter + Tone Osc)
  triggerSnare() {
    this.initCtx();
    const now = this.audioCtx.currentTime;

    // Noise Buffer
    const bufferSize = this.audioCtx.sampleRate * 0.2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;

    const noiseFilter = this.audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1000, now);

    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.audioCtx.destination);

    // Snare Tone Body
    const osc = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.audioCtx.destination);

    whiteNoise.start(now);
    osc.start(now);
    whiteNoise.stop(now + 0.2);
    osc.stop(now + 0.1);
  }

  // 3. Hi-Hat Metallic Synth (High-pass Noise burst)
  triggerHiHat() {
    this.initCtx();
    const now = this.audioCtx.currentTime;
    const bufferSize = this.audioCtx.sampleRate * 0.05;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, now);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(now);
    noise.stop(now + 0.05);
  }

  // 4. Cyber Sub Bass Pulse
  triggerCyberSub() {
    this.initCtx();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Toggle Auto AI DJ Drum Loop Layer
  toggleLoop() {
    this.initCtx();
    this.isPlayingLoop = !this.isPlayingLoop;
    if (this.isPlayingLoop) {
      this.step = 0;
      const intervalMs = (60 / this.bpm / 4) * 1000;
      this.loopTimer = setInterval(() => {
        if (this.pattern.kick[this.step]) this.triggerKick();
        if (this.pattern.snare[this.step]) this.triggerSnare();
        if (this.pattern.hihat[this.step]) this.triggerHiHat();
        if (this.pattern.synth[this.step]) this.triggerCyberSub();
        this.step = (this.step + 1) % 16;
      }, intervalMs);
      return true;
    } else {
      if (this.loopTimer) clearInterval(this.loopTimer);
      this.loopTimer = null;
      return false;
    }
  }
}

window.AIBeatVibe = new AIBeatVibeEngine();
