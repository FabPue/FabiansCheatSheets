/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '2.2',
    codename: 'Sound Update',
    date: 'Juli 2026',
    intro: 'Jetzt mit Ton! Das Case-Öffnen klingt endlich so, wie es sich anfühlt:',
    features: [
      {
        icon: '🔊',
        title: 'Case-Sounds',
        text: 'Beim Öffnen tickt das Reel im CS-Stil — schnell am Anfang, langsamer werdend, bis es unter dem Marker landet.'
      },
      {
        icon: '🎉',
        title: 'Reveal-Chimes',
        text: 'Jeder Drop bekommt einen eigenen Klang, der mit der Seltenheit heller und voller wird — inklusive Gold-Fanfare.'
      },
      {
        icon: '🔇',
        title: 'Sound-Schalter',
        text: 'Zu laut? Der 🔊-Button im Case-Fenster schaltet den Ton jederzeit an oder aus — die Wahl wird gemerkt.'
      },
      {
        icon: '📦',
        title: 'Cases öffnen',
        text: 'Öffne für 25 Gold eine Case mit CS-artiger Reel-Animation und gewinne Programmiersprachen-Items.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
