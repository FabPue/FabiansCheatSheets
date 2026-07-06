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
      glyph: item.glyph,
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

  // ── selling (local marketplace) ──
  // Base coin value per rarity, scaled by float: a lower float (better
  // condition) is worth more. No server, so this is a vendor buy-back.
  const SELL_BASE = { grey: 8, blue: 20, epic: 60, red: 160, gold: 600 };

  function sellValue(drop) {
    const base = SELL_BASE[drop.rarity] || 5;
    const f = typeof drop.float === 'number' ? drop.float : 0.5;
    return Math.max(1, Math.round(base * (1.3 - 0.6 * f)));
  }

  // Removes one inventory item by uid and credits its sell value.
  // Returns { ok, value, reason }.
  function sellItem(username, profile, uid) {
    const inv = profile.inventory || [];
    const idx = inv.findIndex(it => it.uid === uid);
    if (idx === -1) return { ok: false, reason: 'not-found' };
    const value = sellValue(inv[idx]);
    inv.splice(idx, 1);
    profile.inventory = inv;
    profile.coins += value;
    profile.coinsFromSales = (profile.coinsFromSales || 0) + value;
    Store.saveProfile(username, profile);
    return { ok: true, value: value };
  }

  // Sells every item of the given rarities at once. Returns { count, total }.
  function sellAll(username, profile, rarities) {
    const set = rarities && rarities.length ? new Set(rarities) : null;
    const inv = profile.inventory || [];
    let total = 0, count = 0;
    const keep = [];
    inv.forEach(it => {
      if (!set || set.has(it.rarity)) { total += sellValue(it); count += 1; }
      else keep.push(it);
    });
    if (count === 0) return { count: 0, total: 0 };
    profile.inventory = keep;
    profile.coins += total;
    profile.coinsFromSales = (profile.coinsFromSales || 0) + total;
    Store.saveProfile(username, profile);
    return { count: count, total: total };
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
      reel.push({ slug: item.slug, glyph: item.glyph, name: item.name, rarity: rarity.id });
    }
    // Place the actual win near the end at a fixed index.
    const winIndex = n - 8;
    reel[winIndex] = { slug: winningDrop.slug, glyph: winningDrop.glyph, name: winningDrop.name, rarity: winningDrop.rarity };
    return { reel: reel, winIndex: winIndex };
  }

  global.FCSCases = {
    CASE_COST: Data.CASE_COST,
    rarityById, itemsByRarity, wearTierForFloat,
    rollRarity, canOpen, openCase, buildReel, buildDrop,
    sellValue, sellItem, sellAll
  };
})(window);
