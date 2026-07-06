/*
 * cases.js — case opening logic (roll rarity, pick item, roll wear).
 * Depends on: FCSStore, FCSCasesData.
 */
(function (global) {
  'use strict';

  const Store = global.FCSStore;
  const Data = global.FCSCasesData;

  function rarityById(id) { return Data.RARITIES.find(r => r.id === id); }
  function itemsByRarity(id) { return Data.ITEMS.filter(i => i.rarity === id); }

  function wearTierForFloat(f) {
    for (const t of Data.WEAR_TIERS) {
      if (f >= t.min && f < t.max) return t;
    }
    return Data.WEAR_TIERS[Data.WEAR_TIERS.length - 1];
  }

  // Weighted random rarity based on configured probabilities.
  function rollRarity() {
    const total = Data.RARITIES.reduce((s, r) => s + r.prob, 0);
    let roll = Math.random() * total;
    for (const r of Data.RARITIES) {
      if (roll < r.prob) return r;
      roll -= r.prob;
    }
    return Data.RARITIES[0];
  }

  function rollItem(rarityId) {
    const pool = itemsByRarity(rarityId);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Builds a fresh, unique inventory entry for a rolled drop.
  function buildDrop() {
    const rarity = rollRarity();
    const item = rollItem(rarity.id);
    const float = Math.round(Math.random() * 1e6) / 1e6; // 0..1, 6 decimals
    const wear = wearTierForFloat(float);
    return {
      uid: 'itm_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e6).toString(36),
      slug: item.slug,
      name: item.name,
      rarity: rarity.id,
      wearTier: wear.id,
      float: float,
      obtainedAt: Date.now()
    };
  }

  function canOpen(profile) {
    return profile.coins >= Data.CASE_COST;
  }

  // Deducts the cost, rolls a drop, stores it. Returns { ok, reason, drop }.
  function openCase(username, profile) {
    if (!canOpen(profile)) return { ok: false, reason: 'insufficient' };
    profile.coins -= Data.CASE_COST;
    const drop = buildDrop();
    profile.inventory = profile.inventory || [];
    profile.inventory.push(drop);
    profile.casesOpened = (profile.casesOpened || 0) + 1;
    Store.saveProfile(username, profile);
    return { ok: true, drop: drop };
  }

  // Builds a reel of decoy items ending on the winning drop (for the animation).
  function buildReel(winningDrop, length) {
    const n = length || 60;
    const reel = [];
    for (let i = 0; i < n; i++) {
      const rarity = rollRarity();
      const item = rollItem(rarity.id);
      reel.push({ slug: item.slug, name: item.name, rarity: rarity.id });
    }
    // Place the actual win near the end at a fixed index.
    const winIndex = n - 8;
    reel[winIndex] = { slug: winningDrop.slug, name: winningDrop.name, rarity: winningDrop.rarity };
    return { reel: reel, winIndex: winIndex };
  }

  global.FCSCases = {
    CASE_COST: Data.CASE_COST,
    rarityById, itemsByRarity, wearTierForFloat,
    rollRarity, canOpen, openCase, buildReel, buildDrop
  };
})(window);
