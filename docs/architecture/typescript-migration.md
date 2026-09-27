# TypeScript and Vite migration plan

Status: migration implemented and verified on desktop Edge.

## Completion evidence

| Requirement | Implemented evidence | Verification |
| --- | --- | --- |
| Plan structure before extraction | Historical proposal below; actual ownership in [overview](overview.md) | Proposed and implemented structures are distinguished |
| TypeScript 7 | `typescript@7.0.2`, lockfile, strict `src/**/*.ts` configuration | `npm run build` passes; no application JS or type-check suppression remains |
| Vite development/build | Root HTML, `main.ts`, dev/build/preview scripts | Dev browser tests and dedicated production-preview test pass |
| Modular gameplay and services | Combat, encounters, progression, content, equipment, shrine, rendering, UI, audio, input and platform modules | 61 deterministic unit tests pass |
| Split HTML and CSS | Shell plus eight screen fragments; ordered shared and armory styles | Legacy body and CSS matched before duplicate removal; browser and production tests pass |
| Lifecycle and preview isolation | Disposable runtime, frame scheduler and service cleanup; explicit rendering targets | Disposal/remount and renderer-isolation tests pass |
| Preserve supported gameplay flows | Existing saves and controls retained | 34 browser tests pass, including twelve mode combinations, boss/shrine progression and Daruma revival |
| Maintainable extension points | Typed boundaries, formatted code, formatter/check scripts, architecture guide and agent routing | `npm run format:check` and documentation link checks pass |

Production preview separately verifies bundled startup, armory, run/end/restart,
share-card rendering and landscape layout without requesting development modules.
Sharing tests exercise ten host/native/download branches with mocked APIs; they
do not open native dialogs or write downloads.

## Implemented choices relative to the proposal

The proposal was a responsibility map, not a requirement for every suggested file.
`src/game.ts` remains the composition/encounter-presentation orchestrator, rather
than introducing a separate generic command/event framework. Feature rules,
simulation, content, UI controllers and reusable renderers are separate modules;
state stays private to each runtime instance. Some main scene/post-processing
coordination remains in that orchestrator and can be extracted when a feature needs
a new boundary. Audio remains one cohesive typed service. Vite needs no custom
configuration for the current build. Frame and lifecycle services live under
`platform/`, and navigation is part of the HUD controller.

The old combined `src/index.html` and `src/style.css` were removed after their
content matched the assembled replacements (normalizing whitespace) and production
preview passed. Root `index.html` is now the only supported entry.

## Coverage limits

Verification used Windows, Node 24.16.0 and desktop Microsoft Edge, with portrait
and landscape viewports. Physical touch devices, native mobile sharing dialogs,
subjective audio quality and pixel-perfect parity on every device were not verified.
These limits do not imply those browsers or devices are unsupported. Browser
persistence remains origin-specific; no real player saves were cleared.

The following baseline and proposal are retained as historical context.


## Pre-migration baseline (historical)

Before migration, the application consisted of `src/index.html`, `src/style.css`,
and `src/game.js` (about 1,550 densely packed lines), without a package manifest or
build configuration. The README and repository skill described an older root and
`split/` layout. Both now describe the Vite source tree; the checkpoint above tracks
the remaining migration work.

The original JavaScript contained procedural Canvas rendering, synthesized audio, gameplay,
content definitions, browser persistence, screen markup updates, and input wiring.
`G`, `P`, `EQ`, `ST`, rendering dimensions, the active drawing context `g`, and effect
arrays are shared mutable globals. `withPv`, `drawPreview`, and `applyFilmTo` swap
global drawing state to reuse rendering on other canvases. These are important
boundaries to address during extraction.

## Proposed structure

Keep vanilla DOM and Canvas, using TypeScript ES modules and Vite. Organize gameplay
by feature and rendering by responsibility. Each folder owns its related types;
avoid a single catch-all types file or globally exported mutable game object.

