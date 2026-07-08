/*
 * td.js — Tower Defense engine (canvas lane-defense).
 * Depends on: FCSTdData. UI integration lives in ui.js (openTowerDefense).
 *
 * Public API:
 *   FCSTd.statFor(item)            -> defender stats from an inventory item
 *   FCSTd.defendersFromInventory() -> one best defender per owned language
 *   FCSTd.newGame(config)          -> game controller (see bottom)
 */
(function (global) {
  'use strict';

  const D = global.FCSTdData;
  const CELL = 62;

  // Rasterise the SVG bug sprites (td-sprites.js) to <img> once, cached across games.
  const _spriteCache = {};
  function spriteFor(id) {
    if (id in _spriteCache) return _spriteCache[id];
    const S = global.FCSTdSprites;
    const svg = S && S[id];
    if (!svg) { _spriteCache[id] = null; return null; }
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    _spriteCache[id] = img;
    return img;
  }

  const SHORT = {
    'JavaScript': 'JS', 'TypeScript': 'TS', 'Node.js': 'Nd', 'Python': 'Py',
    'C#': 'C#', 'C++': 'C++', 'Haskell': 'Hs', 'Elixir': 'Ex', 'Clojure': 'Cj',
    'HTML5': 'HT', 'CSS3': 'CSS', 'Markdown': 'MD', 'Fortran': 'For', 'Scratch': '🐱',
    'JavaScript ': 'JS'
  };
  function shortLabel(item) {
    if (item.glyph) return item.glyph;
    if (SHORT[item.name]) return SHORT[item.name];
    return item.name.replace(/[^A-Za-z0-9#+]/g, '').slice(0, 3);
  }

  // Defender stats from an inventory item, scaled by rarity and float.
  function statFor(item) {
    const archId = D.archFor(item.name, item.rarity);
    const a = D.ARCHETYPES[archId];
    const rm = D.RARITY_MULT[item.rarity] || 1;
    const f = typeof item.float === 'number' ? item.float : 0.5;
    const fm = 1 + (1 - f) * 0.6;   // better (lower) float => up to +60%
    return {
      key: item.name,
      name: item.name, rarity: item.rarity, float: item.float,
      archId: archId, archLabel: a.label, kind: a.kind, color: a.color,
      cost: D.RARITY_COST[item.rarity] || 60,
      damage: Math.round(a.damage * rm * fm * 10) / 10,
      fireRate: a.fireRate, projSpeed: a.projSpeed,
      pierce: a.pierce, splash: a.splash, shape: a.shape,
      slowFactor: a.slowFactor, slowTime: a.slowTime,
      hp: Math.round(a.hp * rm * fm),
      label: shortLabel(item),
      slug: item.slug || null, glyph: item.glyph || null,
      wearTier: item.wearTier || null
    };
  }

  // One best defender per owned language (best = lowest float of that language).
  function defendersFromInventory(inventory) {
    const best = new Map();
    (inventory || []).forEach(it => {
      const cur = best.get(it.name);
      if (!cur || it.float < cur.float) best.set(it.name, it);
    });
    const order = { gold: 0, red: 1, epic: 2, blue: 3, grey: 4 };
    return Array.from(best.values())
      .map(statFor)
      .sort((a, b) => (order[a.rarity] - order[b.rarity]) || a.cost - b.cost);
  }

  function newGame(cfg) {
    const canvas = cfg.canvas;
    const ctx = canvas.getContext('2d');
    const rows = D.GRID.rows, cols = D.GRID.cols;
    canvas.width = cols * CELL;
    canvas.height = rows * CELL;

    const level = cfg.level;
    const grid = Array.from({ length: rows }, () => new Array(cols).fill(null));
    let enemies = [], projectiles = [], floaters = [];
    let bytes = level.startBytes;
    let lives = 5;
    let selected = null;
    let hoverCell = null;
    let running = false, ended = false, won = false;
    let last = 0, spawnClock = 0, elapsed = 0;
    let queue = buildQueue(level);
    let totalToSpawn = queue.length, spawnedCount = 0;

    /* ── spawn queue ── */
    function buildQueue(lv) {
      const q = [];
      const pool = lv.idx <= 6 ? ['syntax', 'offbyone', 'nullptr', 'race']
                 : lv.idx <= 12 ? ['nullptr', 'race', 'leak', 'loop', 'segfault', 'buffer']
                 : ['leak', 'segfault', 'buffer', 'stack', 'race', 'loop', 'nullptr'];
      let t = 1.5;
      const gap = Math.max(0.55, 2.2 - lv.idx * 0.05);
      for (let i = 0; i < lv.count; i++) {
        q.push({ at: t, type: pick(pool), lane: (Math.random() * rows) | 0, boss: false });
        t += gap * (0.7 + Math.random() * 0.6);
      }
      if (lv.isBoss) {
        q.push({ at: 2.0, type: lv.boss, lane: (rows / 2) | 0, boss: true });
        for (let k = 0; k < 5; k++) q.push({ at: 6 + k * 3.2, type: 'nullptr', lane: (Math.random() * rows) | 0, boss: false });
      }
      // Note: totalToSpawn is derived from the returned queue length by the
      // caller — do not assign it here (it is still in its TDZ during this call).
      return q.sort((a, b) => a.at - b.at);
    }
    function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

    function makeEnemy(spec) {
      const base = spec.boss ? D.BOSSES[spec.type] : D.ENEMIES[spec.type];
      const bossScale = spec.boss ? (1 + Math.max(0, level.idx - 10) * 0.16) : level.enemyHp;
      const hp = Math.round(base.hp * bossScale);
      return {
        type: spec.type, boss: !!spec.boss, name: base.name,
        lane: spec.lane, x: cols * CELL + CELL * 0.5,
        hp: hp, maxHp: hp,
        speed: base.speed * (spec.boss ? 1 : level.enemySpeed),
        dps: base.dps, reward: base.reward, armor: base.armor || 0,
        color: base.color, glyph: base.glyph,
        slowUntil: 0
      };
    }

    /* ── placement ── */
    function cellFromEvent(e) {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (canvas.width / r.width);
      const y = (e.clientY - r.top) * (canvas.height / r.height);
      const col = Math.floor(x / CELL), row = Math.floor(y / CELL);
      if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
      return { col: col, row: row };
    }
    function onMove(e) { hoverCell = cellFromEvent(e); }
    function onLeave() { hoverCell = null; }
    function onClick(e) {
      const c = cellFromEvent(e);
      if (!c) return;
      const existing = grid[c.row][c.col];
      if (existing) {                           // click a placed tower -> its menu
        if (cfg.onTower) cfg.onTower(towerInfo(existing), c, e);
        return;
      }
      if (!selected) return;
      if (bytes < selected.cost) { floater(c.col * CELL + CELL / 2, c.row * CELL + 14, 'Zu wenig Bytes', '#f4324c'); return; }
      bytes -= selected.cost;
      grid[c.row][c.col] = {
        stat: selected, row: c.row, col: c.col,
        x: c.col * CELL + CELL / 2, y: c.row * CELL + CELL / 2,
        hp: selected.hp, maxHp: selected.hp, cd: 0,
        dmg: selected.damage, tier: 0, invested: selected.cost
      };
      redrawIfIdle();
      notifyTowers();
    }
    // Redraw immediately when the game loop isn't running (e.g. placing before Start).
    function redrawIfIdle() { if (!running && !ended) { draw(); pushState(); } }

    // Report the current towers so the UI can render the DOM skin layer.
    function collectTowers() {
      const list = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const d = grid[r][c];
        if (d) list.push({ row: r, col: c, stat: d.stat, tier: d.tier });
      }
      return list;
    }
    function notifyTowers() { if (cfg.onTowers) cfg.onTowers(collectTowers(), { cols: cols, rows: rows }); }

    // ── tower upgrade / sell ──
    const MAX_TIER = 2;
    function upgradeCostOf(d) { return Math.round(d.stat.cost * (0.8 + d.tier * 0.5)); }
    function towerInfo(d) {
      return {
        row: d.row, col: d.col, name: d.stat.name, label: d.stat.label,
        tier: d.tier, maxTier: MAX_TIER, kind: d.stat.kind,
        dmg: Math.round(d.dmg * 10) / 10, hp: Math.round(d.hp), maxHp: d.maxHp,
        upgradeCost: d.tier >= MAX_TIER ? null : upgradeCostOf(d),
        refund: Math.round(d.invested * 0.6)
      };
    }
    function upgradeAt(row, col) {
      const d = grid[row][col];
      if (!d || d.tier >= MAX_TIER) return { ok: false, reason: 'max' };
      const cost = upgradeCostOf(d);
      if (bytes < cost) return { ok: false, reason: 'poor', cost: cost };
      bytes -= cost; d.tier += 1; d.invested += cost;
      d.dmg = Math.round(d.dmg * 1.5 * 10) / 10;
      const nm = Math.round(d.maxHp * 1.5);
      d.hp += (nm - d.maxHp); d.maxHp = nm;
      floater(d.x, d.y - 10, 'Upgrade!', '#34d399');
      redrawIfIdle();
      notifyTowers();
      return { ok: true, cost: cost };
    }
    function sellAt(row, col) {
      const d = grid[row][col];
      if (!d) return { ok: false };
      const refund = Math.round(d.invested * 0.6);
      bytes += refund; grid[row][col] = null;
      floater(d.x, d.y - 10, '+' + refund + 'B', '#fbbf24');
      redrawIfIdle();
      notifyTowers();
      return { ok: true, refund: refund };
    }
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('click', onClick);

    function floater(x, y, text, color) { floaters.push({ x: x, y: y, text: text, color: color, t: 0 }); }

    /* ── update ── */
    function update(dt) {
      elapsed += dt;
      bytes += level.byteRate * dt;
      spawnClock += dt;

      // spawn due enemies
      while (queue.length && queue[0].at <= elapsed) {
        enemies.push(makeEnemy(queue.shift()));
        spawnedCount++;
      }

      // defenders fire
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const d = grid[r][c]; if (!d) continue;
        const s = d.stat;
        if (s.kind === 'wall') continue;
        d.cd -= dt;
        const target = enemies.find(e => e.lane === r && e.x > d.x - CELL * 0.3);
        if (target && d.cd <= 0) {
          d.cd = 1 / s.fireRate;
          if (s.kind === 'aoe') {
            enemies.forEach(e => { if (e.lane === r && e.x > d.x) damageEnemy(e, d.dmg); });
            floaters.push({ lane: r, fromX: d.x, aoe: true, color: s.color, t: 0 });
          } else {
            projectiles.push({
              x: d.x + CELL * 0.3, y: d.y, lane: r, vx: s.projSpeed,
              damage: d.dmg, pierce: s.pierce, splash: s.splash,
              slow: s.kind === 'slow', slowFactor: s.slowFactor, slowTime: s.slowTime,
              color: s.color, shape: s.shape || 'bullet', spin: 0, hit: new Set()
            });
          }
        }
      }

      // projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.spin += dt * 12;
        let remove = p.x > cols * CELL + 20;
        for (const e of enemies) {
          if (e.lane !== p.lane || e.hp <= 0 || p.hit.has(e)) continue;
          if (Math.abs(p.x - e.x) < CELL * 0.42) {
            damageEnemy(e, p.damage);
            if (p.slow) { e.slowUntil = elapsed + (p.slowTime || 2); e.slowFactor = p.slowFactor || 0.5; }
            if (p.splash) {
              enemies.forEach(o => { if (o !== e && o.lane === p.lane && Math.abs(o.x - e.x) < p.splash) damageEnemy(o, p.damage * 0.5); });
              floaters.push({ x: p.x, y: p.y, ring: true, r0: p.splash, color: p.color, t: 0 });
            }
            p.hit.add(e);
            if (!p.pierce) { remove = true; break; }
          }
        }
        if (remove) projectiles.splice(i, 1);
      }

      // enemies move / eat
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.hp <= 0) { bytes += e.reward; enemies.splice(i, 1); continue; }
        const col = Math.floor(e.x / CELL);
        const blocker = (col >= 0 && col < cols) ? grid[e.lane][col] : null;
        if (blocker) {
          blocker.hp -= e.dps * dt;
          if (blocker.hp <= 0) grid[e.lane][col] = null;
        } else {
          const slowMul = elapsed < e.slowUntil ? (e.slowFactor || 0.5) : 1;
          e.x -= e.speed * slowMul * dt;
          if (e.x <= -CELL * 0.3) {
            enemies.splice(i, 1);
            lives -= 1;
            if (lives <= 0) return endGame(false);
          }
        }
      }

      // floaters age
      for (let i = floaters.length - 1; i >= 0; i--) { floaters[i].t += dt; if (floaters[i].t > 0.8) floaters.splice(i, 1); }

      // win?
      if (!queue.length && enemies.length === 0 && spawnedCount >= totalToSpawn) endGame(true);
    }

    function damageEnemy(e, dmg) { e.hp -= dmg * (1 - (e.armor || 0)); }

    /* ── render ── */
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // lanes
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(120,100,255,0.04)';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
      if (hoverCell && selected) {
        const ok = !grid[hoverCell.row][hoverCell.col] && bytes >= selected.cost;
        ctx.fillStyle = ok ? 'rgba(52,211,153,0.18)' : 'rgba(244,50,76,0.18)';
        ctx.fillRect(hoverCell.col * CELL, hoverCell.row * CELL, CELL, CELL);
      }
      // defenders: only the hp bar on canvas — the language icon + float skin
      // is a DOM overlay (see ui.js renderTowerLayer).
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const d = grid[r][c]; if (!d) continue;
        bar(c * CELL + 8, r * CELL + CELL - 9, CELL - 16, 3, d.hp / d.maxHp, '#34d399');
      }
      // aoe flashes
      floaters.forEach(f => {
        if (!f.aoe) return;
        ctx.globalAlpha = Math.max(0, 0.5 - f.t);
        ctx.fillStyle = f.color;
        ctx.fillRect(f.fromX, f.lane * CELL + 4, cols * CELL - f.fromX, CELL - 8);
        ctx.globalAlpha = 1;
      });
      // projectiles — a distinct look per archetype
      projectiles.forEach(drawProjectile);
      // enemies
      enemies.forEach(e => {
        const y = e.lane * CELL + CELL / 2;
        const size = e.boss ? 64 : 44;
        const rad = size / 2;
        const img = spriteFor(e.type);
        if (img && img.complete && img.naturalWidth) {
          ctx.drawImage(img, e.x - rad, y - rad, size, size);
        } else {
          ctx.beginPath(); ctx.arc(e.x, y, e.boss ? 26 : 16, 0, Math.PI * 2);
          ctx.fillStyle = e.color; ctx.fill();
          ctx.font = (e.boss ? '22px' : '15px') + ' serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(e.glyph, e.x, y);
        }
        bar(e.x - rad, y - rad - 6, size, 3, Math.max(0, e.hp / e.maxHp), e.boss ? '#f4324c' : '#ffd447');
        if (elapsed < e.slowUntil) { ctx.strokeStyle = 'rgba(56,189,248,0.8)'; ctx.beginPath(); ctx.arc(e.x, y, rad + 2, 0, Math.PI * 2); ctx.stroke(); }
      });
      // rings (splash impact) + text floaters
      floaters.forEach(f => {
        if (f.aoe) return;
        if (f.ring) {
          ctx.globalAlpha = Math.max(0, 0.6 - f.t * 0.8);
          ctx.strokeStyle = f.color; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(f.x, f.y, (f.r0 || 30) * (0.4 + f.t * 2.4), 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1; ctx.lineWidth = 1; return;
        }
        ctx.globalAlpha = Math.max(0, 1 - f.t);
        ctx.fillStyle = f.color; ctx.font = 'bold 12px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y - f.t * 20); ctx.globalAlpha = 1;
      });
    }

    // Draws a projectile in a style unique to its archetype shape.
    function drawProjectile(p) {
      const x = p.x, y = p.y;
      ctx.save();
      ctx.fillStyle = p.color; ctx.strokeStyle = p.color;
      switch (p.shape) {
        case 'tracer':
          ctx.globalAlpha = 0.45; ctx.fillRect(x - 13, y - 1.5, 13, 3); ctx.globalAlpha = 1;
          ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
          break;
        case 'diamond':
          ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-4.5, -4.5, 9, 9);
          break;
        case 'arrow':
          ctx.globalAlpha = 0.4; ctx.fillRect(x - 16, y - 1, 12, 2); ctx.globalAlpha = 1;
          ctx.beginPath(); ctx.moveTo(x + 9, y); ctx.lineTo(x - 5, y - 5); ctx.lineTo(x - 2, y); ctx.lineTo(x - 5, y + 5); ctx.closePath(); ctx.fill();
          break;
        case 'bomb':
          ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 5, y - 5, 2, 0, Math.PI * 2); ctx.fill();
          break;
        case 'cannon':
          ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(x - 11, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
          ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2); ctx.fill();
          break;
        case 'frost':
          ctx.translate(x, y); ctx.rotate(p.spin); ctx.lineWidth = 2;
          for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke(); }
          break;
        default:
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    function roundRect(x, y, w, h, r, color) {
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
    }
    function bar(x, y, w, h, pct, color) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = color; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, pct)), h);
    }

    /* ── loop ── */
    function frame(ts) {
      if (!running) return;
      const dt = Math.min(0.05, (ts - last) / 1000 || 0);
      last = ts;
      update(dt);
      if (ended) return;
      draw();
      pushState();
      requestAnimationFrame(frame);
    }
    function pushState() {
      if (cfg.onState) cfg.onState({
        bytes: Math.floor(bytes), lives: lives,
        remaining: totalToSpawn - (spawnedCount - enemies.length),
        killed: spawnedCount - enemies.length, total: totalToSpawn,
        label: level.label
      });
    }
    function endGame(w) {
      if (ended) return;
      ended = true; won = w; running = false;
      draw();
      if (cfg.onEnd) cfg.onEnd({ won: w, level: level });
    }

    function start() { if (running || ended) return; running = true; last = performance.now(); requestAnimationFrame(frame); pushState(); }
    function destroy() {
      running = false; ended = true;
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('click', onClick);
    }

    // Initial paint so the board shows before "Start".
    draw();

    return {
      start: start,
      destroy: destroy,
      select: function (stat) { selected = stat; },
      getSelected: function () { return selected; },
      upgradeAt: upgradeAt,
      sellAt: sellAt,
      cellSize: CELL, cols: cols, rows: rows
    };
  }

  global.FCSTd = { statFor, defendersFromInventory, newGame };
})(window);
