/*
 * slots.js — language slot machine engine.
 * Depends on: FCSSlotsData, FCSStore.
 *
 * Bet Bug Taler, win BugCoins. RTP is deliberately below 100% (house edge) —
 * over many spins you lose, which is the point. Free spins are awarded by 3
 * scatters or bought as a bonus.
 */
(function (global) {
  'use strict';

  const D = global.FCSSlotsData;
  const Store = global.FCSStore;

  function symbolById(id) { return D.SYMBOLS.find(s => s.id === id); }

  // Pre-built weighted lookup for one reel.
  const REEL = (function () {
    const arr = [];
    D.SYMBOLS.forEach(s => { for (let i = 0; i < s.weight; i++) arr.push(s.id); });
    return arr;
  })();

  function spinReel() { return REEL[(Math.random() * REEL.length) | 0]; }
  function spinResult() { return [spinReel(), spinReel(), spinReel()]; }

  // Evaluates a 3-symbol payline for a given bet. Returns coins won etc.
  function evaluate(reels, bet) {
    const scatters = reels.filter(id => id === 'scatter').length;
    let win = 0, kind = 'none', symId = null;
    const s0 = reels[0], s1 = reels[1], s2 = reels[2];
    if (s0 !== 'scatter' && s0 === s1 && s1 === s2) {
      win = bet * symbolById(s0).line * D.PAYOUT_MULT; kind = 'line'; symId = s0;
    } else if (s0 !== 'scatter' && s0 === s1) {
      win = bet * symbolById(s0).half * D.PAYOUT_MULT; kind = 'half'; symId = s0;
    }
    win = Math.round(win);
    const freeSpinsAwarded = scatters >= 3 ? D.FREE_SPINS_ON_SCATTER : 0;
    const jackpot = kind === 'line' && (symId === 'gem' || symId === 'rust');
    return { win: win, kind: kind, symId: symId, scatters: scatters, freeSpinsAwarded: freeSpinsAwarded, jackpot: jackpot };
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
    const reels = spinResult();
    const res = evaluate(reels, bet);
    profile.bugCoins = (profile.bugCoins || 0) + res.win;
    if (res.freeSpinsAwarded) profile.slotFreeSpins = (profile.slotFreeSpins || 0) + res.freeSpinsAwarded;
    profile.slotSpins = (profile.slotSpins || 0) + 1;
    Store.saveProfile(username, profile);
    return {
      ok: true, reels: reels, win: res.win, kind: res.kind, symId: res.symId,
      scatters: res.scatters, freeSpinsAwarded: res.freeSpinsAwarded, jackpot: res.jackpot,
      wasFree: free,
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
    SYMBOLS: D.SYMBOLS, BETS: D.BETS, symbolById,
    spinResult, evaluate, exchange, play, bonusBuy
  };
})(window);
