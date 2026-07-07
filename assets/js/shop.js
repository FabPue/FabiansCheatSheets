/*
 * shop.js — unlockable color themes bought with coins.
 * Depends on: FCSStore.
 * Themes override the CSS custom properties defined on :root in index.html.
 */
(function (global) {
  'use strict';

  const Store = global.FCSStore;

  const THEMES = [
    {
      id: 'default', name: 'Midnight (Standard)', price: 0,
      vars: {
        '--bg': '#080810', '--surface': '#0f0f1a', '--border': '#1e1e32',
        '--text': '#e8e6ff', '--muted': '#4a4870', '--glow': 'rgba(120,100,255,0.15)'
      }
    },
    {
      id: 'emerald', name: 'Emerald', price: 150,
      vars: {
        '--bg': '#04120c', '--surface': '#0a1c14', '--border': '#123324',
        '--text': '#e2fff0', '--muted': '#3f7a5f', '--glow': 'rgba(52,211,153,0.18)'
      }
    },
    {
      id: 'crimson', name: 'Crimson', price: 200,
      vars: {
        '--bg': '#140608', '--surface': '#1e0c10', '--border': '#3a1620',
        '--text': '#ffe6ec', '--muted': '#8a4a58', '--glow': 'rgba(244,63,94,0.18)'
      }
    },
    {
      id: 'amber', name: 'Amber Sun', price: 250,
      vars: {
        '--bg': '#140f04', '--surface': '#1e170a', '--border': '#3a2c14',
        '--text': '#fff6e0', '--muted': '#8a744a', '--glow': 'rgba(251,191,36,0.20)'
      }
    },
    {
      id: 'ocean', name: 'Deep Ocean', price: 300,
      vars: {
        '--bg': '#04101a', '--surface': '#081a2a', '--border': '#12324a',
        '--text': '#e0f4ff', '--muted': '#3f6f8a', '--glow': 'rgba(56,189,248,0.20)'
      }
    },
    {
      id: 'aurora', name: 'Aurora', price: 500,
      vars: {
        '--bg': '#0a0416', '--surface': '#140a24', '--border': '#2a1644',
        '--text': '#f3e8ff', '--muted': '#6a4a8a', '--glow': 'rgba(217,70,239,0.22)'
      }
    },
    /* ── premium animated themes (v4.0) — pricier, richer motion ── */
    {
      id: 'neongrid', name: 'Neon Grid', price: 900, premium: true,
      vars: {
        '--bg': '#050510', '--surface': '#0b0b1e', '--border': '#1b2b4a',
        '--text': '#d6f5ff', '--muted': '#4a6a8a', '--glow': 'rgba(34,211,238,0.28)'
      }
    },
    {
      id: 'molten', name: 'Molten Core', price: 1100, premium: true,
      vars: {
        '--bg': '#100503', '--surface': '#1e0a06', '--border': '#3d1a0c',
        '--text': '#ffe8dc', '--muted': '#8a5040', '--glow': 'rgba(255,90,20,0.3)'
      }
    },
    {
      id: 'matrix', name: 'Matrix', price: 1300, premium: true,
      vars: {
        '--bg': '#020a04', '--surface': '#04160a', '--border': '#0c3a1c',
        '--text': '#c8ffd6', '--muted': '#3f8a5a', '--glow': 'rgba(34,255,120,0.25)'
      }
    },
    {
      id: 'galaxy', name: 'Galaxy', price: 1600, premium: true,
      vars: {
        '--bg': '#03040f', '--surface': '#0a0c22', '--border': '#22284a',
        '--text': '#e6e8ff', '--muted': '#5a5f8a', '--glow': 'rgba(129,140,248,0.28)'
      }
    }
  ];

  function getTheme(id) {
    return THEMES.find(t => t.id === id) || THEMES[0];
  }

  function applyTheme(id) {
    const theme = getTheme(id);
    const root = document.documentElement;
    Object.keys(theme.vars).forEach(k => root.style.setProperty(k, theme.vars[k]));
    // Flag the active theme so themes.css can add animated backgrounds
    // (aurora stars, ocean waves) for the themes that ship with motion.
    root.setAttribute('data-fcs-theme', theme.id);
  }

  function owns(profile, id) {
    return (profile.ownedThemes || []).indexOf(id) !== -1;
  }

  // Returns { ok, reason }.
  function buyTheme(username, profile, id) {
    const theme = getTheme(id);
    if (owns(profile, id)) return { ok: false, reason: 'owned' };
    if (profile.coins < theme.price) return { ok: false, reason: 'insufficient' };
    profile.coins -= theme.price;
    profile.ownedThemes = profile.ownedThemes || [];
    profile.ownedThemes.push(id);
    Store.saveProfile(username, profile);
    return { ok: true };
  }

  function activateTheme(username, profile, id) {
    if (!owns(profile, id)) return { ok: false, reason: 'not-owned' };
    profile.activeTheme = id;
    Store.saveProfile(username, profile);
    applyTheme(id);
    return { ok: true };
  }

  global.FCSShop = { THEMES, getTheme, applyTheme, owns, buyTheme, activateTheme };
})(window);
