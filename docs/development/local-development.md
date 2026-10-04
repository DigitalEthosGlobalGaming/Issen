# Local development and verification

## Edition builds

Version 1.13.0 supports `VITE_GAME_EDITION=free|premium|web`. Web/Pages builds
default to Web; Android mode defaults to Free. In PowerShell, set
`$env:VITE_GAME_EDITION = 'premium'` before a build command for a Premium beta,
then `Remove-Item Env:VITE_GAME_EDITION` to restore defaults. An ignored
`.env.android.local` may also select the mobile edition. Invalid values fail the
build. This grants edition access without inventing a purchase; native billing
still requires its separate opt-in/key. See
[edition rules](../features/editions-and-mastery.md).

Use Node 24 (the migration was verified with 24.16.0), then run `npm install` and
`npm run dev`. Vite prints the local URL. For phone testing use
`npm run dev -- --host 0.0.0.0` and the computer's LAN address.

The development watcher ignores Android outputs, local toolchains and
`tmp/` and legacy `.verification*` directories so building or verifying another
edition does not reload a running game.

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
| `npm run build:verification` | Type-check, then build into `tmp/.verification-build-production/` |
| `npm run test:production` | Build into `tmp/`, then test bundled assets through a dedicated Vite preview server |
| `npm run android:apk` | Build/sync offline assets and assemble the Android test APK |
| `npm run android:bundle` | Build/sync and produce a signed Play bundle with upload credentials |
| `npm run test:android-web` | Exercise offline Android assets in a touch-enabled browser |

See [Android development](android.md) for Java/SDK setup, physical-device testing
and release signing. GitHub Pages continues to use `build:pages`.

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
for release verification. `npm run test:production` already runs `npm run build:verification`,
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

Keep all disposable verification artifacts under ignored `tmp/`.
`npm run test:production` builds and serves `tmp/.verification-build-production/`
without writing `dist/`. To build separately, run `npm run build:verification`.
For a named build in PowerShell, set
`$env:ISSEN_PREVIEW_DIR = 'tmp/.verification-build-next-features'` before either
command; the build and production preview both honor it. Remove the variable with
`Remove-Item Env:ISSEN_PREVIEW_DIR` afterward. Raw Vite commands can use
`--outDir tmp/.verification-build-<task>`.

All Playwright configs write results to `tmp/test-results/<suite>/`. Test
screenshots use `testInfo.outputPath(...)` so captures stay with their test,
including retries and parallel workers. Put ad hoc screenshots, logs and optional
HTML/blob/coverage reports under `tmp/` too. Optional Playwright HTML and blob
reporters default to `tmp/playwright-report/<suite>/` and
`tmp/blob-report/<suite>/`; explicit reporter environment overrides are honored.

TypeScript is pinned to 7.0.2; Vite is pinned to 8.3.1. `package-lock.json` records
the dependency resolution. Test files are executed by their runners; the application
compiler's `include` covers `src/**/*.ts`, not the test directory.

## Verification scope

Unit tests exercise deterministic rules, save validation, state isolation, timing,
effect expiry and lifecycle cleanup. Browser tests cover startup, pause/resume,
end-run/restart, all twelve mode/difficulty/life-setting combinations, boss victory
to shrine to next duel, Daruma revival, malformed saves, mute persistence, screen
controllers, renderer isolation, portrait/landscape drawing and disposal/remount.
Feature-04 browser checks additionally exercise first live guided encounters,
portrait setup gates, Armoury unread underlines, deferred boss rewards and run-end reveals.
These tests are not proof of pixel-perfect parity or complete playthrough coverage.
Production tests separately exercise bundled asset startup, armory, a run and landscape layout. Physical touch devices require additional verification.

Default keyboard controls are arrows/WASD to cut, Space to tap/parry (or throw an
owned, charged knife during an ordinary wave), and P/Escape to pause or resume.
Options, available from the title and pause screens, supports keyboard rebinding
and Low/Normal/High swipe sensitivity. Escape remains reserved for pause and menu
navigation. Settings input never becomes combat input. Closing Options from a
paused run returns to pause; Continue resumes it.

Options groups Audio, Controls, and Display and Accessibility into submenus.
Sound effects and ambience have independent volume; master mute also matches the
HUD button and retains legacy `issen.muted` compatibility. Display preferences
cover reduced motion/flashes (System follows the OS reduced-motion preference),
Normal/Large interface text, Auto/Low/High cosmetic density and optional vibration.
`issen.settings` is validated, profile-aware and included in profile reset;
testing sessions use `issen.testing.settings`. Category Restore defaults changes
only that category. Test live controls, binding conflicts, Back/Escape and reload
with `tests/browser/options.spec.ts`; verify shadow grounding and raw-time fade
under slow motion with `tests/browser/death-presentation.spec.ts`.

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
the test profile, and grants at least Vitality rank 1 to expose Endless and No lives.
Other Temple ranks and equipment stay unchanged. Set Awakening Access
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

