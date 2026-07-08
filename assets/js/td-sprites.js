/*
 * td-sprites.js — SVG enemy sprites for the Tower Defense mode.
 *
 * Each entry is a self-contained SVG (viewBox 0 0 200 200), taken from the
 * "Bug-Bestiarium" design. td.js rasterises them to <img> via a data URI and
 * draws them on the canvas. Keys match enemy type ids in td-data.js.
 */
(function (global) {
  'use strict';

  const S = {};

  S.syntax = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g fill="#f0883e" font-family="monospace" font-weight="700">
      <text x="30" y="50" font-size="24">{</text><text x="160" y="55" font-size="24">;</text>
      <text x="25" y="150" font-size="24">)</text><text x="165" y="155" font-size="24">}</text>
    </g>
    <path d="M 60 80 L 75 65 L 95 70 L 105 60 L 125 68 L 140 60 L 145 85 L 155 100 L 148 120 L 155 140 L 130 145 L 115 155 L 95 148 L 78 152 L 65 138 L 55 120 L 60 100 Z" fill="#f85149" stroke="#7a1a1a" stroke-width="3" stroke-linejoin="round"/>
    <rect x="80" y="95" width="14" height="14" fill="#fff"/><rect x="84" y="99" width="6" height="6" fill="#000"/>
    <rect x="110" y="95" width="14" height="14" fill="#fff"/><rect x="114" y="99" width="6" height="6" fill="#000"/>
    <path d="M 78 88 L 96 94" stroke="#000" stroke-width="3" stroke-linecap="round"/>
    <path d="M 122 94 L 108 88" stroke="#000" stroke-width="3" stroke-linecap="round"/>
    <path d="M 85 125 L 92 132 L 98 125 L 105 132 L 112 125 L 118 132" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  S.offbyone = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g font-family="monospace" font-weight="700" font-size="18">
      <text x="30" y="45" fill="#58a6ff">+1</text><text x="150" y="50" fill="#f85149">-1</text>
    </g>
    <path d="M 55 100 Q 55 60 100 60 Q 145 60 145 100 Q 145 145 100 145 Q 55 145 55 100 Z" fill="#f0883e" stroke="#8a4a10" stroke-width="3"/>
    <circle cx="150" cy="95" r="10" fill="#f0883e" stroke="#8a4a10" stroke-width="3"/>
    <circle cx="85" cy="95" r="10" fill="#fff" stroke="#000" stroke-width="2"/><circle cx="88" cy="96" r="4" fill="#000"/>
    <circle cx="115" cy="95" r="10" fill="#fff" stroke="#000" stroke-width="2"/><circle cx="112" cy="94" r="4" fill="#000"/>
    <rect x="80" y="115" width="40" height="18" rx="3" fill="#1a1f30" stroke="#000" stroke-width="2"/>
    <text x="100" y="128" text-anchor="middle" font-family="monospace" font-size="12" fill="#7ee787" font-weight="700">i=n+1</text>
  </svg>`;

  S.nullptr = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <text x="100" y="180" text-anchor="middle" font-family="monospace" font-size="11" fill="#bc8cff" opacity=".5" font-weight="700">0x00000000</text>
    <path d="M 60 90 Q 60 55 100 55 Q 140 55 140 90 L 140 145 L 130 135 L 120 145 L 110 135 L 100 145 L 90 135 L 80 145 L 70 135 L 60 145 Z" fill="#bc8cff" fill-opacity=".7" stroke="#7d4bb8" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="90" cy="90" r="12" fill="#0b0f1a" stroke="#7d4bb8" stroke-width="2"/>
    <path d="M 84 84 L 96 96 M 96 84 L 84 96" stroke="#f85149" stroke-width="2.5" stroke-linecap="round"/>
    <text x="115" y="98" font-family="monospace" font-size="20" fill="#7d4bb8" font-weight="700">?</text>
    <path d="M 88 118 Q 100 112 112 118" stroke="#7d4bb8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;

  S.loop = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="80" fill="none" stroke="#58a6ff" stroke-width="1.5" stroke-dasharray="6 8" opacity=".4"/>
    <path d="M 100 45 Q 155 45 155 100 Q 155 155 100 155 Q 45 155 45 100 Q 45 45 100 45" fill="none" stroke="#3b7dd8" stroke-width="24" stroke-linecap="round"/>
    <path d="M 100 45 Q 155 45 155 100 Q 155 155 100 155 Q 45 155 45 100 Q 45 45 100 45" fill="none" stroke="#58a6ff" stroke-width="18" stroke-linecap="round"/>
    <circle cx="100" cy="45" r="16" fill="#58a6ff" stroke="#3b7dd8" stroke-width="3"/>
    <circle cx="106" cy="42" r="4" fill="#fff"/><circle cx="107" cy="42" r="2" fill="#000"/>
    <rect x="70" y="90" width="60" height="22" rx="4" fill="#0b0f1a" stroke="#58a6ff" stroke-width="1.5"/>
    <text x="100" y="105" text-anchor="middle" font-family="monospace" font-size="11" fill="#58a6ff" font-weight="700">while(true)</text>
  </svg>`;

  S.leak = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="100" cy="175" rx="55" ry="8" fill="#3fb950" opacity=".4"/>
    <ellipse cx="100" cy="175" rx="40" ry="5" fill="#3fb950" opacity=".7"/>
    <path d="M 50 100 Q 50 55 100 55 Q 150 55 150 100 Q 155 130 140 145 Q 120 155 100 152 Q 80 155 60 145 Q 45 130 50 100 Z" fill="#3fb950" stroke="#1f6f2c" stroke-width="3"/>
    <ellipse cx="80" cy="80" rx="15" ry="10" fill="#7ee787" opacity=".5"/>
    <g transform="translate(95 110) rotate(15)">
      <rect x="-20" y="-8" width="40" height="16" fill="#1a1f30" stroke="#0b0f1a" stroke-width="1"/>
      <g fill="#f0883e"><rect x="-16" y="-6" width="4" height="4"/><rect x="-10" y="-6" width="4" height="4"/><rect x="-4" y="-6" width="4" height="4"/><rect x="2" y="-6" width="4" height="4"/><rect x="8" y="-6" width="4" height="4"/></g>
      <text x="0" y="5" text-anchor="middle" font-family="monospace" font-size="6" fill="#7ee787" font-weight="700">RAM</text>
    </g>
    <ellipse cx="80" cy="85" rx="7" ry="9" fill="#fff" stroke="#1f6f2c" stroke-width="2"/><circle cx="80" cy="90" r="3" fill="#000"/>
    <ellipse cx="120" cy="85" rx="7" ry="9" fill="#fff" stroke="#1f6f2c" stroke-width="2"/><circle cx="120" cy="90" r="3" fill="#000"/>
  </svg>`;

  S.buffer = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <path d="M 50 130 L 50 100 Q 50 80 60 75 L 140 75 Q 150 80 150 100 L 150 130 Q 150 155 125 160 L 75 160 Q 50 155 50 130 Z" fill="#f0883e" stroke="#8a4a10" stroke-width="3"/>
    <path d="M 55 80 L 60 65 L 68 78 L 75 60 L 85 75 L 95 62 L 105 78 L 115 60 L 125 75 L 132 60 L 140 78 L 145 65 L 150 80" fill="#f85149" stroke="#8a4a10" stroke-width="2.5" stroke-linejoin="round"/>
    <g font-family="monospace" font-size="12" font-weight="700"><text x="70" y="70" fill="#fff">1</text><text x="90" y="65" fill="#fff">0</text><text x="110" y="68" fill="#fff">1</text><text x="130" y="65" fill="#fff">0</text></g>
    <circle cx="80" cy="115" r="10" fill="#fff" stroke="#000" stroke-width="2"/>
    <text x="80" y="120" text-anchor="middle" font-family="monospace" font-size="12" fill="#f85149" font-weight="700">!</text>
    <circle cx="120" cy="115" r="10" fill="#fff" stroke="#000" stroke-width="2"/>
    <text x="120" y="120" text-anchor="middle" font-family="monospace" font-size="12" fill="#f85149" font-weight="700">!</text>
    <rect x="85" y="138" width="30" height="6" rx="2" fill="#000"/>
  </svg>`;

  S.race = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g opacity=".25" transform="translate(-20 0)"><circle cx="100" cy="90" r="22" fill="#58a6ff"/><path d="M 82 105 Q 100 145 118 105 L 118 140 L 100 130 L 82 140 Z" fill="#58a6ff"/></g>
    <g opacity=".5" transform="translate(-10 0)"><circle cx="100" cy="90" r="22" fill="#58a6ff"/><path d="M 82 105 Q 100 145 118 105 L 118 140 L 100 130 L 82 140 Z" fill="#58a6ff"/></g>
    <g>
      <circle cx="100" cy="90" r="22" fill="#58a6ff" stroke="#3b7dd8" stroke-width="3"/>
      <path d="M 82 105 Q 100 145 118 105 L 118 140 L 100 130 L 82 140 Z" fill="#58a6ff" stroke="#3b7dd8" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="93" cy="88" r="5" fill="#fff"/><circle cx="95" cy="88" r="2.5" fill="#000"/>
      <circle cx="108" cy="88" r="5" fill="#fff"/><circle cx="110" cy="88" r="2.5" fill="#000"/>
      <ellipse cx="100" cy="100" rx="4" ry="3" fill="#0b0f1a"/>
    </g>
    <path d="M 165 90 L 175 100 L 168 100 L 178 110" stroke="#f0883e" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  S.stack = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0 0)"><rect x="50" y="155" width="100" height="20" rx="3" fill="#7d4bb8" stroke="#4a2b7a" stroke-width="2"/><text x="100" y="169" text-anchor="middle" font-family="monospace" font-size="9" fill="#fff" font-weight="700">main()</text></g>
    <g transform="translate(2 0)"><rect x="52" y="132" width="96" height="20" rx="3" fill="#8f5bcc" stroke="#4a2b7a" stroke-width="2"/><text x="100" y="146" text-anchor="middle" font-family="monospace" font-size="9" fill="#fff" font-weight="700">recurse()</text></g>
    <g transform="translate(-3 0)"><rect x="49" y="109" width="96" height="20" rx="3" fill="#a06fde" stroke="#4a2b7a" stroke-width="2"/><text x="97" y="123" text-anchor="middle" font-family="monospace" font-size="9" fill="#fff" font-weight="700">recurse()</text></g>
    <g transform="translate(4 0)"><rect x="53" y="86" width="94" height="20" rx="3" fill="#b283ee" stroke="#4a2b7a" stroke-width="2"/><text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="9" fill="#fff" font-weight="700">recurse()</text></g>
    <g transform="translate(-2 0)"><rect x="52" y="63" width="92" height="20" rx="3" fill="#bc8cff" stroke="#4a2b7a" stroke-width="2"/><text x="98" y="77" text-anchor="middle" font-family="monospace" font-size="9" fill="#fff" font-weight="700">recurse()</text></g>
    <g transform="translate(3 0)">
      <rect x="60" y="30" width="80" height="30" rx="4" fill="#f85149" stroke="#7a1a1a" stroke-width="2.5"/>
      <circle cx="80" cy="42" r="4" fill="#fff"/><circle cx="81" cy="43" r="2" fill="#000"/>
      <circle cx="120" cy="42" r="4" fill="#fff"/><circle cx="121" cy="43" r="2" fill="#000"/>
      <path d="M 75 37 L 85 41" stroke="#000" stroke-width="2" stroke-linecap="round"/><path d="M 125 37 L 115 41" stroke="#000" stroke-width="2" stroke-linecap="round"/>
      <path d="M 88 52 Q 100 48 112 52" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>
  </svg>`;

  S.segfault = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-8 -5)">
      <path d="M 50 70 L 90 68 L 88 100 L 55 105 Z" fill="#f85149" stroke="#7a1a1a" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="60" y="80" width="8" height="8" fill="#fff"/><rect x="62" y="82" width="4" height="4" fill="#000"/>
      <rect x="75" y="80" width="8" height="8" fill="#fff"/><rect x="77" y="82" width="4" height="4" fill="#000"/>
    </g>
    <g transform="translate(8 -3)"><path d="M 105 70 L 145 75 L 148 105 L 108 100 Z" fill="#f85149" stroke="#7a1a1a" stroke-width="2.5" stroke-linejoin="round"/></g>
    <g transform="translate(-10 5)"><path d="M 55 115 L 95 118 L 92 145 L 58 142 Z" fill="#f85149" stroke="#7a1a1a" stroke-width="2.5" stroke-linejoin="round"/></g>
    <g transform="translate(10 6)">
      <path d="M 108 115 L 148 118 L 145 148 L 105 142 Z" fill="#f85149" stroke="#7a1a1a" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M 115 128 L 120 133 L 125 128 L 130 133 L 135 128" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <rect x="70" y="155" width="60" height="20" rx="3" fill="#0b0f1a" stroke="#f85149" stroke-width="1.5"/>
    <text x="100" y="169" text-anchor="middle" font-family="monospace" font-size="11" fill="#f85149" font-weight="700">SIGSEGV</text>
  </svg>`;

  S.deadlock = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="bossGlow"><stop offset="0%" stop-color="#f85149" stop-opacity=".4"/><stop offset="100%" stop-color="#f85149" stop-opacity="0"/></radialGradient></defs>
    <circle cx="100" cy="100" r="90" fill="url(#bossGlow)" opacity=".5"/>
    <g stroke="#8a8f9c" stroke-width="3" fill="none">
      <ellipse cx="88" cy="100" rx="6" ry="4" transform="rotate(15 88 100)"/>
      <ellipse cx="100" cy="100" rx="6" ry="4" transform="rotate(-15 100 100)"/>
      <ellipse cx="112" cy="100" rx="6" ry="4" transform="rotate(15 112 100)"/>
    </g>
    <g>
      <path d="M 20 100 Q 20 55 55 55 Q 82 55 82 90 L 82 115 Q 82 145 55 145 Q 20 145 20 100 Z" fill="#7a1a1a" stroke="#4a0a0a" stroke-width="3"/>
      <circle cx="45" cy="88" r="12" fill="#fff"/><circle cx="48" cy="90" r="7" fill="#f85149"/><circle cx="49" cy="91" r="3" fill="#000"/>
      <path d="M 32 78 L 58 84" stroke="#000" stroke-width="3" stroke-linecap="round"/>
      <path d="M 40 115 L 45 108 L 50 115 L 55 108 L 60 115 L 65 108 L 70 115" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g>
      <path d="M 180 100 Q 180 55 145 55 Q 118 55 118 90 L 118 115 Q 118 145 145 145 Q 180 145 180 100 Z" fill="#4a0a0a" stroke="#2a0505" stroke-width="3"/>
      <circle cx="155" cy="88" r="12" fill="#fff"/><circle cx="152" cy="90" r="7" fill="#f0883e"/><circle cx="151" cy="91" r="3" fill="#000"/>
      <path d="M 168 78 L 142 84" stroke="#000" stroke-width="3" stroke-linecap="round"/>
      <path d="M 130 115 L 135 108 L 140 115 L 145 108 L 150 115 L 155 108 L 160 115" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <rect x="65" y="165" width="70" height="20" rx="3" fill="#0b0f1a" stroke="#f85149" stroke-width="1.5"/>
    <text x="100" y="179" text-anchor="middle" font-family="monospace" font-size="11" fill="#f85149" font-weight="700">DEADLOCK</text>
  </svg>`;

  global.FCSTdSprites = S;
})(window);
