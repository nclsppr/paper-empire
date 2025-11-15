# Victor Buck Tycoon – Developer Guide

This document captures the current architecture of the game, how the files are organised after the split, and the commands needed to run or extend the project.

## 1. Project Overview

Victor Buck Tycoon is a fully client-side incremental/tycoon experience. All state lives in `app.js`, and rendering is performed with vanilla DOM APIs. There is no build step by design so that you can double-click `victorzoo.html` and play.

Key features:

- Buildings and upgrades with multilingual labels (FR/EN) and per-building modifiers.
- Live stats (DOC, CC, gauges) driven by a simulation loop.
- Prestige mechanic with culture points and multiplier bonuses.
- Hidden god mode that accelerates simulated time when the player types `renard` in the window.

## 2. File Structure

```
victorzoo/
├── victorzoo.html          # Markup shell referencing styles + scripts
├── assets/
│   ├── css/
│   │   └── style.css      # All layout/visual rules
│   └── js/
│       ├── app.js         # Gameplay, UI, localisation, god-mode controller
│       ├── modifier-utils.js  # Pure helpers for modifier math (UMD)
│       └── godmode-utils.js   # Pure helpers for cheat detection & scaling (UMD)
├── tests/
│   ├── modifiers.test.js  # Node-based unit tests for modifier-utils
│   └── godmode.test.js    # Node-based unit tests for godmode-utils
├── README.md              # High-level project summary + changelog
└── DOCUMENTATION.md       # (this guide) architecture & workflows
```

The helper modules live under `assets/js` so they can be imported by both the browser (via `<script>`) and Node tests (CommonJS). The main `app.js` assumes both helpers have already been loaded and destructures the exported methods.

## 3. Running the Game

1. Open `victorzoo.html` in any modern browser (Chrome, Firefox, Edge, Safari).
2. Switch languages via the FR/EN picker in the top-left corner.
3. Click `Imprimer un document` to start generating DOC, then purchase buildings/upgrades as funds allow.

There is no build or server dependency. If you prefer to serve through a local static server for caching reasons, any tool (e.g. `npx serve .`) will work.

## 4. Testing

Two lightweight Node tests cover the pure helper modules:

```bash
cd victorzoo
node tests/modifiers.test.js
node tests/godmode.test.js
```

These can run without a DOM since both helper files expose CommonJS exports. When you add new pure helpers, place their tests alongside these files.

## 5. God Mode Cheatsheet

- Focus the window and type `renard` (without quotes). Inputs inside text fields are ignored so you can keep chatting/renaming without triggering the cheat.
- Once unlocked, the god-mode card becomes visible in the right column.
- Use the x1/x10/x100/x1000 buttons to set the simulation time scale. This multiplies the `dt` delta that drives production, prestige, and gauge recovery.

## 6. Coding Guidelines

- **DOM caching:** `app.js` caches all frequently used nodes in the `DOM` object to avoid repeated queries per frame.
- **Translations:** add new keys to the `I18N` object (both FR and EN sections). Use `data-i18n` where possible so `applyStaticTranslations()` keeps the UI in sync.
- **State updates:** whenever a change impacts building or upgrade layouts, flip `uiState.buildingsDirty` or `uiState.upgradesDirty` so `renderAll()` can refresh only what is necessary.
- **Documentation:** prefer short JSDoc-style block comments (already applied throughout `app.js`) to explain non-trivial functions.
- **Testing:** keep logic that can be isolated (math helpers, cheat detection, etc.) outside of `app.js` so it can be reused in the browser and in tests.

## 7. Next Steps

- Extend the upgrade list (`gameState.upgrades`) with richer mechanics.
- Add persistence (localStorage) so progress survives reloads.
- Experiment with more events/log messaging to keep later stages lively.

Feel free to append new sections when adding significant capabilities so future contributors understand the mental model quickly.
