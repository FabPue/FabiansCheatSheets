/*
 * slots-animation.test.mjs — regression test for the Bug Slots spin animation.
 *
 * Guards the behaviour that broke in v5.0 (the plastic per-cell box-shadow made
 * the spin janky/"distorted"). It asserts the animation works exactly like it
 * did before v5.0:
 *
 *   1. All 5 reel columns start spinning together.
 *   2. The columns stop one after another, strictly LEFT → RIGHT.
 *   3. The stop stagger is steady (each column ~a fixed delay after the last).
 *   4. While spinning, cells render lightweight (no heavy box-shadow) so the
 *      reel repaint stays smooth.
 *   5. While spinning, the symbols carry the `slotBlur` motion-blur animation.
 *
 * Run:  node tests/slots-animation.test.mjs
 * (needs Playwright + a Chromium; override paths via PLAYWRIGHT_MODULE /
 *  PW_CHROMIUM if they are not auto-detected.)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ── resolve Playwright (works both in CI and this dev container) ── */
function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    'playwright',
    '/opt/node22/lib/node_modules/playwright'
  ].filter(Boolean);
  for (const c of candidates) {
    try { return require(c); } catch (_) { /* try next */ }
  }
  throw new Error('Playwright not found. `npm i -D playwright` or set PLAYWRIGHT_MODULE.');
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

function startServer() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('nf'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

async function run() {
  const { chromium } = loadPlaywright();
  const server = await startServer();
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  const launch = {};
  if (process.env.PW_CHROMIUM) launch.executablePath = process.env.PW_CHROMIUM;
  else if (fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
  launch.args = ['--no-sandbox'];

  const browser = await chromium.launch(launch);
  const pageErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    page.on('pageerror', e => { if (!/iframeLoaded/.test(e.message)) pageErrors.push(e.message); });
    await page.addInitScript(() => { try { localStorage.setItem('fcs_seen_version', '5.0'); } catch (_) {} });
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });

    await page.evaluate(async () => { await window.FCSAuth.register('anitest', 'pw123456'); });
    await page.evaluate(() => {
      const u = window.FCSAuth.currentUser();
      const p = window.FCSStore.getProfile(u);
      p.bugTaler = 100000; window.FCSStore.saveProfile(u, p);
    });
    await page.evaluate(() => window.FCSApp.openSlots());
    await page.waitForSelector('.slot-grid');

    const NCOLS = await page.evaluate(() => document.querySelectorAll('.slot-col').length);
    check('grid has 5 reel columns', NCOLS === 5, `found ${NCOLS}`);

    // Kick off a spin and sample column state every 30ms.
    await page.evaluate(() => document.querySelector('#slotSpin').click());
    const t0 = Date.now();
    const spinningAtStart = await page.evaluate(() =>
      [...document.querySelectorAll('.slot-col')].map(c => c.classList.contains('spinning')));
    check('all columns start spinning together', spinningAtStart.every(Boolean),
      JSON.stringify(spinningAtStart));

    // While spinning: cells are lightweight + symbols carry the blur animation.
    const midSpin = await page.evaluate(() => {
      const cell = document.querySelector('.slot-col.spinning .slot-cell');
      const sym = document.querySelector('.slot-col.spinning .slot-sym');
      return {
        boxShadow: cell ? getComputedStyle(cell).boxShadow : 'n/a',
        anim: sym ? getComputedStyle(sym).animationName : 'n/a'
      };
    });
    check('spinning cells render without a heavy box-shadow', midSpin.boxShadow === 'none',
      midSpin.boxShadow);
    check('spinning symbols use the slotBlur animation', midSpin.anim === 'slotBlur', midSpin.anim);

    // Record when each column stops (loses `.spinning`).
    const stopTime = new Array(NCOLS).fill(null);
    while (stopTime.some(v => v === null) && Date.now() - t0 < 6000) {
      const state = await page.evaluate(() =>
        [...document.querySelectorAll('.slot-col')].map(c => c.classList.contains('spinning')));
      const now = Date.now() - t0;
      state.forEach((sp, i) => { if (!sp && stopTime[i] === null) stopTime[i] = now; });
      await page.waitForTimeout(30);
    }

    const allStopped = stopTime.every(v => v !== null);
    check('every column eventually stops', allStopped, JSON.stringify(stopTime));

    // Strictly increasing stop times => left-to-right sequence.
    let leftToRight = true;
    for (let i = 1; i < NCOLS; i++) if (!(stopTime[i] > stopTime[i - 1])) leftToRight = false;
    check('columns stop strictly left → right', allStopped && leftToRight, JSON.stringify(stopTime));

    // Steady stagger between consecutive stops (~like the original 280ms cadence).
    const gaps = [];
    for (let i = 1; i < NCOLS; i++) gaps.push(stopTime[i] - stopTime[i - 1]);
    const steady = gaps.every(g => g >= 120 && g <= 480);
    check('stop stagger is steady (120–480ms between columns)', allStopped && steady,
      'gaps=' + JSON.stringify(gaps));

    check('no unexpected console/page errors', pageErrors.length === 0, JSON.stringify(pageErrors));
  } finally {
    await browser.close();
    server.close();
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) { console.error('FAILED: ' + failed.map(f => f.name).join('; ')); process.exit(1); }
  console.log('All slot-animation checks passed. ✓');
}

run().catch(e => { console.error(e); process.exit(1); });
