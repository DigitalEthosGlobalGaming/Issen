# Goal: Make Issen run smoothly and change stages without freezing

## Objective

Issen is a Pixi.js v8 (WebGL2) browser game. It targets mobile, ships as a Capacitor Android build, and runs on high-refresh displays. Bring it to the following state:

1. **Gameplay is smooth.** It holds frame budget at 120 Hz (about 8.3 ms per frame), with no recurring per-frame waste on the main thread.
2. **Stage changes feel near-instant.** No frozen screen, and no hitch when the new stage appears.
3. **Memory stays bounded.** Decoded images and GPU textures stay within a sensible budget on low-memory mobile devices, across a long run that visits every stage.

Work in the `DigitalEthosGlobalGaming/Issen` repository on the `develop` branch. Before starting, read `AGENTS.md`, `current-development-status.md` and `main-goal.md`. Follow the repo's conventions for code style, tests, commits and reporting.

Line numbers below are approximate. Locate code by function or file name.

---

## Definition of done

The goal is complete when all of the following are true, demonstrated with measured before and after numbers:

- Gameplay frame times: p95 under 8.3 ms, and frames over 16.7 ms are rare and explained.
- A normal stage change, where the player has spent a reasonable time in the previous stage, has near-zero loading time.
- A cold stage change (empty HTTP cache) never shows a frozen screen and is no slower than today.
- No main-thread task longer than 16 ms in the first two seconds after a stage is presented, on cold or warm loads.
- Environment compose takes under ~500 ms per stage, or the remaining cost is profiled and explained.
- Decoded-image memory stays under its configured budget in a test that cycles through every stage. GPU textures no longer in use are released.
- Visual output is unchanged, and run determinism is unchanged.
- All existing test suites pass, and new tests cover the new behaviour (listed under Final report).

---

## Guardrails

- **Measure first.** Record baselines before changing behaviour, and re-measure after each phase.
- **Visual output must not change.** Lighting, normals, fog, palettes, mirroring and alpha must not regress. Use the existing rendering and visual tests. Where they don't cover what you change, add pixel-diff tests with a small tolerance.
- **Run determinism must not change.** Stage seeds, layouts and run RNG must be identical for a given run, including dailies, trials, cinematic preview and saved runs.
- **Never slow down gameplay.** Background work must yield and must not run during busy frames.
- **Keep the existing paths working:**
  - the worker-failure fallback to the local renderer;
  - the demon realm renderer;
  - `doc.hidden` handling;
  - WebGL context loss and restore;
  - resize and DPR changes;
  - low-quality / low-density mode;
  - `reducedMotion` and `reducedFlashes`;
  - offline play on Android.
- Commit in small, reviewable steps grouped by phase, with clear messages.
- If a change proves wrong or risky (for example visual diffs, WebGL feedback-loop warnings or determinism changes), revert it and record why. Don't force it through.

## Checkpoints — stop and report before continuing

At each of these points, pause and summarise what you found. Continue only once the finding is recorded in your progress notes. Where the item says to wait for a decision, wait for one.

1. **After Phase 0.** Baselines are recorded. Don't change any behaviour before this.
2. **After investigating the duplicate atlases (3.1).** Report which file in each pair is actually needed, and the decoded-memory saving. This sizes the memory budget.
3. **If reserving the next stage seed (4.1) can't be done without changing the seed sequence.** Stop and ask for a decision. Do not change determinism.
4. **After the cutout-cache angle quantisation (Phase 2) and the lossy WebP conversion (3.2).** Report any visual differences, especially on slope-rotated scenery and normal-mapped surfaces.

---

## Known performance problems

Profiling a production build and a dev build found the following:

- **Per-frame main-thread costs:**
  - `stateView` rebuilt on every draw call;
  - Pixi `removeListener` churn through `BindGroup.setResource` on light targets;
  - `renderTrialObjective` writing to the DOM every frame.
- **Worker environment compose takes 1.3–5.6 s per stage.** Most of that is native `drawImage` from per-stamp material baking. It pegs the GPU process.
- **First-appearance hitches:**
  - `getImageData` on GPU-backed canvases in `ink-enemy.ts` / `ink-sword.ts`;
  - first-use `texImage2D` uploads of 85–100 ms right after a stage is presented.
- **Stage-change freeze:**
  - When `prepareScene()` sets `sceneLoading`, the simulation stops completely, so the screen looks frozen.
  - The worker only then downloads the stage's atlases (about 35 PNGs, around 30 MB), composes the scene, and hands it over before any of it is on the GPU.
  - Nothing pre-fetches or pre-composes the next stage.
