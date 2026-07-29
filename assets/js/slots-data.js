/*
 * slots-data.js — configuration for the language slot machine.
 *
 * A 5×5 grid slot whose symbols are programming languages. Wins pay on 7
 * paylines: the 5 horizontal rows plus the two full diagonals. A payline pays
 * for 3, 4 or 5 matching symbols counted from the left.
 *
 * The reel weights + paytable are tuned (Monte-Carlo) to a realistic ~90% RTP
 * (return to player): the house always wins over time — the whole point is to
 * show that gambling doesn't pay. Bet in Bug Taler, win BugCoins.
 */
(function (global) {
  'use strict';

  // Grid dimensions.
  const COLS = 5;
  const ROWS = 5;

  // Global payout multiplier — tunes overall RTP without rebalancing each line.
  // With the streak multiplier, the (capped, non-resetting) free-spin
  // multiplier and the post-win "hot" reroll, the raw RTP is ~2.87 at
  // PAYOUT_MULT=1 (Monte-Carlo, 16M spins), so 0.314 lands total RTP ≈ 0.90
  // (~10% house edge). The multipliers redistribute winnings toward streaks and
  // free spins — single wins pay less, but the excitement (and the house edge)
  // stays. Gambling still doesn't pay.
  const PAYOUT_MULT = 0.314;

  // Each cell is drawn independently from a weighted reel. p3/p4/p5 are the
  // per-line payout multipliers (× per-line stake) for 3, 4 or 5 of a kind
  // counted from the left. scatter symbols pay nothing on a line but award
  // free spins when 3+ appear anywhere on the grid.
  const SYMBOLS = [
    { id: 'html',    name: 'HTML5',      slug: 'html5',      weight: 22, p3: 2,   p4: 8,   p5: 25 },
    { id: 'css',     name: 'CSS3',       slug: 'css3',       weight: 18, p3: 3,   p4: 12,  p5: 40 },
    { id: 'js',      name: 'JavaScript', slug: 'javascript', weight: 12, p3: 5,   p4: 20,  p5: 80 },
    { id: 'py',      name: 'Python',     slug: 'python',     weight: 8,  p3: 10,  p4: 40,  p5: 150 },
    { id: 'rust',    name: 'Rust',       slug: 'rust',       weight: 3,  p3: 25,  p4: 120, p5: 500 },
    { id: 'gem',     name: 'Diamant',    glyph: '💎',        weight: 1,  p3: 100, p4: 500, p5: 2500 },
    { id: 'scatter', name: 'Bug-Bonus',  glyph: '🐞',        weight: 3,  scatter: true }
  ];

  // Paylines as [col, row] coordinate lists (col 0 = leftmost, row 0 = top).
  // 5 rows + 2 diagonals = 7 lines.
  const PAYLINES = [
    { id: 'row0', name: 'Reihe 1',      cells: [[0,0],[1,0],[2,0],[3,0],[4,0]] },
    { id: 'row1', name: 'Reihe 2',      cells: [[0,1],[1,1],[2,1],[3,1],[4,1]] },
    { id: 'row2', name: 'Reihe 3',      cells: [[0,2],[1,2],[2,2],[3,2],[4,2]] },
    { id: 'row3', name: 'Reihe 4',      cells: [[0,3],[1,3],[2,3],[3,3],[4,3]] },
    { id: 'row4', name: 'Reihe 5',      cells: [[0,4],[1,4],[2,4],[3,4],[4,4]] },
    { id: 'diagD', name: 'Diagonale ↘', cells: [[0,0],[1,1],[2,2],[3,3],[4,4]] },
    { id: 'diagU', name: 'Diagonale ↗', cells: [[0,4],[1,3],[2,2],[3,1],[4,0]] }
  ];

  const BETS = [5, 10, 25, 50, 100];          // Bug Taler per spin (total stake)
  const EXCHANGE_RATE = 1;                     // 1 coin -> 1 Bug Taler
  const SCATTER_MIN = 4;                        // scatters needed to trigger free spins
  const FREE_SPINS_ON_SCATTER = 12;            // that many scatters award this many spins
  const BONUS_BUY_COST_MULT = 50;              // bonus buy costs 50× the current bet
  const BONUS_BUY_FREE_SPINS = 12;
  const DIAG_BONUS = 1.25;                      // diagonal wins pay a small bonus

  // Win-streak multiplier (base game): consecutive wins escalate ×2 → ×4 → ×8 …
  // The first win of a streak still pays ×1 (the multiplier only "arms" for the
  // NEXT win); any losing spin resets it. Capped so display + economy stay sane.
  const MULT_MAX = 1024;

  // Free-spin multiplier: during a free-spin session the multiplier escalates the
  // same way but does NOT reset on a losing free spin — it holds and keeps
  // climbing for the whole session. Capped lower so long, retriggering sessions
  // can't explode the RTP.
  const FS_MULT_CAP = 8;

  // After any win, the next spin gets a single "second chance" reroll if it
  // would otherwise lose — a small, on-a-roll boost to the win probability.
  const HOT_REROLL_CHANCE = 0.35;

  global.FCSSlotsData = {
    COLS, ROWS, PAYOUT_MULT, SYMBOLS, PAYLINES, BETS, EXCHANGE_RATE, SCATTER_MIN,
    FREE_SPINS_ON_SCATTER, BONUS_BUY_COST_MULT, BONUS_BUY_FREE_SPINS, DIAG_BONUS,
    MULT_MAX, FS_MULT_CAP, HOT_REROLL_CHANCE
  };
})(window);
