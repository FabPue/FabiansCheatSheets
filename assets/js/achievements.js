/*
 * achievements.js — evaluates and awards achievements.
 * Depends on: FCSStore, FCSGamify, FCSAchievementsData.
 *
 * check(username) computes current stats, awards any newly-met achievements
 * (once each), grants their XP + gold, and returns the newly unlocked list so
 * the UI can show center-screen popups.
 */
(function (global) {
  'use strict';

  const Store = global.FCSStore;
  const DEFS = global.FCSAchievementsData;

  function computeStats(profile) {
    const rarity = { grey: 0, blue: 0, epic: 0, red: 0, gold: 0 };
    const wear = { fn: 0, mw: 0, ft: 0, ww: 0, bs: 0 };
    const langs = new Set();
    let bestFloat = 1, worstFloat = 0;
    (profile.inventory || []).forEach(it => {
      if (rarity[it.rarity] !== undefined) rarity[it.rarity]++;
      if (wear[it.wearTier] !== undefined) wear[it.wearTier]++;
      langs.add(it.slug || it.name);
      if (typeof it.float === 'number') {
        if (it.float < bestFloat) bestFloat = it.float;
        if (it.float > worstFloat) worstFloat = it.float;
      }
    });
    return {
      streak: profile.streak || 0,
      casesOpened: profile.casesOpened || 0,
      solvedTotal: profile.solvedTotal || 0,
      level: profile.level || (global.FCSGamify ? global.FCSGamify.levelForXp(profile.xp || 0) : 1),
      uniqueLangs: langs.size,
      rarity: rarity,
      wear: wear,
      bestFloat: bestFloat,
      worstFloat: worstFloat,
      tdProgress: profile.tdProgress || 0,
      cmProgress: profile.cmProgress || 0
    };
  }

  function getById(id) { return DEFS.find(a => a.id === id); }

  // Returns array of newly unlocked achievement definitions.
  function check(username) {
    const profile = Store.getProfile(username);
    if (!profile) return [];
    profile.achievements = profile.achievements || [];
    const owned = new Set(profile.achievements);
    const stats = computeStats(profile);
    const unlocked = [];

    DEFS.forEach(def => {
      if (owned.has(def.id)) return;
      let met = false;
      try { met = !!def.test(stats); } catch (e) { met = false; }
      if (met) {
        profile.achievements.push(def.id);
        owned.add(def.id);
        profile.coins += def.gold || 0;
        if (def.xp) profile.xp += def.xp;
        unlocked.push(def);
      }
    });

    if (unlocked.length) {
      // Recompute level after XP grants.
      if (global.FCSGamify) profile.level = global.FCSGamify.levelForXp(profile.xp);
      Store.saveProfile(username, profile);
    }
    return unlocked;
  }

  function isUnlocked(profile, id) {
    return (profile.achievements || []).indexOf(id) !== -1;
  }

  global.FCSAchievements = { DEFS, computeStats, getById, check, isUnlocked };
})(window);
