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
      achievements: []
    };
  }

  function profileKey(username) {
    return KEYS.profilePrefix + username.toLowerCase();
  }

  function getProfile(username) {
    if (!username) return null;
    const p = readJSON(profileKey(username), null);
    if (!p) return null;
    // Merge with defaults so older profiles gain new fields.
    return Object.assign(defaultProfile(), p);
  }

  function saveProfile(username, profile) {
    if (!username) return;
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