- **Asset sizes:**
  - Runtime images total about 173 MB on disk but about 1.85 GB decoded: environment about 1.1 GB, figures about 570 MB, UI about 180 MB.
  - Holding everything decoded is not an option, so a tiered loader is needed.
  - Stages appear to load both a plain and a `_diffuse` version of each atlas, which may be duplication.
- **Production builds have no source maps,** so their traces are unreadable.

---

## Phase 0 — Instrumentation and baselines

1. Set `build: { sourcemap: true }` in `vite.config.ts`, merged with any existing options. Confirm the GitHub Pages deploy still works and publishes the `.map` files.
2. Add `performance.mark` / `measure` calls for:
   - `prepareScene` start;
   - assets ready;
   - compose sent and compose received;
   - textures warmed;
   - `settlePresentedScene`;
   - the first gameplay frame afterwards.
3. Extend `npm run test-performance` (`tests/performance/`) to record:
   - steady-state frame times: median, p95, p99, and counts over 8.3 ms and over 16.7 ms;
   - startup time to the title screen and to first gameplay;
   - stage-change loading time, cold and warm;
   - the longest main-thread task in the two seconds after a stage is presented;
   - peak JS heap, and estimated peak decoded-image memory;
   - per-stage compose time.
4. Record the baselines. **(Checkpoint 1)**

---

## Phase 1 — Main-thread hot paths

**1.1 Light-target listener churn**

Files:
- `src/rendering/pixi/composite-material.ts` (`update` around line 74, `releaseLightTargets` around line 88)
- `src/rendering/pixi/scene-painter.ts` (`detachLightingTargets` around line 463, `geometryPass`, `lightPass`, `flush`)
- `src/rendering/pixi/light-buffer.ts` (around line 256)

What happens now:
- `flush` assigns three shared light-target textures to every slot's shader.
- `detachLightingTargets` swaps them back to `Texture.EMPTY.source` in both passes.
- Each swap removes and re-adds `'change'` listeners on resources shared by every slot, which costs about O(N²) per swap.
- Detach loops over **all** pooled slots, while prepare only covers slots `< this.cursor`.

Changes:
- Detach only the slots that were actually prepared.
- Give each composite material an `attached` flag, so release is a no-op when nothing is attached.
- Skip resource assignments whose value is unchanged.
- Hoist the per-call uniform-name arrays to module-level constants.
- Apply the same idempotence to the grass and leaf materials, `artworkMaterials.detachTargets()` and `lightBuffer.detachGeometry()`.
- Test whether the detach in `geometryPass` is needed at all. That pass renders into the geometry buffer, not the light targets. Keep the removal only if gameplay, the rendering tests, resize and context restore produce no feedback-loop warnings. Record the outcome.

**1.2 `stateView` rebuilt on every call**

Files: `src/game/session/state-view.ts`, `src/runtime/presentation.ts`, `src/presentation/figures-host.ts`, `figures.ts`, `player-figures.ts`

What happens now:
- The view callbacks build up to three nested `stateView`s on every `readViews()` call. Each level does `getOwnPropertyDescriptors` over about 25 ports and `defineProperty` per key.
- `figures-host.ts` then copies the result into a new object literal.
- This happens on every `drawEnemy`, `drawFigure` and `drawPet`.

The repo already has `cacheView()`. Its precondition is that mutable selections must be getters.

Changes:
- Convert snapshot ports into getters. Examples include `isRobeSp: readRules().isRobeSp`, `isSteelThird`, `isSp` and `cinematic: readCinematic()`. Audit the rest.
- Wrap the hot factory callbacks in `cacheView`.
- Stop rebuilding the object literal in `figures-host.ts`.
- Apply the same treatment to other per-frame or per-draw `() => stateView(...)` callbacks.
- Never cache snapshot values. Equipment, robe/blade style, seal, cinematic and resize changes must still take effect immediately.

**1.3 Per-frame DOM writes**

Files: `renderTrialObjective` in `src/runtime/ui-base.ts` (around line 65), called from `src/runtime/frame-simulation.ts`

Changes:
- Cache the element reference.
- Write `hidden` and `textContent` only when they change.
- Reset that cache when a trial starts or ends.
- Check the other per-frame UI updates for the same pattern.

**1.4 Readbacks on GPU canvases**

Use `getContext('2d', { willReadFrequently: true })` for every canvas read back with `getImageData`. This includes the tone canvas in `src/rendering/figures/ink-enemy.ts` (around line 205), `part` in `ink-sword.ts` (around line 65), and any others you find by searching.

---

## Phase 2 — Worker compose cost

