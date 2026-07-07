/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '3.1',
    codename: 'Float & Polish',
    date: 'Juli 2026',
    intro: 'Alles dreht sich um den Float — mit aufgeräumtem Inventar, Sprüchen und fieseren Flammen:',
    features: [
      {
        icon: '🎒',
        title: 'Aufgeräumtes Inventar',
        text: 'Gleiche Sprachen sind jetzt gruppiert: nur der beste Float wird gezeigt — Klick auf die Karte klappt alle weiteren Floats auf.'
      },
      {
        icon: '🔤',
        title: 'Sortierung',
        text: 'Sortiere dein Inventar alphabetisch (A–Z) oder nach Seltenheit.'
      },
      {
        icon: '💠',
        title: 'Schimmer bei Top-Floats',
        text: 'Unter Float 0.05 wandert ein glitzernder Schimmer über das Item — mal hier, mal dort.'
      },
      {
        icon: '💬',
        title: 'Float-Sprüche',
        text: 'Besondere Floats bekommen eigene Sprüche als Popup — von „Absolute Spitzenklasse!" bis „Geh bitte nicht gambeln".'
      },
      {
        icon: '🏅',
        title: 'Float-Achievements',
        text: 'Neue Erfolge für extrem gute (unter 0.0001) und extrem schlechte (über 0.9999) Floats.'
      },
      {
        icon: '🔥',
        title: 'Fiesere Flammen',
        text: 'Der Flammen-Effekt bei extrem schlechtem Float ist jetzt richtig grässlich — verkohlt, rauchend, mit Glut.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
