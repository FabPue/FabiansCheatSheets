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

  let overlay, dialog, toastWrap;

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

        <div class="reward-box ${canClaim ? '' : 'claimed'}">
          <div class="rw-title">🎁 Täglicher Login-Bonus</div>
          <div class="rw-sub">${canClaim ? `Basis 25 🪙 + Streak-Bonus ${bonus} 🪙` : 'Heute bereits abgeholt — komm morgen wieder!'}</div>
          ${canClaim ? '<button class="fcs-btn" id="claimBtn">Belohnung abholen</button>' : ''}
        </div>

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
    } else {
      renderHeader();
    }

    // Show the "what's new" popup once per browser version.
    maybeShowChangelog();
  }

  global.FCSApp = { init, openAuth, openAccount, openChallenges, openShop, openChangelog, renderHeader };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
