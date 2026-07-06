/*
 * changelog.js — "What's New" data.
 *
 * Bump CURRENT_VERSION whenever you want the popup to show again for everyone.
 * The popup appears once per browser (tracked via localStorage: fcs_seen_version).
 */
(function (global) {
  'use strict';

  const CHANGELOG = {
    version: '3.0',
    codename: 'Major Update',
    date: 'Juli 2026',
    intro: 'Das größte Update bisher — Marktplatz, Collections, Bestenliste, neue Sprachen, Effekte und mehr:',
    features: [
      {
        icon: '💰',
        title: 'Marktplatz',
        text: 'Verkaufe Items aus deinem Inventar für Coins — der Wert steigt mit Seltenheit und besserem Float.'
      },
      {
        icon: '🏆',
        title: 'Collections',
        text: 'Sammle bestimmte Sprachen-Sets (manche in speziellen Floats) und kassiere einmalige Belohnungen.'
      },
      {
        icon: '🏅',
        title: 'Float-Bestenliste',
        text: 'Deine besten (niedrigsten) Floats im Ranking — wer hat den makellosesten Drop?'
      },
      {
        icon: '🧬',
        title: 'Mehr Sprachen',
        text: 'Neue Case-Items inkl. F#, Fortran, C, C++, Java, Natural, BASIC, Fortress und Scratch als Gold.'
      },
      {
        icon: '🔥',
        title: 'Float-Effekte',
        text: 'Guter Float glänzt und funkelt, schlechter zeigt Kratzer — und bei extrem schlechtem Float lodern Flammen.'
      },
      {
        icon: '🌌',
        title: 'Animierte Themes',
        text: 'Aurora mit funkelnden Sternen und Deep Ocean mit sanften Wellen — jetzt in Bewegung.'
      },
      {
        icon: '🔍',
        title: 'Cheatsheet-Suche',
        text: 'In jedem Cheat Sheet gibt es jetzt eine Suchleiste (Taste „/") zum sofortigen Filtern der Karten.'
      },
      {
        icon: '🎯',
        title: 'Mehr Daily Quests & Case-Counter',
        text: 'Zusätzliche tägliche Aufgaben und ein Zähler für geöffnete Cases.'
      }
    ]
  };

  global.FCSChangelog = CHANGELOG;
})(window);
