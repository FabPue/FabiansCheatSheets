/*
 * cheatsheet-search.js — shared live filter for every cheat sheet page.
 *
 * Injects a sticky search bar and filters the `.card` blocks by text. It is
 * self-contained: it renders its own styles using the CSS custom properties
 * each sheet already defines (--surface, --border, --text, --muted, --accent),
 * so it themes itself to whatever sheet it runs on. Include once per sheet:
 *   <script src="../assets/js/cheatsheet-search.js"></script>
 */
(function () {
  'use strict';

  function init() {
    const cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
    if (!cards.length) return; // nothing to filter

    // Pre-compute lowercase text + a title handle for each card.
    const entries = cards.map(card => ({
      el: card,
      text: (card.textContent || '').toLowerCase(),
      title: card.querySelector('.card-title')
    }));

    const style = document.createElement('style');
    style.textContent = `
      .cs-search-bar {
        position: sticky; top: 0; z-index: 200;
        background: var(--surface, #161b22);
        border-bottom: 1px solid var(--border, #2d3440);
        padding: 10px 40px; display: flex; align-items: center; gap: 12px;
      }
      .cs-search-input {
        flex: 1; max-width: 520px;
        background: var(--bg, #0d1117);
        border: 1px solid var(--border, #2d3440);
        border-radius: 8px; padding: 9px 12px;
        color: var(--text, #e2e8f0);
        font-family: inherit; font-size: 13px; outline: none;
        transition: border-color 0.2s;
      }
      .cs-search-input:focus { border-color: var(--accent3, #f97316); }
      .cs-search-count { color: var(--muted, #5a6478); font-size: 11px; white-space: nowrap; }
      .card.cs-hidden { display: none !important; }
      .cs-hit { outline: 1px solid var(--accent3, #f97316); }
      @media (max-width: 640px) { .cs-search-bar { padding: 10px 16px; } }
    `;
    document.head.appendChild(style);

    const bar = document.createElement('div');
    bar.className = 'cs-search-bar';
    bar.innerHTML =
      '<input class="cs-search-input" type="search" placeholder="🔍  In diesem Cheat Sheet suchen…  (Taste /)" aria-label="Cheat Sheet durchsuchen">' +
      '<span class="cs-search-count"></span>';

    // Place the bar right after the sticky header if present, else at body top.
    const header = document.querySelector('header');
    if (header && header.parentNode) header.parentNode.insertBefore(bar, header.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);

    const input = bar.querySelector('.cs-search-input');
    const count = bar.querySelector('.cs-search-count');

    function apply(q) {
      const query = q.trim().toLowerCase();
      let shown = 0;
      entries.forEach(e => {
        const match = !query || e.text.indexOf(query) !== -1;
        e.el.classList.toggle('cs-hidden', !match);
        if (e.title) e.title.classList.toggle('cs-hit', !!query && match);
        if (match) shown++;
      });
      count.textContent = query ? `${shown} / ${entries.length} Karten` : '';
    }

    input.addEventListener('input', () => apply(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { input.value = ''; apply(''); input.blur(); }
    });
    // Press "/" anywhere to jump to search (unless already typing).
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement !== input) {
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); input.focus(); }
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
