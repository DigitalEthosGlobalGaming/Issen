# Local development and verification

Use Node 24 (the migration was verified with 24.16.0), then run `npm install` and
`npm run dev`. Vite prints the local URL. For phone testing use
`npm run dev -- --host 0.0.0.0` and the computer's LAN address.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Strict TypeScript check for all application modules |
| `npm run format` | Apply consistent source/test/config formatting |
| `npm run format:check` | Check formatting without changing files |
| `npm run typecheck:watch` | Continuous compiler diagnostics |
| `npm run build` | Type-check, then bundle into generated `dist/` |
| `npm run preview` | Serve the production build; run build first |
| `npm test` | Node test runner with native TypeScript stripping for rule tests |
| `npm run test:browser` | Playwright tests using installed Microsoft Edge |
| `npm run test:production` | Build, then test bundled assets through a dedicated Vite preview server |

Browser tests use an isolated context at `http://127.0.0.1:5173`. Playwright starts
Vite if necessary and can reuse an existing server. Tests that import the entry
module must use its actual script URL, including Vite's timestamp when present,
to avoid accidentally starting a second application instance.

TypeScript is pinned to 7.0.2; Vite is pinned to 8.3.1. `package-lock.json` records
the dependency resolution. Test files are executed by their runners; the application
compiler's `include` covers `src/**/*.ts`, not the test directory.

## Verification scope

Unit tests exercise deterministic rules, save validation, state isolation, timing,
effect expiry and lifecycle cleanup. Browser tests cover startup, pause/resume,
end-run/restart, all twelve mode/difficulty/life-setting combinations, boss victory
to shrine to next duel, Daruma revival, malformed saves, mute persistence, screen
controllers, renderer isolation, portrait/landscape drawing, sharing fallback
branches with mocked browser/host APIs, share-card generation and disposal/remount.
These tests are not proof of pixel-perfect parity or complete playthrough coverage.
Production tests separately exercise bundled asset startup, armory, a run, sharing
and landscape layout. Native mobile share sheets and physical touch devices are not
covered by desktop automation.

Keyboard controls are arrows/WASD to cut, Space to tap/parry, and P/Escape to pause.
On a paused screen, a keyboard press resumes when a button is not focused.

## Persistence and sharing

Use test contexts or a disposable browser profile when testing save corruption or
reset behavior. Do not clear real player data. Saves belong to the browser origin;
localhost, LAN addresses and deployed sites have separate storage.

Sharing tries an optional host downloads API, then Web Share when file sharing is
supported, then a PNG download link. Host downloads require the host integration;
Web Share depends on browser/device support. The displayed image remains a manual
save option. Native dialogs and actual mobile devices require separate verification.
