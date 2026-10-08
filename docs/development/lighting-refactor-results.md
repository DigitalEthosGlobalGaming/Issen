# Lighting refactor results (Workstream 3)

Version 1.68.0 completes phases 1–6 on PixiJS 8.22/WebGL2. The native renderer
has one material model and no Canvas scene fallback or old-forward runtime flag.
Part 4 independent final verification/report/push remains required.

## Requirements and evidence

| Requirement | Owner and direct evidence |
| --- | --- |
| Painter-owned three-attachment G-buffer; last writer, configurable cutoff | pixi/geometry-buffer.ts, material.ts and scene-painter.ts; geometry-buffer.spec.ts verifies native bytes, clipping, transforms, exact alpha boundary, ordering and owner replacement |
| Normal/depth/coverage, roughness/metal/AO, linear albedo | G0/G1/G2 layout documented in rendering.md; material/geometry native tests include normalY, inverse transpose and signed depth |
| One fullscreen two-attachment HDR pass; 16 points, directional/ambient GGX | pixi/light-buffer.ts; light-buffer.spec.ts checks actual HDR values, analytical response, MRT requirements and restore |
| Deterministic intensity × visible-footprint budget | presentation/light-sources.ts and rendering/light-budget.ts; light-sources units cover clipped disc area, stable code-point ties and global ranking |
| Ordered cheap composite for all scene routes; legacy unified | pixi/material.ts, lighting-composite-glsl.ts and artwork-materials.ts; artwork-lighting, legacy-material and light-composite native suites prove positive light lookup and genuine pre-removal references |
| No old shader/selection/alternate scene backend | Old forward source is recoverable at 472f60aa71787adec717adbf8f982109790925f6; source audit and required-feature errors retain one renderer/model |
| Grass instancing per original depth layer | scene-grass.ts, pixi/grass-material.ts, scene/ambient.ts; native 1000-instance curve/cutoff/retained-data/resize/restore tests |
| Ordered two-sided catalogue leaves; GPU analytic motion | scene-leaves.ts, pixi/leaf-material.ts, scene/leaf-motion.ts; native 1000-instance/four-atlas/32-frame/lifetime checks and analytic unit oracle |
| Existing glints, lanterns, embers, foxfire, boss auras | presentation/scene-light-sources.ts, figure/foxfire pose helpers; native five-family contribution/removal plus immutable draw/RNG/clock checks |
| Kill/parry/block event flashes on effects clock | presentation/event-lights.ts; decay, pause, Reduced Flashes, stronger-event/global-budget and dispose tests |
| Optional half-resolution HDR and edge-aware lookup | effects/quality.ts, testing tools and shared lighting-composite-glsl.ts; all five providers, odd sizing, guide ablation, owner/quality/restore and unchanged saved preferences |
| Named scene geometry/lights/forward-composite and post/film insertion | scene-composer.ts, scene.ts, post.ts; composer-light-passes and presentation-readiness prove pass counts/current targets/order and isolated rules/saves/haptics |
| Frozen metadata and borrowed targets; lifecycle safety | scene-painter.ts getter, target owners and shared sampler detach; native independent-surface/resize/restore/dispose checks; minimal examples in rendering.md |
| Graphics errors, context loss, deadline and explicit resume | graphics-errors and pixi-backend suites run in the complete W3 broad gate |
| W2 scenarios/checkpoints remain intact | All 415 units plus complete browser gate include actual runtime scenarios and old checkpoint fixtures |

Paths above are under src/rendering/ unless prefixed otherwise; tests are under
tests/unit/ or tests/browser/. Final owner map remains in architecture/overview.md.

## W3 checkpoint verification

Exact logs are under ignored tmp/lighting-refactor/.

- `npm run typecheck`: PASS; `npm test`: all 415 PASS, exit 0;
  demon-mist-fix-{typecheck,unit}.log.
- `npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
  all 279 PASS, exit 0; w3-gate-repaired-broad-retry.log. This complete command
  includes all named native suites, startup errors and context-loss cases.
- `npm run test:production`: strict/build and all 4 PASS, 30.2s, exit 0;
  w3-gate-repaired-production.log.
- `ISSEN_ANDROID_BUILD_DIR=tmp/.verification-build-android` with
  `npm run test:android-web`: strict/build PASS; 3 PASS/2 FAIL, 34.2s, exit 1;
  w3-gate-repaired-android.log. Both failures are baseline-proven below.
- Focused mist/composer/scene/film rerun: 11 PASS, 25.0s, exit 0;
  demon-mist-fix-browser.log. This supplements the full run above.

Screenshots use testInfo.outputPath. Native grass/leaves, edge-aware lighting,
event/persistent lights and repaired Demon captures were visually inspected.
No profiling, performance suite, native APK build or physical-phone test was run.

## Exceptions and accepted approximations

Android offline.spec.ts:55's immediate pause/reload assertion fails identically
on unchanged pre-refactor (tmp/asset-compaction/android-recovery-baseline.log).
Android premium.spec.ts's hidden-Support assumption also fails on that baseline
in all three repeats (android-premium-baseline.log). Baseline fails #bSupport at
line 34; current build reaches #support at line 35. The original runtime explicitly
exposes placeholder Support and keeps the closed opacity-zero panel mounted.
Neither assertion nor product behavior changed. The suite is not reported green;
the goal's pre-existing-failure rule permits continued final verification.

Below-cutoff translucency looks up the underlying covered surface. Legacy masks
map to the shared GGX model rather than preserving a second exact BRDF. G-buffer
normals/depth/materials are quantized; coarse half-resolution samples can miss
subtexel features. Grass normals use curved strip approximations; leaf motion
uses analytic effects-clock equations and bounded CPU lifetime sweeps. These
tradeoffs and target lifetimes are detailed in architecture/rendering.md.

The first broad run exposed non-repeatable fractional Demon mist clip edges
(277 PASS/1 FAIL). Aligning only strip bounds to logical pixels repaired the exact
existing assertion without shader changes/tolerance relaxation. Prepared native
comparison: repeat differences 548→0 RGB channels; original-to-aligned max RGB3,
mean RGBA0.0094498, exact alpha and all G/HDR buffers. The repaired full run above
is the checkpoint evidence. Unsuccessful precision/dither/sampler/state trials
were diagnostics only; no production workaround remains.

The first repaired broad run had 278 PASS/1 FAIL before gameplay: Edge failed
the src/main-game.ts request with ERR_NO_BUFFER_SPACE, so the title never loaded.
The unchanged focused no-lives test passed all three repeats (27.9s), and the
complete retry above is used for the checkpoint. No source/assertion/timeout
change was made. Trace evidence is preserved in w3-modes-startup-evidence.

Phase decisions, test-fixture corrections and revert references are recorded in
[decision log](refactor-decision-log.md). Hooks were built without future effects.
No lit-only worktree code was integrated.
