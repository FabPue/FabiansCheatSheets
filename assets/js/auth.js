/*
 * auth.js — client-side registration / login / logout.
 * Depends on: FCSStore.
 *
 * SECURITY NOTE: purely local. Passwords are salted + SHA-256 hashed before
 * storage, but there is no server and no real security guarantee.
 */
(function (global) {
  'use strict';

  const Store = global.FCSStore;

  const MIN_USERNAME = 3;
  const MAX_USERNAME = 20;
  const MIN_PASSWORD = 4;
  const USERNAME_RE = /^[A-Za-z0-9_]+$/;

  function validateUsername(username) {
    if (!username || username.length < MIN_USERNAME) return `Benutzername braucht mind. ${MIN_USERNAME} Zeichen.`;
    if (username.length > MAX_USERNAME) return `Benutzername max. ${MAX_USERNAME} Zeichen.`;
    if (!USERNAME_RE.test(username)) return 'Nur Buchstaben, Zahlen und _ erlaubt.';
    return null;
  }

  function validatePassword(password) {
    if (!password || password.length < MIN_PASSWORD) return `Passwort braucht mind. ${MIN_PASSWORD} Zeichen.`;
    return null;
  }

  // Returns { ok, error }.
  async function register(username, password) {
    username = (username || '').trim();
    const uErr = validateUsername(username);
    if (uErr) return { ok: false, error: uErr };
    const pErr = validatePassword(password);
    if (pErr) return { ok: false, error: pErr };
    if (Store.userExists(username)) return { ok: false, error: 'Benutzername ist bereits vergeben.' };

    const salt = Store.randomSalt();
    const hash = await Store.hashPassword(password, salt);
    const users = Store.getUsers();
    users[username.toLowerCase()] = {
      username: username,
      salt: salt,
      hash: hash,
      createdAt: Store.todayKey()
    };
    Store.saveUsers(users);
    Store.saveProfile(username, Store.defaultProfile());
    Store.setSession(username);
    return { ok: true };
  }

  // Returns { ok, error }.
  async function login(username, password) {
    username = (username || '').trim();
    const users = Store.getUsers();
    const record = users[username.toLowerCase()];
    if (!record) return { ok: false, error: 'Benutzer nicht gefunden.' };
    const hash = await Store.hashPassword(password, record.salt);
    if (hash !== record.hash) return { ok: false, error: 'Falsches Passwort.' };
    if (!Store.getProfile(record.username)) {
      Store.saveProfile(record.username, Store.defaultProfile());
    }
    Store.setSession(record.username);
    return { ok: true };
  }

  function logout() {
    Store.setSession(null);
  }

  function currentUser() {
    return Store.getSession();
  }

  global.FCSAuth = {
    validateUsername, validatePassword,
    register, login, logout, currentUser
  };
})(window);
