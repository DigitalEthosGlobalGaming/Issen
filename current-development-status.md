# Performance, assets and seamless transitions — Pinned memory measured; retirement rejected

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
3. Phase3.1verified at1.68.7: generated scripts/assets/runtime-inventory.json and
   generator record361source/catalog/startup-glob assets, dimensions/bytes,
   consumers and stage mappings. Shared environment/asset-sources.ts retains
   original selections. Generic material and UI owners now request colour:false,
   skipping unused diffuse maps; explicit player/enemy diffuse colour unchanged.
   Duplicate checkpoint records80material-only diffuse families (341MB nominal
   across entire set); stage kits fall151–283MB→113–214MB. Generated files remain
   inputs to conversion validation; no extra encoded-size/deletion gain claimed.
   tmp/performance-compose-phase3-material-only PASS45/116planes byte-identical
   toPhase2, stage0compose median630.2ms still>500. Six units,12focused browsers,
   plus3request/compact validation checks and checked build PASS. Inventory flags
   startup-only vectors for removal from the new runtime loader/prefetch manifest.
   Phase3.2existing WebP checkpoint recorded:352hashes+browser comparisons PASS,
   exact alpha/all180data planes,324lossless WebP/11compactPNG/17lossyWebP. Do not
   repeat asset compaction or resume packing. Current version/lock/title/changelog1.68.7.
   All processes terminal:66010compose;89376/71874/11881browsers; build terminal.
   No live capture at that checkpoint. Next implement3.3compressed prefetch and3.4shared per-thread
   priority/pin/LRU decoded loader. Proposed256/384MB mobile,512MB desktop defaults
   must be validated for current+next scenes plus figures/UI; not yet implemented.
   Phase4next-seed/scene slots, upload warming/cosmetic loading andPhase5full
   verification remain. Seed determinism risk is the only user-decision gate.

4. Shared loader core and worker integration verified at1.68.8. New
   platform/decoded-images.ts provides serial priorities, shared promises,
   priority bump, task yields, reference-counted pins, warm unpin, bounded LRU,
   pre-decode reservations from catalog dimensions and close-on-disposal/late
   failure handling. Worker wrappers share bitmap resources, release pins on
   clear, and expose decodedLoader snapshot diagnostics. Six new units+four
   worker units PASS; four existing worker browsers PASS; checked build PASS.
   Two actual worker retention cycles PASS (9stages×3,390x844 DPR2): desktop512MiB
   peak534,788,792bytes/76evictions; low-memory256MiB peak264,275,504/246evictions.
   Saved27samples each in tmp/test-results/rendering-v2/worker-decoded-budget-work-*/
   worker-budget-cycle.json. Browser navigator fixtures simulate device class;
   this does not prove physical phone performance or resident GPU memory.
   tmp/performance-compose-phase3-worker-loader PASS45/116byte-identical planes;
   stage0median715.2ms remains>500, others286–460ms. No speedup claim; preparation
   is excluded by this predecoded fixture and must be remeasured after prefetch.
   All handles15353/99259/58196/15995/96977terminal; no live capture.
   Version/package/lock/title/changelog1.68.8. Main figure/UI/startup image owners
   remain outside this loader; whole-app memory remains unbounded. Worker uses
   navigator device class only; runtime quality/density budget changes are pending.
   Next: main-thread managed image ownership (preserve independent previews and
   cached-material bindings), remove lifetime startup retention/startup-only
   sources, compressed prefetch, background policy wiring and quiet next-stage
   decode. Current worker decode interpretation is intentionally unchanged;
   any bitmap premultiplication/colour-space changes require raw-plane parity.

Goal remains active; final full suites, final traces, budgets, new loader/seed/
next-slot/loading-state tests, final report and any final push are outstanding.

