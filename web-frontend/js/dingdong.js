/**
 * 🔔 DingDong — Interrupt / Chime / Resume
 *
 * Mirrors the Home Assistant automation:
 *   1. interrupt_start  → pause current SoundWave playback
 *   2. volume_set 1     → save current volume, set to 100%
 *   3. play_media       → play synthesized DingDong chime via Web Audio API
 *   4. delay 2s         → wait for chime to finish
 *   5. interrupt_resume → restore volume & resume playback
 */

// ─── Synthesise a Classic DingDong Chime ───────────────────────────────────
function synthesiseDingDong(audioCtx, startTime) {
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(1.0, startTime);
  masterGain.connect(audioCtx.destination);

  /**
   * A single bell tone: sine + slight detuned oscillator for richness.
   * @param {number} freq  - fundamental frequency in Hz
   * @param {number} t     - start time (AudioContext seconds)
   * @param {number} decay - envelope decay duration in seconds
   */
  function bell(freq, t, decay = 1.4) {
    // Fundamental
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);
    gain1.gain.setValueAtTime(0.6, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + decay);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(t);
    osc1.stop(t + decay);

    // Slight overtone for bell character
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.756, t); // bell overtone ratio
    gain2.gain.setValueAtTime(0.25, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + decay * 0.7);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(t);
    osc2.stop(t + decay * 0.7);

    // Attack transient click
    const noise = audioCtx.createOscillator();
    const noiseGain = audioCtx.createGain();
    noise.type = 'triangle';
    noise.frequency.setValueAtTime(freq * 4, t);
    noiseGain.gain.setValueAtTime(0.15, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    noise.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(t);
    noise.stop(t + 0.08);
  }

  // "DING"  — high E5  (659 Hz), at t+0
  bell(659, startTime, 1.5);
  // "DONG"  — low  B3  (247 Hz), at t+0.55
  bell(247, startTime + 0.55, 1.8);

  // Total chime duration ≈ 2.35 s — safely within the 2 s delay + fade
}

// ─── Show / hide DingDong status toast ────────────────────────────────────
function showDingDongToast(msg, durationMs = 2500) {
  const toast = document.getElementById('dingdongToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), durationMs);
}

// ─── Main DingDong Trigger ─────────────────────────────────────────────────
window.triggerDingDong = async function () {
  const btn = document.getElementById('dingDongBtn');

  // ── STEP 1: interrupt_start — pause current playback & save state ──────
  const audioEl = document.getElementById('audioPlayer')
                || document.querySelector('audio');
  const wasPlaying = audioEl && !audioEl.paused;
  const savedVolume = audioEl ? audioEl.volume : 1;

  if (wasPlaying && audioEl) {
    audioEl.pause();
  }

  // ── STEP 2: volume_set 1 — maximise output volume ─────────────────────
  if (audioEl) audioEl.volume = 1;

  // Animate the button
  if (btn) {
    btn.classList.add('ringing');
    btn.textContent = '🔔';
  }

  showDingDongToast('🔔 DingDong! Chiming...', 2200);

  // ── STEP 3: play_media — synthesise DingDong chime ──────────────────
  let audioCtx = null;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    synthesiseDingDong(audioCtx, audioCtx.currentTime);
  } catch (err) {
    console.warn('DingDong synthesis error:', err);
  }

  // ── STEP 4: delay 00:00:02 ────────────────────────────────────────────
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ── STEP 5: interrupt_resume — restore volume & resume playback ───────
  if (audioEl) audioEl.volume = savedVolume;
  if (wasPlaying && audioEl) {
    try {
      await audioEl.play();
    } catch (e) {
      console.warn('DingDong resume error:', e);
    }
  }

  // Clean up Web Audio context
  if (audioCtx) {
    setTimeout(() => audioCtx.close(), 500);
  }

  // Restore button
  if (btn) {
    btn.classList.remove('ringing');
    btn.textContent = '🔔';
  }

  showDingDongToast(
    wasPlaying ? '▶ Playback resumed' : '🔔 DingDong complete!',
    2000
  );
};
