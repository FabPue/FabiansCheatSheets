/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '2.0',
    codename: 'Gamification Update',
    date: 'Juli 2026',
    intro: 'Das erste große Update ist da! Aus der Referenz-Sammlung wird ein interaktives Erlebnis:',
    features: [
      {
        icon: '👤',
        title: 'Accounts',
        text: 'Registriere dich mit Benutzername & Passwort — komplett lokal, ohne E-Mail und ohne Server.'
      },
      {
        icon: '🎯',
        title: 'Daily Challenges',
        text: 'Tägliche Aufgaben in Easy/Medium/Hard — Multiple-Choice, Code-Vervollständigung und Freitext.'
      },
      {
        icon: '🔥',
        title: 'Streak, XP & Level',
        text: 'Löse jeden Tag mindestens eine Aufgabe, halte deine Streak am Leben, sammle XP und steige im Level auf.'
      },
      {
        icon: '🎁',
        title: 'Täglicher Login-Bonus',
        text: 'Hol dir jeden Tag Coins ab — mit Streak-Bonus. Reset um Mitternacht.'
      },
      {
        icon: '🛍️',
        title: 'Theme Shop',
        text: 'Gib deine verdienten Coins aus und schalte neue Farb-Themes für die Seite frei.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
