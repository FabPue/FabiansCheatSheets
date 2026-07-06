/*
 * collections.js — collectible language sets that pay out a one-time reward.
 *
 * A collection completes when the player's inventory contains a matching item
 * for every requirement. A requirement may also demand a specific wear tier,
 * so some collections ask for languages in a particular float condition
 * (e.g. all Factory New). Depends on: FCSStore.
 */
(function (global) {
  'use strict';

  const Store = global.FCSStore;

  // req: array of { name, wear? }  — wear is a WEAR_TIERS id (fn/mw/ft/ww/bs).
  const COLLECTIONS = [
    {
      id: 'web_basics', icon: '🌐', name: 'Web-Grundlagen',
      desc: 'Das Fundament jeder Website.',
      req: [{ name: 'HTML5' }, { name: 'CSS3' }, { name: 'JavaScript' }],
      reward: { coins: 120, xp: 80 }
    },
    {
      id: 'systems', icon: '⚙️', name: 'Systemnah',
      desc: 'Nah an der Maschine.',
      req: [{ name: 'C' }, { name: 'C++' }, { name: 'Rust' }],
      reward: { coins: 300, xp: 200 }
    },
    {
      id: 'jvm', icon: '☕', name: 'JVM-Familie',
      desc: 'Alles läuft auf der JVM.',
      req: [{ name: 'Java' }, { name: 'Kotlin' }, { name: 'Scala' }, { name: 'Clojure' }],
      reward: { coins: 400, xp: 260 }
    },
    {
      id: 'functional', icon: '🧮', name: 'Funktional',
      desc: 'Rein funktionale Sammlung.',
      req: [{ name: 'Haskell' }, { name: 'Elixir' }, { name: 'F#' }],
      reward: { coins: 500, xp: 320 }
    },
    {
      id: 'pristine_web', icon: '✨', name: 'Makelloses Web',
      desc: 'Web-Grundlagen — aber alle Fabrikneu (FN).',
      req: [{ name: 'HTML5', wear: 'fn' }, { name: 'CSS3', wear: 'fn' }, { name: 'JavaScript', wear: 'fn' }],
      reward: { coins: 350, xp: 220 }
    },
    {
      id: 'battle_scarred', icon: '🩹', name: 'Schrottplatz',
      desc: 'Drei Sprachen mit Kampfspuren (KS).',
      req: [{ name: 'Python', wear: 'bs' }, { name: 'PHP', wear: 'bs' }, { name: 'Perl', wear: 'bs' }],
      reward: { coins: 200, xp: 120 }
    }
  ];

  function reqMet(inventory, req) {
    return inventory.some(it =>
      it.name === req.name && (!req.wear || it.wearTier === req.wear));
  }

  // Returns { have, need, done } for one collection.
  function collectionProgress(profile, collection) {
    const inv = profile.inventory || [];
    let have = 0;
    collection.req.forEach(r => { if (reqMet(inv, r)) have += 1; });
    return { have: have, need: collection.req.length, done: have === collection.req.length };
  }

  function isClaimed(profile, id) {
    return (profile.collectionsClaimed || []).indexOf(id) !== -1;
  }

  // Claims a completed, unclaimed collection. Returns { ok, reason, reward }.
  function claim(username, profile, id) {
    const coll = COLLECTIONS.find(c => c.id === id);
    if (!coll) return { ok: false, reason: 'unknown' };
    if (isClaimed(profile, id)) return { ok: false, reason: 'claimed' };
    if (!collectionProgress(profile, coll).done) return { ok: false, reason: 'incomplete' };
    profile.coins += coll.reward.coins;
    profile.xp += coll.reward.xp;
    profile.collectionsClaimed = profile.collectionsClaimed || [];
    profile.collectionsClaimed.push(id);
    Store.saveProfile(username, profile);
    return { ok: true, reward: coll.reward };
  }

  global.FCSCollections = { COLLECTIONS, collectionProgress, isClaimed, claim };
})(window);
