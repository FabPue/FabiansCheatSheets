/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '2.1',
    codename: 'Gambling Update',
    date: 'Juli 2026',
    intro: 'Zeit für etwas Nervenkitzel! Setze dein Gold ein und sammle seltene Sprach-Items:',
    features: [
      {
        icon: '📦',
        title: 'Cases öffnen',
        text: 'Öffne für 25 Gold eine Case mit CS-artiger Reel-Animation und gewinne Programmiersprachen-Items.'
      },
      {
        icon: '💎',
        title: 'Raritäten & Abnutzung',
        text: 'Items gibt es in Grau, Blau, Episch, Rot und dem sagenhaften Gold — jeweils mit Wear von Fabrikneu bis Kampfspuren.'
      },
      {
        icon: '🎒',
        title: 'Inventar',
        text: 'Alle gewonnenen Icons landen in deinem Inventar — mit Rarität, Abnutzung und Float-Wert, filterbar nach Seltenheit.'
      },
      {
        icon: '🏅',
        title: 'Errungenschaften',
        text: 'Schalte Erfolge frei und kassiere XP & Gold — von der ersten Streak bis zum Case CEO.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