5. Compressed prefetch verified at1.68.9: generated275-file runtime manifest
   excludes80unused diffuse maps and6startup-only vectors; existing startup glob
   filtered through it. Runtime source artwork lifetime retention remains.
   Base-path-scoped CacheStorage with HTTP fallback feeds worker decode unchanged.
   MainGame starts after loading overlay removal; at most2low-priority fetches,
   task yields, current/adjacent stage ordering then figures/UI/rest. Frame sampling
   grants settled quiet title/over/between/shrine/paused time under75%frame budget;
   combat/loading/panels/hidden/saveData/native gates pause new dispatch.
   Required worker reads remain available; root disposal aborts/removes observers.
   Strict,16focused units, changed-file formatting, checked production build PASS.
   Strong browser PASS4: all275files prefetch, fresh workers prepare all9stages
   with atlas network blocked; native/saveData storage untouched and dispatch
   policy pause/resume verified. Existing4worker and3scene-readiness cases PASS.
   tmp/performance-compose-phase3-prefetch PASS45/116byte-identical raw planes;
   stage0compose median651.7ms remains>500, others268–406ms. No speedup or startup
   no-regression claim; prepare/cache-write interval is excluded by this fixture.
   All processes terminal including98178compose; no active captures. Details/logs
   in progress notes. Version/package/lock/title/changelog1.68.9.
   Next: managed main decoded ownership, independent material/preview bindings,
   remove lifetime startup retention; wire quality/density budget and quiet decode.
   Then deterministic seed/next slots, paced GPU/variant warming and cosmetic
   loading; finish120Hz fidelity/CPU budget and full Phase5comparisons/suites/report.

6. Main native-image pool/local-map integration verified at1.68.10. Explicit
   per-Document shared leases use the serial priority/pin/LRU core, manifest-sized
   reservations, compressed-response native HTML decode and pool-owned URL cleanup.
   Local fallback PBR maps use it; stage changes release old pins, peer previews
   keep shared images, last owner disposes resources. Colour source bindings stay
   independent. Worker documents keep their existing wrappers/options.
   Strict,9units, formatting, checked build PASS;4worker fallback/all-nine/hidden/
   disposal cases and3main lease/pixel/budget browsers PASS. Native normal pixels
   exact against original image. Actual local prepares9stages×3at256MiB: nominal
   managed-map peak264,266,176bytes,134evictions, final17pinned maps; disposal0bytes.
   Saved27samples at tmp/test-results/rendering-v2/main-image-budget-local-fa-5fc56-in-the-low-memory-main-pool/main-map-budget-cycle.json.
   All handles terminal including76631; no live capture. Version/lock/title/
   changelog1.68.10. Main source/figure/UI/startup owners remain outside the pool;
   whole-app memory/GPU retirement remain unproven. Source identity binds cached
   material owners, so sharing colour requires explicit owner binding first.
   Next migrate those owners/lazy active selections, release startup retention,
   wire runtime quality/density/policy and validate combined low-memory pins.
   Then quiet next decode, deterministic seeds/next slots, paced GPU/variant
   warming/cosmetic loading,120Hz fidelity/CPU budgets and full Phase5verification.

7. Local colour sources share the map pool at1.68.11. Current sources/maps pin
   with manifest reservations; departed source leases unpin. Bindings are per
   image+owner; synchronous withBindings scopes restore nested ownership and
   disposal removes only its own bindings/layers. Strict,12units, formatting,
   checked build PASS;4worker and4main browsers PASS. Concurrent previews have
   exact colour/data planes and surviving layers rebuild after disposal; native
   colour/data decode matches original exactly. Main local9stages×3at256MiB:
   peak264,275,504bytes,245evictions,25current pins, disposal0bytes. Stable27samples:
   tmp/performance-main-source-budget/results.json. Compose
   tmp/performance-compose-phase3-main-sources PASS45/116byte-identical raw planes,
   stage0median709.7ms remains>500; others293–465ms. No speedup/startup claim.
   Processes90873/31945/86121and4516terminal; no active capture. Version/package/
   lock/title/changelog1.68.11. Figure/UI/startup, demon realm/live fog/Armoury room
   owners remain outside the pool. Next migrate lazy active selections, remove
   startup retention, wire runtime budget/policy and validate combined low-memory
   pins before Phase4and final checks. Whole-app memory/GPU retirement unproven.

