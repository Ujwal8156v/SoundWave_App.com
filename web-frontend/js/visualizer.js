/**
 * SoundWave Visualizer Suite - 60 FPS Real-Time Canvas Audio Visualizer
 * High-Performance, Zero-Memory-Leak Engine
 */
class SoundWaveVisualizer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.mode = 'neonBars'; // 'neonBars', 'cosmicParticles', 'fluidMesh', 'matrixRain'
    this.isRunning = false;
    this.particles = [];
    this.primaryHue = 350; // Neon Crimson default
    this.resizeDebounce = null;
  }

  attach(canvasElement) {
    if (!canvasElement) return;
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    this.resize();

    window.removeEventListener('resize', this.onResizeBound);
    this.onResizeBound = () => {
      clearTimeout(this.resizeDebounce);
      this.resizeDebounce = setTimeout(() => this.resize(), 100);
    };
    window.addEventListener('resize', this.onResizeBound);
    this.initParticles();
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2 for performance
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);

    // CRITICAL: Reset transformation matrix before scaling to prevent scale explosion & tab freezing
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  setMode(mode) {
    this.mode = mode;
  }

  setHue(hue) {
    this.primaryHue = hue;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.ctx && this.canvas) {
      const width = this.canvas.clientWidth || this.canvas.width;
      const height = this.canvas.clientHeight || this.canvas.height;
      this.ctx.clearRect(0, 0, width, height);
    }
  }

  initParticles() {
    this.particles = [];
    const count = 36;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        radius: Math.random() * 2.5 + 1,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.4 + 0.1,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  loop() {
    if (!this.isRunning) return;

    // Pause canvas calculations when canvas container is hidden to save CPU/GPU cycles
    if (this.canvas && this.canvas.offsetParent === null && this.canvas.offsetWidth === 0) {
      this.animId = requestAnimationFrame(() => this.loop());
      return;
    }

    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.clientWidth || 300;
    const height = this.canvas.clientHeight || 150;

    this.ctx.clearRect(0, 0, width, height);

    // Frequency data buffer
    const bufferLength = 64;
    const freqData = new Uint8Array(bufferLength);

    if (window.AudioFX && window.AudioFX.isInitialized) {
      window.AudioFX.getFrequencyData(freqData);
    } else {
      // Smooth wave fallback when paused
      const time = Date.now() * 0.002;
      for (let i = 0; i < bufferLength; i++) {
        freqData[i] = Math.max(10, Math.sin(time + i * 0.15) * 40 + 50);
      }
    }

    if (this.mode === 'neonBars') {
      this.drawNeonBars(freqData, width, height);
    } else if (this.mode === 'cosmicParticles') {
      this.drawCosmicParticles(freqData, width, height);
    } else if (this.mode === 'fluidMesh') {
      this.drawFluidMesh(freqData, width, height);
    } else if (this.mode === 'matrixRain') {
      this.drawMatrixRain(freqData, width, height);
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  drawNeonBars(freqData, width, height) {
    const barsCount = 32;
    const gap = 3;
    const barWidth = Math.max(2, (width / barsCount) - gap);
    const hue = this.primaryHue;

    for (let i = 0; i < barsCount; i++) {
      const value = freqData[i] || 0;
      const percent = value / 255;
      const barHeight = Math.max(4, percent * (height * 0.85));
      const x = i * (barWidth + gap) + 2;
      const y = height - barHeight;

      // Gradient Fill
      const grad = this.ctx.createLinearGradient(0, height, 0, Math.max(0, y));
      grad.addColorStop(0, `hsla(${hue}, 90%, 50%, 0.9)`);
      grad.addColorStop(0.5, `hsla(${(hue + 40) % 360}, 90%, 60%, 0.75)`);
      grad.addColorStop(1, `hsla(${(hue + 80) % 360}, 90%, 75%, 0.95)`);

      this.ctx.fillStyle = grad;

      // Rounded Top Bar
      this.ctx.beginPath();
      if (typeof this.ctx.roundRect === 'function') {
        this.ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
      } else {
        this.ctx.rect(x, y, barWidth, barHeight);
      }
      this.ctx.fill();

      // Top Glow Dot
      this.ctx.fillStyle = `hsla(${(hue + 60) % 360}, 100%, 85%, 0.9)`;
      this.ctx.beginPath();
      this.ctx.arc(x + barWidth / 2, Math.max(2, y - 3), 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawCosmicParticles(freqData, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;

    let bassSum = 0;
    for (let i = 0; i < 8; i++) {
      bassSum += freqData[i] || 0;
    }
    const bassEnergy = (bassSum / 8) / 255;
    const hue = this.primaryHue;

    // Pulsing Central Core
    const coreRadius = Math.max(10, 20 + bassEnergy * 30);
    const coreGrad = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 2);
    coreGrad.addColorStop(0, `hsla(${hue}, 100%, 65%, 0.9)`);
    coreGrad.addColorStop(0.4, `hsla(${(hue + 40) % 360}, 100%, 55%, 0.4)`);
    coreGrad.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

    this.ctx.fillStyle = coreGrad;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, coreRadius * 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Orbital Particles
    this.particles.forEach((p, index) => {
      const freqVal = (freqData[index % freqData.length] || 0) / 255;
      p.angle += (p.speed + bassEnergy * 1.2) * 0.02;

      const orbitRadius = (Math.min(width, height) * 0.22) * (0.5 + p.x) + (freqVal * 20);
      const px = centerX + Math.cos(p.angle) * orbitRadius;
      const py = centerY + Math.sin(p.angle) * orbitRadius;
      const size = p.radius + (freqVal * 3);

      this.ctx.fillStyle = `hsla(${(hue + index * 8) % 360}, 100%, 70%, ${p.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawFluidMesh(freqData, width, height) {
    const points = 20;
    const sliceWidth = width / (points - 1);
    const hue = this.primaryHue;

    this.ctx.beginPath();
    this.ctx.moveTo(0, height);

    for (let i = 0; i < points; i++) {
      const val = freqData[i % freqData.length] || 0;
      const amp = (val / 255) * (height * 0.45);
      const x = i * sliceWidth;
      const y = height - 15 - amp - Math.sin(Date.now() * 0.002 + i * 0.4) * 10;

      if (i === 0) {
        this.ctx.lineTo(x, y);
      } else {
        const prevX = (i - 1) * sliceWidth;
        const cx = (prevX + x) / 2;
        this.ctx.quadraticCurveTo(prevX, y, cx, y);
      }
    }

    this.ctx.lineTo(width, height);
    this.ctx.closePath();

    const grad = this.ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, `hsla(${hue}, 90%, 55%, 0.6)`);
    grad.addColorStop(0.5, `hsla(${(hue + 50) % 360}, 90%, 50%, 0.4)`);
    grad.addColorStop(1, `hsla(${(hue + 90) % 360}, 90%, 45%, 0.15)`);

    this.ctx.fillStyle = grad;
    this.ctx.fill();

    this.ctx.strokeStyle = `hsla(${(hue + 30) % 360}, 100%, 75%, 0.9)`;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  drawMatrixRain(freqData, width, height) {
    const fontSize = 14;
    const columns = Math.max(1, Math.floor(width / fontSize));

    if (!this.matrixColumns || this.matrixColumns.length !== columns) {
      this.matrixColumns = Array.from({ length: columns }, () => Math.floor(Math.random() * -20));
    }

    this.ctx.fillStyle = 'rgba(10, 12, 22, 0.25)';
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.font = `${fontSize}px monospace`;
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ@#$%&*';

    for (let i = 0; i < columns; i++) {
      const freqVal = (freqData[i % freqData.length] || 0) / 255;
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = this.matrixColumns[i] * fontSize;

      const isLead = Math.random() > 0.88;
      this.ctx.fillStyle = isLead ? '#FFFFFF' : `hsl(${130 + (freqVal * 50)}, 100%, ${45 + freqVal * 35}%)`;
      this.ctx.fillText(char, x, y);

      if (y > height && Math.random() > 0.975) {
        this.matrixColumns[i] = 0;
      }
      this.matrixColumns[i] += (1 + Math.floor(freqVal * 2));
    }
  }
}

window.Visualizer = new SoundWaveVisualizer();
