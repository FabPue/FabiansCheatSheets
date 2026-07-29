/*
 * achievements-data.js — achievement definitions.
 *
 * Each achievement:
 *   id, icon, title, desc, xp, gold
 *   test(stats) -> boolean   (met condition; awarded once, on first time met)
 *
 * `stats` is provided by achievements.js and contains:
 *   streak, casesOpened, solvedTotal, level, uniqueLangs,
 *   rarity: { grey, blue, epic, red, gold },   // counts owned
 *   wear:   { fn, mw, ft, ww, bs }             // counts owned
 */
(function (global) {
  'use strict';

  const A = [
    /* ── Streak ── */
    { id: 'streak_1',   icon: '🔥', title: 'Erste Streak',        desc: 'Du hast eine Streak erhalten.',              xp: 20,   gold: 15,   test: s => s.streak >= 1 },
    { id: 'streak_3',   icon: '🔥', title: 'Streak Azubi',        desc: 'Du hast eine 3-Tage-Streak erlangt.',        xp: 40,   gold: 30,   test: s => s.streak >= 3 },
    { id: 'streak_7',   icon: '🔥', title: 'Streak Geselle',      desc: 'Du hast eine 7-Tage-Streak erlangt.',        xp: 80,   gold: 60,   test: s => s.streak >= 7 },
    { id: 'streak_14',  icon: '🔥', title: 'Streak Profi',        desc: 'Du hast eine 14-Tage-Streak erlangt.',       xp: 150,  gold: 120,  test: s => s.streak >= 14 },
    { id: 'streak_30',  icon: '🔥', title: 'Streak Meister',      desc: 'Du hast eine 30-Tage-Streak erlangt.',       xp: 300,  gold: 250,  test: s => s.streak >= 30 },
    { id: 'streak_100', icon: '🔥', title: 'Streak Großmeister',  desc: 'Du hast eine 100-Tage-Streak erlangt.',      xp: 800,  gold: 700,  test: s => s.streak >= 100 },
    { id: 'streak_365', icon: '👑', title: 'Streak Legende',      desc: 'Du hast eine 365-Tage-Streak erlangt!',      xp: 3650, gold: 3000, test: s => s.streak >= 365 },

    /* ── Cases ── */
    { id: 'case_1',    icon: '📦', title: 'Erste Case',   desc: 'Du hast deine erste Case geöffnet.',   xp: 20,   gold: 10,   test: s => s.casesOpened >= 1 },
    { id: 'case_10',   icon: '📦', title: 'Case Azubi',   desc: 'Du hast 10 Cases geöffnet.',           xp: 60,   gold: 40,   test: s => s.casesOpened >= 10 },
    { id: 'case_25',   icon: '📦', title: 'Case Geselle', desc: 'Du hast 25 Cases geöffnet.',           xp: 120,  gold: 90,   test: s => s.casesOpened >= 25 },
    { id: 'case_50',   icon: '📦', title: 'Case Profi',   desc: 'Du hast 50 Cases geöffnet.',           xp: 220,  gold: 180,  test: s => s.casesOpened >= 50 },
    { id: 'case_100',  icon: '🎁', title: 'Case Meister', desc: 'Du hast 100 Cases geöffnet.',          xp: 450,  gold: 400,  test: s => s.casesOpened >= 100 },
    { id: 'case_500',  icon: '🎁', title: 'Case Mogul',   desc: 'Du hast 500 Cases geöffnet.',          xp: 1500, gold: 1500, test: s => s.casesOpened >= 500 },
    { id: 'case_1000', icon: '💼', title: 'Case CEO',     desc: 'Du hast 1000 Cases geöffnet!',         xp: 4000, gold: 4000, test: s => s.casesOpened >= 1000 },

    /* ── Challenges solved ── */
    { id: 'solve_1',   icon: '🧩', title: 'Erste Aufgabe', desc: 'Du hast deine erste Aufgabe gelöst.', xp: 20,   gold: 10,  test: s => s.solvedTotal >= 1 },
    { id: 'solve_10',  icon: '🧩', title: 'Fleißig',       desc: 'Du hast 10 Aufgaben gelöst.',         xp: 60,   gold: 40,  test: s => s.solvedTotal >= 10 },
    { id: 'solve_50',  icon: '🧠', title: 'Streber',       desc: 'Du hast 50 Aufgaben gelöst.',         xp: 200,  gold: 150, test: s => s.solvedTotal >= 50 },
    { id: 'solve_100', icon: '🧠', title: 'Genie',         desc: 'Du hast 100 Aufgaben gelöst.',        xp: 400,  gold: 350, test: s => s.solvedTotal >= 100 },
    { id: 'solve_500', icon: '🎓', title: 'Allwissend',    desc: 'Du hast 500 Aufgaben gelöst.',        xp: 1500, gold: 1200, test: s => s.solvedTotal >= 500 },

    /* ── Level ── */
    { id: 'level_5',  icon: '⭐', title: 'Aufsteiger', desc: 'Du hast Level 5 erreicht.',  xp: 0,   gold: 50,  test: s => s.level >= 5 },
    { id: 'level_10', icon: '⭐', title: 'Etabliert',  desc: 'Du hast Level 10 erreicht.', xp: 0,   gold: 120, test: s => s.level >= 10 },
    { id: 'level_25', icon: '🌟', title: 'Veteran',    desc: 'Du hast Level 25 erreicht.', xp: 0,   gold: 350, test: s => s.level >= 25 },
    { id: 'level_50', icon: '🌟', title: 'Elite',      desc: 'Du hast Level 50 erreicht.', xp: 0,   gold: 900, test: s => s.level >= 50 },

    /* ── Rarity firsts ── */
    { id: 'first_blue', icon: '🔵', title: 'Blaues Wunder', desc: 'Du hast ein blaues Item gedroppt.',   xp: 40,  gold: 30,  test: s => s.rarity.blue >= 1 },
    { id: 'first_epic', icon: '🟣', title: 'Episch!',       desc: 'Du hast ein episches Item gedroppt.', xp: 100, gold: 80,  test: s => s.rarity.epic >= 1 },
    { id: 'first_red',  icon: '🔴', title: 'Sieh rot',      desc: 'Du hast ein rotes Item gedroppt.',    xp: 250, gold: 200, test: s => s.rarity.red >= 1 },
    { id: 'first_gold', icon: '🏆', title: 'Goldrausch',    desc: 'Du hast ein GOLD-Item gedroppt!',     xp: 1000, gold: 800, test: s => s.rarity.gold >= 1 },

    /* ── Collection ── */
    { id: 'coll_5',   icon: '📚', title: 'Kleine Sammlung', desc: 'Du besitzt 5 verschiedene Sprachen.',  xp: 60,  gold: 40,  test: s => s.uniqueLangs >= 5 },
    { id: 'coll_12',  icon: '📚', title: 'Sammler',         desc: 'Du besitzt 12 verschiedene Sprachen.', xp: 200, gold: 150, test: s => s.uniqueLangs >= 12 },
    { id: 'wear_fn',  icon: '✨', title: 'Fabrikfrisch',    desc: 'Du hast ein fabrikneues Item.',        xp: 80,  gold: 60,  test: s => s.wear.fn >= 1 },
    { id: 'wear_bs',  icon: '🩹', title: 'Schrottsammler',  desc: 'Du hast ein Item mit Kampfspuren.',    xp: 40,  gold: 20,  test: s => s.wear.bs >= 1 },

    /* ── Float extremes ── */
    { id: 'float_sub01',   icon: '💎', title: 'Blitzsauber',     desc: 'Ein Item mit Float unter 0.01.',   xp: 120,  gold: 100,  test: s => s.bestFloat <= 0.01 },
    { id: 'float_sub001',  icon: '💠', title: 'Makellos',        desc: 'Ein Item mit Float unter 0.001.',  xp: 400,  gold: 350,  test: s => s.bestFloat <= 0.001 },
    { id: 'float_sub0001', icon: '🏆', title: 'Perfektionist',   desc: 'Ein Item mit Float unter 0.0001!', xp: 1500, gold: 1200, test: s => s.bestFloat <= 0.0001 },
    { id: 'float_99',      icon: '🗑️', title: 'Schrottwert',     desc: 'Ein Item mit Float über 0.99.',    xp: 60,   gold: 30,   test: s => s.worstFloat >= 0.99 },
    { id: 'float_9999',    icon: '💀', title: 'Totalschaden',    desc: 'Ein Item mit Float über 0.9999!',  xp: 400,  gold: 200,  test: s => s.worstFloat >= 0.9999 },

    /* ── Tower Defense ── */
    { id: 'td_1',    icon: '🗼', title: 'Erste Verteidigung', desc: 'Schließe dein erstes TD-Level ab.',      xp: 60,   gold: 40,   test: s => s.tdProgress >= 1 },
    { id: 'td_boss', icon: '💀', title: 'Boss-Bezwinger',     desc: 'Schaffe das erste Boss-Level (2.0).',    xp: 250,  gold: 200,  test: s => s.tdProgress >= 10 },
    { id: 'td_all',  icon: '🏰', title: 'Tower-Meister',      desc: 'Schließe alle 20 TD-Level ab.',          xp: 1500, gold: 1200, test: s => s.tdProgress >= 20 },

    /* ── Code Match ── */
    { id: 'cm_1',   icon: '🍬', title: 'Erstes Match',     desc: 'Schließe dein erstes Code-Match-Level ab.', xp: 60,   gold: 40,   test: s => s.cmProgress >= 1 },
    { id: 'cm_10',  icon: '🍭', title: 'Süße Serie',       desc: 'Schaffe Code-Match-Level 10.',              xp: 250,  gold: 200,  test: s => s.cmProgress >= 10 },
    { id: 'cm_30',  icon: '🏆', title: 'Match-Meister',    desc: 'Schließe alle 30 Code-Match-Level ab.',     xp: 1500, gold: 1200, test: s => s.cmProgress >= 30 },

    /* ── Slots & Kosmetik ── */
    { id: 'slot_1',   icon: '🎰', title: 'Erster Dreh',     desc: 'Dreh die Bug Slots zum ersten Mal.',        xp: 30,  gold: 20,  test: s => s.slotSpins >= 1 },
    { id: 'slot_100', icon: '🎲', title: 'Zock-Veteran',    desc: 'Drehe 100 Mal an den Slots.',               xp: 150, gold: 0,   test: s => s.slotSpins >= 100 },
    { id: 'slot_500', icon: '🏦', title: 'Das Haus gewinnt', desc: '500 Spins — und die Erkenntnis: Gambeln lohnt sich nicht.', xp: 400, gold: 0, test: s => s.slotSpins >= 500 },
    { id: 'slot_diag', icon: '↗️', title: 'Quergewinn',      desc: 'Lande einen Gewinn auf einer Diagonale.',   xp: 80,  gold: 40, test: s => s.slotDiagWins >= 1 },
    { id: 'slot_mega', icon: '💰', title: 'Mega-Win',        desc: 'Gewinne 1000+ BugCoins in einem einzigen Dreh.', xp: 250, gold: 0, test: s => s.slotMaxWin >= 1000 },
    { id: 'slot_mult', icon: '⚡', title: 'Serientäter',      desc: 'Erreiche einen ×16-Multiplikator (Gewinnserie).', xp: 200, gold: 0, test: s => s.slotMultBest >= 16 },
    { id: 'slot_mult2', icon: '🔗', title: 'Kettenreaktion',  desc: 'Erreiche einen ×64-Multiplikator!', xp: 500, gold: 0, test: s => s.slotMultBest >= 64 },
    { id: 'cos_3',    icon: '🎨', title: 'Stil-Bewusst',    desc: 'Besitze 3 Hintergrund-Effekte aus dem BugShop.', xp: 120, gold: 80, test: s => s.cosmeticsOwned >= 3 },
    { id: 'cos_6',    icon: '🖼️', title: 'Deko-Sammler',    desc: 'Besitze 6 Hintergrund-Effekte aus dem BugShop.', xp: 240, gold: 160, test: s => s.cosmeticsOwned >= 6 }
  ];

  global.FCSAchievementsData = A;
})(window);
