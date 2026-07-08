/*
 * store.js — localStorage persistence, password hashing and profile model.
 *
 * NOTE: This is a purely client-side "account" system. Data lives only in the
 * current browser. Password hashing (SHA-256 + salt) protects casually against
 * plaintext storage but is NOT real authentication — there is no server.
 */
(function (global) {
  'use strict';

  const KEYS = {
    users: 'fcs_users',
    session: 'fcs_session',
    profilePrefix: 'fcs_profile_'
  };

  /* ── low-level JSON storage ── */
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ── date utilities (local time) ── */
  // Injectable clock so date-reset behaviour can be tested manually.
  let _now = () => new Date();
  function setClock(fn) { _now = fn; }
  function now() { return _now(); }

  function dateKey(d) {
    const x = d || now();
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function todayKey() { return dateKey(now()); }

  function yesterdayKey() {
    const d = new Date(now().getTime());
    d.setDate(d.getDate() - 1);
    return dateKey(d);
  }

  // Deterministic integer seed derived from a date key (for daily selection).
  function daySeed(key) {
    const k = key || todayKey();
    let h = 2166136261;
    for (let i = 0; i < k.length; i++) {
      h ^= k.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /* ── crypto: SHA-256(salt + password) ── */
  function randomSalt() {
    const bytes = new Uint8Array(16);
    (global.crypto || global.msCrypto).getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  async function hashPassword(password, salt) {
    const enc = new TextEncoder();
    const data = enc.encode(salt + ':' + password);
    const digest = await (global.crypto.subtle).digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ── users ── */
  function getUsers() { return readJSON(KEYS.users, {}); }
  function saveUsers(users) { writeJSON(KEYS.users, users); }
  function userExists(username) {
    return Object.prototype.hasOwnProperty.call(getUsers(), username.toLowerCase());
  }

  /* ── session ── */
  function getSession() {
    try { return localStorage.getItem(KEYS.session) || null; }
    catch (e) { return null; }
  }
  function setSession(username) {
    if (username) localStorage.setItem(KEYS.session, username);
    else localStorage.removeItem(KEYS.session);
  }

  /* ── profile ── */
  function defaultProfile() {
    return {
      coins: 0,
      xp: 0,
      level: 1,
      streak: 0,
      lastStreakDate: null,
      lastRewardDate: null,
      solvedToday: { date: null, ids: [] },
      solvedTotal: 0,
      ownedThemes: ['default'],
      activeTheme: 'default',
      inventory: [],
      casesOpened: 0,
      achievements: [],
      tdProgress: 0,
      cmProgress: 0
    };
  }

  function profileKey(username) {
    return KEYS.profilePrefix + username.toLowerCase();
  }

  /* ── tamper protection ──
   * Profiles are signed with a synchronous checksum over the economy-relevant
   * fields. Editing e.g. `coins` directly in localStorage invalidates the
   * signature, which is detected on load. NOTE: the secret lives in this file
   * and is therefore discoverable — this deters casual cookie/localStorage
   * editing but is NOT real security (that would require a server).
   */
  const SIG_SECRET = 'fcs-integrity-7Kq2$whileTrue::do-not-touch-v21';

  function fnv1aHex(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    // second pass with a rotation for a bit more spread
    let h2 = 0x811c9dc5 >>> 0;
    for (let i = str.length - 1; i >= 0; i--) {
      h2 ^= str.charCodeAt(i);
      h2 = Math.imul(h2, 16777619) >>> 0;
    }
    return (h >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  }

  function economySnapshot(p) {
    return [
      p.coins | 0,
      p.xp | 0,
      p.level | 0,
      p.casesOpened | 0,
      p.solvedTotal | 0,
      (p.inventory || []).length,
      (p.achievements || []).length
    ].join('|');
  }

  function signProfile(p) {
    return fnv1aHex(SIG_SECRET + '::' + economySnapshot(p));
  }

  function getProfile(username) {
    if (!username) return null;
    const raw = readJSON(profileKey(username), null);
    if (!raw) return null;
    // Merge with defaults so older profiles gain new fields.
    const p = Object.assign(defaultProfile(), raw);
    const expected = signProfile(p);

    if (p._sig === expected) {
      // valid, untouched
      return p;
    }

    const wasSignedBefore = (p.coinResetDone === true) || (typeof p._sig === 'string' && p._sig.length > 0);
    if (wasSignedBefore) {
      // Signature present/expected but does not match -> tampering. Wipe coins.
      p.coins = 0;
      p._tampered = true;
    }
    // Legacy profile (never signed): accept balance as-is; the one-time
    // case-open reset will neutralise any pre-update cheated balances.
    p._sig = signProfile(p);
    writeJSON(profileKey(username), p);
    return p;
  }

  function saveProfile(username, profile) {
    if (!username) return;
    profile._sig = signProfile(profile);
    writeJSON(profileKey(username), profile);
  }

  global.FCSStore = {
    KEYS,
    readJSON, writeJSON,
    setClock, now, dateKey, todayKey, yesterdayKey, daySeed,
    randomSalt, hashPassword,
    getUsers, saveUsers, userExists,
    getSession, setSession,
    defaultProfile, getProfile, saveProfile
  };
})(window);
