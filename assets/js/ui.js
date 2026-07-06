/*
 * ui.js — wires auth / gamification / shop into the page UI.
 * Depends on: FCSStore, FCSAuth, FCSGamify, FCSShop, FCSChallenges.
 */
(function (global) {
  'use strict';

  const Store = global.FCSStore;
  const Auth = global.FCSAuth;
  const Gamify = global.FCSGamify;
  const Shop = global.FCSShop;

  const SEEN_VERSION_KEY = 'fcs_seen_version';

  let overlay, dialog, toastWrap, achWrap;

  /* deferred module refs (may load in any order) */
  function Cases() { return global.FCSCases; }
  function CasesData() { return global.FCSCasesData; }
  function Ach() { return global.FCSAchievements; }
  function Admin() { return global.FCSAdmin; }
  function Sounds() { return global.FCSSounds; }

  function deviconClass(slug) { return `devicon-${slug}-plain colored`; }
  // Renders a language icon: a Devicon glyph when the item has a `slug`, else a
  // labelled/emoji badge fallback (item.glyph) for languages Devicon lacks.
  function iconMarkup(item) {
    if (item && item.slug) return `<i class="${deviconClass(item.slug)}"></i>`;
    const g = (item && item.glyph) || '?';
    const emoji = !/^[A-Za-z0-9#+]+$/.test(g); // label vs. emoji fallback
    return `<span class="lang-glyph${emoji ? ' is-emoji' : ''}">${esc(g)}</span>`;
  }
  // Wraps a language icon so its float/wear tier drives the visual condition
  // (glow & sparkle when good, scratches/flames when worn). See .skin-icon in cases.css.
  function skinIconHTML(item, wearId, floatVal) {
    const extreme = (typeof floatVal === 'number' && floatVal >= 0.90) ? ' float-extreme' : '';
    return `<span class="skin-icon wear-${wearId}${extreme}">${iconMarkup(item)}</span>`;
  }
  function rarityMeta(id) {
    const d = CasesData();
    return (d && d.RARITIES.find(r => r.id === id)) || { id: 'grey', name: 'Grau', color: '#9aa4b2' };
  }
  function wearMeta(id) {
    const d = CasesData();
    return (d && d.WEAR_TIERS.find(w => w.id === id)) || { name: '', short: '' };
  }

  /* ── small helpers ── */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function el(html) {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }
  function requireProfile() {
    const user = Auth.currentUser();
    if (!user) return null;
    return Store.getProfile(user);
  }

  /* ── toast ── */
  function toast(msg, kind) {
    if (!toastWrap) return;
    const t = el(`<div class="fcs-toast ${kind || ''}">${esc(msg)}</div>`);
    toastWrap.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity 0.4s, transform 0.4s';
      t.style.opacity = '0';
      t.style.transform = 'translateX(40px)';
      setTimeout(() => t.remove(), 400);
    }, 3200);
  }

  /* ── dialog control ── */
  function openDialog(innerHTML, wide) {
    dialog.className = 'fcs-dialog' + (wide ? ' wide' : '');
    dialog.innerHTML = innerHTML;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeDialog() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { dialog.innerHTML = ''; }, 300);
  }

  /* ── header widget ── */
  function renderHeader() {
    const mount = document.getElementById('userWidget');
    if (!mount) return;
    const user = Auth.currentUser();
    if (!user) {
      mount.innerHTML = '';
      mount.appendChild(el('<button class="btn-auth">Anmelden</button>'));
      mount.querySelector('.btn-auth').onclick = () => openAuth('login');
      return;
    }
    const p = Store.getProfile(user);
    mount.innerHTML = `
      <div class="user-stats">
        <span class="stat-pill pill-coins"><span class="ic">🪙</span>${p.coins}</span>
        <span class="stat-pill pill-streak"><span class="ic">🔥</span>${p.streak}</span>
        <span class="stat-pill pill-level"><span class="ic">⭐</span>Lv ${p.level}</span>
      </div>
      <span class="user-name">${esc(user)}</span>`;
    mount.querySelector('.user-name').onclick = openAccount;
  }

  /* ── auth dialog ── */
  function openAuth(mode) {
    mode = mode || 'login';
    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">Account</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="fcs-tabs">
          <div class="fcs-tab" data-mode="login">Login</div>
          <div class="fcs-tab" data-mode="register">Registrieren</div>
        </div>
        <div class="fcs-msg" id="authMsg"></div>
        <div class="fcs-field">
          <label>Benutzername</label>
          <input class="fcs-input" id="authUser" autocomplete="off" maxlength="20">
        </div>
        <div class="fcs-field">
          <label>Passwort</label>
          <input class="fcs-input" id="authPass" type="password">
        </div>
        <button class="fcs-btn" id="authSubmit">Los geht's</button>
        <p class="fcs-note">Hinweis: Accounts werden nur lokal in diesem Browser gespeichert (kein Server, keine E-Mail). Passwörter werden gehasht abgelegt. Daten sind nicht zwischen Geräten synchronisiert.</p>
      </div>`);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;

    const tabs = dialog.querySelectorAll('.fcs-tab');
    const submit = dialog.querySelector('#authSubmit');
    const msg = dialog.querySelector('#authMsg');
    let current = mode;

    function setMode(m) {
      current = m;
      tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === m));
      submit.textContent = m === 'login' ? 'Einloggen' : 'Account erstellen';
      msg.className = 'fcs-msg';
    }
    tabs.forEach(t => t.onclick = () => setMode(t.dataset.mode));
    setMode(mode);

    function showMsg(text, ok) {
      msg.textContent = text;
      msg.className = 'fcs-msg show ' + (ok ? 'ok' : 'error');
    }

    async function doSubmit() {
      const u = dialog.querySelector('#authUser').value;
      const pw = dialog.querySelector('#authPass').value;
      submit.disabled = true;
      try {
        const res = current === 'login' ? await Auth.login(u, pw) : await Auth.register(u, pw);
        if (!res.ok) { showMsg(res.error, false); return; }
        onLogin();
        closeDialog();
        toast(current === 'login' ? `Willkommen zurück, ${u}!` : `Account erstellt — willkommen, ${u}!`, 'level');
      } finally {
        submit.disabled = false;
      }
    }
    submit.onclick = doSubmit;
    dialog.querySelector('#authPass').addEventListener('keydown', e => { if (e.key === 'Enter') doSubmit(); });
  }

  /* ── after login/register ── */
  function onLogin() {
    const user = Auth.currentUser();
    if (!user) return;
    const p = Store.getProfile(user);
    Gamify.refreshStreakOnLoad(p);
    Store.saveProfile(user, p);
    Shop.applyTheme(p.activeTheme || 'default');
    renderHeader();
  }

  /* ── account / rewards dialog ── */
  function renderAchievementsSection(profile) {
    const A = Ach();
    if (!A) return '';
    const defs = A.DEFS;
    const owned = new Set(profile.achievements || []);
    const unlockedCount = defs.filter(d => owned.has(d.id)).length;
    const rows = defs.map(d => {
      const has = owned.has(d.id);
      const reward = [d.xp ? `+${d.xp} XP` : '', d.gold ? `+${d.gold} 🪙` : ''].filter(Boolean).join(' · ');
      return `
        <div class="ach-row ${has ? '' : 'locked'}">
          <div class="ar-icon">${has ? d.icon : '🔒'}</div>
          <div>
            <div class="ar-title">${esc(d.title)}</div>
            <div class="ar-desc">${esc(d.desc)}</div>
          </div>
          <div class="ar-reward">${reward}</div>
        </div>`;
    }).join('');
    return `
      <div class="ach-section-title">Errungenschaften</div>
      <div class="ach-progress">${unlockedCount} / ${defs.length} freigeschaltet</div>
      <div class="ach-list">${rows}</div>`;
  }


  function openAccount() {
    const user = Auth.currentUser();
    if (!user) return openAuth('login');
    const p = Store.getProfile(user);
    Gamify.refreshStreakOnLoad(p);
    Store.saveProfile(user, p);
    const prog = Gamify.levelProgress(p.xp);
    const canClaim = Gamify.canClaimDailyReward(p);
    const bonus = Gamify.streakBonus(p);

    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">${esc(user)}</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="acct-grid">
          <div class="acct-stat"><div class="num" style="color:#fbbf24">${p.coins}</div><div class="lbl">🪙 Coins</div></div>
          <div class="acct-stat"><div class="num" style="color:#fb7185">${p.streak}</div><div class="lbl">🔥 Streak</div></div>
          <div class="acct-stat"><div class="num" style="color:#60a5fa">${prog.level}</div><div class="lbl">⭐ Level</div></div>
        </div>
        <div class="xp-bar"><div class="xp-fill" style="width:${prog.pct}%"></div></div>
        <div class="xp-text">${prog.into} / ${prog.need} XP bis Level ${prog.level + 1}</div>
        <div class="xp-text" style="margin-top:6px">📦 Cases geöffnet: ${p.casesOpened || 0} &nbsp;·&nbsp; 🎒 Items: ${(p.inventory || []).length} &nbsp;·&nbsp; 🧩 Gelöst: ${p.solvedTotal || 0}</div>

        <div class="reward-box ${canClaim ? '' : 'claimed'}">
          <div class="rw-title">🎁 Täglicher Login-Bonus</div>
          <div class="rw-sub">${canClaim ? `Basis 25 🪙 + Streak-Bonus ${bonus} 🪙` : 'Heute bereits abgeholt — komm morgen wieder!'}</div>
          ${canClaim ? '<button class="fcs-btn" id="claimBtn">Belohnung abholen</button>' : ''}
        </div>

        ${renderAchievementsSection(p)}

        <button class="fcs-btn secondary" id="logoutBtn">Abmelden</button>
      </div>`);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelector('#logoutBtn').onclick = () => {
      Auth.logout();
      closeDialog();
      renderHeader();
      Shop.applyTheme('default');
      toast('Abgemeldet.', '');
    };
    const claimBtn = dialog.querySelector('#claimBtn');
    if (claimBtn) {
      claimBtn.onclick = () => {
        const prof = Store.getProfile(user);
        const res = Gamify.claimDailyReward(user, prof);
        if (res.claimed) {
          toast(`+${res.amount} 🪙 Login-Bonus!`, 'coin');
          renderHeader();
          runAchievementCheck();
          openAccount();
        }
      };
    }
  }

  /* ── challenges dialog ── */
  let activeDiffFilter = 'all';

  function openChallenges() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();
    renderChallenges();
  }

  function renderChallenges() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const daily = Gamify.getDailyChallenges();
    const solvedCount = daily.filter(c => Gamify.isSolvedToday(p, c.id)).length;

    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">Daily Challenges</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="xp-text" style="margin-bottom:14px">
          🔥 Streak: ${p.streak} &nbsp;·&nbsp; Heute gelöst: ${solvedCount}/${daily.length}
          &nbsp;·&nbsp; Löse 1 Aufgabe, um deine Streak zu verlängern.
        </div>
        <div class="diff-filter">
          ${['all', 'easy', 'medium', 'hard'].map(d =>
            `<div class="diff-chip ${activeDiffFilter === d ? 'active' : ''}" data-diff="${d}">${d === 'all' ? 'Alle' : d}</div>`).join('')}
        </div>
        <div id="challengeList"></div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelectorAll('.diff-chip').forEach(chip => {
      chip.onclick = () => { activeDiffFilter = chip.dataset.diff; renderChallenges(); };
    });

    const list = dialog.querySelector('#challengeList');
    const shown = daily.filter(c => activeDiffFilter === 'all' || c.difficulty === activeDiffFilter);
    if (!shown.length) { list.innerHTML = '<p class="xp-text">Keine Aufgaben in dieser Schwierigkeit heute.</p>'; return; }
    shown.forEach(c => list.appendChild(buildChallengeCard(c)));
  }

  const DIFF_LABEL = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' };
  const TYPE_LABEL = { mc: 'Multiple Choice', code: 'Code', free: 'Freitext' };

  function buildChallengeCard(c) {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const solved = Gamify.isSolvedToday(p, c.id);

    const card = el(`
      <div class="challenge-card ${solved ? 'solved' : ''}">
        <div class="ch-meta">
          <span class="ch-tag">${esc(c.lang)}</span>
          <span class="ch-tag d-${c.difficulty}">${DIFF_LABEL[c.difficulty]}</span>
          <span class="ch-tag">${TYPE_LABEL[c.type]}</span>
          <span class="ch-reward">${solved ? '✓ gelöst' : ''}</span>
        </div>
        <div class="ch-prompt">${esc(c.prompt)}</div>
        ${c.code ? `<div class="ch-code">${esc(c.code)}</div>` : ''}
        <div class="ch-body"></div>
        <div class="ch-feedback"></div>
      </div>`);

    const body = card.querySelector('.ch-body');
    const feedback = card.querySelector('.ch-feedback');

    function finishCorrect(userVal) {
      const prof = Store.getProfile(user);
      const res = Gamify.solveChallenge(user, prof, c, userVal);
      if (res.alreadySolved) return;
      if (!res.ok) { feedback.textContent = '✗ Leider falsch, versuch es nochmal.'; feedback.className = 'ch-feedback err'; return; }
      feedback.textContent = `✓ Richtig! +${res.coins} 🪙 +${res.xp} XP`;
      feedback.className = 'ch-feedback ok';
      card.classList.add('solved');
      toast(`+${res.coins} 🪙 · +${res.xp} XP`, 'coin');
      if (res.streak) toast(`🔥 Streak: ${res.streak} Tage!`, 'streak');
      if (res.leveledUp) toast(`⭐ Level ${res.newLevel} erreicht!`, 'level');
      renderHeader();
      runAchievementCheck();
    }

    if (solved) {
      body.innerHTML = '';
      return card;
    }

    if (c.type === 'mc') {
      const opts = el('<div class="ch-options"></div>');
      c.options.forEach((opt, i) => {
        const b = el(`<button class="ch-option">${esc(opt)}</button>`);
        b.onclick = () => {
          if (card.classList.contains('solved')) return;
          if (Number(i) === c.answer) {
            b.classList.add('correct');
            opts.querySelectorAll('.ch-option').forEach(o => o.disabled = true);
            finishCorrect(i);
          } else {
            b.classList.add('wrong');
            feedback.textContent = '✗ Leider falsch, versuch eine andere Option.';
            feedback.className = 'ch-feedback err';
          }
        };
        opts.appendChild(b);
      });
      body.appendChild(opts);
    } else if (c.type === 'code') {
      const wrap = el(`
        <div>
          <input class="fcs-input" placeholder="Deine Antwort…" style="margin-bottom:10px">
          <button class="fcs-btn" style="width:auto;padding:10px 18px">Prüfen</button>
        </div>`);
      const input = wrap.querySelector('input');
      const btn = wrap.querySelector('button');
      btn.onclick = () => finishCorrect(input.value);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') finishCorrect(input.value); });
      body.appendChild(wrap);
    } else { // free
      const wrap = el(`
        <div>
          <button class="fcs-btn secondary" style="width:auto;padding:10px 18px;margin-right:8px">Musterlösung zeigen</button>
          <button class="fcs-btn" style="width:auto;padding:10px 18px">Als erledigt markieren</button>
          <div class="ch-solution">${esc(c.solution || '')}</div>
        </div>`);
      const [showBtn, doneBtn] = wrap.querySelectorAll('button');
      const sol = wrap.querySelector('.ch-solution');
      showBtn.onclick = () => sol.classList.toggle('show');
      doneBtn.onclick = () => finishCorrect(true);
      body.appendChild(wrap);
    }
    return card;
  }

  /* ── shop dialog ── */
  function openShop() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();
    renderShop();
  }

  function renderShop() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">Theme-Shop</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="xp-text" style="margin-bottom:16px">Guthaben: <span style="color:#fbbf24">${p.coins} 🪙</span> — schalte Farb-Themes frei.</div>
        <div class="shop-grid" id="shopGrid"></div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;

    const grid = dialog.querySelector('#shopGrid');
    Shop.THEMES.forEach(theme => {
      const prof = Store.getProfile(user);
      const owned = Shop.owns(prof, theme.id);
      const active = prof.activeTheme === theme.id;
      const v = theme.vars;
      const swatch = `linear-gradient(135deg, ${v['--surface']} 0%, ${v['--bg']} 60%), radial-gradient(circle at 70% 30%, ${v['--glow']}, transparent 60%)`;
      let btnHtml;
      if (active) btnHtml = '<button class="theme-btn active" disabled>Aktiv ✓</button>';
      else if (owned) btnHtml = '<button class="theme-btn" data-act="activate">Anwenden</button>';
      else btnHtml = `<button class="theme-btn" data-act="buy">Kaufen · ${theme.price} 🪙</button>`;

      const card = el(`
        <div class="theme-card">
          <div class="theme-swatch" style="background:${swatch}"></div>
          <div class="theme-name">${esc(theme.name)}</div>
          <div class="theme-price">${theme.price === 0 ? 'Gratis' : theme.price + ' 🪙'}</div>
          ${btnHtml}
        </div>`);
      const btn = card.querySelector('button[data-act]');
      if (btn) {
        btn.onclick = () => {
          const prf = Store.getProfile(user);
          if (btn.dataset.act === 'buy') {
            const res = Shop.buyTheme(user, prf, theme.id);
            if (!res.ok) {
              toast(res.reason === 'insufficient' ? 'Nicht genug Coins.' : 'Bereits gekauft.', 'error');
              return;
            }
            toast(`"${theme.name}" gekauft!`, 'coin');
            Shop.activateTheme(user, Store.getProfile(user), theme.id);
          } else {
            Shop.activateTheme(user, prf, theme.id);
            toast(`Theme "${theme.name}" aktiviert.`, 'level');
          }
          renderHeader();
          renderShop();
        };
      }
      grid.appendChild(card);
    });
  }

  /* ── achievements: center popup queue + checking ── */
  let achQueue = [];
  let achShowing = false;

  function queueAchievements(list) {
    if (!list || !list.length) return;
    list.forEach(a => achQueue.push(a));
    if (!achShowing) showNextAchievement();
  }

  function showNextAchievement() {
    if (!achQueue.length) { achShowing = false; return; }
    achShowing = true;
    const def = achQueue.shift();
    const rewardBits = [];
    if (def.xp) rewardBits.push(`+${def.xp} XP`);
    if (def.gold) rewardBits.push(`+${def.gold} 🪙`);
    const pop = el(`
      <div class="ach-popup">
        <div class="ach-icon">${def.icon || '🏅'}</div>
        <div>
          <div class="ach-eyebrow">Errungenschaft freigeschaltet</div>
          <div class="ach-title">${esc(def.title)}</div>
          <div class="ach-desc">${esc(def.desc)}</div>
          <div class="ach-reward">${rewardBits.join('  ·  ')}</div>
        </div>
      </div>`);
    achWrap.appendChild(pop);
    // Visible for 10 seconds, then animate out and show the next one.
    setTimeout(() => {
      pop.classList.add('out');
      setTimeout(() => { pop.remove(); showNextAchievement(); }, 500);
    }, 10000);
  }

  function runAchievementCheck() {
    const user = Auth.currentUser();
    if (!user || !Ach()) return;
    const unlocked = Ach().check(user);
    if (unlocked.length) {
      queueAchievements(unlocked);
      renderHeader();
    }
  }

  /* ── cases ── */
  function openCases() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();

    // One-time forced coin reset (v2.1.1 anti-tamper). Runs exactly once per
    // user: neutralises any pre-update balances that may have been edited via
    // localStorage/cookies before signature protection existed.
    const rp = Store.getProfile(user);
    if (rp && rp.coinResetDone !== true) {
      rp.coins = 0;
      rp.coinResetDone = true;
      rp._tampered = false;
      Store.saveProfile(user, rp);
      renderHeader();
      toast('🔒 Sicherheitsupdate: Coins wurden zurückgesetzt.', 'error');
    } else if (rp && rp._tampered) {
      // Signature mismatch was detected on load and coins already wiped.
      rp._tampered = false;
      Store.saveProfile(user, rp);
      renderHeader();
      toast('⚠️ Manipulation erkannt — Coins zurückgesetzt.', 'error');
    }

    renderCases();
  }

  function renderCases() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const C = Cases();
    const oddsChips = CasesData().RARITIES.map(r =>
      `<span class="odds-chip r-${r.id}">${esc(r.name)} ${r.prob}%</span>`).join('');

    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">📦 Case öffnen</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="case-intro">
          <div class="case-cost">Kosten: ${C.CASE_COST} 🪙 &nbsp;·&nbsp; Guthaben: <span id="caseBal">${p.coins}</span> 🪙
            <button class="sound-toggle" id="soundToggle" title="Sound an/aus"></button>
          </div>
          <div class="case-counter">📦 Geöffnete Cases: <span id="caseCount">${p.casesOpened || 0}</span></div>
          <div class="case-odds">${oddsChips}</div>
        </div>
        <div class="reel-viewport" id="reelView">
          <div class="reel-marker"></div>
          <div class="reel-track" id="reelTrack"></div>
        </div>
        <div id="dropResult"></div>
        <button class="fcs-btn" id="openCaseBtn">Öffnen · ${C.CASE_COST} 🪙</button>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;

    // Fill an idle reel for visual flavour.
    fillIdleReel();

    // Sound on/off toggle.
    const sndBtn = dialog.querySelector('#soundToggle');
    if (sndBtn) {
      const Snd = Sounds();
      const paint = () => { sndBtn.textContent = (Snd && Snd.isMuted()) ? '🔇' : '🔊'; };
      paint();
      sndBtn.onclick = () => {
        if (!Snd) return;
        Snd.setMuted(!Snd.isMuted());
        if (!Snd.isMuted()) { Snd.resume(); Snd.tick(); }
        paint();
      };
    }

    const btn = dialog.querySelector('#openCaseBtn');
    btn.onclick = () => startCaseOpen(btn);
  }

  function reelItemHTML(it) {
    return `
      <div class="reel-item r-${it.rarity}">
        ${iconMarkup(it)}
        <span class="ri-name">${esc(it.name)}</span>
      </div>`;
  }

  function fillIdleReel() {
    const track = dialog.querySelector('#reelTrack');
    if (!track) return;
    const C = Cases();
    let html = '';
    for (let i = 0; i < 14; i++) {
      const r = C.rollRarity();
      const items = C.itemsByRarity(r.id);
      const it = items[Math.floor(Math.random() * items.length)];
      html += reelItemHTML({ slug: it.slug, name: it.name, rarity: r.id });
    }
    track.className = 'reel-track';
    track.style.transform = 'translateX(0)';
    track.innerHTML = html;
  }

  function startCaseOpen(btn) {
    const user = Auth.currentUser();
    let p = Store.getProfile(user);
    const C = Cases();
    if (!C.canOpen(p)) { toast('Nicht genug Gold für eine Case.', 'error'); return; }
    // Unlock audio here — this runs inside the button-click gesture.
    if (Sounds()) Sounds().resume();
    btn.disabled = true;
    dialog.querySelector('#dropResult').innerHTML = '';

    const res = C.openCase(user, p);
    if (!res.ok) { btn.disabled = false; toast('Öffnen fehlgeschlagen.', 'error'); return; }
    const drop = res.drop;
    const freshProfile = Store.getProfile(user);
    const balEl = dialog.querySelector('#caseBal');
    if (balEl) balEl.textContent = freshProfile.coins;
    const countEl = dialog.querySelector('#caseCount');
    if (countEl) countEl.textContent = freshProfile.casesOpened || 0;
    renderHeader();

    const built = C.buildReel(drop, 60);
    const track = dialog.querySelector('#reelTrack');
    const view = dialog.querySelector('#reelView');
    track.className = 'reel-track';
    track.style.transform = 'translateX(0)';
    track.innerHTML = built.reel.map(reelItemHTML).join('');

    // Compute landing offset so the winning item lands under the center marker.
    const ITEM = 104, GAP = 10, PAD = 10;
    const step = ITEM + GAP;
    const viewCenter = view.offsetWidth / 2;
    const itemCenter = PAD + built.winIndex * step + ITEM / 2;
    const jitter = (Math.random() * 40) - 20; // stay under the marker
    const target = viewCenter - itemCenter + jitter;

    // Force reflow, then animate.
    void track.offsetWidth;
    track.classList.add('spin');
    track.style.transform = `translateX(${target}px)`;

    // Drive the "tick" sound off the reel's live position so the ticks follow
    // the CSS easing: rapid at the start, slowing to single clicks as it lands.
    playReelTicks(track, step);

    setTimeout(() => {
      revealDrop(drop);
      btn.disabled = false;
      btn.textContent = `Nochmal öffnen · ${C.CASE_COST} 🪙`;
      if (drop.rarity === 'gold') showGoldExplosion(drop);
      runAchievementCheck();
    }, 6200);
  }

  // Reads the track's live translateX each frame and fires a tick sound every
  // time a new reel item crosses the center marker.
  function playReelTicks(track, step) {
    const Snd = Sounds();
    if (!Snd || !track) return;
    let lastIndex = 0;
    const start = performance.now();
    function frame() {
      let x = 0;
      const t = getComputedStyle(track).transform;
      if (t && t !== 'none') {
        try { x = new DOMMatrixReadOnly(t).m41; } catch (e) { x = 0; }
      }
      const idx = Math.floor(-x / step);
      if (idx > lastIndex) {
        // Cap per-frame ticks so the fast opening can't spam the audio graph.
        const n = Math.min(idx - lastIndex, 3);
        for (let i = 0; i < n; i++) Snd.tick();
        lastIndex = idx;
      }
      if (performance.now() - start < 6100) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function revealDrop(drop) {
    const Snd = Sounds();
    if (Snd) {
      if (drop.rarity === 'gold') Snd.gold();
      else Snd.reveal(drop.rarity);
    }
    const wear = wearMeta(drop.wearTier);
    const pinPct = Math.min(100, Math.max(0, drop.float * 100));
    const box = dialog.querySelector('#dropResult');
    if (!box) return;
    box.innerHTML = `
      <div class="drop-reveal r-${drop.rarity}">
        <div class="drop-card">
          <span class="rarity-label">${esc(rarityMeta(drop.rarity).name)}</span>
          ${skinIconHTML(drop, drop.wearTier, drop.float)}
          <div class="drop-name">${esc(drop.name)}</div>
          <div class="drop-wear">${esc(wear.name)} · Float ${drop.float.toFixed(4)}</div>
          <div class="wear-bar"><div class="wear-pin" style="left:${pinPct}%"></div></div>
        </div>
      </div>`;
    toast(`Gedroppt: ${drop.name} (${rarityMeta(drop.rarity).name})`, drop.rarity === 'gold' ? 'coin' : '');
  }

  function showGoldExplosion(drop) {
    const ov = el(`
      <div class="gold-explosion">
        <div class="rays"></div>
        <div class="gold-core">
          ${iconMarkup(drop)}
          <div class="gold-title">LEGENDÄR</div>
          <div class="gold-name">${esc(drop.name)}</div>
          <div class="gold-sub">GOLD · ${esc(wearMeta(drop.wearTier).name)} · Float ${drop.float.toFixed(4)}</div>
          <button class="gold-dismiss">Sensationell!</button>
        </div>
      </div>`);
    // Confetti
    const colors = ['#ffb700', '#fff3b0', '#ff9a00', '#ffd447', '#ffcf33'];
    for (let i = 0; i < 80; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.animationDuration = (1.8 + Math.random() * 2.4) + 's';
      c.style.animationDelay = (Math.random() * 0.8) + 's';
      ov.appendChild(c);
    }
    document.body.appendChild(ov);
    const dismiss = () => ov.remove();
    ov.querySelector('.gold-dismiss').onclick = dismiss;
    ov.addEventListener('click', e => { if (e.target === ov) dismiss(); });
  }

  /* ── inventory ── */
  let invFilter = 'all';

  function openInventory() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();
    renderInventory();
  }

  function renderInventory() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const items = (p.inventory || []).slice();
    const order = { gold: 0, red: 1, epic: 2, blue: 3, grey: 4 };
    items.sort((a, b) => (order[a.rarity] - order[b.rarity]) || (b.obtainedAt - a.obtainedAt));

    const chips = ['all'].concat(CasesData().RARITIES.map(r => r.id));
    const chipHtml = chips.map(id => {
      const label = id === 'all' ? `Alle (${items.length})` : rarityMeta(id).name;
      const cls = id === 'all' ? '' : 'r-' + id;
      return `<div class="inv-chip ${cls} ${invFilter === id ? 'active' : ''}" data-f="${id}">${label}</div>`;
    }).join('');

    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">🎒 Inventar</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="inv-toolbar">${chipHtml}</div>
        <div id="invGrid"></div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelectorAll('.inv-chip').forEach(ch => {
      ch.onclick = () => { invFilter = ch.dataset.f; renderInventory(); };
    });

    const grid = dialog.querySelector('#invGrid');
    const shown = items.filter(it => invFilter === 'all' || it.rarity === invFilter);
    if (!shown.length) {
      grid.innerHTML = '<div class="inv-empty">Noch keine Items — öffne eine Case! 📦</div>';
      return;
    }
    grid.className = 'inv-grid';
    grid.innerHTML = shown.map(it => {
      const wear = wearMeta(it.wearTier);
      return `
        <div class="inv-item r-${it.rarity}">
          ${skinIconHTML(it, it.wearTier, it.float)}
          <div class="inv-name">${esc(it.name)}</div>
          <div class="inv-wear-line">${esc(wear.short)} · ${esc(rarityMeta(it.rarity).name)}</div>
          <div class="inv-float">${it.float.toFixed(4)}</div>
        </div>`;
    }).join('');
  }

  /* ── admin gold ── */
  function openAdmin() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">🔐 Admin</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="fcs-msg" id="admMsg"></div>
        <div class="fcs-field">
          <label>Code</label>
          <input class="fcs-input" id="admCode" type="password" autocomplete="off">
        </div>
        <div class="fcs-field">
          <label>Menge Gold</label>
          <input class="fcs-input" id="admAmount" type="number" value="${Admin() ? Admin().DEFAULT_AMOUNT : 10000}">
        </div>
        <button class="fcs-btn" id="admSubmit">Gold hinzufügen</button>
        <p class="admin-note">Zugriff via Strg+Umschalt+G.</p>
      </div>`);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    const msg = dialog.querySelector('#admMsg');
    dialog.querySelector('#admSubmit').onclick = () => {
      const code = dialog.querySelector('#admCode').value;
      const amount = dialog.querySelector('#admAmount').value;
      if (!Admin() || !Admin().verify(code)) {
        msg.textContent = 'Falscher Code.';
        msg.className = 'fcs-msg show error';
        return;
      }
      const res = Admin().grant(amount);
      if (!res.ok) { msg.textContent = 'Fehler: ' + res.reason; msg.className = 'fcs-msg show error'; return; }
      renderHeader();
      runAchievementCheck();
      closeDialog();
      toast(`+${res.added} 🪙 hinzugefügt.`, 'coin');
    };
  }

  /* ── changelog / "what's new" dialog ── */
  function openChangelog() {
    const cl = global.FCSChangelog;
    if (!cl) return;
    const rows = cl.features.map(f => `
      <div class="cl-row">
        <div class="cl-icon">${f.icon}</div>
        <div class="cl-text">
          <div class="cl-title">${esc(f.title)}</div>
          <div class="cl-desc">${esc(f.text)}</div>
        </div>
      </div>`).join('');

    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">✨ Was ist neu — v${esc(cl.version)}</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="cl-banner">
          <div class="cl-codename">${esc(cl.codename)}</div>
          <div class="cl-date">${esc(cl.date)}</div>
        </div>
        <p class="cl-intro">${esc(cl.intro)}</p>
        <div class="cl-list">${rows}</div>
        <button class="fcs-btn" id="clDone">Los geht's!</button>
      </div>`);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelector('#clDone').onclick = closeDialog;
  }

  function markVersionSeen() {
    const cl = global.FCSChangelog;
    if (cl) { try { localStorage.setItem(SEEN_VERSION_KEY, cl.version); } catch (e) {} }
  }

  function maybeShowChangelog() {
    const cl = global.FCSChangelog;
    if (!cl) return;
    let seen = null;
    try { seen = localStorage.getItem(SEEN_VERSION_KEY); } catch (e) {}
    if (seen !== cl.version) {
      openChangelog();
      markVersionSeen();
    }
  }

  /* ── init ── */
  function init() {
    overlay = el('<div class="fcs-dialog-overlay" id="fcsOverlay"><div class="fcs-dialog" id="fcsDialog"></div></div>');
    document.body.appendChild(overlay);
    dialog = overlay.querySelector('#fcsDialog');
    overlay.addEventListener('click', e => { if (e.target === overlay) closeDialog(); });

    toastWrap = el('<div class="fcs-toast-wrap" id="fcsToasts"></div>');
    document.body.appendChild(toastWrap);

    achWrap = el('<div class="ach-popup-wrap" id="fcsAchievements"></div>');
    document.body.appendChild(achWrap);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeDialog();
    });

    // Wire the header version badge to (re)open the changelog.
    const badge = document.getElementById('versionBadge');
    if (badge) { badge.style.cursor = 'pointer'; badge.onclick = openChangelog; }

    // Restore session state (streak refresh + theme).
    const user = Auth.currentUser();
    if (user && Store.getProfile(user)) {
      onLogin();
      // Nudge the user if a daily reward is available.
      const p = Store.getProfile(user);
      if (Gamify.canClaimDailyReward(p)) {
        setTimeout(() => toast('🎁 Dein täglicher Bonus wartet! Klick auf deinen Namen.', 'coin'), 800);
      }
      // Backfill any achievements already earned (e.g. existing streak).
      setTimeout(runAchievementCheck, 1200);
    } else {
      renderHeader();
    }

    // Show the "what's new" popup once per browser version.
    maybeShowChangelog();
  }

  global.FCSApp = {
    init, renderHeader,
    openAuth, openAccount, openChallenges, openShop, openChangelog,
    openCases, openInventory, openAdmin
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
