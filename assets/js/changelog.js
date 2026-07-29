/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '5.0',
    codename: 'Redesign',
    date: 'Juli 2026',
    intro: 'Großes Redesign: weg von den klobigen Würfel-Kacheln — hin zu Editor-Fenstern, Bento-Karten und plastischen Spiel-Symbolen.',
    features: [
      {
        icon: '🪟',
        title: 'Sprachen als Editor-Fenster',
        text: 'Jede Cheat-Sheet-Karte sieht jetzt aus wie ein Code-Editor: Titelleiste mit Ampel-Punkten und Dateiname (Program.cs, main.py …). Passt perfekt zu einem Entwickler-Tool.'
      },
      {
        icon: '🧩',
        title: 'Bento-Karten für Features',
        text: 'Slots, Cases, BugShop & Co. liegen jetzt in einem Bento-Raster mit Glas-Optik, Farb-Glow und größerer Hero-Kachel — mehr Rhythmus, weniger „alles gleich laut".'
      },
      {
        icon: '💎',
        title: 'Plastische Spiel-Symbole',
        text: 'Die quadratischen Zellen in Slots, Cases und Inventar sind jetzt gefüllt und plastisch (weiche Radien, Licht + Schatten) statt flach umrandet.'
      },
      {
        icon: '🎨',
        title: 'Frische Farben & Typo',
        text: 'Verfeinerte Farb-Tokens, deutlich lesbarerer Sekundärtext und rundere Formen im ganzen Interface.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
