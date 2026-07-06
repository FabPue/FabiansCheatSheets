/*
 * cases-data.js — case configuration: rarities, wear tiers and the item pool.
 *
 * Language logos are rendered via Devicon CSS classes: devicon-<slug>-plain.
 * Each item belongs to a rarity tier (like a CS:GO skin), the wear tier is
 * rolled per drop.
 */
(function (global) {
  'use strict';

  const CASE_COST = 25;

  // Ordered common -> legendary. Probabilities are CS:GO-like.
  const RARITIES = [
    { id: 'grey',   name: 'Grau',    color: '#9aa4b2', prob: 79.92 },
    { id: 'blue',   name: 'Blau',    color: '#4b8bf5', prob: 15.98 },
    { id: 'epic',   name: 'Episch',  color: '#a855f7', prob: 3.20 },
    { id: 'red',    name: 'Rot',     color: '#f4324c', prob: 0.64 },
    { id: 'gold',   name: 'Gold',    color: '#ffb700', prob: 0.26 }
  ];

  // Ordered best -> worst; float ranges follow CS:GO wear boundaries.
  const WEAR_TIERS = [
    { id: 'fn', name: 'Fabrikneu',                    short: 'FN', min: 0.00, max: 0.07 },
    { id: 'mw', name: 'Minimale Gebrauchsspuren',     short: 'MW', min: 0.07, max: 0.15 },
    { id: 'ft', name: 'Einsatzerprobt',               short: 'ET', min: 0.15, max: 0.38 },
    { id: 'ww', name: 'Abgenutzt',                    short: 'AG', min: 0.38, max: 0.45 },
    { id: 'bs', name: 'Kampfspuren',                  short: 'KS', min: 0.45, max: 1.00 }
  ];

  // slug = Devicon slug; name = display name; rarity = tier id.
  const ITEMS = [
    // grey — Common
    { slug: 'html5',    name: 'HTML5',      rarity: 'grey' },
    { slug: 'css3',     name: 'CSS3',       rarity: 'grey' },
    { slug: 'markdown', name: 'Markdown',   rarity: 'grey' },
    { slug: 'bash',     name: 'Bash',       rarity: 'grey' },
    { slug: 'git',      name: 'Git',        rarity: 'grey' },
    { slug: 'sass',     name: 'Sass',       rarity: 'grey' },
    { slug: 'lua',      name: 'Lua',        rarity: 'grey' },
    { slug: 'perl',     name: 'Perl',       rarity: 'grey' },

    // blue — Uncommon
    { slug: 'javascript', name: 'JavaScript', rarity: 'blue' },
    { slug: 'python',     name: 'Python',     rarity: 'blue' },
    { slug: 'mysql',      name: 'MySQL',      rarity: 'blue' },
    { slug: 'php',        name: 'PHP',        rarity: 'blue' },
    { slug: 'ruby',       name: 'Ruby',       rarity: 'blue' },
    { slug: 'r',          name: 'R',          rarity: 'blue' },
    { slug: 'sqlite',     name: 'SQLite',     rarity: 'blue' },

    // epic — Epic
    { slug: 'typescript', name: 'TypeScript', rarity: 'epic' },
    { slug: 'csharp',     name: 'C#',         rarity: 'epic' },
    { slug: 'java',       name: 'Java',       rarity: 'epic' },
    { slug: 'go',         name: 'Go',         rarity: 'epic' },
    { slug: 'cplusplus',  name: 'C++',        rarity: 'epic' },
    { slug: 'nodejs',     name: 'Node.js',    rarity: 'epic' },

    // red — Rare
    { slug: 'rust',   name: 'Rust',   rarity: 'red' },
    { slug: 'kotlin', name: 'Kotlin', rarity: 'red' },
    { slug: 'swift',  name: 'Swift',  rarity: 'red' },
    { slug: 'dart',   name: 'Dart',   rarity: 'red' },
    { slug: 'scala',  name: 'Scala',  rarity: 'red' },

    // gold — Legendary
    { slug: 'haskell',  name: 'Haskell',  rarity: 'gold' },
    { slug: 'elixir',   name: 'Elixir',   rarity: 'gold' },
    { slug: 'clojure',  name: 'Clojure',  rarity: 'gold' }
  ];

  global.FCSCasesData = { CASE_COST, RARITIES, WEAR_TIERS, ITEMS };
})(window);
