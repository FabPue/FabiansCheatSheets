/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '4.4',
    codename: 'Multiplier',
    date: 'Juli 2026',
    intro: 'Gewinnserien mit steigendem Multiplikator und eine Mega-Chance in den Freispielen.',
    features: [
      {
        icon: '⚡',
        title: 'Gewinn-Multiplikator',
        text: 'Ein Badge am Grid zeigt deinen Multiplikator. Der erste Gewinn zählt normal, dann steigt es bei jedem Folgegewinn: ×2 → ×4 → ×8 → ×16 … Eine Niederlage setzt die Serie zurück.'
      },
      {
        icon: '🎨',
        title: 'Eskalierende Optik & Sounds',
        text: 'Je höher der Multiplikator, desto krasser: Farbe, Glühen und Sound des Badges steigern sich mit jeder Stufe.'
      },
      {
        icon: '🔥',
        title: 'Mega-Freispiele',
        text: 'In den Freispielen kann jeder Gewinn einen Zufalls-Bonus bekommen — meistens klein, aber manchmal richtig krass (bis ×50).'
      },
      {
        icon: '📉',
        title: 'Immer noch ehrlich',
        text: 'Trotz Multiplikatoren per Monte-Carlo (8 Mio. Spins) wieder auf RTP ~90 % getunt. Einzelgewinne zahlen weniger, die Serien machen den Reiz — auf Dauer verlierst du trotzdem.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
