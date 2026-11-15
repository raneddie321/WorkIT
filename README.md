# WorkIT

A unified document workspace: **workIT Docs** (rich text editor), **Sheets** (spreadsheet with a formula engine), **Tables** (database-style tracker) and **Slides** (presentation builder) — in one clean single-page app.

## Run it
Open `index.html`. No build step, no dependencies. Works offline; documents persist in `localStorage`.

## Structure
- `index.html` — app shell (sidebar, top bar, view root)
- `css/base.css` — design tokens & reset; `layout.css` — app layout; `components.css` — UI pieces
- `js/main.js` — entry point: theme, routing, drawer
- `js/state.js` — document store + formula evaluator
- `js/storage.js` — localStorage load/save
- `js/seed.js` — demo documents on first run
- `js/router.js` — hash router
- `js/ui/` — dashboard, list views, doc editor (rich text / sheet / table / slides), pricing

## Roadmap (needs a backend)
Real-time collaboration (WebSocket), cloud sync, end-to-end encryption, PWA install, team management and payments. The front-end is structured so these plug into `js/state.js` and `js/storage.js`.