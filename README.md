# Flash Soccer Manager Reborn

A modern browser-based recreation of the Mousebreaker Flash Soccer Manager
08/09 feel: pick a club, pick your XI and formation, play through a league
one fixture at a time, watch the table update.

See [PLAN.md](./PLAN.md) for the architecture and what this prototype milestone
does and doesn't cover.

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (defaults to http://localhost:5173).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run test` — run the Vitest unit tests (the football simulation engine)
- `npm run test:watch` — Vitest in watch mode
- `npm run e2e` — run the Playwright end-to-end smoke test
- `npm run lint` — ESLint

## Project layout

```
src/engine/   Pure TypeScript football simulation — no React, fully unit-tested.
src/data/     Clubs, players, formations (data-driven, deterministically generated).
src/state/    React Context + reducer wiring the UI to the engine.
src/screens/  Menu, Club Select, Squad, Tactics, Fixtures, Table, Match Result.
src/components/ Small reusable UI pieces (Button, Panel, DataTable, TopNav).
```
