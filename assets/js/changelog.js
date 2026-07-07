/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '4.0',
    codename: 'Tower Defense',
    date: 'Juli 2026',
    intro: 'Das gigantische Update: verteidige mit deinen ergambelten Sprachen gegen Bugs — plus neue Premium-Themes!',
    features: [
      {
        icon: '🗼',
        title: 'Tower Defense',
        text: 'Ganz neuer Spielmodus im PvZ-Stil: platziere deine Sprachen als Türme und wehre Bug-Wellen über 5 Lanes ab.'
      },
      {
        icon: '⚔️',
        title: 'Sprach-Attacken',
        text: 'Jede Sprache kämpft nach ihrem Merkmal: C durchschlägt (Zeiger), C++ macht Splash, SQL verlangsamt (JOIN-Lock), Haskell trifft die ganze Lane, HTML ist ein Tank.'
      },
      {
        icon: '💪',
        title: 'Float & Rarität zählen',
        text: 'Höhere Seltenheit und besserer Float bedeuten mehr Leben und mehr Schaden für deinen Turm.'
      },
      {
        icon: '💀',
        title: '20 Level & Bosse',
        text: 'Kämpfe dich durch 1.1 bis 3.0 — mit fetten Boss-Gegnern (Legacy Monolith, Blue Screen) auf jeder x.0.'
      },
      {
        icon: '🌌',
        title: 'Premium-Themes',
        text: 'Vier neue animierte Themes: Neon Grid, Molten Core, Matrix und Galaxy — mehr Effekte, höherer Preis.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