## Persistence

Use test contexts or a disposable browser profile when testing save corruption or
reset behavior. Do not clear real player data. Saves belong to the browser origin;
localhost, LAN addresses and deployed sites have separate storage.

## GitHub Pages deployment

Pushing a source branch runs `.github/workflows/deploy-pages.yml`. The workflow
installs locked dependencies, builds the branch's Pages path, updates the combined
site snapshot and deploys it to the `github-pages` environment. The production site is
`https://digitalethosglobalgaming.github.io/Issen/`.

The standalone privacy policy is maintained in `public/privacy/index.html` and
published at `https://digitalethosglobalgaming.github.io/Issen/privacy/`.
Vite copies it into web and Android builds; it uses system fonts and loads no
game scripts. The title screen opens it in a separate tab. Keep its data-handling
statements in sync when adding online services, analytics, ads or purchases.

The Pages build uses `/Issen/` as Vite's base path because this is a project site.
Keep `npm run build` at the root base so existing local preview and production tests
continue to exercise `http://127.0.0.1:4173/`.

The standalone privacy policy is maintained in `public/privacy/index.html` and
published at https://digitalethosglobalgaming.github.io/Issen/privacy/. Vite copies
it to the build. The title screen opens it in a separate tab. Keep the policy
current when adding online services, analytics, ads or purchases.

Daily runs, midnight recovery and profile isolation have focused coverage in `tests/unit/daily.test.mjs` and `tests/browser/daily.spec.ts`. Options tests exercise Classic/Scrolls persistence, reset and reduced-motion disposal. The privacy policy links to the standalone AI disclosure; neither page loads game code.

## Branch previews and feature batches

Use the repository [release-feature-sets skill](../../.agents/skills/release-feature-sets/SKILL.md)
for coherent feature batches. Work can stay on `develop` or any chosen source
branch; production promotion requires a release request.

`npm run build:develop` type-checks and builds `/Issen/develop/`.
`npm run build:branch` detects the current Git branch (or `GITHUB_REF_NAME` in CI).
Use `npm run build:branch -- --branch feature/combat` for an explicit target.
Both support Vite options such as `--outDir tmp/.verification-build-pages`.
`npm run build:pages` remains the production-only `/Issen/` build.

Simple lowercase branch names such as `develop` or `combat-test` map directly to
`/Issen/<branch-name>/`. Names containing slashes, uppercase characters, reserved
production directories or other punctuation use a normalized name and a stable
12-character hash; the build prints the exact base path. This prevents collisions
between branches such as `feature/combat` and `feature-combat`.

The Pages workflow runs for pushes to all source branches and for manual runs on
the selected branch. It excludes `gh-pages`, which stores only the generated
combined site. Builds on `main` replace production at `/Issen/`; other branches
replace only their own preview. Serialized runs preserve other deployments,
using `.issen-previews.json` to retain preview directories across production
updates. The first preview deployment seeds production from committed `main` if
no snapshot exists. Failed builds/assembly stop before deployment; a failed Pages
publish can be retried manually from the same source branch. Do not edit generated
snapshots as source code. Previews persist after a source branch is deleted;
cleanup is deliberately manual.

Keep Settings → Pages → Source set to **GitHub Actions**. The `github-pages`
environment must permit deployment from the chosen source branches, and the
workflow token needs `contents: write`, `pages: write` and `id-token: write`.
Branch protection on `gh-pages` must allow workflow snapshot pushes. A workflow
must be committed on the source branch to run there; existing feature branches
need to incorporate this setup. The workflow summary prints the branch URL.
Local changes do not publish until committed and pushed.

Previews share the production browser origin and therefore its `issen.*` saves.
Use a disposable browser context or the Testing tools test profile for experiments;
do not reset real progress to test a branch. Local root and Android builds retain
their current paths and save compatibility.

Verify deployment changes with:

```powershell
node --test tests/unit/pages-deployment.test.mjs
npm run build:develop -- --outDir tmp/.verification-build-pages
npx playwright test --config playwright.pages.config.ts
npm run test:production
```

The Pages smoke test verifies nested-path startup, artwork, Armoury and standalone
pages. Set `ISSEN_PAGES_BASE` and `ISSEN_PREVIEW_DIR` to test another built branch.