8. UI input leases verified at1.68.12. Jobs retain metadata/CSS exports; one pack
   leases shared native colour/data inputs per export, then unpins and retires
   uploaded sources through the existing texture store. Initial bound-source
   warnings were fixed by detaching prepared shader bindings before destruction;
   no warning-bearing version committed. Background exports await quiet visible
   frames before decode and upload; explicit prepare/custom requests bypass the
   wait. Multi-subscriber frame policy coexists with prefetch; disposal wakes waits.
   Strict,14units, formatting, checked build PASS;6final UI/scene-readiness browsers
   PASS plus earlier native-material/prefetch checks. All31packs retain expected
   colour/alpha/slices/light changes/custom seal/restoration, with no cleanup warnings.
   Stage0's34pins +31UIpacks twice at256MiB: peak268,422,128bytes,142evictions;
   UI completion returns to34pins and0uploaded source textures, stage remains valid,
   last disposal0bytes. Stable tmp/performance-ui-stage-budget/results.json.
   Processes22280/46291/21974/52816terminal; no active capture. Version/package/
   lock/title/changelog1.68.12. Decoded UI inputs are bounded, while exported
   browser-owned DOM/CSS images and all remaining figure/startup/environment owners
   remain outside this estimate. Whole-app memory/GPU and startup speed unproven.
   Next migrate active figure/remaining sources, remove startup retention and wire
   runtime budget/policy; finish combined memory, Phase4and full Phase5requirements.

9. Startup ownership retired at1.68.13: successful mount/overlay removal disposes
   preloader and clears every retained src; failed startup preserves successes for
   retry, pending disposal remains safe. Startup's initial broad decode is still
   outside the budget and must be replaced during active figure/source migration.
   Existing startup browsers exposed a prior manifest filter bug: relative Vite
   glob URLs never matched absolute manifest URLs. Canonical document-base matching
   restores intended filtering/load/decode/retry gate. Initial2failures preserved;
   corrected6startup/scene browsers PASS34.3s,4units, formatting and checked build
   PASS. No test loosening; prior scene-readiness passes did not prove this gate.
   Logs tmp/performance-startup-retention-corrected-browser.log/build.log; sessions
   12724/72369terminal, no active captures. Version/package/lock/title/changelog1.68.13.
   Final startup measurements must use corrected filtering; no whole-app memory
   or speed claim yet. Continue active figure/remaining sources and narrow startup
   required assets, then combined budgets/Phase4/full Phase5verification.

10. Charm colour/data kit shares main-pool leases at1.68.14 (18,874,368bytes).
    Independent tint caches/pins survive peer disposal and late attachment is
    ignored. Strict,9units, checked build and4UI/material browsers PASS. Local
    stage0 +charm peer +31UIpacks twice at256MiB:37mandatory pins/232,826,480bytes,
    peak268,424,816bytes,145evictions, no extra UI pins/upload textures afterexport;
    peer ready, stage valid and last disposal0bytes. Stable evidence
    tmp/performance-charm-ui-stage-budget/results.json; session57939terminal,
    no active captures. Version/package/lock/title/changelog1.68.14. Other figure
    and environment sources remain outside the pool; initial broad startup decode
    still exceeds the intended eventual budget. Continue their active/lazy lease
    migration and narrow startup, then finish budgets/Phase4/full Phase5requirements.

11. Next-decode prerequisite at1.68.15: stageVisits.peek(stage, forceNewVisit)
    predicts the unchanged enter formula without mutating ledger/RNG. Repeated
    entries retain the current seed; forced visits predict visit+1. Four units PASS
    including full sequence identity across4initial seeds,3nine-stage cycles,
    repeat/forced entries and unrelated peeks. Strict/format/build PASS; no runtime
    use yet and no active captures. Checkpoint3decision gate is not triggered:
    no seed-sequence change. Mode-specific prediction/next slots remain pending.
    Version/package/lock/title/changelog1.68.15. Continue remaining main image
    ownership/active selections and narrow startup; use peek for quiet decode and
    normal/trial/daily/cinematic prediction, then complete Phase4/Phase5requirements.

