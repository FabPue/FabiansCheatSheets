/*
 * td-data.js — Tower Defense configuration.
 *
 * Lane-defense (Plants-vs-Zombies-like): "bug" enemies march left along 5
 * lanes; the player places programming-language defenders that attack with a
 * style reflecting the language's trait. Higher rarity and better float mean
 * more health and damage (see td.js: statFor()).
 */
(function (global) {
  'use strict';

  const GRID = { rows: 5, cols: 9 };

  // Rarity → combat multiplier and placement cost (in "Bytes", the in-game currency).
  const RARITY_MULT = { grey: 1.0, blue: 1.5, epic: 2.2, red: 3.0, gold: 4.2 };
  const RARITY_COST = { grey: 50, blue: 75, epic: 125, red: 200, gold: 300 };

  // Attack archetypes. Each defender uses one; the numbers are the BASE before
  // rarity/float scaling. fireRate = shots per second; range in columns.
  //   kind: 'shoot'  fires projectiles down the lane
  //         'aoe'    hits every enemy in the lane each tick
  //         'slow'   fires slowing projectiles (little damage)
  //         'wall'   no attack, just soaks damage (very high hp)
  const ARCHETYPES = {
    rapid:  { kind: 'shoot', label: 'Schnellfeuer',   damage: 8,  fireRate: 3.4, projSpeed: 340, hp: 90,  pierce: false, splash: 0,  color: '#f7d363' },
    typed:  { kind: 'shoot', label: 'Typsicher',      damage: 12, fireRate: 2.6, projSpeed: 360, hp: 120, pierce: false, splash: 0,  color: '#3b82f6' },
    balanced:{kind: 'shoot', label: 'Vielseitig',     damage: 16, fireRate: 1.9, projSpeed: 300, hp: 130, pierce: false, splash: 0,  color: '#63b3f7' },
    pierce: { kind: 'shoot', label: 'Zeiger-Piercing',damage: 21, fireRate: 1.6, projSpeed: 460, hp: 110, pierce: true,  splash: 0,  color: '#f7a063' },
    splash: { kind: 'shoot', label: 'Splash',         damage: 18, fireRate: 1.4, projSpeed: 300, hp: 140, pierce: false, splash: 46, color: '#9d63f7' },
    heavy:  { kind: 'shoot', label: 'Schwer & sicher',damage: 34, fireRate: 1.1, projSpeed: 320, hp: 220, pierce: true,  splash: 0,  color: '#f4324c' },
    slow:   { kind: 'slow',  label: 'JOIN-Lock',      damage: 5,  fireRate: 1.5, projSpeed: 300, hp: 120, pierce: false, splash: 0,  color: '#f29111', slowFactor: 0.5, slowTime: 2.2 },
    wall:   { kind: 'wall',  label: 'Struktur (Tank)',damage: 0,  fireRate: 0,   projSpeed: 0,   hp: 460, pierce: false, splash: 0,  color: '#9aa4b2' },
    aoe:    { kind: 'aoe',   label: 'Funktional-AoE', damage: 13, fireRate: 1.2, projSpeed: 0,   hp: 150, pierce: false, splash: 0,  color: '#ffb700' }
  };

  // Language name → archetype id. Names match cases-data.js item names.
  const LANG_ARCH = {
    'JavaScript': 'rapid', 'TypeScript': 'typed', 'Node.js': 'rapid',
    'Python': 'balanced', 'Ruby': 'balanced', 'PHP': 'balanced', 'Perl': 'rapid', 'Lua': 'rapid',
    'C': 'pierce', 'C++': 'splash', 'Rust': 'heavy', 'Go': 'splash',
    'Java': 'balanced', 'C#': 'typed', 'Kotlin': 'heavy', 'Swift': 'splash', 'Scala': 'splash', 'Dart': 'typed',
    'SQL': 'slow', 'MySQL': 'slow', 'SQLite': 'slow', 'R': 'slow', 'F#': 'slow',
    'HTML5': 'wall', 'CSS3': 'wall', 'Markdown': 'wall', 'Sass': 'wall',
    'Bash': 'rapid', 'Git': 'rapid',
    'Haskell': 'aoe', 'Elixir': 'aoe', 'Clojure': 'aoe', 'Fortran': 'aoe', 'Scratch': 'aoe',
    'Natural': 'balanced', 'B': 'rapid', 'BASIC': 'rapid', 'Fortress': 'balanced'
  };

  function archFor(name, rarity) {
    if (LANG_ARCH[name]) return LANG_ARCH[name];
    // Fallback by rarity for anything unmapped.
    return ({ grey: 'wall', blue: 'balanced', epic: 'typed', red: 'heavy', gold: 'aoe' })[rarity] || 'balanced';
  }

  // Enemy ("bug") base stats. hp/speed get scaled per level in td.js.
  const ENEMIES = {
    nullptr:  { name: 'Null Pointer',   hp: 48,  speed: 26, dps: 16, reward: 18, color: '#8a94a6', glyph: '∅' },
    segfault: { name: 'Segfault',       hp: 36,  speed: 40, dps: 13, reward: 16, color: '#f4324c', glyph: '✖' },
    leak:     { name: 'Memory Leak',    hp: 104, speed: 17, dps: 20, reward: 26, color: '#4b8bf5', glyph: '💧' },
    race:     { name: 'Race Condition', hp: 28,  speed: 56, dps: 11, reward: 20, color: '#a855f7', glyph: '⚡' },
    bloat:    { name: 'Bloatware',      hp: 210, speed: 13, dps: 24, reward: 40, color: '#f7a063', glyph: '🐘' }
  };

  const BOSSES = {
    monolith:   { name: 'Legacy Monolith', hp: 2600, speed: 11, dps: 60, reward: 300, color: '#5b21b6', glyph: '🏛️' },
    bluescreen: { name: 'Blue Screen',     hp: 4200, speed: 14, dps: 80, reward: 500, color: '#1d4ed8', glyph: '💀' }
  };

  // 20 levels: 1.1–1.9, 2.0 (BOSS), 2.1–2.9, 3.0 (BOSS).
  // Bosses land on the x.0 levels. Difficulty scales with the index.
  const LEVELS = (function build() {
    const list = [];
    const worlds = [1, 2, 3];
    // world 1: 1.1..1.9 ; world 2: 2.0(boss),2.1..2.9 ; world 3: 3.0(boss)
    const labels = [];
    for (let m = 1; m <= 9; m++) labels.push('1.' + m);
    labels.push('2.0');
    for (let m = 1; m <= 9; m++) labels.push('2.' + m);
    labels.push('3.0');
    labels.forEach((label, i) => {
      const isBoss = label.endsWith('.0');
      const idx = i + 1;
      list.push({
        idx: idx,
        label: label,
        isBoss: isBoss,
        boss: isBoss ? (label === '2.0' ? 'monolith' : 'bluescreen') : null,
        startBytes: 250 + Math.floor(idx * 6),
        byteRate: 26 + idx,               // bytes gained per second (passive)
        enemyHp: 1 + (idx - 1) * 0.16,    // hp scale multiplier for this level
        enemySpeed: 1 + (idx - 1) * 0.03, // speed scale multiplier
        count: 8 + idx * 2,               // number of enemies (non-boss)
        reward: { coins: 40 + idx * 10, xp: 30 + idx * 8 }
      });
    });
    return list;
  })();

  global.FCSTdData = {
    GRID, RARITY_MULT, RARITY_COST, ARCHETYPES, LANG_ARCH, archFor,
    ENEMIES, BOSSES, LEVELS
  };
})(window);
