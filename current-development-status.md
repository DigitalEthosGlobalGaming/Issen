# Performance, assets and seamless transitions — Phase 2 checkpoint complete

Active objective: [goal-objective.md](goal-objective.md). Work on develop.
Profiling is explicitly authorized. The old refactor is complete at 2d27986;
pre-refactor remains immutable. Do not resume packing or lit-only integration.
No performance-goal push/deployment/native build or player-save change occurred.

## Phase 0 checkpoint complete

[Measured baseline and checkpoint](docs/development/performance-goal-progress.md)
records every current metric, limitations, source-map checks and recovery.
All measurement processes are terminal:

- Original interrupted baseline: tmp/performance/2026-10-08T09-15-46.492Z-731996ff.
- Recovered full PASS: tmp/performance/2026-10-08T09-36-15.869Z-resumed-b605febf:
  105 timings, 21 diagnostics; exact saved build/identity, original untouched.
- Compose PASS: tmp/performance-compose-baseline/results.json: all 45 repetitions,
  nine stages, raw colour/material planes preserved. Stage 0 compose median678ms;
  others194–437ms at900x600 DPR1.
- Production scene probe PASS: tmp/performance-scene-baseline-v2/results.json:
  all18 cold/warm scenes,18 traces and fresh gameplay. First probe failed due to
  incorrect initial-title readiness wait; evidence preserved in the v1 folder,
  test-only wait corrected. Cold load314–894ms; warm359–875ms; tasks up to76.8ms.
- Full baseline combat intervalp95=19.3ms/renderp95=15.4ms at390x844 DPR2.
  runtime/frame-bindings.ts hard-caps every frame at60fps;120Hz needs a pacing
  change after baseline. Desktop profiling does not prove real120Hz/mobile.
- Maximum sampled heap319,292,568bytes; nominal main decoded928,462,528bytes.
  Stage worker nominal decoded151–283MB. These are estimates/samples, not resident
  GPU or continuous memory peaks. Main figure/UI residency must be budgeted.

Keep the current standard performance harness byte fingerprint unchanged for
Phase1 comparisons (including build-plugin formatting):
85311fdbddd17a504d77f5474a770d9af0087012c1e42ecad042462149244843.
Benchmarks are excluded from this fingerprint. Never overlap browser measurements.

## Verified Phase 0 implementation

Source maps, bounded scene marks, worker timings and weak decoded-image tracking
only; no hot-path behavior optimization yet. Local fallback records equivalent
asset/compose boundaries. Worker/runtime marks share scene keys; first gameplay
uses that key. Baseline texture marker says first-present submission and
prewarmed:false, not a GPU fence. Version/package lock/title/changelog1.68.1.