12. Cosmetic loading dispatch verified at1.68.16: raw presentation elapsed time
    advances clock, ambient/transition motion, cosmetic weather particles, camera
    and apparel while all gameplay/run/trial/first-frame progression stays frozen.
    Temporary weather hazard-state/bank copies use cosmetic RNG; live hazard fields
    and run RNG remain unchanged. Reduced motion suppresses weather motion.
    Two new loading/weather units plus3weather units PASS; strict/format/build and
    4actual scene/continued-run browsers PASS32.9s. Session14400terminal, no captures.
    Logs tmp/performance-cosmetic-loading-browser.log/build.log. Version/package/
    lock/title/changelog1.68.16.150ms loading treatment/direct moving-pixel proof
    remain pending, alongside main ownership/active selections, mode prediction/
    next slots, paced upload/variants,120Hz fidelity and full Phase5requirements.

13. Delayed static ink veil at1.68.17 follows scene-state after150ms and cancels
    immediately after presentation; short/repeated loads and reduced-motion media
    are covered. Loading scheduling stays awake even when paused; hit-stop/slowT
    inputs are masked so frameDelta cannot spend combat timers. Actual held stage
    requests show303,422changed pixels over0.8167s active and304,235over0.8333s
    paused, with identical G/player/hazard/run-RNG/hit-stop state. Seven focused
    scene/continued-run browsers PASS1.0m,13loading/weather/frame units PASS;
    strict/format/checked production build PASS. Mobile veil screenshot reviewed.
    Stable captures/JSON: tmp/performance-loading-veil; logs same prefix with
    -browser.log/-build.log. Session72306terminal, no captures active. Version/
    package/lock/title/changelog1.68.17. This proves the selected held-load flow,
    not all cold/warm scenes or seamless promotion. Remaining main image ownership/
    active selections/startup budget, mode prediction/next slots, paced uploads/
    variants,120Hz fidelity/CPU budget and full Phase5requirements remain required.

14. Main shared-pool scheduling at1.68.18 now pauses soon/idle until visible quiet
    frames use<=75%budget. Required requests bypass pacing; visibility restoration
    requires a fresh quiet grant. One subscription per pool, change-only policy
    updates and final-owner cleanup avoid recurring queue scans/listener leaks.
    New browser proves priority bump/peer cancellation, busy/expensive/hidden gates,
    required hidden loads, visibility restoration and fresh-pool idle state.
    Eight native-pool/UI/27stage-cycle browsers PASS12.9s,6loader units PASS;
    strict/format/checked production build PASS. Logs:
    tmp/performance-main-queue-policy-browser.log/-build.log. Session75826terminal.
    Version/package/lock/title/changelog1.68.18. No automatic next-image requests
    yet. Companion inspection found both eager colour/data kits37,735,212bytes:
    stage0+charms+both=270,561,692bytes, exceeding256MiB by2,126,236bytes. Do not
    migrate both as permanent pins; implement active selection and startup/preview
    readiness together. Companion code unchanged this step. Whole-memory budgets,
    remaining main ownership/startup, mode prediction/next slots, paced uploads/
    variants,120Hz fidelity/CPU budget and full Phase5requirements remain required.

15. Pinned decoded-byte diagnostics at1.68.19 count each resident pinned URL once,
    regardless of lease reference count. Six loader units,9main-pool/worker browsers
    PASS17.3s; strict/format/checked production build PASS. Logs:
    tmp/performance-pinned-bytes-browser.log/-build.log; session79229terminal.
    Local stage0 retains213,952,112mandatory decoded bytes; stage4 retains132,140,400.
    Attempted post-compose input retirement failed the unchanged-pixel guardrail
    and is fully reverted. Even the unchanged renderer compared with itself under
    decode pressure differs at stages7/8: normal/surface alpha max28, opaque RGB
    max21, live-view max3. Stages0–6 are exact in both tested variants. Peak pool
    bytes264,282,368 remain below256MiB; no shader/feedback warnings. These are
    unresolved cache/raster reload differences, not a confirmed causal diagnosis.
    Stable evidence tmp/performance-local-input-release/unchanged-control.json;
    rejected patch and reproducible probes tmp/probes/local-input-release/README.md.
    No input-retirement optimization is accepted. Version/package/lock/title/
    changelog1.68.19. Next isolate pressure/rebuild pixel stability before retiring
    inputs; then companion active selection/startup/preview readiness together.
    Whole-memory budgets, remaining owners/startup, prediction/next slots, uploads/
    variants,120Hz fidelity/CPU budget and full Phase5requirements remain required.
