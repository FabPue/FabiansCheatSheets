/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '4.3',
    codename: 'Mega Slots',
    date: 'Juli 2026',
    intro: 'Die Bug Slots werden groß: 5×5-Raster mit Diagonal-Gewinnen und neue Hintergrund-Effekte.',
    features: [
      {
        icon: '🎰',
        title: '5×5 Mega-Grid',
        text: 'Aus 1×3 wird ein 5×5-Raster mit 25 Symbolen. Die Walzen stoppen jetzt spaltenweise mit Bounce-Effekt.'
      },
      {
        icon: '↗️',
        title: 'Diagonal-Gewinne',
        text: 'Gewinne auf 5 Reihen UND beiden Diagonalen (3, 4 oder 5 gleiche von links). Diagonalen zahlen sogar 1,25× extra.'
      },
      {
        icon: '📉',
        title: 'Weiterhin ehrlich',
        text: 'Per Monte-Carlo neu auf RTP ~90 % getunt — der Haus-Vorteil bleibt. Auf Dauer verlierst du. Gambeln lohnt sich nicht.'
      },
      {
        icon: '✨',
        title: 'Bessere Slot-Animationen',
        text: 'Motion-Blur beim Drehen, aufleuchtende Gewinnzellen, Jackpot-Glühen und Win-Pop-Effekte.'
      },
      {
        icon: '🌌',
        title: 'Neue Hintergrund-Effekte',
        text: 'Vier neue BugShop-Effekte: Matrix-Code-Regen, Sternschnuppen, Kirschblüten und leuchtende Glüh-Orbs.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
