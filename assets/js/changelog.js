/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '4.2',
    codename: 'Slots & BugShop',
    date: 'Juli 2026',
    intro: 'Bug Slots, zwei neue Währungen und ein Kosmetik-Shop für Hintergrund-Effekte:',
    features: [
      {
        icon: '🎰',
        title: 'Bug Slots',
        text: 'Neuer Slot mit Sprach-Symbolen, einstellbarem Einsatz und schönen Animationen. Setze Bug Taler, gewinne BugCoins.'
      },
      {
        icon: '🎟️',
        title: 'Bug Taler & BugCoins',
        text: 'Tausche Coins in Bug Taler (Einsatz) und gewinne BugCoins — die Währung für den neuen BugShop.'
      },
      {
        icon: '📉',
        title: 'Ehrliche Wahrscheinlichkeit',
        text: 'Die Auszahlungen entsprechen einem echten Slot (RTP ~91 %, Haus-Vorteil). Auf Dauer verlierst du — Gambeln lohnt sich nicht.'
      },
      {
        icon: '🎁',
        title: 'Freispiele & Bonus-Buy',
        text: 'Drei 🐞 lösen Freispiele aus — oder kaufe den Bonus direkt (viel Einsatz für mehr Chancen).'
      },
      {
        icon: '🛒',
        title: 'BugShop & Hintergrund-Effekte',
        text: 'Gib BugCoins für Kosmetik aus: lass deine gezogenen Sprach-Icons durch den Hintergrund fliegen, plus Sternenstaub, Blasen, Konfetti & Glühwürmchen.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
