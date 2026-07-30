# Tests

Browser-driven regression tests for the interactive parts of the site. They are
plain Node scripts (no test runner) that spin up a local static server, drive a
headless Chromium via [Playwright](https://playwright.dev/), and assert
behaviour — printing `PASS` / `FAIL` per check and exiting non-zero on failure.

## Running

```bash
npm i -D playwright        # once (or: npx playwright install chromium)
node tests/slots-animation.test.mjs
```

If Playwright or its Chromium live in non-standard locations, override them:

```bash
PLAYWRIGHT_MODULE=/path/to/playwright \
PW_CHROMIUM=/path/to/chromium \
node tests/slots-animation.test.mjs
```

## What's covered

- **`slots-animation.test.mjs`** — the Bug Slots spin animation. Guards the
  regression fixed after v5.0 (the plastic per-cell box-shadow made the spin
  look janky/"distorted"). Verifies that all five reel columns start together,
  stop **strictly left → right** with a steady stagger, render lightweight while
  spinning, and carry the `slotBlur` motion-blur animation — i.e. exactly the
  behaviour from before v5.0.
