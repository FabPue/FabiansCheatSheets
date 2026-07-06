/*
 * gamify.js — daily rewards, streak, XP/level and daily challenge logic.
 * Depends on: FCSStore, FCSChallenges.
 */
(function (global) {
  'use strict';

  const Store = global.FCSStore;
  const POOL = global.FCSChallenges;

  const DAILY_CHALLENGE_COUNT = 4;   // challenges offered per day
  const DAILY_REWARD_BASE = 25;      // base coins for the daily login reward
  const STREAK_BONUS_PER_DAY = 5;    // extra reward coins per streak day
  const STREAK_BONUS_CAP = 100;      // max streak bonus coins

  const DIFF_REWARD = { easy: 10, medium: 20, hard: 35 };
  const DIFF_XP = { easy: 10, medium: 25, hard: 50 };
  const FREE_MULTIPLIER = 0.5;       // self-reported freetext gives half coins/xp

  /* ── level curve ── */
  // XP required to reach a given level: cumulative, grows quadratically-ish.
  function xpForLevel(level) {
    return Math.floor(50 * (level - 1) * level / 2);
  }
  function levelForXp(xp) {
    let lvl = 1;
    while (xp >= xpForLevel(lvl + 1)) lvl++;
    return lvl;
  }
  function levelProgress(xp) {
    const lvl = levelForXp(xp);
    const cur = xpForLevel(lvl);
    const next = xpForLevel(lvl + 1);
    const span = next - cur || 1;
    return { level: lvl, into: xp - cur, need: next - cur, pct: Math.min(100, Math.round(((xp - cur) / span) * 100)) };
  }

  /* ── deterministic daily selection ── */
  function seededShuffle(array, seed) {
    const a = array.slice();
    let s = seed >>> 0;
    for (let i = a.length - 1; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Returns today's challenge set (stable for a given date).
  function getDailyChallenges(dateKey) {
    const key = dateKey || Store.todayKey();
    const seed = Store.daySeed(key);
    const byDiff = { easy: [], medium: [], hard: [] };
    POOL.forEach(c => { if (byDiff[c.difficulty]) byDiff[c.difficulty].push(c); });
    // Aim for a spread across difficulties.
    const wanted = ['easy', 'medium', 'hard', 'easy'];
    const picked = [];
    const usedIds = new Set();
    wanted.forEach((diff, idx) => {
      const shuffled = seededShuffle(byDiff[diff], seed + idx * 97);
      for (const c of shuffled) {
        if (!usedIds.has(c.id)) { picked.push(c); usedIds.add(c.id); break; }
      }
    });
    // Top up if any difficulty bucket was short.
    if (picked.length < DAILY_CHALLENGE_COUNT) {
      const rest = seededShuffle(POOL, seed + 999);
      for (const c of rest) {
        if (picked.length >= DAILY_CHALLENGE_COUNT) break;
        if (!usedIds.has(c.id)) { picked.push(c); usedIds.add(c.id); }
      }
    }
    return picked.slice(0, DAILY_CHALLENGE_COUNT);
  }

  /* ── solvedToday helpers ── */
  function ensureTodayBucket(profile) {
    const today = Store.todayKey();
    if (!profile.solvedToday || profile.solvedToday.date !== today) {
      profile.solvedToday = { date: today, ids: [] };
    }
    return profile.solvedToday;
  }

  function isSolvedToday(profile, id) {
    const bucket = ensureTodayBucket(profile);
    return bucket.ids.indexOf(id) !== -1;
  }

  /* ── answer checking ── */
  function normalize(str) {
    return String(str).trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function checkAnswer(challenge, userValue) {
    if (challenge.type === 'mc') {
      return Number(userValue) === challenge.answer;
    }
    if (challenge.type === 'code') {
      const norm = normalize(userValue);
      return (challenge.answers || []).some(a => normalize(a) === norm);
    }
    // freetext is self-reported
    return true;
  }

  /* ── streak logic ── */
  // Called when a challenge is solved. Advances streak once per day.
  function touchStreakOnSolve(profile) {
    const today = Store.todayKey();
    const yesterday = Store.yesterdayKey();
    if (profile.lastStreakDate === today) return; // already counted today
    if (profile.lastStreakDate === yesterday) profile.streak += 1;
    else profile.streak = 1;
    profile.lastStreakDate = today;
  }

  // Detect a missed day on load: if last activity was before yesterday, reset.
  function refreshStreakOnLoad(profile) {
    const today = Store.todayKey();
    const yesterday = Store.yesterdayKey();
    if (profile.lastStreakDate && profile.lastStreakDate !== today && profile.lastStreakDate !== yesterday) {
      profile.streak = 0;
      profile.lastStreakDate = null;
    }
  }

  /* ── rewards ── */
  function canClaimDailyReward(profile) {
    return profile.lastRewardDate !== Store.todayKey();
  }

  function streakBonus(profile) {
    return Math.min(STREAK_BONUS_CAP, Math.max(0, profile.streak) * STREAK_BONUS_PER_DAY);
  }

  // Mutates & saves profile; returns { claimed, amount, base, bonus }.
  function claimDailyReward(username, profile) {
    if (!canClaimDailyReward(profile)) {
      return { claimed: false, amount: 0, base: 0, bonus: 0 };
    }
    const base = DAILY_REWARD_BASE;
    const bonus = streakBonus(profile);
    const amount = base + bonus;
    profile.coins += amount;
    profile.lastRewardDate = Store.todayKey();
    Store.saveProfile(username, profile);
    return { claimed: true, amount, base, bonus };
  }

  /* ── solving a challenge ── */
  // Returns { ok, correct, alreadySolved, coins, xp, leveledUp, newLevel, streak }.
  function solveChallenge(username, profile, challenge, userValue) {
    if (isSolvedToday(profile, challenge.id)) {
      return { ok: false, alreadySolved: true, correct: false };
    }
    const correct = checkAnswer(challenge, userValue);
    if (!correct) {
      return { ok: false, alreadySolved: false, correct: false };
    }

    const mult = challenge.type === 'free' ? FREE_MULTIPLIER : 1;
    const coins = Math.round((DIFF_REWARD[challenge.difficulty] || 10) * mult);
    const xpGain = Math.round((DIFF_XP[challenge.difficulty] || 10) * mult);

    const prevLevel = levelForXp(profile.xp);
    profile.coins += coins;
    profile.xp += xpGain;
    const newLevel = levelForXp(profile.xp);
    profile.level = newLevel;

    ensureTodayBucket(profile).ids.push(challenge.id);
    profile.solvedTotal = (profile.solvedTotal || 0) + 1;
    touchStreakOnSolve(profile);

    Store.saveProfile(username, profile);
    return {
      ok: true, alreadySolved: false, correct: true,
      coins, xp: xpGain,
      leveledUp: newLevel > prevLevel, newLevel,
      streak: profile.streak
    };
  }

  global.FCSGamify = {
    DAILY_CHALLENGE_COUNT, DAILY_REWARD_BASE,
    xpForLevel, levelForXp, levelProgress,
    getDailyChallenges,
    isSolvedToday, checkAnswer,
    refreshStreakOnLoad,
    canClaimDailyReward, streakBonus, claimDailyReward,
    solveChallenge
  };
})(window);