- npm run typecheck PASS.
- node --test --test-isolation=none tests/unit/scene-timing.test.mjs
  tests/unit/pages-deployment.test.mjs tests/unit/frame-loop.test.mjs
  tests/performance/*.test.mjs: all18 PASS. Isolation disabled solely to avoid
  the sandbox child-process restriction; browser tools require escalation.
- npx playwright test tests/browser/worker-environment.spec.ts
  tests/browser/scene-readiness.spec.ts tests/browser/scene-continuation.spec.ts
  --config playwright.rendering-v2.config.ts: all8 PASS22.8s.
- npm run build:develop -- --outDir tmp/.verification-build-performance-pages:
  strict/build PASS; emitted main/worker/painter maps resolve src modules.
- ISSEN_PREVIEW_DIR=tmp/.verification-build-performance-pages npx playwright test
  --config playwright.pages.config.ts:1 PASS6.8s.
- Pages assembly units verify maps are retained. Live publication deferred until
  final authorized push; do not claim already deployed.

## Next

Phase0 commits bc43526 and1aa563d are complete. Phase1.1 is now verified:

- Change-only setters, attachment flags and previously prepared-slot detach.
- Routine geometryPass detach removed; replacement of the borrowed guide and
  light-target writes still detach. Resize/context restore/feedback checks PASS.
- Pixi already checks identity. Actual shared light-source fan-out required one
  painter-owned BindGroup borrowed by materials, grass and leaves. Standalone
  factories own their group; atlas/uniform groups retain individual ownership.
- Strict,2unit checks,35native rendering browsers and7ownership/instancing
  browsers PASS. Checked production verification build PASS.
- Version/package lock/title/changelog1.68.2.
- All15 timings and3diagnostics PASS in
  tmp/performance/2026-10-08T10-18-38.055Z-a5186c2e (captured before metadata bump).
  Pooled render median combat6.1→2.8ms,Demon29.4→7.1ms,Inferno45.9→10.1ms.
  After renderp95=4.0/11.0/17.9ms;120Hz target is NOT reached. Cap remains60fps.
  Remaining listener self-time requires further investigation; current light
  source listener count is independent of pool size. No decoded budget yet.
- Initial smaller candidate: tmp/performance/2026-10-08T10-08-08.648Z-9b4b1032.
  Both candidates and weighted CPU self-time comparison are recorded in notes.
- Measurement session52285 and browser sessions are terminal; do not restart them.

Continue:
1. Phase1.2–1.4 are implemented at1.68.3: cached live presentation/rule/host/frame
   views with getters; change-only trial DOM owner with lifecycle reset; CPU
   readback flags on enemy/player/sword canvases. Strict,19units,22live-view/native
   browsers,14trial/artwork browsers and2enhanced enemy readback browsers PASS;
   checked production build PASS. Current evidence is recorded in progress notes.
   Browser session76210 and all check processes are terminal. The new live-view
   browser proves12readers keep identity with zero descriptor rebuilds over100reads,
   including equipment/layout/seal/clocks/scenery replacements and cinematic open.
   High-refresh pacing at1.68.4 is implemented and verified:120Hz gameplay render
   submissions, independent unchanged60Hz simulation, prepared-frame replay on
   extra draws. Poses remain60Hz without interpolation. Menus/cinematic retain60Hz.
   Eleven focused units and five corrected browser cases PASS; checked build PASS.
   Cap-transition regression found/fixed; preliminary44timings/8diagnostics in
   tmp/performance/2026-10-08T10-57-17.984Z-68f8042d are excluded. Runner stopped;
   do not resume its earlier build despite preserved running metadata.
2. Focused strict/unit/browser checks, then measured Phase1 comparison against
   frozen baselines. Record findings and commit before Phase2 compose.
   Pacing commit c625ce8 and architecture follow-up b82c05c are complete.
   Fresh FULL comparison PASS: terminal exec session56608, log
   tmp/performance-phase1-corrected-measured.log, results
   tmp/performance/2026-10-08T11-13-56.661Z-6cf5fb13:105timings/21diagnostics,
   no errors, clean c625ce8, version1.68.4 and unchanged harness fingerprint.
   Derived frame-budgets.json uses120cap; listener-profile.json compares Phase0.
   Combat renderp9515.4→3.4ms, Demon39.7→9.7ms, Inferno81.4→18.2ms. Actual
   measurement callbacks remain60Hz; physical120Hz/mobile remains unproven.
   Remaining Demon/Inferno/stress CPU budget violations need further work.
   Compose tmp/performance-compose-phase1 PASS45repetitions,116planes byte-identical
   to Phase0, worker decoded unchanged151–283MB; stage0median574ms remains>500.
   Production tmp/performance-scene-phase1 PASS18cold/warm traces plus gameplay.
   Loading286–809ms;7captures retain tasks>16ms (maximum59.1ms), atlas requests
   remain0–28per transition. Main decoded budget still absent; nominal878–928MB.
   Compose session23676 and scene session72683 are TERMINAL exit0. No live captures.
   Full Phase1measured checkpoint is recorded in progress notes at1dc25ce.
   Phase2worker binding/parallel transfer step is verified at1.68.5:4new units,
   6browsers and checked production build PASS. Compose evidence
   tmp/performance-compose-phase2-transfer PASS45repetitions/116byte-identical
   baseline planes; session78210 TERMINAL exit0. Transfer medians are mixed;
   no uniform speedup claim. Stage0compose median587.2ms remains>500.
   Phase2cutouts are verified at1.68.6:4Mpixel/16MB per-document LRU with direct
   software baking, recycled evicted canvases and oversized reusable scratch.
   Two-degree normal rotation preserves reflection/shear/anisotropy. GPU scratch
   was reverted because raw map/mask alpha differed by76–104levels; retain CPU
   rasterization even on maps without readback. Intermediate copy/sharing/second-
   use admission experiments were rejected; reasons and evidence are recorded.
   tmp/performance-compose-phase2-direct-cache PASS45/116planes: colour/surface/
   emissive and all alpha exact, opaque normal RGBmax1. Native lit fixturemax2.
   Stage0compose median643.8ms vs678.2original/703.2contemporaneous control;
   other stage medians279–477ms. Results mixed, no uniform speedup claim.
   tmp/performance-compose-phase2-direct-cache-profile PASS6: remaining native
   software→GPU transfers dominate draw wall time; mostly unique stamp keys
   limit cache reuse. Cache maximum3,964,896pixels stays bounded. Shared decoded
   image budget remains absent. Seven units,13focused browsers and checked build
   PASS. Quantisation checkpoint is recorded before Phase3.
   All measurement/check processes are terminal:94785direct cache,78378software
   copy trial,86236contemporary control,16116and81757browsers. Failed first control
   27088was stopped (old snapshot diagnostics incompatible); use only corrected
   v2control. No active captures. Current version/package/lock/title/changelog1.68.6.
   High-refresh submissions alone do not prove smooth120Hz visual motion; prepared
   poses remain60Hz. Address that fidelity/per-frame waste concern while retaining
   run determinism before final completion, alongside remaining CPU budget costs.
3. Continue bounded loading and next scenes through Phases3–5. Duplicate-atlas
   checkpoint and WebP/quantisation visual checks remain required. Existing W1
   already compacted runtime WebP planes; inventory actual files before converting
   anything again. Seed determinism risk is the only explicit user-decision gate.

Goal remains active; final full suites, final traces, budgets, new loader/seed/
next-slot/loading-state tests, final report and any final push are outstanding.
