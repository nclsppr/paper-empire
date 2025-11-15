# Papers Empire

Papers Empire is a browser-based incremental game that runs entirely on the client side. The experience is intentionally light-hearted: you're modernising an industrial print shop a la Victor Buck Services while channeling the vibe of workplace sitcoms.

The UI is now split across dedicated HTML, CSS, and JavaScript assets for easier maintenance. Additional helper modules power the modifier builder math and god-mode utilities so they can be unit-tested in isolation.

For a deeper dive into the architecture, commands, and debugging notes see [`DOCUMENTATION.md`](DOCUMENTATION.md).

## Versioned Change History

Track meaningful milestones in the project:

- **0.1** – Initial concept and single-file setup.
- **0.2** – Fix interactive flow so clicking and buy buttons immediately update the game state and UI.
- **0.3** – Stabilise production modifiers, surface their impact in the UI, and add targeted unit tests.
- **0.4** – Introduce the hidden “renard” god mode with time-scaling controls and supporting tests.
- **0.5** – Split the UI into modular assets, cache DOM references for better performance, and add extensive inline documentation plus project-wide docs.
- **0.6** – Externalise i18n, add German/Luxembourgish, refresh the mobile UI (sticky header, ripple, layout fixes), and add Playwright layout tests. See `RELEASE_NOTES.md` for details.

When you make notable changes (new features, mechanics, UI improvements), append a new entry with an incremented version number and a short description of what changed.
