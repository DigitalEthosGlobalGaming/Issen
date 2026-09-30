# Issen 一閃

A one-handed samurai swipe game for mobile browsers, with an offline Android prototype. Everything is drawn in code on a canvas. Development uses TypeScript 7 and Vite. Web loads Shippori Mincho B1 from Google Fonts; Android bundles the font and its license.

Play the published game at [digitalethosglobalgaming.github.io/Issen](https://digitalethosglobalgaming.github.io/Issen/).

## Files

- `index.html` and `src/main.ts`: Vite entry and application startup.
- `src/ui/`: shell, screen HTML fragments and mounting.
- `src/styles/`: shared styles; armory styles live alongside its screen.
- `src/game/`: run state, combat, encounters, content, equipment and progression rules.
- `src/rendering/`: scenery, figures, effects and isolated armory previews.
- `src/shared/` and `src/platform/`: typed utilities and browser adapters.
- `src/game.ts`: typed runtime composition, encounter transitions and presentation orchestration.
- `tests/`: unit and browser regression checks.

See the [architecture guide](docs/architecture/overview.md) for module boundaries and the [migration record](docs/architecture/typescript-migration.md) for verification. Root `index.html` is the single supported entry; the legacy combined HTML/CSS files have been removed.

## Running locally

Use Node 24 (verified with 24.16.0):

```
npm install
npm run dev
```

Open the local address printed by Vite. For phone testing on your local network, use `npm run dev -- --host 0.0.0.0` and your computer's IP address.

`npm run typecheck` checks all application TypeScript. `npm run build` type-checks and builds `dist/`; `npm run preview` serves that output. `npm run build:pages` creates the GitHub Pages build with the repository base path. `npm test` runs rule tests. `npm run test:browser` runs isolated browser regression tests using an installed Microsoft Edge browser and starts Vite if needed. See [development guidance](docs/development/local-development.md) for verification scope.

## Android prototype

For Android, run `npm run android:apk` with Java 21 and Android SDK 36 installed.
The test app uses `com.digitalethosglobalgaming.issen.debug` and can coexist with
the future Play release. See [Android setup and Play release steps](docs/development/android.md).
The prototype still needs physical-device validation before ads, purchases and
store submission. GitHub Pages deployment is unchanged.

## Adding features

See the [implemented architecture](docs/architecture/overview.md) for module ownership and extension points. Put rules and data in their owning feature modules, then connect presentation through the runtime. Renderers receive explicit canvases; armory effects do not borrow the live game's particle state.

## Saved data

Progress lives in the browser's localStorage under keys starting with `issen.`: stats, unlocks, equipment, setup, hints and mute. To reset everything, run this in the browser console:

```
Object.keys(localStorage).filter(k=>k.startsWith('issen.')).forEach(k=>localStorage.removeItem(k))
```

Progress on your computer is separate from the published version on claude.ai.

## Notes

- The share card's "Save image" button tries the optional host downloads integration, then Web Share when supported, then a normal file download. Availability depends on the host and browser.
- Keyboard controls for desktop testing: arrow keys or WASD to cut, Space to tap or parry, P or Escape to pause.
