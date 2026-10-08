# Performance, assets and seamless transitions — Phase 1 in progress

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
1. Phase1.2 cached live views with getters;1.3 change-only trial DOM;1.4 CPU readback
   canvases. Include high-refresh gameplay pacing while keeping time/RNG contracts.
2. Focused strict/unit/browser checks, then measured Phase1 comparison against
   frozen baselines. Record findings and commit before Phase2 compose.
3. Continue bounded loading and next scenes through Phases2–5. Duplicate-atlas
   checkpoint and WebP/quantisation visual checks remain required. Existing W1
   already compacted runtime WebP planes; inventory actual files before converting
   anything again. Seed determinism risk is the only explicit user-decision gate.

Goal remains active; final full suites, final traces, budgets, new loader/seed/
next-slot/loading-state tests, final report and any final push are outstanding.
