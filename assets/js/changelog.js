/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '4.1',
    codename: 'Games & Gems',
    date: 'Juli 2026',
    intro: 'Ein neuer Spielmodus, dreifaches Case-Öffnen und ein rundum aufgewerteter Tower Defense:',
    features: [
      {
        icon: '🍬',
        title: 'Code Match (neu)',
        text: 'Ganz neuer Match-3-Modus: Sprachen sind die Gems — reihe 3+ gleiche an, löse Ketten aus, meistere 30 Level.'
      },
      {
        icon: '📦',
        title: '3× öffnen',
        text: 'Neuer Button: öffne für 100 Coins drei Cases gleichzeitig — mit drei Reel-Reihen und drei Drops auf einmal.'
      },
      {
        icon: '🎨',
        title: 'Türme mit Sprach-Look',
        text: 'TD-Türme zeigen jetzt das echte Sprach-Logo mit Float-Effekt: gute Floats schimmern, schlechte brennen.'
      },
      {
        icon: '⚔️',
        title: 'Einzigartige Angriffe',
        text: 'Jeder Turm-Typ feuert anders: Tracer, Diamant, Pfeil, Splash-Bombe, Kanonenkugel, Frost-Splitter, Lane-Welle.'
      },
      {
        icon: '🔥',
        title: 'Schwerer & mehr Erfolge',
        text: 'Tower Defense ist fordernder (mehr Gegner-HP & -Anzahl), und es gibt neue Achievements für TD und Code Match.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
