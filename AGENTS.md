# game

## Cursor Cloud specific instructions

This repository is a **zero-dependency HTML5 game** (vanilla JavaScript + Canvas, served as static files). There is no build step and no npm dependency tree.

### Toolchain
- `node` and `python3` are both preinstalled in the Cursor Cloud base image; nothing else needs to be installed.

### Run / Test / Lint
The game's `package.json` defines the canonical commands (prefer these over duplicating literals here):
- Run (dev): `npm start` — serves the static files (currently `python3 -m http.server 4173`). Then open `http://localhost:4173`. You can also open `index.html` directly in a browser.
- Test / lint: `npm test` — currently a syntax check (`node --check src/main.js`). There is no test framework configured.

### Non-obvious notes
- The static server must be started from the directory that contains `index.html` (the repo root once game files are present), otherwise the page 404s.
- The game canvas needs keyboard focus before WASD/Space input registers — click directly on the canvas (not a side panel or button) first.
- The `main` branch may be a placeholder; the actual game files (`index.html`, `src/main.js`, `styles.css`, `package.json`) currently live on `cursor/*` feature branches. Run/test commands above only apply once those files are present in the working tree.
