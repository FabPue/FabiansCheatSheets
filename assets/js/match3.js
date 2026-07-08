/*
 * match3.js — "Code Match", a match-3 puzzle where the gems are programming
 * languages. Swap adjacent gems to line up three or more of the same language;
 * matches clear, gems fall and refill, cascades score more. 30 levels with
 * score or clear-a-language goals under a move limit. Self-contained, no libs.
 */
(function (global) {
  'use strict';

  const SIZE = 8;

  // The "colours" are languages.
  const TYPES = [
    { id: 0, name: 'JavaScript', label: 'JS',  color: '#f7d363' },
    { id: 1, name: 'Python',     label: 'Py',  color: '#63b3f7' },
    { id: 2, name: 'C++',        label: 'C++', color: '#9d63f7' },
    { id: 3, name: 'Ruby',       label: 'Rb',  color: '#f4324c' },
    { id: 4, name: 'Go',         label: 'Go',  color: '#22d3ee' },
    { id: 5, name: 'Rust',       label: 'Rs',  color: '#f7a063' }
  ];

  // 30 levels: mostly score goals, every 5th is "clear N of a language".
  const LEVELS = (function () {
    const list = [];
    for (let i = 1; i <= 30; i++) {
      const boss = i % 10 === 0;
      if (i % 5 === 0) {
        list.push({
          idx: i, kind: 'type', typeIdx: (i / 5 - 1) % TYPES.length,
          target: 12 + i, moves: 24 + (boss ? 6 : 0),
          reward: { coins: 45 + i * 12, xp: 32 + i * 9 }
        });
      } else {
        list.push({
          idx: i, kind: 'score', target: 700 + i * 260, moves: 24,
          reward: { coins: 45 + i * 12, xp: 32 + i * 9 }
        });
      }
    }
    return list;
  })();

  function rndType() { return (Math.random() * TYPES.length) | 0; }
  function clone(g) { return g.map(row => row.slice()); }

  function newGame(level) {
    // Fill the board avoiding any initial 3-in-a-row.
    const grid = [];
    for (let r = 0; r < SIZE; r++) {
      grid[r] = [];
      for (let c = 0; c < SIZE; c++) {
        let t;
        do { t = rndType(); }
        while ((c >= 2 && grid[r][c - 1] === t && grid[r][c - 2] === t) ||
               (r >= 2 && grid[r - 1][c] === t && grid[r - 2][c] === t));
        grid[r][c] = t;
      }
    }

    let score = 0, movesLeft = level.moves, typeCleared = 0, status = 'playing';

    function adjacent(a, b) { return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1; }

    function findMatches(g) {
      const mask = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
      for (let r = 0; r < SIZE; r++) {
        let run = 1;
        for (let c = 1; c <= SIZE; c++) {
          if (c < SIZE && g[r][c] === g[r][c - 1]) run++;
          else { if (run >= 3) for (let k = c - run; k < c; k++) mask[r][k] = true; run = 1; }
        }
      }
      for (let c = 0; c < SIZE; c++) {
        let run = 1;
        for (let r = 1; r <= SIZE; r++) {
          if (r < SIZE && g[r][c] === g[r - 1][c]) run++;
          else { if (run >= 3) for (let k = r - run; k < r; k++) mask[k][c] = true; run = 1; }
        }
      }
      return mask;
    }
    function anyTrue(m) { return m.some(row => row.some(Boolean)); }
    function countTrue(m) { let n = 0; m.forEach(row => row.forEach(v => { if (v) n++; })); return n; }

    // Clears masked cells, drops survivors, refills from the top.
    function collapse(g, mask) {
      if (level.kind === 'type') {
        for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++)
          if (mask[r][c] && g[r][c] === level.typeIdx) typeCleared++;
      }
      for (let c = 0; c < SIZE; c++) {
        const survivors = [];
        for (let r = SIZE - 1; r >= 0; r--) if (!mask[r][c]) survivors.push(g[r][c]);
        for (let r = SIZE - 1, i = 0; r >= 0; r--, i++) {
          g[r][c] = i < survivors.length ? survivors[i] : rndType();
        }
      }
    }

    // Attempts to swap two adjacent cells. Returns { ok, steps, ... }.
    function trySwap(a, b) {
      if (status !== 'playing') return { ok: false, reason: 'over' };
      if (!adjacent(a, b)) return { ok: false, reason: 'not-adjacent' };
      const tmp = grid[a.r][a.c]; grid[a.r][a.c] = grid[b.r][b.c]; grid[b.r][b.c] = tmp;
      if (!anyTrue(findMatches(grid))) {
        const t2 = grid[a.r][a.c]; grid[a.r][a.c] = grid[b.r][b.c]; grid[b.r][b.c] = t2;
        return { ok: false, reason: 'no-match' };
      }
      movesLeft--;
      const steps = [];
      let chain = 0;
      while (true) {
        const mask = findMatches(grid);
        if (!anyTrue(mask)) break;
        chain++;
        const gain = countTrue(mask) * 10 * chain;
        score += gain;
        steps.push({ grid: clone(grid), mask: mask.map(row => row.slice()), gain, chain });
        collapse(grid, mask);
      }
      const goalMet = level.kind === 'score' ? score >= level.target : typeCleared >= level.target;
      if (goalMet) status = 'won';
      else if (movesLeft <= 0) status = 'lost';
      return { ok: true, steps: steps, finalGrid: clone(grid), score, movesLeft, typeCleared, status };
    }

    return {
      SIZE: SIZE, level: level,
      getGrid: () => clone(grid),
      getState: () => ({
        score, movesLeft, typeCleared, status,
        target: level.target, kind: level.kind, typeIdx: level.typeIdx
      }),
      trySwap: trySwap
    };
  }

  global.FCSMatch3 = { SIZE, TYPES, LEVELS, newGame };
})(window);
