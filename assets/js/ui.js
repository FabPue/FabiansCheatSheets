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
  function Collections() { return global.FCSCollections; }
  function Td() { return global.FCSTd; }
  function TdData() { return global.FCSTdData; }
  function Match3() { return global.FCSMatch3; }
  function Slots() { return global.FCSSlots; }
  function SlotsData() { return global.FCSSlotsData; }
  function Cosmetics() { return global.FCSCosmetics; }

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
    const f = typeof floatVal === 'number' ? floatVal : null;
    const extreme = (f !== null && f >= 0.90) ? ' float-extreme' : '';
    const pristine = (f !== null && f < 0.05) ? ' float-pristine' : '';
    // Extra overlay layers: roaming shimmer for pristine floats, chaotic
    // flames for extreme floats (styled in cases.css).
    let extra = '';
    if (pristine) extra = '<span class="pristine-shimmer" aria-hidden="true"></span>';
    else if (extreme) extra = '<span class="flames" aria-hidden="true"></span>';
    return `<span class="skin-icon wear-${wearId}${extreme}${pristine}">${iconMarkup(item)}${extra}</span>`;
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
  let activeGame = null;
  let tdMenu = null;
  function closeTowerMenu() {
    if (tdMenu) { tdMenu.remove(); tdMenu = null; document.removeEventListener('click', tdOutsideCloser); }
  }
  function tdOutsideCloser(e) { if (tdMenu && !tdMenu.contains(e.target)) closeTowerMenu(); }
  let slotTimers = [], slotBusy = false, slotBet = 10;
  function clearSlotTimers() { slotTimers.forEach(t => { clearInterval(t); clearTimeout(t); }); slotTimers = []; slotBusy = false; }
  function stopActiveGame() { closeTowerMenu(); clearSlotTimers(); if (activeGame) { activeGame.destroy(); activeGame = null; } }

  function openDialog(innerHTML, wide) {
    stopActiveGame();
    dialog.className = 'fcs-dialog' + (wide === true ? ' wide' : (wide ? ' ' + wide : ''));
    dialog.innerHTML = innerHTML;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeDialog() {
    stopActiveGame();
    if (typeof hideDropPopup === 'function') hideDropPopup();
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
    if (Cosmetics()) Cosmetics().render(p);
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
        <div class="reel-stack" id="reelStack">
          <div class="reel-viewport reel-extra" id="reelViewTop" style="display:none">
            <div class="reel-marker"></div>
            <div class="reel-track" id="reelTrackTop"></div>
          </div>
          <div class="reel-viewport" id="reelView">
            <div class="reel-marker"></div>
            <div class="reel-track" id="reelTrack"></div>
          </div>
          <div class="reel-viewport reel-extra" id="reelViewBottom" style="display:none">
            <div class="reel-marker"></div>
            <div class="reel-track" id="reelTrackBottom"></div>
          </div>
        </div>
        <div id="dropResult"></div>
        <div class="case-btns">
          <button class="fcs-btn" id="openCaseBtn">Öffnen · ${C.CASE_COST} 🪙</button>
          <button class="fcs-btn case-triple" id="openCase3Btn">3× öffnen · 100 🪙</button>
        </div>
      </div>`, 'xwide');
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
    const btn3 = dialog.querySelector('#openCase3Btn');
    if (btn3) btn3.onclick = () => startTripleOpen(btn3);
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

  // Fills a reel viewport with a spin that lands on `drop`; starts the CSS
  // animation and returns the per-item step (px) used for tick timing.
  function spinReel(view, track, drop) {
    const C = Cases();
    const built = C.buildReel(drop, 60);
    track.className = 'reel-track';
    track.style.transform = 'translateX(0)';
    track.innerHTML = built.reel.map(reelItemHTML).join('');
    const ITEM = 92, GAP = 10, PAD = 10;
    const step = ITEM + GAP;
    const viewCenter = view.offsetWidth / 2;
    const itemCenter = PAD + built.winIndex * step + ITEM / 2;
    const jitter = (Math.random() * 40) - 20; // stay under the marker
    const target = viewCenter - itemCenter + jitter;
    void track.offsetWidth; // force reflow
    track.classList.add('spin');
    track.style.transform = `translateX(${target}px)`;
    return step;
  }

  function updateCaseHud(user) {
    const fresh = Store.getProfile(user);
    const balEl = dialog.querySelector('#caseBal');
    if (balEl) balEl.textContent = fresh.coins;
    const countEl = dialog.querySelector('#caseCount');
    if (countEl) countEl.textContent = fresh.casesOpened || 0;
    renderHeader();
  }

  function setReelExtras(show) {
    const t = dialog.querySelector('#reelViewTop'), b = dialog.querySelector('#reelViewBottom');
    if (t) t.style.display = show ? '' : 'none';
    if (b) b.style.display = show ? '' : 'none';
  }

  function startCaseOpen(btn) {
    const user = Auth.currentUser();
    let p = Store.getProfile(user);
    const C = Cases();
    if (!C.canOpen(p)) { toast('Nicht genug Gold für eine Case.', 'error'); return; }
    // Unlock audio here — this runs inside the button-click gesture.
    if (Sounds()) Sounds().resume();
    const btn3 = dialog.querySelector('#openCase3Btn');
    btn.disabled = true; if (btn3) btn3.disabled = true;
    dialog.querySelector('#dropResult').innerHTML = '';
    hideDropPopup();
    setReelExtras(false);

    const res = C.openCase(user, p);
    if (!res.ok) { btn.disabled = false; if (btn3) btn3.disabled = false; toast('Öffnen fehlgeschlagen.', 'error'); return; }
    const drop = res.drop;
    updateCaseHud(user);

    const step = spinReel(dialog.querySelector('#reelView'), dialog.querySelector('#reelTrack'), drop);
    playReelTicks(dialog.querySelector('#reelTrack'), step);

    setTimeout(() => {
      revealDrops([drop]);
      btn.disabled = false; if (btn3) btn3.disabled = false;
      btn.textContent = `Nochmal öffnen · ${C.CASE_COST} 🪙`;
      if (drop.rarity === 'gold') showGoldExplosion(drop);
      runAchievementCheck();
    }, 6200);
  }

  const TRIPLE_COST = 100;
  function startTripleOpen(btn) {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const C = Cases();
    if (p.coins < TRIPLE_COST) { toast('Nicht genug Gold (100) für 3× öffnen.', 'error'); return; }
    if (Sounds()) Sounds().resume();
    const single = dialog.querySelector('#openCaseBtn');
    btn.disabled = true; if (single) single.disabled = true;
    dialog.querySelector('#dropResult').innerHTML = '';
    hideDropPopup();
    setReelExtras(true);

    const res = C.openCaseN(user, p, 3, TRIPLE_COST);
    if (!res.ok) { btn.disabled = false; if (single) single.disabled = false; toast('Öffnen fehlgeschlagen.', 'error'); return; }
    const drops = res.drops;
    updateCaseHud(user);

    const step = spinReel(dialog.querySelector('#reelView'), dialog.querySelector('#reelTrack'), drops[0]);
    spinReel(dialog.querySelector('#reelViewTop'), dialog.querySelector('#reelTrackTop'), drops[1]);
    spinReel(dialog.querySelector('#reelViewBottom'), dialog.querySelector('#reelTrackBottom'), drops[2]);
    playReelTicks(dialog.querySelector('#reelTrack'), step);

    setTimeout(() => {
      revealDrops(drops);
      btn.disabled = false; if (single) single.disabled = false;
      const gold = drops.find(d => d.rarity === 'gold');
      if (gold) showGoldExplosion(gold);
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

  // Special one-liners for notable floats. Ordered best -> worst; first match wins.
  const FLOAT_PHRASES = [
    { max: 0.0001, text: 'Absolute Spitzenklasse! 🏆', kind: 'great' },
    { max: 0.0010, text: 'Traumhafter Float! ✨',       kind: 'great' },
    { max: 0.0100, text: 'Richtig sauber. 😎',           kind: 'great' },
    { min: 0.9999, text: 'Geh bitte nicht gambeln. 💀',  kind: 'bad' },
    { min: 0.9900, text: 'Autsch… richtig ranzig. 🤢',   kind: 'bad' },
    { min: 0.9500, text: 'Das riecht schon. 🗑️',        kind: 'bad' }
  ];

  function floatPhrase(f) {
    for (const p of FLOAT_PHRASES) {
      if (p.max !== undefined && f <= p.max) return p;
      if (p.min !== undefined && f >= p.min) return p;
    }
    return null;
  }

  function showFloatPhrase(phrase, floatVal) {
    if (!phrase || !achWrap) return;
    const pop = el(`
      <div class="float-phrase ${phrase.kind}">
        <div class="fp-float">${floatVal.toFixed(4)}</div>
        <div class="fp-text">${esc(phrase.text)}</div>
      </div>`);
    achWrap.appendChild(pop);
    setTimeout(() => {
      pop.classList.add('out');
      setTimeout(() => pop.remove(), 500);
    }, 4200);
  }

  function dropCardHTML(drop) {
    const wear = wearMeta(drop.wearTier);
    const pinPct = Math.min(100, Math.max(0, drop.float * 100));
    return `
      <div class="drop-reveal r-${drop.rarity}">
        <div class="drop-card">
          <span class="rarity-label">${esc(rarityMeta(drop.rarity).name)}</span>
          ${skinIconHTML(drop, drop.wearTier, drop.float)}
          <div class="drop-name">${esc(drop.name)}</div>
          <div class="drop-wear">${esc(wear.name)} · Float ${drop.float.toFixed(4)}</div>
          <div class="wear-bar"><div class="wear-pin" style="left:${pinPct}%"></div></div>
        </div>
      </div>`;
  }

  /* ── drawn-drops popup (fades in on the right, auto-hides after 5s) ──
     Keeps the reveal out of the dialog flow so the open buttons never move. */
  let caseDropTimer = null;
  function ensureDropPopup() {
    let pop = document.getElementById('caseDropPopup');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'caseDropPopup';
      pop.className = 'case-drop-pop';
      document.body.appendChild(pop);
    }
    return pop;
  }
  function hideDropPopup() {
    if (caseDropTimer) { clearTimeout(caseDropTimer); caseDropTimer = null; }
    const pop = document.getElementById('caseDropPopup');
    if (pop) pop.classList.remove('show');
  }
  function dropPopItemHTML(drop) {
    const wear = wearMeta(drop.wearTier);
    return `
      <div class="cdp-item r-${drop.rarity}">
        <span class="rarity-label">${esc(rarityMeta(drop.rarity).name)}</span>
        ${skinIconHTML(drop, drop.wearTier, drop.float)}
        <div class="cdp-name">${esc(drop.name)}</div>
        <div class="cdp-wear">${esc(wear.name)} · ${drop.float.toFixed(4)}</div>
      </div>`;
  }
  // Shows the drawn drops; replaces any current popup and restarts the timer.
  function showDropPopup(drops) {
    const pop = ensureDropPopup();
    if (caseDropTimer) { clearTimeout(caseDropTimer); caseDropTimer = null; }
    const title = drops.length > 1 ? 'Gezogen (' + drops.length + ')' : 'Gezogen';
    pop.innerHTML = `<div class="cdp-title">${title}</div>${drops.map(dropPopItemHTML).join('')}`;
    void pop.offsetWidth; // restart the item pop-in animation
    pop.classList.add('show');
    caseDropTimer = setTimeout(() => { pop.classList.remove('show'); caseDropTimer = null; }, 5000);
  }

  // Reveals one or several drops in the fading right-side popup.
  function revealDrops(drops) {
    const Snd = Sounds();
    const order = { grey: 0, blue: 1, epic: 2, red: 3, gold: 4 };
    const anyGold = drops.some(d => d.rarity === 'gold');
    if (Snd) {
      if (anyGold) Snd.gold();
      else Snd.reveal(drops.slice().sort((a, b) => order[b.rarity] - order[a.rarity])[0].rarity);
    }
    const box = dialog.querySelector('#dropResult');
    if (box) box.innerHTML = '';
    showDropPopup(drops);
    toast(`Gedroppt: ${drops.map(d => d.name).join(', ')}`, anyGold ? 'coin' : '');
    const bestFloat = drops.slice().sort((a, b) => a.float - b.float)[0];
    showFloatPhrase(floatPhrase(bestFloat.float), bestFloat.float);
  }

  function revealDrop(drop) { revealDrops([drop]); }

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
  let invSort = 'az';                 // 'az' | 'rarity'
  const invExpanded = {};             // language name -> expanded?

  function openInventory() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();
    renderInventory();
  }

  // Groups inventory by language name; each group keeps its items sorted by
  // float ascending (best first). Returns array of { name, rarity, items, best }.
  function groupInventory(items) {
    const map = new Map();
    items.forEach(it => {
      if (!map.has(it.name)) map.set(it.name, []);
      map.get(it.name).push(it);
    });
    const groups = [];
    map.forEach((list, name) => {
      list.sort((a, b) => a.float - b.float);
      groups.push({ name: name, rarity: list[0].rarity, items: list, best: list[0] });
    });
    return groups;
  }

  function renderInventory() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const items = (p.inventory || []).slice();
    const order = { gold: 0, red: 1, epic: 2, blue: 3, grey: 4 };

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
        <div class="inv-sort">
          <span class="inv-sort-label">Sortieren:</span>
          <div class="inv-sort-chip ${invSort === 'az' ? 'active' : ''}" data-s="az">A–Z</div>
          <div class="inv-sort-chip ${invSort === 'rarity' ? 'active' : ''}" data-s="rarity">Seltenheit</div>
        </div>
        <div id="invGrid"></div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelectorAll('.inv-chip').forEach(ch => {
      ch.onclick = () => { invFilter = ch.dataset.f; renderInventory(); };
    });
    dialog.querySelectorAll('.inv-sort-chip').forEach(ch => {
      ch.onclick = () => { invSort = ch.dataset.s; renderInventory(); };
    });

    const grid = dialog.querySelector('#invGrid');
    const filtered = items.filter(it => invFilter === 'all' || it.rarity === invFilter);
    if (!filtered.length) {
      grid.innerHTML = '<div class="inv-empty">Noch keine Items — öffne eine Case! 📦</div>';
      return;
    }

    let groups = groupInventory(filtered);
    if (invSort === 'az') {
      groups.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      groups.sort((a, b) => (order[a.rarity] - order[b.rarity]) || a.name.localeCompare(b.name));
    }

    grid.className = 'inv-grid';
    grid.innerHTML = groups.map(g => {
      const wear = wearMeta(g.best.wearTier);
      const multi = g.items.length > 1;
      const expanded = multi && invExpanded[g.name];
      const others = g.items.map((it, i) =>
        `<div class="inv-sub-row"><span>#${i + 1}</span><span>${esc(wearMeta(it.wearTier).short)}</span><span class="inv-sub-float">${it.float.toFixed(4)}</span></div>`
      ).join('');
      return `
        <div class="inv-item r-${g.rarity} ${multi ? 'has-more' : ''} ${expanded ? 'expanded' : ''}" data-name="${esc(g.name)}">
          ${multi ? `<span class="inv-count">×${g.items.length}</span>` : ''}
          ${skinIconHTML(g.best, g.best.wearTier, g.best.float)}
          <div class="inv-name">${esc(g.name)}</div>
          <div class="inv-wear-line">${esc(wear.short)} · ${esc(rarityMeta(g.rarity).name)}</div>
          <div class="inv-float">${g.best.float.toFixed(4)}${multi ? ' <span class="inv-best-tag">beste</span>' : ''}</div>
          ${multi ? `<div class="inv-sublist">${others}</div>` : ''}
        </div>`;
    }).join('');

    grid.querySelectorAll('.inv-item.has-more').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.name;
        invExpanded[name] = !invExpanded[name];
        card.classList.toggle('expanded', invExpanded[name]);
      });
    });
  }

  /* ── marketplace: sell items for coins ── */
  let marketFilter = 'all';

  function openMarket() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();
    renderMarket();
  }

  function renderMarket() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const C = Cases();
    const items = (p.inventory || []).slice();
    const order = { gold: 0, red: 1, epic: 2, blue: 3, grey: 4 };
    items.sort((a, b) => (order[a.rarity] - order[b.rarity]) || (a.float - b.float));

    const chips = ['all'].concat(CasesData().RARITIES.map(r => r.id));
    const chipHtml = chips.map(id => {
      const label = id === 'all' ? `Alle (${items.length})` : rarityMeta(id).name;
      const cls = id === 'all' ? '' : 'r-' + id;
      return `<div class="inv-chip ${cls} ${marketFilter === id ? 'active' : ''}" data-f="${id}">${label}</div>`;
    }).join('');

    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">💰 Marktplatz</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="xp-text" style="margin-bottom:12px">Guthaben: <span style="color:#fbbf24" id="mktBal">${p.coins}</span> 🪙 — verkaufe Items für Coins. Besserer Float = mehr wert.</div>
        <div class="inv-toolbar">${chipHtml}</div>
        <div class="market-actions">
          <button class="fcs-btn secondary" data-sell="grey" style="width:auto;padding:8px 14px">Alle Grauen verkaufen</button>
          <button class="fcs-btn secondary" data-sell="grey,blue" style="width:auto;padding:8px 14px">Grau + Blau verkaufen</button>
        </div>
        <div id="marketGrid"></div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelectorAll('.inv-chip').forEach(ch => {
      ch.onclick = () => { marketFilter = ch.dataset.f; renderMarket(); };
    });
    dialog.querySelectorAll('[data-sell]').forEach(btn => {
      btn.onclick = () => {
        const rar = btn.dataset.sell.split(',');
        const prof = Store.getProfile(user);
        const res = C.sellAll(user, prof, rar);
        if (!res.count) { toast('Nichts zu verkaufen.', ''); return; }
        toast(`${res.count} Items verkauft · +${res.total} 🪙`, 'coin');
        renderHeader();
        renderMarket();
      };
    });

    const grid = dialog.querySelector('#marketGrid');
    const shown = items.filter(it => marketFilter === 'all' || it.rarity === marketFilter);
    if (!shown.length) {
      grid.innerHTML = '<div class="inv-empty">Keine Items zum Verkaufen — öffne eine Case! 📦</div>';
      return;
    }
    grid.className = 'inv-grid';
    grid.innerHTML = shown.map(it => {
      const wear = wearMeta(it.wearTier);
      return `
        <div class="inv-item r-${it.rarity}" data-uid="${esc(it.uid)}">
          ${skinIconHTML(it, it.wearTier, it.float)}
          <div class="inv-name">${esc(it.name)}</div>
          <div class="inv-wear-line">${esc(wear.short)} · ${it.float.toFixed(4)}</div>
          <button class="market-sell-btn">Verkaufen · ${C.sellValue(it)} 🪙</button>
        </div>`;
    }).join('');
    grid.querySelectorAll('.inv-item').forEach(card => {
      const uid = card.dataset.uid;
      card.querySelector('.market-sell-btn').onclick = () => {
        const prof = Store.getProfile(user);
        const res = C.sellItem(user, prof, uid);
        if (!res.ok) { toast('Verkauf fehlgeschlagen.', 'error'); return; }
        toast(`Verkauft · +${res.value} 🪙`, 'coin');
        renderHeader();
        renderMarket();
      };
    });
  }

  /* ── collections ── */
  function openCollections() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();
    renderCollections();
  }

  function renderCollections() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const Col = Collections();
    if (!Col) return;

    const cards = Col.COLLECTIONS.map(c => {
      const prog = Col.collectionProgress(p, c);
      const claimed = Col.isClaimed(p, c.id);
      const inv = p.inventory || [];
      const reqChips = c.req.map(r => {
        const met = inv.some(it => it.name === r.name && (!r.wear || it.wearTier === r.wear));
        const wearTag = r.wear ? ` <span class="coll-wear">${esc(wearMeta(r.wear).short)}</span>` : '';
        return `<span class="coll-req ${met ? 'met' : ''}">${met ? '✓' : '○'} ${esc(r.name)}${wearTag}</span>`;
      }).join('');
      const pct = Math.round((prog.have / prog.need) * 100);
      let btn;
      if (claimed) btn = '<span class="coll-claimed">✓ Belohnung erhalten</span>';
      else if (prog.done) btn = `<button class="fcs-btn" data-claim="${c.id}" style="width:auto;padding:8px 16px">Belohnung abholen · +${c.reward.coins} 🪙</button>`;
      else btn = `<span class="coll-reward-hint">Belohnung: +${c.reward.coins} 🪙 · +${c.reward.xp} XP</span>`;

      return `
        <div class="coll-card ${prog.done ? 'done' : ''}">
          <div class="coll-head">
            <span class="coll-icon">${c.icon}</span>
            <div>
              <div class="coll-name">${esc(c.name)}</div>
              <div class="coll-desc">${esc(c.desc)}</div>
            </div>
            <span class="coll-count">${prog.have}/${prog.need}</span>
          </div>
          <div class="coll-bar"><div class="coll-fill" style="width:${pct}%"></div></div>
          <div class="coll-reqs">${reqChips}</div>
          <div class="coll-foot">${btn}</div>
        </div>`;
    }).join('');

    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">🏆 Collections</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="xp-text" style="margin-bottom:14px">Sammle bestimmte Sprachen (teils in bestimmten Floats) und kassiere Belohnungen.</div>
        <div class="coll-list">${cards}</div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelectorAll('[data-claim]').forEach(btn => {
      btn.onclick = () => {
        const prof = Store.getProfile(user);
        const res = Col.claim(user, prof, btn.dataset.claim);
        if (!res.ok) { toast('Abholen nicht möglich.', 'error'); return; }
        // Reflect any XP-driven level change and re-check achievements.
        const p2 = Store.getProfile(user);
        p2.level = Gamify.levelForXp(p2.xp);
        Store.saveProfile(user, p2);
        toast(`Collection abgeschlossen! +${res.reward.coins} 🪙 +${res.reward.xp} XP`, 'coin');
        renderHeader();
        runAchievementCheck();
        renderCollections();
      };
    });
  }

  /* ── float leaderboard (local) ── */
  function openLeaderboard() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();
    renderLeaderboard();
  }

  function renderLeaderboard() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    // Lower float = better condition, so rank ascending by float.
    const items = (p.inventory || []).slice().sort((a, b) => a.float - b.float);
    const top = items.slice(0, 15);
    const best = items[0];

    const rows = top.map((it, i) => {
      const wear = wearMeta(it.wearTier);
      return `
        <div class="lb-row r-${it.rarity}">
          <span class="lb-rank">${i + 1}</span>
          <span class="lb-icon">${iconMarkup(it)}</span>
          <span class="lb-name">${esc(it.name)}</span>
          <span class="lb-wear">${esc(wear.short)}</span>
          <span class="lb-float">${it.float.toFixed(4)}</span>
        </div>`;
    }).join('');

    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">🏅 Float-Bestenliste</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <p class="fcs-note" style="margin-bottom:14px">Niedrigerer Float = besserer Zustand. Hinweis: Diese Seite hat keinen Server — die Bestenliste ist lokal (deine eigenen Drops in diesem Browser).</p>
        ${best ? `<div class="lb-best">🥇 Dein Rekord: <b>${esc(best.name)}</b> · Float <b>${best.float.toFixed(4)}</b> (${esc(wearMeta(best.wearTier).name)})</div>` : ''}
        <div class="lb-list">${rows || '<div class="inv-empty">Noch keine Drops — öffne eine Case! 📦</div>'}</div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
  }

  /* ── tower defense ── */
  const TD_TUT_KEY = 'fcs_td_tutorial';

  function openTowerDefense() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();
    let seen = false;
    try { seen = localStorage.getItem(TD_TUT_KEY) === '1'; } catch (e) {}
    if (!seen) return showTdTutorial();
    renderTdLevels();
  }

  function showTdTutorial() {
    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">🗼 Tower Defense — So geht's</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="td-tut">
          <div class="td-tut-row"><span class="td-tut-ic">🧱</span><div><b>Türme platzieren:</b> Wähle unten eine Sprache und klick auf ein Feld. Jeder Turm kostet <b>Bytes</b> 💾 (regenerieren automatisch + pro getötetem Bug).</div></div>
          <div class="td-tut-row"><span class="td-tut-ic">⚔️</span><div><b>Jede Sprache kämpft anders:</b> C durchschlägt, C++ macht Splash, SQL verlangsamt, Haskell trifft die ganze Lane, HTML ist ein Tank.</div></div>
          <div class="td-tut-row"><span class="td-tut-ic">💠</span><div><b>Float & Rarität zählen:</b> Höhere Seltenheit und besserer Float = mehr Leben und Schaden.</div></div>
          <div class="td-tut-row"><span class="td-tut-ic">⬆️</span><div><b>Upgrade & Verkauf:</b> Klick auf einen platzierten Turm, um ihn aufzuwerten oder für Bytes zu verkaufen.</div></div>
          <div class="td-tut-row"><span class="td-tut-ic">❤️</span><div><b>Ziel:</b> Lass keine Bugs links durch! Bei 0 Leben ist die Runde verloren. Boss-Level (💀) auf jeder x.0.</div></div>
        </div>
        <button class="fcs-btn" id="tdTutGo">Los geht's! 🚀</button>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelector('#tdTutGo').onclick = () => {
      try { localStorage.setItem(TD_TUT_KEY, '1'); } catch (e) {}
      renderTdLevels();
    };
  }

  function showTowerMenu(info, ev, game) {
    closeTowerMenu();
    const m = el(`
      <div class="td-tower-menu">
        <div class="ttm-title">${esc(info.name)} <span class="ttm-tier">Lv ${info.tier + 1}/${info.maxTier + 1}</span></div>
        <div class="ttm-stats">💥 ${info.dmg} &nbsp; ❤ ${info.hp}/${info.maxHp}</div>
        <div class="ttm-actions">
          ${info.upgradeCost != null
            ? `<button class="fcs-btn" id="ttmUp" style="width:auto;padding:6px 12px">⬆ Upgrade · ${info.upgradeCost}B</button>`
            : '<span class="ttm-max">Max-Level ✓</span>'}
          <button class="fcs-btn secondary" id="ttmSell" style="width:auto;padding:6px 12px">💰 +${info.refund}B</button>
        </div>
      </div>`);
    document.body.appendChild(m);
    tdMenu = m;
    const px = Math.min(ev.clientX, window.innerWidth - 200);
    const py = Math.min(ev.clientY, window.innerHeight - 120);
    m.style.left = Math.max(8, px) + 'px';
    m.style.top = Math.max(8, py) + 'px';
    const up = m.querySelector('#ttmUp');
    if (up) up.onclick = () => {
      const res = game.upgradeAt(info.row, info.col);
      if (!res.ok && res.reason === 'poor') toast('Zu wenig Bytes für das Upgrade.', 'error');
      closeTowerMenu();
    };
    m.querySelector('#ttmSell').onclick = () => { game.sellAt(info.row, info.col); closeTowerMenu(); };
    // Defer so the click that opened the menu doesn't immediately close it.
    setTimeout(() => document.addEventListener('click', tdOutsideCloser), 0);
  }

  // Renders the placed towers as a DOM layer over the canvas: each tower shows
  // its real language logo with the same float-based skin (shimmer/flames).
  function renderTowerLayer(towers, dim) {
    const layer = dialog.querySelector('#tdTowerLayer');
    if (!layer) return;
    const C = Cases();
    layer.innerHTML = towers.map(t => {
      const s = t.stat;
      const wearId = s.wearTier || (C ? C.wearTierForFloat(s.float).id : 'ft');
      const left = ((t.col + 0.5) / dim.cols) * 100;
      const top = ((t.row + 0.5) / dim.rows) * 100;
      const badge = t.tier > 0 ? `<span class="td-tier-badge">${t.tier + 1}</span>` : '';
      return `<div class="td-tower-node" style="left:${left}%;top:${top}%">
          ${skinIconHTML({ slug: s.slug, glyph: s.glyph, name: s.name }, wearId, s.float)}
          ${badge}
        </div>`;
    }).join('');
  }

  function renderTdLevels() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const progress = p.tdProgress || 0;      // highest cleared level idx
    const levels = TdData().LEVELS;

    const cells = levels.map(lv => {
      const cleared = lv.idx <= progress;
      const unlocked = lv.idx <= progress + 1;
      const cls = cleared ? 'cleared' : (unlocked ? 'open' : 'locked');
      const mark = cleared ? '✓' : (unlocked ? (lv.isBoss ? '💀' : '▶') : '🔒');
      return `<button class="td-lvl ${cls} ${lv.isBoss ? 'boss' : ''}" data-idx="${lv.idx}" ${unlocked ? '' : 'disabled'}>
          <span class="td-lvl-label">${lv.label}</span>
          <span class="td-lvl-mark">${mark}</span>
        </button>`;
    }).join('');

    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">🗼 Tower Defense</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <p class="fcs-note" style="margin-bottom:14px">Verteidige gegen Bugs! Platziere deine ergambelten Sprachen als Türme — höhere Seltenheit & besserer Float = mehr Leben und Schaden. Boss-Level (💀) auf jeder x.0.</p>
        <div class="td-level-grid">${cells}</div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelectorAll('.td-lvl:not([disabled])').forEach(b => {
      b.onclick = () => renderTdGame(Number(b.dataset.idx));
    });
  }

  function renderTdGame(levelIdx) {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const level = TdData().LEVELS[levelIdx - 1];
    const defenders = Td().defendersFromInventory(p.inventory);

    const paletteHtml = defenders.length ? defenders.map((d, i) =>
      `<button class="td-card r-${d.rarity}" data-i="${i}" title="${esc(d.archLabel)}">
        <span class="td-card-label">${esc(d.label)}</span>
        <span class="td-card-name">${esc(d.name)}</span>
        <span class="td-card-stats">💥${d.damage} ❤${d.hp}</span>
        <span class="td-card-cost">${d.cost}B</span>
      </button>`).join('')
      : '<div class="inv-empty">Keine Türme — öffne erst ein paar Cases, um Sprachen zu gewinnen! 📦</div>';

    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">🗼 Level ${level.label}${level.isBoss ? ' — BOSS' : ''}</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body td-game">
        <div class="td-hud">
          <span class="td-hud-item">💾 <b id="tdBytes">—</b> Bytes</span>
          <span class="td-hud-item">❤ <b id="tdLives">5</b></span>
          <span class="td-hud-item">🐛 <b id="tdKilled">0</b>/<b id="tdTotal">0</b></span>
          <button class="fcs-btn" id="tdStart" style="width:auto;padding:8px 18px">▶ Start</button>
          <button class="fcs-btn secondary" id="tdBack" style="width:auto;padding:8px 14px">↩ Level</button>
        </div>
        <div class="td-board-wrap">
          <canvas id="tdCanvas" class="td-canvas"></canvas>
          <div class="td-tower-layer" id="tdTowerLayer"></div>
          <div class="td-end" id="tdEnd"></div>
        </div>
        <div class="td-palette-label">Türme (Klick zum Auswählen, dann aufs Feld) · platzierten Turm anklicken für ⬆ Upgrade / 💰 Verkauf:</div>
        <div class="td-palette" id="tdPalette">${paletteHtml}</div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelector('#tdBack').onclick = () => renderTdLevels();

    const canvas = dialog.querySelector('#tdCanvas');
    const game = Td().newGame({
      canvas: canvas,
      level: level,
      onState: st => {
        setText('#tdBytes', st.bytes);
        setText('#tdLives', st.lives);
        setText('#tdKilled', st.killed);
        setText('#tdTotal', st.total);
        // dim palette cards you can't afford
        dialog.querySelectorAll('.td-card').forEach((c, i) => {
          if (defenders[i]) c.classList.toggle('poor', st.bytes < defenders[i].cost);
        });
      },
      onEnd: res => onTdEnd(res, levelIdx),
      onTower: (info, cell, ev) => showTowerMenu(info, ev, game),
      onTowers: (towers, dim) => renderTowerLayer(towers, dim)
    });
    activeGame = game;

    let selectedCard = null;
    dialog.querySelectorAll('.td-card').forEach((c) => {
      c.onclick = () => {
        const d = defenders[Number(c.dataset.i)];
        if (!d) return;
        game.select(d);
        if (selectedCard) selectedCard.classList.remove('selected');
        c.classList.add('selected'); selectedCard = c;
      };
    });

    const startBtn = dialog.querySelector('#tdStart');
    startBtn.onclick = () => {
      if (!defenders.length) { toast('Erst Cases öffnen für Türme!', 'error'); return; }
      startBtn.disabled = true;
      game.start();
    };
  }

  function onTdEnd(res, levelIdx) {
    const user = Auth.currentUser();
    const endBox = dialog.querySelector('#tdEnd');
    if (!endBox) return;
    let rewardMsg = '';
    if (res.won) {
      const p = Store.getProfile(user);
      const already = (p.tdProgress || 0) >= levelIdx;
      if (!already) {
        p.tdProgress = levelIdx;
        p.coins += res.level.reward.coins;
        p.xp += res.level.reward.xp;
        p.level = Gamify.levelForXp(p.xp);
        Store.saveProfile(user, p);
        rewardMsg = `+${res.level.reward.coins} 🪙 · +${res.level.reward.xp} XP`;
        renderHeader();
        runAchievementCheck();
      } else {
        rewardMsg = 'Bereits gemeistert — keine erneute Belohnung.';
      }
    }
    const nextIdx = levelIdx + 1;
    const hasNext = res.won && TdData().LEVELS[nextIdx - 1];
    endBox.innerHTML = `
      <div class="td-end-card ${res.won ? 'win' : 'lose'}">
        <div class="td-end-title">${res.won ? '🎉 Level geschafft!' : '💀 Verloren'}</div>
        <div class="td-end-sub">${res.won ? esc(rewardMsg) : 'Die Bugs sind durchgekommen.'}</div>
        <div class="td-end-actions">
          <button class="fcs-btn" id="tdRetry" style="width:auto;padding:8px 16px">↻ Nochmal</button>
          ${hasNext ? `<button class="fcs-btn" id="tdNext" style="width:auto;padding:8px 16px">Nächstes ${TdData().LEVELS[nextIdx - 1].label} →</button>` : ''}
          <button class="fcs-btn secondary" id="tdToLevels" style="width:auto;padding:8px 16px">Level-Auswahl</button>
        </div>
      </div>`;
    endBox.classList.add('show');
    endBox.querySelector('#tdRetry').onclick = () => renderTdGame(levelIdx);
    endBox.querySelector('#tdToLevels').onclick = () => renderTdLevels();
    const nb = endBox.querySelector('#tdNext');
    if (nb) nb.onclick = () => renderTdGame(nextIdx);
  }

  function setText(sel, val) { const e = dialog.querySelector(sel); if (e) e.textContent = val; }

  /* ── match-3 ("Code Match") ── */
  let m3Game = null, m3Sel = null, m3Busy = false, m3Idx = 1;

  function openMatch3() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();
    renderM3Levels();
  }

  function renderM3Levels() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const progress = p.cmProgress || 0;
    const cells = Match3().LEVELS.map(lv => {
      const cleared = lv.idx <= progress;
      const unlocked = lv.idx <= progress + 1;
      const cls = cleared ? 'cleared' : (unlocked ? 'open' : 'locked');
      const mark = cleared ? '✓' : (unlocked ? '▶' : '🔒');
      return `<button class="td-lvl ${cls}" data-idx="${lv.idx}" ${unlocked ? '' : 'disabled'}>
          <span class="td-lvl-label">${lv.idx}</span><span class="td-lvl-mark">${mark}</span>
        </button>`;
    }).join('');
    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">🍬 Code Match</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <p class="fcs-note" style="margin-bottom:14px">Reihe 3+ gleiche Sprachen aneinander! Tausche benachbarte Gems — Matches lösen sich auf, es fällt nach, Ketten geben mehr Punkte. 30 Level mit Punkte- oder Sammel-Zielen und begrenzten Zügen.</p>
        <div class="td-level-grid">${cells}</div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelectorAll('.td-lvl:not([disabled])').forEach(b => b.onclick = () => renderM3Game(Number(b.dataset.idx)));
  }

  function m3GoalText(level) {
    const T = Match3().TYPES;
    return level.kind === 'score' ? `🎯 ${level.target} Punkte` : `🎯 ${level.target}× ${T[level.typeIdx].label}`;
  }

  function renderM3Game(levelIdx) {
    m3Idx = levelIdx; m3Sel = null; m3Busy = false;
    const level = Match3().LEVELS[levelIdx - 1];
    m3Game = Match3().newGame(level);
    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">🍬 Level ${levelIdx}</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body m3-body">
        <div class="m3-hud">
          <span>🔁 <b id="m3Moves">${level.moves}</b> Züge</span>
          <span>⭐ <b id="m3Score">0</b></span>
          <span>${m3GoalText(level)} <b id="m3Prog"></b></span>
          <button class="fcs-btn secondary" id="m3Back" style="width:auto;padding:6px 12px">↩ Level</button>
        </div>
        <div class="m3-board-wrap">
          <div class="m3-grid" id="m3Grid"></div>
          <div class="td-end" id="m3End"></div>
        </div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelector('#m3Back').onclick = () => renderM3Levels();
    renderM3Board(m3Game.getGrid());
    updateM3Hud();
  }

  function renderM3Board(grid) {
    const host = dialog.querySelector('#m3Grid');
    if (!host) return;
    const T = Match3().TYPES;
    const n = grid.length;
    host.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    let html = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const t = T[grid[r][c]];
      html += `<button class="m3-cell" data-r="${r}" data-c="${c}" style="--gem:${t.color}">${esc(t.label)}</button>`;
    }
    host.innerHTML = html;
    host.querySelectorAll('.m3-cell').forEach(cell => cell.onclick = () => onM3Click(Number(cell.dataset.r), Number(cell.dataset.c)));
    if (m3Sel) {
      const s = host.querySelector(`.m3-cell[data-r="${m3Sel.r}"][data-c="${m3Sel.c}"]`);
      if (s) s.classList.add('sel');
    }
  }

  function markM3Pop(mask) {
    const host = dialog.querySelector('#m3Grid');
    if (!host) return;
    for (let r = 0; r < mask.length; r++) for (let c = 0; c < mask.length; c++) {
      if (mask[r][c]) {
        const cell = host.querySelector(`.m3-cell[data-r="${r}"][data-c="${c}"]`);
        if (cell) cell.classList.add('pop');
      }
    }
  }

  function updateM3Hud() {
    const st = m3Game.getState();
    setText('#m3Moves', st.movesLeft);
    setText('#m3Score', st.score);
    setText('#m3Prog', st.kind === 'score' ? `(${Math.min(st.score, st.target)}/${st.target})` : `(${st.typeCleared}/${st.target})`);
  }

  function onM3Click(r, c) {
    if (m3Busy || !m3Game) return;
    if (!m3Sel) { m3Sel = { r: r, c: c }; renderM3Board(m3Game.getGrid()); return; }
    if (m3Sel.r === r && m3Sel.c === c) { m3Sel = null; renderM3Board(m3Game.getGrid()); return; }
    const a = m3Sel, b = { r: r, c: c };
    if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) !== 1) { m3Sel = { r: r, c: c }; renderM3Board(m3Game.getGrid()); return; }
    const res = m3Game.trySwap(a, b);
    m3Sel = null;
    if (!res.ok) {
      renderM3Board(m3Game.getGrid());
      if (res.reason === 'no-match') toast('Kein Match — Zug ungültig.', '');
      return;
    }
    playM3Steps(res);
  }

  function playM3Steps(res) {
    m3Busy = true;
    const Snd = Sounds();
    const steps = res.steps;
    let i = 0;
    (function next() {
      if (i >= steps.length) {
        renderM3Board(res.finalGrid);
        updateM3Hud();
        m3Busy = false;
        if (res.status !== 'playing') onM3End(res.status);
        return;
      }
      const st = steps[i++];
      renderM3Board(st.grid);
      markM3Pop(st.mask);
      if (Snd) Snd.tick();
      updateM3Hud();
      setTimeout(next, 300);
    })();
  }

  function onM3End(status) {
    const user = Auth.currentUser();
    const box = dialog.querySelector('#m3End');
    if (!box) return;
    let rewardMsg = '';
    if (status === 'won') {
      const p = Store.getProfile(user);
      const level = Match3().LEVELS[m3Idx - 1];
      if ((p.cmProgress || 0) < m3Idx) {
        p.cmProgress = m3Idx;
        p.coins += level.reward.coins;
        p.xp += level.reward.xp;
        p.level = Gamify.levelForXp(p.xp);
        Store.saveProfile(user, p);
        rewardMsg = `+${level.reward.coins} 🪙 · +${level.reward.xp} XP`;
        renderHeader();
        runAchievementCheck();
      } else rewardMsg = 'Bereits gemeistert.';
    }
    const nextIdx = m3Idx + 1;
    const hasNext = status === 'won' && Match3().LEVELS[nextIdx - 1];
    box.innerHTML = `
      <div class="td-end-card ${status === 'won' ? 'win' : 'lose'}">
        <div class="td-end-title">${status === 'won' ? '🎉 Geschafft!' : '💀 Keine Züge mehr'}</div>
        <div class="td-end-sub">${status === 'won' ? esc(rewardMsg) : 'Ziel nicht erreicht.'}</div>
        <div class="td-end-actions">
          <button class="fcs-btn" id="m3Retry" style="width:auto;padding:8px 16px">↻ Nochmal</button>
          ${hasNext ? `<button class="fcs-btn" id="m3Next" style="width:auto;padding:8px 16px">Level ${nextIdx} →</button>` : ''}
          <button class="fcs-btn secondary" id="m3ToLevels" style="width:auto;padding:8px 16px">Level-Auswahl</button>
        </div>
      </div>`;
    box.classList.add('show');
    box.querySelector('#m3Retry').onclick = () => renderM3Game(m3Idx);
    box.querySelector('#m3ToLevels').onclick = () => renderM3Levels();
    const nb = box.querySelector('#m3Next');
    if (nb) nb.onclick = () => renderM3Game(nextIdx);
  }

  /* ── slots ("Bug Slots") ── */
  function openSlots() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();
    if (Sounds()) Sounds().resume();
    renderSlots();
  }

  function slotSymHTML(sym) {
    return sym.slug ? `<i class="${deviconClass(sym.slug)}"></i>` : `<span class="slot-glyph">${esc(sym.glyph)}</span>`;
  }

  function renderSlots() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const S = Slots(), SD = SlotsData();
    const betChips = SD.BETS.map(b => `<button class="slot-bet ${b === slotBet ? 'active' : ''}" data-bet="${b}">${b}</button>`).join('');
    const payRows = S.SYMBOLS.filter(s => !s.scatter).map(s =>
      `<div class="slot-pay-row"><span class="slot-pay-ico">${slotSymHTML(s)}</span><span>${esc(s.name)}</span><span class="slot-pay-x">3× = ${s.p3} · 4× = ${s.p4} · 5× = ${s.p5}</span></div>`).join('');

    // Build a COLS×ROWS grid of cells, grouped into columns for the reel effect.
    let cols = '';
    for (let c = 0; c < S.COLS; c++) {
      let cells = '';
      for (let r = 0; r < S.ROWS; r++) cells += `<div class="slot-cell" id="sc-${c}-${r}"></div>`;
      cols += `<div class="slot-col" data-col="${c}">${cells}</div>`;
    }

    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">🎰 Bug Slots</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body slots-body">
        <div class="slot-wallet">
          <span>🎟️ Bug Taler: <b id="slotTaler">${p.bugTaler || 0}</b></span>
          <span>🪲 BugCoins: <b id="slotBugCoins">${p.bugCoins || 0}</b></span>
          <span>🪙 Coins: <b id="slotCoins">${p.coins}</b></span>
        </div>
        <div class="slot-exchange">
          <span>Coins → Bug Taler:</span>
          <button class="fcs-btn secondary slot-xch" data-amt="100" style="width:auto;padding:6px 10px">+100</button>
          <button class="fcs-btn secondary slot-xch" data-amt="500" style="width:auto;padding:6px 10px">+500</button>
          <button class="sound-toggle" id="slotSound" title="Sound an/aus"></button>
        </div>
        <div class="slots-layout">
          <div class="slot-left">
            <div class="slot-mult" id="slotMult"></div>
            <div class="slot-machine slot-grid">${cols}</div>
          </div>
          <div class="slot-right">
            <div class="slot-result" id="slotResult"></div>
            <div class="slot-controls">
              <div class="slot-bets">Einsatz: ${betChips}</div>
              <div class="slot-actions">
                <button class="fcs-btn" id="slotSpin">🎰 Drehen · ${slotBet} 🎟️</button>
                <button class="fcs-btn secondary" id="slotBonus">🎁 Bonus · ${slotBet * SD.BONUS_BUY_COST_MULT} 🎟️</button>
              </div>
              <div class="slot-free" id="slotFree"></div>
            </div>
            <details class="slot-paytable"><summary>Auszahlungen & Info</summary>
              <div class="slot-pays">${payRows}</div>
              <p class="fcs-note" style="margin-top:8px">5×5-Raster · Gewinne auf <b>5 Reihen + 2 Diagonalen</b> (3, 4 oder 5 gleiche von links). Diagonalen zahlen ${SD.DIAG_BONUS}×. ${SD.SCATTER_MIN}× 🐞 = ${SD.FREE_SPINS_ON_SCATTER} Freispiele. Gewinne in BugCoins. Hinweis: Die Chance entspricht einem echten Slot (RTP ~90 %, Haus-Vorteil ~10 %) — auf Dauer verlierst du. <b>Gambeln lohnt sich nicht.</b> 🙂</p>
            </details>
          </div>
        </div>
      </div>`, 'xwide');
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    // Fill grid with a random static display.
    const initGrid = S.spinGrid();
    for (let c = 0; c < S.COLS; c++) for (let r = 0; r < S.ROWS; r++) setCell(c, r, S.symbolById(initGrid[c][r]));
    dialog.querySelectorAll('.slot-bet').forEach(ch => ch.onclick = () => { if (slotBusy) return; slotBet = Number(ch.dataset.bet); renderSlots(); });
    dialog.querySelectorAll('.slot-xch').forEach(x => x.onclick = () => {
      const prof = Store.getProfile(user);
      const r = S.exchange(user, prof, Number(x.dataset.amt));
      if (!r.ok) { toast(r.reason === 'insufficient' ? 'Nicht genug Coins.' : 'Ungültig.', 'error'); return; }
      updateSlotWallet(); renderHeader();
    });
    const sb = dialog.querySelector('#slotSound');
    if (sb) { const Snd = Sounds(); const paint = () => sb.textContent = (Snd && Snd.isMuted()) ? '🔇' : '🔊'; paint(); sb.onclick = () => { if (!Snd) return; Snd.setMuted(!Snd.isMuted()); if (!Snd.isMuted()) Snd.resume(); paint(); }; }
    dialog.querySelector('#slotSpin').onclick = () => doSlotSpin();
    dialog.querySelector('#slotBonus').onclick = () => doSlotBonus();
    updateSlotFree();
    setMultBadge(p.slotMultiplier || 1, false);
  }

  function setCell(c, r, sym) {
    const el = dialog.querySelector('#sc-' + c + '-' + r);
    if (el) el.innerHTML = `<div class="slot-sym">${slotSymHTML(sym)}</div>`;
  }
  function updateSlotWallet() {
    const p = Store.getProfile(Auth.currentUser());
    setText('#slotTaler', p.bugTaler || 0); setText('#slotBugCoins', p.bugCoins || 0); setText('#slotCoins', p.coins);
  }
  function updateSlotFree() {
    const p = Store.getProfile(Auth.currentUser());
    const fs = p.slotFreeSpins || 0;
    const el = dialog.querySelector('#slotFree'); if (el) el.innerHTML = fs > 0 ? `🎁 Freispiele übrig: <b>${fs}</b>` : '';
    const spinBtn = dialog.querySelector('#slotSpin');
    if (spinBtn && !slotBusy) spinBtn.innerHTML = fs > 0 ? `🎁 Freispin drehen (${fs})` : `🎰 Drehen · ${slotBet} 🎟️`;
  }

  function doSlotSpin() {
    if (slotBusy) return;
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const S = Slots();
    const res = S.play(user, p, slotBet);
    if (!res.ok) { toast('Nicht genug Bug Taler — tausche erst Coins um.', 'error'); return; }
    slotBusy = true;
    dialog.querySelector('#slotResult').innerHTML = '';
    dialog.querySelectorAll('.slot-cell').forEach(el => el.classList.remove('win', 'jackpot-cell'));
    const Snd = Sounds(); if (Snd) Snd.slotSpin();
    // Each column cycles all its cells, then columns stop left-to-right.
    const cyclers = [];
    for (let c = 0; c < S.COLS; c++) {
      const col = dialog.querySelector('.slot-col[data-col="' + c + '"]');
      if (col) col.classList.add('spinning');
      const id = setInterval(() => {
        for (let r = 0; r < S.ROWS; r++) setCell(c, r, S.SYMBOLS[(Math.random() * S.SYMBOLS.length) | 0]);
      }, 60);
      cyclers.push(id);
      slotTimers.push(id);
    }
    for (let c = 0; c < S.COLS; c++) {
      const t = setTimeout(() => {
        clearInterval(cyclers[c]);
        for (let r = 0; r < S.ROWS; r++) setCell(c, r, S.symbolById(res.grid[c][r]));
        const col = dialog.querySelector('.slot-col[data-col="' + c + '"]');
        if (col) { col.classList.remove('spinning'); col.classList.add('landed'); setTimeout(() => col.classList.remove('landed'), 320); }
        if (Snd) Snd.slotStop();
        if (c === S.COLS - 1) finishSlotSpin(res);
      }, 560 + c * 280);
      slotTimers.push(t);
    }
  }

  // log2 tier of a multiplier: ×2 → 1, ×4 → 2, ×8 → 3 …
  function multTier(mult) { return Math.max(0, Math.round(Math.log2(mult || 1))); }

  // Updates the win-streak multiplier badge on the grid.
  function setMultBadge(mult, animate) {
    const el = dialog && dialog.querySelector('#slotMult');
    if (!el) return;
    mult = mult || 1;
    if (mult <= 1) { el.className = 'slot-mult'; el.innerHTML = ''; return; }
    const tier = Math.min(6, multTier(mult));
    el.className = 'slot-mult show mult-t' + tier;
    el.innerHTML = `<span class="sm-x">×</span>${mult}`;
    if (animate) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }

  function finishSlotSpin(res) {
    slotBusy = false;
    updateSlotWallet(); updateSlotFree(); renderHeader();
    const box = dialog.querySelector('#slotResult'); if (!box) return;
    const Snd = Sounds();
    // Highlight winning cells.
    (res.winCells || []).forEach(key => {
      const el = dialog.querySelector('#sc-' + key);
      if (el) { el.classList.add('win'); if (res.jackpot) el.classList.add('jackpot-cell'); }
    });

    // Streak multiplier badge (only paid spins change it; free spins freeze it).
    setMultBadge(res.nextMult, res.multiplierUp);
    if (res.multiplierUp && res.nextMult > 1 && Snd) Snd.slotMultiplier(multTier(res.nextMult));

    if (res.win > 0) {
      const crazyFree = res.wasFree && res.fsMult >= 10;
      const bigWin = res.jackpot || crazyFree || res.win >= slotBet * 10;
      const cls = (res.jackpot || crazyFree) ? 'jackpot' : (bigWin ? 'big' : 'win');
      const lead = res.jackpot ? '💎 JACKPOT! ' : (crazyFree ? '🔥 MEGA-FREISPIEL! ' : '');
      const diag = res.diagWin ? ' · ↗↘ Diagonale!' : '';
      const fs = res.freeSpinsAwarded ? ` · 🐞 ${res.freeSpinsAwarded} Freispiele` : '';
      let mtag = '';
      if (res.wasFree && res.fsMult > 1) mtag = ` <span class="sw-mult">×${res.fsMult}</span>`;
      else if (!res.wasFree && res.appliedMult > 1) mtag = ` <span class="sw-mult">×${res.appliedMult}</span>`;
      box.innerHTML = `<div class="slot-win ${cls}">${lead}+${res.win} 🪲${mtag}${diag}${fs}</div>`;
      if (res.multiplierActivated) box.innerHTML += `<div class="slot-mult-note">⚡ Multiplikator aktiviert — nächster Gewinn ×2!</div>`;
      if (Snd) { if (res.jackpot || crazyFree) Snd.slotJackpot(); else Snd.slotWin(Math.min(1, res.win / (slotBet * 20))); }
    } else if (res.freeSpinsAwarded) {
      box.innerHTML = `<div class="slot-win win">🐞 BONUS! ${res.freeSpinsAwarded} Freispiele</div>`;
      if (Snd) Snd.slotBonus();
    } else {
      let note = '';
      if (!res.wasFree && res.appliedMult > 1) note = ` <span class="slot-mult-lost">Serie beendet (×${res.appliedMult})</span>`;
      box.innerHTML = `<div class="slot-lose">Kein Gewinn.${note}</div>`;
    }
    runAchievementCheck();
  }

  function doSlotBonus() {
    if (slotBusy) return;
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const S = Slots();
    const r = S.bonusBuy(user, p, slotBet);
    if (!r.ok) { toast(`Nicht genug Bug Taler (${r.cost} nötig).`, 'error'); return; }
    const Snd = Sounds(); if (Snd) Snd.slotBonus();
    updateSlotWallet(); updateSlotFree();
    toast(`${SlotsData().BONUS_BUY_FREE_SPINS} Freispiele gekauft!`, 'coin');
  }

  /* ── BugShop (cosmetics) ── */
  function openBugShop() {
    const user = Auth.currentUser();
    if (!user) { openAuth('login'); return; }
    onLogin();
    renderBugShop();
  }

  function renderBugShop() {
    const user = Auth.currentUser();
    const p = Store.getProfile(user);
    const Cos = Cosmetics();
    if (!Cos) return;
    const cards = Cos.COSMETICS.map(c => {
      const owned = Cos.owns(p, c.id);
      const active = Cos.isActive(p, c.id);
      let btn;
      if (!owned) btn = `<button class="cos-btn" data-buy="${c.id}">Kaufen · ${c.price} 🪲</button>`;
      else btn = `<button class="cos-btn ${active ? 'on' : ''}" data-toggle="${c.id}">${active ? 'Aktiv ✓ (aus)' : 'Aktivieren'}</button>`;
      return `<div class="cos-card ${active ? 'active' : ''}">
          <div class="cos-emoji">${c.icon}</div>
          <div class="cos-name">${esc(c.name)}</div>
          <div class="cos-desc">${esc(c.desc)}</div>
          ${btn}
        </div>`;
    }).join('');
    openDialog(`
      <div class="fcs-dialog-head">
        <span class="fcs-dialog-title">🛒 BugShop</span>
        <button class="fcs-dialog-close">✕</button>
      </div>
      <div class="fcs-dialog-body">
        <div class="bugshop-wallet">🪲 BugCoins: <b id="bugShopBal">${p.bugCoins || 0}</b> — schalte Hintergrund-Effekte frei. Mehrere gleichzeitig aktivierbar.</div>
        <div class="bugshop-grid">${cards}</div>
      </div>`, true);
    dialog.querySelector('.fcs-dialog-close').onclick = closeDialog;
    dialog.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const prof = Store.getProfile(user);
      const r = Cos.buy(user, prof, b.dataset.buy);
      if (!r.ok) { toast(r.reason === 'insufficient' ? 'Nicht genug BugCoins.' : 'Schon gekauft.', 'error'); return; }
      toast('Effekt gekauft!', 'coin');
      renderBugShop();
    });
    dialog.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
      const prof = Store.getProfile(user);
      Cos.toggle(user, prof, b.dataset.toggle);
      renderBugShop();
    });
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
    openCases, openInventory, openMarket, openCollections, openLeaderboard, openTowerDefense, openMatch3, openSlots, openBugShop, openAdmin
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