```text
index.html                         # Vite entry: metadata, app mount, main.ts
package.json
package-lock.json
tsconfig.json
vite.config.ts
src/
  main.ts                          # imports styles, creates and starts application
  app/
    create-app.ts                  # constructs services and connects them
    game-loop.ts                   # animation frame, raw/scaled delta, disposal
    lifecycle.ts                   # resize, visibility, pause, teardown
  game/
    session.ts                     # owns run state and dispatches commands
    state.ts                       # run state factory and phase types
    commands.ts                    # swipe, tap-down, tap, start, pause, resume
    events.ts                      # typed gameplay outcomes for presentation
    combat/
      enemies.ts                   # spawning, ordering, enemy updates
      attacks.ts                   # cut/parry resolution and timing
      player.ts                    # player action state and death/revival
      types.ts
    encounters/
      waves.ts                     # configuration, spawning, wave progression
      bosses.ts                    # duel state and attack chains
      standoff.ts                  # standoff timing and resolution
      progression.ts               # transitions between encounters and shrine
    equipment/
      modifiers.ts                 # computeMods with explicit inputs
      equipment.ts                 # selection and awakened blade rules
      types.ts
    shrine/
      blessings.ts                 # offers and selected blessing effects
    progression/
      scoring.ts                   # score and combo rules
      statistics.ts                # run results and lifetime counters
      unlocks.ts                   # item/awakening requirements
      types.ts
    content/
      stages.ts
      bosses.ts
      items.ts
      blessings.ts
      fortunes.ts
  rendering/
    renderer.ts                    # owns main-canvas rendering and layer order
    context.ts                     # explicit context, viewport, palette, time
    layout.ts                      # portrait/landscape geometry and DPR
    palette.ts                     # colours, robe palettes, seals
    scene/
      background.ts                # cached scenery and stage transitions
      props.ts                     # procedural environmental props
      weather.ts                   # ambient weather state/update/drawing
    figures/
      figure.ts                    # body/head drawing and figure generation
      weapons.ts                   # swords, spears, aura and glints
      cosmetics.ts                 # crests, charms, companions
      poses.ts
    effects/
      effects.ts                   # effect state, spawn and update
      draw-effects.ts              # particles, slash effects, pops and stamps
      post-processing.ts           # films, grain, vignette, flash and camera
    glyphs.ts                      # attack rings and direction cues
    preview.ts                     # independent armory canvas/effect state
  audio/
    audio.ts                       # AudioContext lifecycle and mute
    synthesis.ts                   # noise and oscillator primitives
    cues.ts                        # named sound effects and ambience
  input/
    pointer.ts                     # touch/pointer gesture recognition
    keyboard.ts                    # desktop controls
  platform/
    storage.ts                     # guarded JSON/localStorage access
    saves.ts                       # existing issen.* shapes, defaults, validation
    sharing.ts                     # host downloads, Web Share, download fallback
    haptics.ts
    browser.d.ts                   # narrow optional host/browser extensions
  ui/
    shell.html                     # canvas, HUD and overlay containers
    mount.ts                       # creates DOM before controllers initialize
    navigation.ts                  # screen/panel state independent of run state
    dom.ts                         # checked, typed element lookup
    hud.ts
    notifications.ts               # hints, toasts, banners and their timers
    screens/
      title.html / title.ts
      setup.html / setup.ts
      armory.html / armory.ts / armory.css
      stats.html / stats.ts
      shrine.html / shrine.ts
      game-over.html / game-over.ts
      pause.html / pause.ts
      share.html / share.ts
    share-card.ts                  # compositing and card text
  styles/
    index.css                      # explicit shared stylesheet import order
    tokens.css                     # fonts, colours, spacing and theme variables
    base.css                       # reset, viewport, canvas, touch behavior
    components.css                 # shared buttons, panels, badges and cards
    hud.css
    screens.css                    # shared and small screen-specific rules
  shared/
    math.ts
    random.ts
    directions.ts
    format.ts
tests/
  unit/                            # modifiers, scoring, encounters and saves
  browser/                         # real-browser flows and rendering smoke checks
docs/
  index.md
  architecture/typescript-migration.md
```

Names separated by `/` on one line represent sibling files, not nested paths.
This is a responsibility map: combine small cohesive pieces when extraction shows
that separate files would only add indirection. Large figure/effect renderers can
be divided further around distinct drawing primitives when useful.

## Ownership and dependencies

`create-app.ts` composes the session, renderer, audio, persistence, input and UI.
Input and UI translate interactions into typed commands. The session owns gameplay
state, calls feature functions, and returns typed outcomes such as enemy killed,
score changed, shrine opened or run ended. The app routes those outcomes to audio,
effects, persistence and UI. A small explicit event list/callback interface is
sufficient; no general-purpose event framework is needed.

