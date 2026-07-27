/*
 * slots-data.js — configuration for the language slot machine.
 *
 * A 3-reel, single-payline slot whose symbols are programming languages.
 * The reel weights + paytable are tuned to a realistic ~92% RTP (return to
 * player): the house always wins over time — the whole point is to show that
 * gambling doesn't pay. Bet in Bug Taler, win BugCoins.
 */
(function (global) {
  'use strict';

  // Global payout multiplier — tunes overall RTP without rebalancing each line.
  const PAYOUT_MULT = 1.42;

  // Each reel uses these symbols with the given weight. line = 3-of-a-kind
  // payout (× bet), half = left two match (× bet). scatter triggers free spins.
  const SYMBOLS = [
    { id: 'html',    name: 'HTML5',      slug: 'html5',      weight: 22, line: 5,   half: 1 },
    { id: 'css',     name: 'CSS3',       slug: 'css3',       weight: 18, line: 8,   half: 1 },
    { id: 'js',      name: 'JavaScript', slug: 'javascript', weight: 12, line: 15,  half: 2 },
    { id: 'py',      name: 'Python',     slug: 'python',     weight: 8,  line: 30,  half: 3 },
    { id: 'rust',    name: 'Rust',       slug: 'rust',       weight: 3,  line: 100, half: 8 },
    { id: 'gem',     name: 'Diamant',    glyph: '💎',        weight: 1,  line: 500, half: 20 },
    { id: 'scatter', name: 'Bug-Bonus',  glyph: '🐞',        weight: 6,  scatter: true }
  ];

  const BETS = [5, 10, 25, 50, 100];        // Bug Taler per spin
  const EXCHANGE_RATE = 1;                    // 1 coin -> 1 Bug Taler
  const FREE_SPINS_ON_SCATTER = 12;           // 3 scatters award this many
  const BONUS_BUY_COST_MULT = 50;             // bonus buy costs 50× the current bet
  const BONUS_BUY_FREE_SPINS = 12;

  global.FCSSlotsData = {
    PAYOUT_MULT, SYMBOLS, BETS, EXCHANGE_RATE,
    FREE_SPINS_ON_SCATTER, BONUS_BUY_COST_MULT, BONUS_BUY_FREE_SPINS
  };
})(window);
