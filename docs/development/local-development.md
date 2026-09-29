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
| `npm run build:pages` | Type-check, then build for the `/Issen/` GitHub Pages path |
| `npm run preview` | Serve the production build; run build first |
| `npm test` | Node test runner with native TypeScript stripping for rule tests |
| `npm run test:browser` | Playwright tests using installed Microsoft Edge |
| `npm run test:production` | Build, then test bundled assets through a dedicated Vite preview server |

## Fast feedback

Start with `npm run typecheck` and the tests that cover the changed behavior. The
unit suite is fast enough to run as a whole, but a focused file is also supported:

```powershell
node --test tests/unit/encounters.test.mjs
npm run test:browser -- tests/browser/feature-plan-05.spec.ts
npm run test:browser -- tests/browser/feature-plan-05.spec.ts -g "Temple rank"
```

The browser suite runs with two workers by default. This parallelizes test
files; cases within a file still run in order. Use
`npm run test:browser -- --workers=1` when investigating timing-sensitive
failures, and rerun only failures with `npm run test:browser -- --last-failed`.
Run the full browser suite for shared runtime changes and before a release. Run
production tests when changing bundling, startup or deployment behavior, and
for release verification. `npm run test:production` already runs `npm run build`,
which includes TypeScript checking; a separate build/typecheck immediately
before it duplicates work. After a passing check, repeat it only if subsequent
edits affect what it covered.

Browser tests use an isolated context at `http://127.0.0.1:5173`. Playwright starts
Vite if necessary and can reuse an existing server. Tests that import the entry
module must use its actual script URL, including Vite's timestamp when present,
to avoid accidentally starting a second application instance.

Ordinary runs now save `issen.runCheckpoint` at encounter boundaries and Shrine
choices. Reload a run to test recovery on the pause screen; **Continue** resumes
the saved encounter or Shrine choice. The pause and result screens show
its seed. Use the testing profile for checkpoint and fatal-loss experiments so
real player progress is not changed. The test profile uses
`issen.testing.runCheckpoint` automatically. A fatal loss or explicit End run
removes Continue after results settle.

The renderer samples sustained frame time and adjusts cosmetic density toward a
60 fps budget. Weather particles, leaves, gusts and impact effects scale down
under load and recover gradually; gameplay rolls stay on the saved run's random
stream. Test this with a live run on the target device rather than interpreting
one slow startup frame as sustained performance.

For production verification without writing `dist/`, run `npm run typecheck`,
then `npx vite build --outDir .verification-build-next-features`. Set
`ISSEN_PREVIEW_DIR=.verification-build-next-features` when running
`npx playwright test --config playwright.production.config.ts`. The isolated
build folder is ignored by Git.

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
Feature-04 browser checks additionally exercise first live guided encounters,
portrait setup gates, Armoury unread underlines, deferred boss rewards and run-end reveals.
These tests are not proof of pixel-perfect parity or complete playthrough coverage.
Production tests separately exercise bundled asset startup, armory, a run, sharing
and landscape layout. Native mobile share sheets and physical touch devices are not
covered by desktop automation.

Keyboard controls are arrows/WASD to cut, Space to tap/parry (or throw an owned,
charged knife during an ordinary wave), and P/Escape to pause.
On a paused screen, a keyboard press resumes when a button is not focused.

## Testing tools and onboarding

Press **Ctrl+Shift+A** to open Testing tools. Select **Enter test profile**; the
reload activates an isolated `issen.testing.*` save namespace and a visible badge.
The screen groups Profile, Modes & Trials, Encounter, Armoury & Awakenings,
Temple, and Onboarding controls. Open it again to jump to an encounter, set
equipment or ranks, and replay lessons or reveals. Mode access is an ordered
selector; **Unlock Ronin mode** is a shortcut that preserves later access.
**Trials unlocked** sets the isolated test profile's Ronin best wave to 10 and
also enables Ronin. Clearing the checkbox resets that test best wave to 0; it
does not remove completed Trials or their cosmetic rewards. The Trials button
then follows the same saved-progress gate as it does for a player profile.
The permanent-upgrades checkbox controls the next run's setup. All of these
controls are unavailable in the player profile.
**Clear test profile** asks for confirmation, removes only `issen.testing.*`, and
reloads a fresh test profile. It blocks stale queued saves during reload.
**Unlock all** grants the complete Armoury (including awakened unlocks) only in
the test profile, without changing Temple ranks or equipment. Set Awakening Access
separately to reveal and use those forms.