Files:
- `drawCachedImage` in `src/rendering/cached-materials.ts` (around lines 175–280)
- `src/rendering/environment/worker-canvas.ts` (around line 88)
- `transfer` / `copy` in `src/rendering/environment/compose.worker.ts`
- the stage builders such as `ridge.ts`, for verification

What happens now:
- Every material sprite stamp creates a new CPU-backed (`willReadFrequently`) scratch canvas.
- For each of normal, surface and emissive, it calls `drawImage` three times (crop, `destination-in` mask, draw to destination).
- With the colour draw, that is about 10 `drawImage` calls per sprite, several of which move CPU-backed canvases onto GPU-backed OffscreenCanvases.
- Non-aligned normals also take a `getImageData` → rotate → `putImageData` round trip. Slope-rotated scenery such as `drawLastLightRidge` takes this path most of the time.

Changes:
1. Reuse one scratch canvas per worker document, or a small pool.
2. Use `willReadFrequently` only on the `!alignedNormal` readback path.
3. Cache the masked map cutouts:
   - Build the key from source identity, frame, map kind, output pixel size, `normalY`, mirror, and the normal transform with rotation quantised (start at 2° steps).
   - Bound the cache by pixel budget.
   - Clear it together with the existing material caches.
4. Wrap only `drawImage` and `createPattern` in the worker canvas Proxy, which still need `unwrap()`. Return all other methods as cached, bound native functions.
5. Run the `createImageBitmap` copies in `transfer()` in parallel with `Promise.all`. Keep the existing close-on-failure handling.
6. Re-measure compose time per stage. Profile any stage still above ~500 ms, then fix or explain the largest remaining cost. **(Checkpoint 4, for quantisation)**

---

## Phase 3 — Tiered asset loading

There are three tiers, each holding less than the one before:
1. compressed files, fetched early;
2. decoded images, managed by a priority queue and memory budget;
3. GPU textures, for what's on screen or about to be.

**3.1 Inventory and de-duplication**

- Generate, from code, an inventory of every runtime image. Use a script under `scripts/` or a typed manifest. For each image, record:
  - its URL or import;
  - dimensions and decoded bytes (width × height × 4);
  - which stages, figures or UI screens use it;
  - which code loads it: `ASSET_URLS` / `sceneAssets` in `local-renderer.ts`, `asset-materials.ts`, `cached-materials.ts`, the `ink-*` figure modules, and `ui/`.
- Investigate each plain vs `_diffuse` atlas pair: pine, shrubs, rocks, boulders, grass-edges, meadow-patches, fog-wisps, foreground-boulders and the woodland/snow landmarks.
  - If one of each pair is redundant, stop loading it, and remove the file if nothing else uses it.
  - If both are needed, document why.
- Exclude non-runtime images (store screenshots, branding sources, test fixtures) from all loading. **(Checkpoint 2)**

**3.2 WebP conversion**

- Add a build-time conversion for the runtime atlases:
  - lossless WebP for normal, surface and emissive maps;
  - high-quality lossy WebP for diffuse/colour, falling back to lossless where artefacts appear.
- Keep the PNG sources unless the repo convention says otherwise.
- Check alpha, premultiplication and colour space through every decode path, including the `createImageBitmap` options in the worker. **(Checkpoint 4, for WebP)**

**3.3 Background pre-fetch**

- After the title screen is interactive, pre-fetch every runtime asset file.
  - Use `fetch(url, { priority: 'low' })` into the HTTP cache, or Cache Storage if the HTTP cache is unreliable.
  - Limit concurrency to a few requests at a time.
  - Order the queue: current and next stage first, then figures and UI, then everything else.
- Skip pre-fetching when assets are already local, as in the Capacitor Android build.
- Pause while the page is hidden. Respect `saveData`.
- A cold-load stage change must make no network requests for atlases. Startup must be no slower than the baseline.

**3.4 Decoded-image loader**

Create one shared loader, working in both the worker and the main thread (one instance per thread is fine).

- **Priorities:** `now` (never deferred), `soon` (next stage, figures about to appear) and `idle`. A repeat request moves an already-queued asset up to the higher priority without adding a duplicate. Callers awaiting the same asset share one promise.
- **Pacing:** decode one item at a time, or a few. Yield between items. Don't run `idle` work during a compose or after a frame that ran over budget.
- **Budget:**
  - Track decoded bytes. When over budget, evict least-recently-used assets that aren't pinned, and call `bitmap.close()`.
  - Make the budget configurable per device class, using `density()`, low-quality mode or `navigator.deviceMemory`.
  - Start with about 256–384 MB on mobile and 512–768 MB on desktop, adjusted by Checkpoint 2's findings. Document the defaults you choose.
  - Reuse the existing patterns where they fit: `retain()` in `ink-enemy.ts` and `retainedPixels` in `scene-kit.ts`.
