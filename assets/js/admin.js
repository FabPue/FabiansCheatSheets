/*
 * admin.js — hidden developer gold code.
 * Depends on: FCSStore, FCSAuth.
 *
 * A secret key combo (Ctrl+Shift+G) opens a code entry. Entering the correct
 * code grants gold to the currently logged-in account.
 *
 * NOTE: This is client-side only and therefore NOT truly secret — the code
 * lives in this file and could be found by anyone inspecting the source. It
 * only keeps casual users out. (Intentionally omitted from the changelog.)
 */
(function (global) {
  'use strict';

  const Store = global.FCSStore;
  const Auth = global.FCSAuth;

  const ADMIN_CODE = 'fabian-cheats-gold';
  const DEFAULT_AMOUNT = 10000;

  function verify(code) {
    return String(code).trim() === ADMIN_CODE;
  }

  // Grants gold to the current user. Returns { ok, reason, coins }.
  function grant(amount) {
    const user = Auth.currentUser();
    if (!user) return { ok: false, reason: 'not-logged-in' };
    const profile = Store.getProfile(user);
    if (!profile) return { ok: false, reason: 'no-profile' };
    const amt = Math.max(0, Math.floor(Number(amount) || 0));
    profile.coins += amt;
    Store.saveProfile(user, profile);
    return { ok: true, coins: profile.coins, added: amt };
  }

  function registerHotkey() {
    document.addEventListener('keydown', e => {
      // Ctrl + Shift + G
      if (e.ctrlKey && e.shiftKey && (e.key === 'G' || e.key === 'g')) {
        e.preventDefault();
        if (global.FCSApp && typeof global.FCSApp.openAdmin === 'function') {
          global.FCSApp.openAdmin();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerHotkey);
  } else {
    registerHotkey();
  }

  global.FCSAdmin = { verify, grant, DEFAULT_AMOUNT };
})(window);