Gameplay imports content and shared helpers but does not import DOM, Canvas, audio,
or storage implementations. Pass random/time dependencies where rules need them,
so timing and probability can be tested deterministically. Preserve existing raw
versus scaled delta behavior before changing simulation strategy.

Separate persisted player profile (stats, unlocks, equipment, setup), transient run
state, UI navigation, and visual effects. Feature functions receive the state they
need; the session controls orchestration. Avoid replacing globals with an equally
unrestricted context bag. Use typed readonly views for renderer inputs without
deep-cloning the entire game every frame.

Rendering receives a Canvas context and render environment explicitly. Main game,
armory preview and share card have independent targets and effect state; preview
rendering must never temporarily overwrite live game dimensions or effect arrays.
Keep visual caches inside renderer instances. Audio starts/resumes from user
gestures, preserving browser autoplay constraints.

## HTML and CSS

Use Vite `?raw` imports for static HTML fragments. Mount the shell and screen
templates once before binding handlers; controllers update text, classes and lists.
Keep user/save-derived values out of raw HTML interpolation. Preserve existing IDs,
labels, keyboard controls and touch behavior during the first extraction.

Import shared CSS in a deterministic order, then feature CSS. Keep responsive rules
with their owning styles, preserving their order and specificity during migration.
Move inline styles into their owning stylesheet. Add more screen stylesheets when
they have substantial unique styling; the armory already warrants one.

## Toolchain

- Use the stable TypeScript 7 `typescript` package and its `tsc` command; resolve and
  lock an available 7.x release when installing.
- Use Vite for development, CSS updates, bundling and production preview. Verify
  the selected Vite release's Node requirement when installing and document it.
- `dev`: `vite`; `typecheck`: `tsc --noEmit`; `typecheck:watch`:
  `tsc --noEmit --watch`; `build`: `npm run typecheck && vite build`;
  `preview`: `vite preview`.
- Use strict TypeScript, DOM libraries, ES modules, bundler module resolution,
  `verbatimModuleSyntax`, and `noEmit`. Prefer unions for phases/directions and
  checked indexed access for content lookup. Do not leave `@ts-nocheck` or broad
  `any` escape hatches as the final migration.
- Vite transpilation does not replace type checking. Keep the native compiler check
  in the build gate. Support full reload for gameplay edits initially; dispose
  listeners, animation frames, timers and audio nodes if using application HMR.
- Use a single maintained source tree and generated `dist/` output. Development
  runs through the Vite server; a double-clickable HTML bundle is a separate future
  packaging feature if needed.

References: [TypeScript 7 release](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/),
[Vite features](https://vite.dev/guide/features.html).

## Migration sequence and completion evidence

1. Capture baseline gameplay and screen behavior from the existing `src/` app.
   Record controls, saved-data keys, responsive layouts and optional sharing paths.
2. Establish Vite, TypeScript 7, scripts and entry HTML. Extract shared helpers,
   content definitions and typed persistence while keeping the game runnable.
3. Introduce typed profile/run/encounter state and extract gameplay rules. Add
   deterministic tests for modifiers, scoring, ordered attacks, duel timing,
   standoffs, blessings and unlock requirements.
4. Extract rendering and audio, replacing shared render-global swapping with
   explicit contexts. Compare main scene, armory previews and share cards against
   baseline in portrait and landscape.
5. Extract screen templates/controllers, styles and input adapters; connect them
   through application composition. Test pause/resume, visibility changes and
   repeated navigation for duplicate listeners or loops.
6. Remove superseded monolithic sources once parity is verified. Update README,
   the repo knowledge skill and concise agent routing to describe the actual
   structure and development commands.

Completion requires a verified 7.x compiler, passing strict typecheck and production
build, and a working Vite dev/preview app. Exercise waves and boss rush, normal and
Ronin difficulty, lives/no-lives/endless, shrine choices, death/revival, armory,
save/reload, audio/mute, sharing fallbacks, pointer/keyboard input and responsive
rendering. Test malformed/missing saves without clearing the user's existing data.
Retain current `issen.*` keys and compatible saved values; changing dev origin may
require explicit export/import for existing progress. Record any browser/device
coverage that could not be exercised rather than claiming full parity from a build.

To add a feature afterward: define its data and types in its owning gameplay
folder, implement its rules there, connect commands/outcomes through the session,
then add rendering or UI only where needed. A new item should primarily touch
content and its specific modifier/visual behavior, not the application bootstrap.