Stats also offers **Reset profile** for the active profile. Its modal warning
requires **Delete all progress**; Cancel/Escape leave saves unchanged. A player
reset removes player `issen.*` keys but preserves `issen.testing.*`; a test reset
removes only `issen.testing.*`. Records, unlocks, awakening progress, Temple ranks,
currency, onboarding and settings are reset, then the game reloads. Queued writes
are blocked during reload, and failures attempt to restore the captured data.
Verify this only in disposable browser contexts, never with real player saves.
**Return to player profile** reloads the original saves. The shortcut ships in the
client for convenience, not as an access-control mechanism. Never reset player
saves to test these flows.

The first Begin for a fresh profile starts gameplay directly. Tutorial practice
is available from the title menu and returns there on completion or Skip.
Tests that drive ordered
waves or boss combat without teaching prompts should also seed
`issen.guidedLessons` with `{ "order": true, "bossParry": true }`; test-profile
fixtures use the `issen.testing.guidedLessons` namespace. No lives and Endless
fixtures need Vitality rank 1 in schema-4 metadata. Legacy contexts with
positive historical runs/duels/best-wave and absent metadata migrate to all modes
unlocked. Use explicit fresh metadata when testing locked modes rather than relying
on migration. See the [first feature record](../features/next-feature-plan.md) for
historical currency and milestone rules. The [second feature record](../features/feature-plan-02.md)
updates the upgrade catalog, Normal-life baseline, upgrades toggle and awakening
rules; [feature plan 04](../features/feature-plan-04.md) records current end-run
settlement and teaching behavior.

For awakening tests seed `issen.awakening` with separate `blades`/`robes` records
and use owned access in metadata; editing lifetime `issen.stats.bl` after migration
must not grant new challenge progress. Use schema version 4 for new fixtures:
awakening rank 1 enables weapons only and rank 2 enables outfits too. Older
purchased combined access migrates once to rank 2. Metadata versioning prevents the old
Knife/Pouch split from losing capacity: old owned Knife + Pouch ranks become the
single knife rank (1–3). Fractional Embers persist as integer hundredths in
`emberRemainder`, so half-rate kills and small Yoroi rewards accumulate across
completed runs and reloads. An abandoned run does not pay out. Versioning also prevents the old
Vitality-to-rank-2 compensation from applying repeatedly. Test Off separately from
challenge-mode eligibility: Off suppresses both Template powers and awakened forms,
while challenge tracking still works after access. Knife tests must cover bosses,
standoffs, UI, zero charges and no valid target without spending charges.

Focused coverage includes `tests/unit/robe-awakenings.test.mjs` for all 20 outfits,
`tests/unit/robe-aura.test.mjs` for visual state/opacity isolation and
`tests/browser/outfit-awakenings.spec.ts` for access, activation, suppression and
hidden-secret presentation. These targeted checks do not replace integrated
run-start, migration, input and visual checks.

`tests/unit/meta.test.mjs` covers progression rules and parsing;
`tests/unit/run-rewards.test.mjs`, `armory-seen.test.mjs`, and
`guided-state.test.mjs` cover the new run-local payout, viewed state, and
teaching state. `tests/browser/feature-plan-04.spec.ts` checks live guided
encounters and mobile menu progression, including browser-generated touch swipes
during frozen cut practice and a touch parry at the held boss glint. Cut practice
must allow pointer-down to begin a swipe; only a completed tap is suppressed.
The boss-rush pool, Twin filtering,
and secret event sequences/predicates have focused unit coverage.
`tests/browser/tutorial.spec.ts` exercises the independent playable lesson flow,
skip/replay, cleanup and save isolation. The audio cue test verifies synthesis
parameters; listening in combat is still needed to assess the sound's character.

## Persistence and sharing

Use test contexts or a disposable browser profile when testing save corruption or
reset behavior. Do not clear real player data. Saves belong to the browser origin;
localhost, LAN addresses and deployed sites have separate storage.

Sharing tries an optional host downloads API, then Web Share when file sharing is
supported, then a PNG download link. Host downloads require the host integration;
Web Share depends on browser/device support. The displayed image remains a manual
save option. Native dialogs and actual mobile devices require separate verification.

## GitHub Pages deployment

Pushing `main` runs `.github/workflows/deploy-pages.yml`. The workflow installs the
locked dependencies, runs `npm run build:pages`, uploads `dist/` as a Pages artifact
and deploys it to the `github-pages` environment. The published site is
`https://digitalethosglobalgaming.github.io/Issen/`.

The Pages build uses `/Issen/` as Vite's base path because this is a project site.
Keep `npm run build` at the root base so existing local preview and production tests
continue to exercise `http://127.0.0.1:4173/`.
