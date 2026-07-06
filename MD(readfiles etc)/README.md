# 📋 Fabian's Cheat Sheets
 
> A clean, fast-reference collection of programming language cheat sheets — built for developers who want answers without the noise.
 
---
 
## 🌐 Overview
 
**Fabian's Cheat Sheets** is a personal web project offering concise, well-structured cheat sheets for various programming languages and technologies. Each cheat sheet is presented as a visual card with syntax highlights, key concepts, and quick-reference tables — designed to keep you in flow while coding.
 
Now with optional **gamification**: create a local account, collect a daily login reward, solve daily challenges to build a streak, earn coins & XP, level up, and spend coins on unlockable color themes. No ads. Just the information you need — plus a little fun.
 
**Status:** v1.0 stable | **Languages:** 7 | **Code Examples:** 200+ | **Topics Covered:** 50+
 
---
 
## ✨ Features
 
- 🃏 **Card-based UI** — Each language gets its own styled card with a unique color theme and glow effect
- 🌙 **Dark-first design** — Easy on the eyes during long coding sessions
- ⚡ **Fast & lightweight** — No heavy frameworks, instant load times
- 📐 **Clean layout** — Focused on readability and quick scanning
- 🔍 **Multiple standards** — Covers different versions and standards (e.g. C11 · C17)
- 🎯 **Interactive modal view** — Click any card to open the complete cheat sheet
- 🎨 **Syntax highlighting** — Code examples with proper formatting
- 📱 **Fully responsive** — Works seamlessly on desktop, tablet, and mobile
- 👤 **Local accounts** — Register with just a username & password (no email, no server). Data stays in your browser
- 🎁 **Daily rewards** — A login bonus that resets every day at midnight, scaled by your streak
- 🧩 **Daily challenges** — Multiple-choice, code-completion and freetext tasks across easy/medium/hard difficulties
- 🔥 **Streaks, XP & levels** — Solve at least one challenge a day to grow your streak and level up
- 🛍️ **Theme shop** — Spend earned coins to unlock and apply new color themes

---

## 📚 Available Cheat Sheets

| Language | Version | Coverage |
|----------|---------|----------|
| **C#** | .NET 8 · C# 12 | OOP, LINQ, async/await, Generics |
| **JavaScript** | ES2024 · Node.js | DOM, async patterns, Modules, Classes |
| **Python** | 3.12 | OOP, async patterns, Type hints, stdlib |
| **TypeScript** | 5.x · Strict Mode | Advanced types, Generics, Decorators |
| **C** | C11 · C17 | Pointers, Memory management, Structs |
| **SQL** | MySQL · PostgreSQL | Queries, Joins, Indexes, Transactions |
| **HTML** | HTML5 · Semantic | Elements, Forms, Semantic markup |

---

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/fabian/FabiansCheatSheets.git
   cd FabiansCheatSheets
   ```

2. **Open in browser** — Simply open `index.html` in your web browser
   - No server setup required
   - Works offline
   - Instant loading

3. **Navigate** — Click on any language card to open the full cheat sheet in a modal view

---

## 💻 Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Styling:** Custom CSS with animations and gradients
- **Icons:** Inline SVG
- **Fonts:** Bebas Neue, JetBrains Mono, Outfit (Google Fonts)
- **Plugins:** None — Pure vanilla web technologies

---

## 📁 Project Structure

```
FabiansCheatSheets/
├── index.html                      # Main landing page & modal viewer
├── assets/
│   ├── css/
│   │   └── gamify.css             # Styles for accounts, challenges & shop
│   └── js/
│       ├── store.js               # localStorage, hashing, profile model
│       ├── challenges-data.js     # Daily challenge pool
│       ├── gamify.js              # Rewards, streak, XP/level, daily logic
│       ├── shop.js                # Unlockable color themes
│       ├── auth.js                # Local register / login / logout
│       └── ui.js                  # Header widget & dialogs
├── CheatSheets/
│   ├── c-cheatsheet.html          # C Language reference
│   ├── csharp-cheatsheet.html     # C# & .NET reference
│   ├── html-cheatsheet.html       # HTML5 & semantic markup
│   ├── javascript-cheatsheet.html # JavaScript & ES2024
│   ├── python-cheatsheet.html     # Python 3.12
│   ├── sql-cheatsheet.html        # SQL databases
│   └── typescript-cheatsheet.html # TypeScript 5.x
└── MD(readfiles etc)/
    ├── README.md                  # This file
    └── SECURITY.md                # Security policy
```

---

## 🎨 Design Highlights

- **Animated background** — Subtle grid and color orb animations
- **Glassmorphism** — Modern frosted glass effect on header
- **Color-coded cards** — Each language has a unique signature color
- **Smooth transitions** — Spring animations and easing functions
- **Glowing effects** — Neon-style shadows on hover

---

## 🌍 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🔐 Security

For security-related information, vulnerabilities, or responsible disclosure, please refer to [SECURITY.md](./SECURITY.md).

---

## 📝 License

This project is open source. Check individual cheat sheet files for specific licensing information.

---

## 👤 About

Created by Fabian — A simple, no-nonsense reference library for modern developers.

**Website:** [FabiansCheatSheets.dev](https://fabianscheatsheets.dev)

---

## 🤝 Contributing

Suggestions for improvements or new cheat sheets are welcome! Feel free to:
- Submit issues for corrections or missing content
- Suggest additional languages or topics
- Improve formatting or explanations

---

**Last Updated:** June 2026 | **Status:** Active maintained
