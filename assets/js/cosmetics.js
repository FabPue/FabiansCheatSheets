/*
 * cosmetics.js — the BugShop: cosmetic background effects bought with BugCoins.
 * Depends on: FCSStore. Renders an animated layer behind the page content.
 */
(function (global) {
  'use strict';

  const Store = global.FCSStore;

  const COSMETICS = [
    { id: 'inv_parade', name: 'Icon-Parade',    price: 150, icon: '🛸', desc: 'Deine gezogenen Sprach-Icons fliegen im Hintergrund umher.' },
    { id: 'stardust',   name: 'Sternenstaub',   price: 80,  icon: '✨', desc: 'Funkelnde Sterne rieseln über den Hintergrund.' },
    { id: 'bubbles',    name: 'Bläschen',        price: 80,  icon: '🫧', desc: 'Sanft aufsteigende Blasen.' },
    { id: 'confetti',   name: 'Konfetti-Regen',  price: 120, icon: '🎉', desc: 'Buntes Konfetti rieselt herab.' },
    { id: 'fireflies',  name: 'Glühwürmchen',    price: 100, icon: '🟡', desc: 'Glimmende Lichtpunkte tanzen umher.' },
    { id: 'matrix',     name: 'Matrix-Regen',    price: 160, icon: '🟩', desc: 'Grüner Code regnet in Spalten herab — wie in der Matrix.' },
    { id: 'meteors',    name: 'Sternschnuppen',  price: 140, icon: '☄️', desc: 'Leuchtende Sternschnuppen schießen diagonal über den Bildschirm.' },
    { id: 'sakura',     name: 'Kirschblüten',    price: 110, icon: '🌸', desc: 'Rosa Blütenblätter segeln sanft herab.' },
    { id: 'orbs',       name: 'Glüh-Orbs',       price: 130, icon: '🔮', desc: 'Große, weich leuchtende Farb-Orbs schweben umher.' }
  ];

  const DEFAULT_SLUGS = ['javascript', 'python', 'typescript', 'rust', 'go', 'html5', 'css3'];

  function owns(p, id) { return (p.ownedCosmetics || []).indexOf(id) !== -1; }
  function isActive(p, id) { return (p.activeCosmetics || []).indexOf(id) !== -1; }

  function buy(username, p, id) {
    const c = COSMETICS.find(x => x.id === id);
    if (!c) return { ok: false };
    if (owns(p, id)) return { ok: false, reason: 'owned' };
    if ((p.bugCoins || 0) < c.price) return { ok: false, reason: 'insufficient' };
    p.bugCoins -= c.price;
    p.ownedCosmetics = p.ownedCosmetics || [];
    p.ownedCosmetics.push(id);
    Store.saveProfile(username, p);
    return { ok: true };
  }

  function toggle(username, p, id) {
    if (!owns(p, id)) return { ok: false };
    p.activeCosmetics = p.activeCosmetics || [];
    const i = p.activeCosmetics.indexOf(id);
    if (i === -1) p.activeCosmetics.push(id); else p.activeCosmetics.splice(i, 1);
    Store.saveProfile(username, p);
    render(p);
    return { ok: true, active: isActive(p, id) };
  }

  function ensureLayer() {
    let layer = document.getElementById('fcsCosmeticsBg');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'fcsCosmeticsBg';
      layer.className = 'cosmetics-bg';
      document.body.appendChild(layer);
    }
    return layer;
  }

  // (Re)builds the animated background layer for the profile's active cosmetics.
  function render(profile) {
    const layer = ensureLayer();
    layer.innerHTML = '';
    const active = (profile && profile.activeCosmetics) || [];

    if (active.indexOf('inv_parade') !== -1) {
      const inv = (profile.inventory || []).filter(it => it.slug).map(it => it.slug);
      const slugs = inv.length ? inv : DEFAULT_SLUGS.slice();
      const count = Math.min(16, Math.max(8, slugs.length));
      for (let i = 0; i < count; i++) {
        const slug = slugs[i % slugs.length];
        const el = document.createElement('i');
        el.className = `cbg-icon devicon-${slug}-plain colored`;
        el.style.left = (Math.random() * 100) + '%';
        el.style.top = (Math.random() * 100) + '%';
        el.style.fontSize = (24 + Math.random() * 40) + 'px';
        el.style.animationDuration = (16 + Math.random() * 18) + 's';
        el.style.animationDelay = (-Math.random() * 25) + 's';
        layer.appendChild(el);
      }
    }

    const confettiColors = ['#f4324c', '#f7d363', '#63b3f7', '#9d63f7', '#34d399', '#f7a063'];
    ['stardust', 'bubbles', 'confetti', 'fireflies'].forEach(type => {
      if (active.indexOf(type) === -1) return;
      const n = type === 'confetti' ? 44 : (type === 'bubbles' ? 26 : 32);
      for (let i = 0; i < n; i++) {
        const el = document.createElement('span');
        el.className = 'cbg-particle p-' + type;
        el.style.left = (Math.random() * 100) + '%';
        el.style.animationDuration = (type === 'confetti' ? (4 + Math.random() * 5) : (8 + Math.random() * 12)) + 's';
        el.style.animationDelay = (-Math.random() * 16) + 's';
        if (type === 'confetti') el.style.background = confettiColors[i % confettiColors.length];
        if (type === 'fireflies') el.style.setProperty('--x', (Math.random() * 40 - 20) + 'px');
        layer.appendChild(el);
      }
    });

    // Matrix code rain — falling columns of glyphs.
    if (active.indexOf('matrix') !== -1) {
      const glyphs = '01{}<>[]()=+-*/;$#&|!?✕λ⌘のアカサ';
      const colsN = 22;
      for (let i = 0; i < colsN; i++) {
        const col = document.createElement('div');
        col.className = 'cbg-matrix';
        col.style.left = (i / colsN * 100 + Math.random() * 2) + '%';
        col.style.animationDuration = (5 + Math.random() * 7) + 's';
        col.style.animationDelay = (-Math.random() * 10) + 's';
        col.style.fontSize = (12 + Math.random() * 8) + 'px';
        let txt = '';
        const len = 12 + (Math.random() * 14 | 0);
        for (let j = 0; j < len; j++) txt += glyphs[(Math.random() * glyphs.length) | 0] + '\n';
        col.textContent = txt;
        layer.appendChild(col);
      }
    }

    // Shooting stars / meteors — diagonal streaks.
    if (active.indexOf('meteors') !== -1) {
      for (let i = 0; i < 16; i++) {
        const el = document.createElement('span');
        el.className = 'cbg-particle p-meteor';
        el.style.left = (Math.random() * 100) + '%';
        el.style.top = (Math.random() * 60) + '%';
        el.style.animationDuration = (2.4 + Math.random() * 3.2) + 's';
        el.style.animationDelay = (-Math.random() * 8) + 's';
        layer.appendChild(el);
      }
    }

    // Sakura petals — falling + swaying emoji.
    if (active.indexOf('sakura') !== -1) {
      for (let i = 0; i < 26; i++) {
        const el = document.createElement('span');
        el.className = 'cbg-particle p-sakura';
        el.textContent = Math.random() < 0.5 ? '🌸' : '🌷';
        el.style.left = (Math.random() * 100) + '%';
        el.style.fontSize = (14 + Math.random() * 16) + 'px';
        el.style.animationDuration = (9 + Math.random() * 10) + 's';
        el.style.animationDelay = (-Math.random() * 16) + 's';
        el.style.setProperty('--sway', (30 + Math.random() * 60) + 'px');
        layer.appendChild(el);
      }
    }

    // Glowing orbs — large soft floating colour blobs.
    if (active.indexOf('orbs') !== -1) {
      const orbColors = ['#7c6af7', '#f472b6', '#34d399', '#63b3f7', '#fbbf24'];
      for (let i = 0; i < 14; i++) {
        const el = document.createElement('span');
        el.className = 'cbg-particle p-orb';
        const size = 40 + Math.random() * 90;
        el.style.width = size + 'px'; el.style.height = size + 'px';
        el.style.left = (Math.random() * 100) + '%';
        el.style.top = (Math.random() * 100) + '%';
        el.style.background = orbColors[i % orbColors.length];
        el.style.animationDuration = (14 + Math.random() * 16) + 's';
        el.style.animationDelay = (-Math.random() * 20) + 's';
        el.style.setProperty('--x', (Math.random() * 120 - 60) + 'px');
        el.style.setProperty('--y', (Math.random() * 120 - 60) + 'px');
        layer.appendChild(el);
      }
    }
  }

  global.FCSCosmetics = { COSMETICS, owns, isActive, buy, toggle, render };
})(window);
