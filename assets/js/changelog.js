/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '4.5',
    codename: 'Hot Streak',
    date: 'Juli 2026',
    intro: 'Der Multiplikator hält jetzt in den Freispielen — plus eine „heiße" Gewinnchance nach jedem Gewinn.',
    features: [
      {
        icon: '🔥',
        title: 'Multiplikator in Freispielen',
        text: 'In den Freispielen fällt der Multiplikator NICHT mehr weg: Er steigt ×2 → ×4 → ×8 und hält die ganze Session, auch nach einem Fehlgriff.'
      },
      {
        icon: '🍀',
        title: 'Heiße Serie',
        text: 'Nach einem Gewinn ist der nächste Dreh „heiß" — die Chance auf einen weiteren Gewinn ist spürbar erhöht.'
      },
      {
        icon: '⚡',
        title: 'Basis-Multiplikator wie gehabt',
        text: 'Im normalen Spiel steigert sich der Multiplikator weiter bei Folgegewinnen und wird nur durch eine Niederlage zurückgesetzt.'
      },
      {
        icon: '📉',
        title: 'Immer noch ehrlich',
        text: 'Alles neu per Monte-Carlo (16 Mio. Spins) auf RTP ~90 % getunt. Mehr Nervenkitzel, gleicher Haus-Vorteil — auf Dauer verlierst du trotzdem.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
