/*
 * sounds.js — synthesized CS-style unboxing sounds via the Web Audio API.
 *
 * No external audio files: every sound is generated on the fly, so it works
 * offline and carries no third-party audio assets. Exposes FCSSounds with:
 *   resume()          — unlock/resume the AudioContext (call on a user gesture)
 *   tick()            — short scroll "click" as reel items pass the marker
 *   reveal(rarityId)  — drop reveal chime, brighter for rarer drops
 *   gold()            — legendary fanfare
 *   setMuted(bool) / isMuted()
 */
(function (global) {
  'use strict';

  const MUTE_KEY = 'fcs_sound_muted';
  let ctx = null;
  let master = null;
  let muted = false;
  let lastTick = 0;

  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    return ctx;
  }

  // Must be called from within a user gesture (e.g. button click) so browsers
  // allow audio to start.
  function resume() {
    const c = ensureCtx();
    if (c && c.state === 'suspended') c.resume();
  }

  // A short percussive click — the iconic reel "tick".
  function tick() {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime;
    // Throttle so a fast reel start can't machine-gun the audio graph.
    if (now - lastTick < 0.012) return;
    lastTick = now;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    // Slight pitch jitter keeps repeated ticks from sounding mechanical.
    osc.frequency.value = 1250 + (Math.random() * 300 - 150);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Play a single note (used to build reveal chimes / fanfares).
  function note(freq, start, dur, peak, type) {
    const c = ctx;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  // Rarity → chord of frequencies (Hz). Rarer drops get brighter, richer chords.
  const REVEAL_CHORDS = {
    grey: [440, 554.37],
    blue: [523.25, 659.25, 783.99],
    epic: [587.33, 739.99, 880, 1174.66],
    red:  [659.25, 830.61, 987.77, 1318.51],
    gold: [523.25, 659.25, 783.99, 1046.5, 1318.51]
  };

  function reveal(rarityId) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + 0.02;
    const chord = REVEAL_CHORDS[rarityId] || REVEAL_CHORDS.grey;
    chord.forEach((f, i) => note(f, now + i * 0.045, 0.6, 0.16, 'triangle'));
  }

  // Ascending fanfare for a legendary (gold) drop.
  function gold() {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + 0.02;
    const seq = [523.25, 659.25, 783.99, 1046.5];
    seq.forEach((f, i) => {
      note(f, now + i * 0.11, 0.5, 0.2, 'sawtooth');
      note(f * 2, now + i * 0.11, 0.4, 0.08, 'triangle');
    });
    // Sustained shimmering top note to cap it off.
    note(1567.98, now + seq.length * 0.11, 1.2, 0.14, 'triangle');
  }

  function setMuted(m) {
    muted = !!m;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
  }
  function isMuted() { return muted; }

  global.FCSSounds = { resume, tick, reveal, gold, setMuted, isMuted };
})(window);