- **Pinning:** pin what the current stage and on-screen figures need. When the stage changes, unpin the previous stage's assets so they become evictable, without evicting them immediately.
- **Integration:**
  - Route environment loading (`createAssetMaterials`, `local-renderer.prepare()`, the worker's `DecodedImage`), figure atlases and UI images through the loader.
  - Separate "make sure stage N's images are decoded" from "make stage N the active compose target". Today `local-renderer.prepare()` disposes `cachedMaterials` and clears `cacheKey`, and the worker renderer tracks a single `preparedStage`.
- **Next stage:** at a quiet point in the current stage (boss phase, `between`, `shrine`), request the next stage's assets at `soon` priority.
- **Diagnostics:** expose queued, decoded, pinned, bytes used and evictions through the existing `dataset` or snapshot diagnostics.

---

## Phase 4 — Seamless stage transitions

**4.1 Reserve the next stage seed**

`compositionKey` (`worker-types.ts`) includes `stageSeed`. That seed comes from `stageVisits.enter(si)`, called at transition time in `runtime/scene.ts`, `game/session/run-start.ts` and `ui/wiring/cinematic.ts`.

- Add a way to know the next visit's seed in advance, either `peek` or a reservation that `enter` later honours exactly.
- Prove with a unit test that a full run's seed sequence is identical with and without peeking.
- Define next-stage prediction for normal runs, trials, dailies and cinematic preview. Skip it where the next stage can't be known. **(Checkpoint 3 if determinism is at risk)**

**4.2 Pre-compose the next scene**

- Add a "next" slot to the worker and local renderers.
- Once the next seed is known and its assets are decoded, compose the next scene in the background at low priority. Only do this when the current scene is settled and no other compose is running.
- When `prepareScene` asks for a key that matches the next slot, promote it to current immediately.
- Discard the slot on resize, DPR change, quality change, stage or seed mismatch, or disposal.
- Keep the slot's memory within the overall budget.

**4.3 Upload textures before presenting**

- In `pump()` (`src/rendering/environment/worker-renderer.ts`), initialise the Pixi texture sources for every composed layer and map **before** `settle(key, true)` / `sceneReadyToPresent` (`src/runtime/scene-flow.ts`).
  - Use Pixi's texture system (for example `renderer.texture.initSource`) or the scene painter's texture store. Don't add a parallel cache.
  - Spread the uploads across frames if one batch would make a long task.
- Warm a pre-composed next scene the same way, only while the current scene is idle.
- During loading, upload textures and pre-build the cached variants and tones for the incoming stage's enemies and weapons.
- Release GPU textures for scenes and figures that are no longer in use.

**4.4 Keep the screen alive while loading**

Files: `src/runtime/frame-simulation.ts` (around line 37), `src/runtime/frame-bindings.ts` (around line 244), `src/presentation/scene.ts`

- While `sceneLoading`, run cosmetic updates only, modelled on the existing cinematic branch:
  - presentation clock;
  - `updateAmbient`;
  - `updateTransition`;
  - cosmetic `updateWeather`;
  - `advanceCamera`;
  - `apparelMotion`.

  Never advance run time, encounters, enemies, combat, run RNG or `G.runTime`.
- If a load takes longer than about 150 ms, show a loading treatment in the game's monochrome ink style, such as an ink wipe, brush veil or fade. Respect `reducedMotion` and `reducedFlashes`.

---

## Phase 5 — Verify

1. Re-run the full Phase 0 measurement suite, and compare every metric against the baseline.
2. Build the production bundle with source maps. Capture a Chrome performance trace covering normal gameplay and at least two stage changes (one cold, one warm). Confirm that function names resolve to `src/...` and that no hotspot from the Known performance problems section remains.
3. Run all test suites.

---

## Final report

Write a summary in your final message, or under `docs/` if that's the repo convention, covering:

- before and after numbers for every Phase 0 metric;
- asset inventory totals (on disk and decoded), what was de-duplicated, and the WebP savings;
- the memory budget defaults per device class, and why you chose them;
- how next-stage and next-seed prediction works per mode, and where it's skipped;
- the outcome of the `geometryPass` detach investigation;
- the findings recorded at each checkpoint;
- anything reverted, deliberately left unchanged, or needing follow-up, with reasons;
- the tests you added, covering at least:
  - change-only DOM writes;
  - no-op light-target detach;
  - the cutout cache key;
  - loader priority bumping, shared promises, eviction and pinning;
  - the stage-cycling memory test;
  - seed-sequence identity;
  - next-slot promotion and invalidation;
  - gameplay state during loading.