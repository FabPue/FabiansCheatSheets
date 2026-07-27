/*
 * slots.js — language slot machine engine (5×5 grid, 7 paylines).
 * Depends on: FCSSlotsData, FCSStore.
 *
 * Bet Bug Taler, win BugCoins. Wins pay on the 5 rows and the 2 diagonals for
 * 3, 4 or 5 matching symbols counted from the left. RTP is deliberately below
 * 100% (house edge) — over many spins you lose, which is the point. Free spins
 * are awarded by 3+ scatters or bought as a bonus.
 */
(function (global) {
  'use strict';

  const D = global.FCSSlotsData;
  const Store = global.FCSStore;

  function symbolById(id) { return D.SYMBOLS.find(s => s.id === id); }

  // Pre-built weighted lookup for one cell.
  const REEL = (function () {
    const arr = [];
    D.SYMBOLS.forEach(s => { for (let i = 0; i < s.weight; i++) arr.push(s.id); });
    return arr;
  })();

  function spinCell() { return REEL[(Math.random() * REEL.length) | 0]; }

  // Returns a grid as columns: grid[col] = [rows...] of symbol ids.
  function spinGrid() {
    const grid = [];
    for (let c = 0; c < D.COLS; c++) {
      const col = [];
      for (let r = 0; r < D.ROWS; r++) col.push(spinCell());
      grid.push(col);
    }
    return grid;
  }

  function cellId(grid, c, r) { return grid[c][r]; }

  // Evaluates every payline + scatters on the grid for a given total bet.
  function evaluate(grid, bet) {
    const perLine = bet / D.PAYLINES.length;
    let win = 0, best = null, diagWin = false;
    const lines = [];
    const winCells = {};

    D.PAYLINES.forEach(pl => {
      const first = cellId(grid, pl.cells[0][0], pl.cells[0][1]);
      if (first === 'scatter') return;
      // Count consecutive matches from the left.
      let count = 1;
      for (let i = 1; i < pl.cells.length; i++) {
        if (cellId(grid, pl.cells[i][0], pl.cells[i][1]) === first) count++;
        else break;
      }
      if (count < 3) return;
      const sym = symbolById(first);
      const mult = count === 5 ? sym.p5 : (count === 4 ? sym.p4 : sym.p3);
      const isDiag = pl.id === 'diagD' || pl.id === 'diagU';
      let amount = perLine * mult * (isDiag ? D.DIAG_BONUS : 1);
      amount = amount * D.PAYOUT_MULT;
      win += amount;
      if (isDiag) diagWin = true;
      // mark winning cells
      for (let i = 0; i < count; i++) winCells[pl.cells[i][0] + '-' + pl.cells[i][1]] = true;
      const lineInfo = { line: pl.id, name: pl.name, symId: first, count: count, isDiag: isDiag, amount: amount };
      lines.push(lineInfo);
      if (!best || amount > best.amount) best = lineInfo;
    });

    // Scatters anywhere on the grid.
    let scatters = 0;
    for (let c = 0; c < D.COLS; c++) for (let r = 0; r < D.ROWS; r++) if (grid[c][r] === 'scatter') scatters++;

    win = Math.round(win);
    const freeSpinsAwarded = scatters >= D.SCATTER_MIN ? D.FREE_SPINS_ON_SCATTER : 0;
    const jackpot = !!best && best.count === 5 && (best.symId === 'gem' || best.symId === 'rust');
    return {
      win: win, lines: lines, best: best, diagWin: diagWin,
      scatters: scatters, freeSpinsAwarded: freeSpinsAwarded, jackpot: jackpot,
      winCells: Object.keys(winCells)
    };
  }

  // Coins -> Bug Taler.
  function exchange(username, profile, coins) {
    coins = Math.floor(coins);
    if (coins <= 0) return { ok: false, reason: 'amount' };
    if (profile.coins < coins) return { ok: false, reason: 'insufficient' };
    profile.coins -= coins;
    profile.bugTaler = (profile.bugTaler || 0) + coins * D.EXCHANGE_RATE;
    Store.saveProfile(username, profile);
    return { ok: true, taler: profile.bugTaler };
  }

  // One spin. Uses a free spin if available, else charges `bet` Bug Taler.
  function play(username, profile, bet) {
    const free = (profile.slotFreeSpins || 0) > 0;
    if (!free) {
      if ((profile.bugTaler || 0) < bet) return { ok: false, reason: 'insufficient' };
      profile.bugTaler -= bet;
    } else {
      profile.slotFreeSpins -= 1;
    }
    const grid = spinGrid();
    const res = evaluate(grid, bet);
    profile.bugCoins = (profile.bugCoins || 0) + res.win;
    if (res.freeSpinsAwarded) profile.slotFreeSpins = (profile.slotFreeSpins || 0) + res.freeSpinsAwarded;
    profile.slotSpins = (profile.slotSpins || 0) + 1;
    if (res.win > (profile.slotMaxWin || 0)) profile.slotMaxWin = res.win;
    if (res.diagWin) profile.slotDiagWins = (profile.slotDiagWins || 0) + 1;
    Store.saveProfile(username, profile);
    return {
      ok: true, grid: grid, win: res.win, lines: res.lines, best: res.best,
      diagWin: res.diagWin, scatters: res.scatters, freeSpinsAwarded: res.freeSpinsAwarded,
      jackpot: res.jackpot, winCells: res.winCells, wasFree: free,
      bugTaler: profile.bugTaler, bugCoins: profile.bugCoins, freeSpins: profile.slotFreeSpins
    };
  }

  // Bonus buy: pay a lump of Bug Taler for guaranteed free spins.
  function bonusBuy(username, profile, bet) {
    const cost = bet * D.BONUS_BUY_COST_MULT;
    if ((profile.bugTaler || 0) < cost) return { ok: false, reason: 'insufficient', cost: cost };
    profile.bugTaler -= cost;
    profile.slotFreeSpins = (profile.slotFreeSpins || 0) + D.BONUS_BUY_FREE_SPINS;
    Store.saveProfile(username, profile);
    return { ok: true, cost: cost, freeSpins: profile.slotFreeSpins };
  }

  global.FCSSlots = {
    SYMBOLS: D.SYMBOLS, BETS: D.BETS, PAYLINES: D.PAYLINES, COLS: D.COLS, ROWS: D.ROWS,
    symbolById, spinGrid, evaluate, exchange, play, bonusBuy
  };
})(window);
