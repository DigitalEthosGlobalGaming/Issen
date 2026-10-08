# Performance, assets and seamless transitions — Preview admission guard rejected integration

Latest checkpoint37: shared enemy/runtime gate trial rejected and reverted exactly
to1.68.31. Strict TypeScript/all467unitsPASS; saved-original native27visitsPASS18.9s
within max1; startup/ordering/cancellation/continuation14browsersPASS47.0s. Actual
256MiB fallback runtime54visits with empty/crow selectionsPASS39.3s: peaks
268,183,176/268,245,408bytes, all scene/enemy maps ready; UI exports explain pending
shared queues. But visible Armoury preview draws8enemy parts before a held scene
load and0during it: previews share runtime artwork, so scene-wide suspension hides
another consumer. Rejected despite passing other checks. Restored preview guard
PASS6.6s/all8parts. Seven tracked files restored, four trial tests moved to ignored
evidence; no implementation/version change. Full patch/sources/tests/logs under
tmp/performance-enemy-admission/; probe under tmp/probes/enemy-admission/.
Next distinguish visible preview requirements from hidden runtime figures and
coordinate incoming admission without hiding either or raising/splitting budgets.
Settled ownership proof remains checkpoint36; indiscriminate gating is unsafe.
All handles terminal; full goal active, no push/deploy/native build/player saves.

Previous checkpoint36: test-only ordered shared enemy admission/native parity PASS.
Original/shared54visits total41.7s; shared12maps75,489,120bytes with two owners,
accounted peak264,280,976 below256MiB; all14appearance/peer/after-peer-disposal
native comparisons exact. Persistent owners release/reacquire around27high/low/high
stage visitsPASS18.6s, preserving bounded colour/tone caches; peer after one release
stays ready/pinned, final loader0/no GL warnings. Incoming stage1→0 while enemies
remain pinned deliberately reproduces admission failure (original succeeds outside
pool),2fixturesPASS4.9s. Integrating unconditional sharing remains unsafe. Existing
loading presentation suppresses combat figures; integrate explicit lease release
before composition/reacquisition before readiness, including startup's parallel
prepare and eager shared preview calls, stale requests and pending disposal.
Production unchanged1.68.31/source-test diff empty. Evidence under
tmp/performance-enemy-admission/ and tmp/probes/enemy-admission/. All handles
terminal. Player/outfit/sword/startup ownership, next slots,120Hz/CPU budgets and
full Phase5 remain required. Goal active; no push/deploy/native build/saves.

Previous checkpoint35: worker compose-input release rejected and reverted exactly
to1.68.31; main-thread local release from checkpoint34 remains integrated.
Baseline54visits/256and512MiB PASS; candidate72cases meet loader bounds/zero pins
but one revisited stage0low colour plane changes. Two unchanged worker controls
match exactly; candidate max24 exceeds max1. Final warm bitmap/unpin trial also
changes second-cycle stage7low colour by255. Preserving raw wrapper/bitmap identity
does not resolve the regression; cause unresolved. Restored36case comparisonPASS21.8s,
all planes exact. Evidence under tmp/performance-worker-input-release/ and
tmp/probes/worker-input-release/. No implementation/version change; all handles
terminal. Continue selected figure ownership/incoming admission with native parity
and coordinated headroom. Worker release needs a separate proven fix. Full goal
remains active; next slots,120Hz/CPU budgets and Phase5 remain required.

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

16. Pressure pixel isolation keeps1.68.19 unchanged: software/no-cutout-cache
    controls still differ.53full-size source/map hashes and53direct fractional
    downsample hashes match across eviction; direct sampling with three suspect
    maps continuously pinned also matches.17isolated kits x6rotation/flip variants
    match. Four focused probes PASS10.7s/8.7s/7.1s/6.7s. Full-composition tracing
    locates first stage7 mismatch immediately after native mountain-map drawImage,
    before normal correction/masking: source hash, crop, normal matrix, target
    dimensions and colour mask match. Stage8first low/high differences are pine/
    temple posts. Cause remains unknown; full composition history is required by
    the current reproducer. Do not infer a cache-key/driver bug or accept input
    retirement. Next capture Canvas attributes/draw state and reduce source
    sampling history at that first divergent native draw. Stable JSON
    tmp/performance-local-input-release/; runnable probe index
    tmp/probes/local-input-release/README.md. All investigation processes terminal,
    no captures active. No new version/renderer change. Remaining whole-memory,
    source/startup, next-stage, upload,120Hz and Phase5work is unchanged.

17. Further pressure isolation: Canvas draw state/attributes match with no context
    loss; removing WebGL presentation still differs. A mountain-only crop/size
    history replay with pressure PASS24.2s. HTML-map bitmap snapshots make the
    bitmap-versus-bitmap repeat exact across18compositions (PASS39.9s), but original
    native-versus-bitmap parity FAILS from stage0 for HTML snapshots and both blob
    decode-option variants (large normal/surface/alpha changes, live max50).
    All bitmap/input-retirement implementations remain rejected; no tolerance
    change. Probe index tmp/probes/local-input-release/README.md and stable JSON
    tmp/performance-local-input-release/. All investigation sessions terminal.
    Native input sampling-history cause remains unresolved; continue independent
    required ownership/prediction/upload work without claiming this issue fixed.

18. Final composed-bitmap disposal at1.68.20 now immediately retires each GPU
    consumer's colour/data/crop textures. Matching composite/geometry/artwork/leaf
    bindings detach in all pooled slots before destruction; inactive slots were
    the source of warnings in the first attempt. Temporary disuse retains120-frame
    grace. Source ownership/close and baking stay unchanged; peer GPU stores remain
    independent. Eight retirement/loader units,36native rendering/worker/UI/restore/
    instancing browsers PASS1.7m; strict/format/checked production build PASS.
    Mobile-size390x844 DPR2 two-stage control counts12→12→24→24 versus current
    12→0→12→0 (draw/replacement/new draw/owner disposal). Live pixels are exact0;
    585x1266 planes give nominal old/new RGBA8 source bytes71,098,560→35,549,280
    after the second draw. These are source estimates, not resident GPU peaks.
    Stable tmp/performance-texture-retirement/counts.json; ignored reproducible
    control tmp/probes/texture-retirement/playwright.config.ts. Logs same prefix
    -focused/-corrected/-browser/-counts/-build. Session22380terminal; no captures.
    Version/package/lock/title/changelog1.68.20. Remaining main figure/source/
    startup budgets, native pressure stability, next-mode prediction/slots,
    paced uploads/variants,120Hz fidelity/CPU budget and full Phase5requirements
    remain required. GPU retirement for other source-owner lifecycles still needs
    coverage as they migrate; this is specifically final composed worker bitmaps.

19. Mode-aware next-stage rules at1.68.21: stage-progression.ts shares stage/lap
    formulas with actual wave/rush entry. Normal/daily predict the next three-wave
    visit, rush the next duel. Trials retain their scene; cinematic/inactive or
    mismatched stage state skips prediction. Actual frame samples pass the optional
    next stage to compressed prefetch; same-stage mode changes refresh priority.
    Allocation-free prediction does not enter/peek a visit or consume run RNG.
    Nineteen progression/entry/trial/seed units PASS;10prefetch/main-pool browsers
    PASS12.0s;7runtime/trial browsers PASS, and the expanded runtime sampling test
    PASS9.0s (normal/daily1, trialnone). Checked production build/typecheck PASS.
    Trial checks emit destroyed-source/sampler binding warnings; origin has not
    been isolated, so broader GPU-lifetime verification remains required. Logs
    tmp/performance-next-stage-prefetch-browser.log, -prediction-unit.log,
    -runtime-browser.log, -runtime-sampling.log, -build.log (same next-stage prefix
    except prefetch). All sessions terminal. Version/package/lock/title/changelog
    1.68.21. Compressed fetch ordering is now mode-aware; next-slot composition,
    decoded warming, paced uploads, whole-memory/startup budgets, native pressure
    stability,120Hz fidelity/CPU budget and full Phase5verification remain required.

20. Cached source binding cleanup at1.68.22: warning traces locate120-frame source
    destruction in SceneTextureStore.collect. Pixi default mesh bindings and cached
    GraphicsContext texture batch groups outlive their submitted draws. Before
    destroying an owned GPU source, source-bindings.ts snapshots its source/style
    change observers, detaches only matching BindGroup resources with public
    setResource, and leaves unrelated observers/resources intact. Guarded private
    EventEmitter context inventory is Pixi8.22-specific. No per-frame scan added;
    existing texture destruction and120-frame grace stay unchanged.
    An initial batched isolated test missed the default mesh path; native unbatched
    and pattern controls now both FAIL with cleanup disabled (source/sampler
    warnings), and both PASS enabled with counts1→0→1→0 across draw/expiry/reuse/
    disposal. All-eight-encounters and seeded retry tests add warning assertions.
    Final29rendering/lighting/UI/worker/lifetime/context browsers PASS1.6m;4focused
    native/trial browsers PASS50.1s;4retirement/resource units PASS; strict/format/
    checked production build PASS. Earlier broad/recovery runs hit the unchanged
    5s startup wait in #prevC; isolated check PASS16.1s and final broad check passes
    without changing test waits. This is not evidence of cold-start optimization.
    Stable logs tmp/performance-source-bindings-control.log (expected2FAIL),
    -final.log, -browser.log, -build.log; tracing/rejected default-mesh-only attempts
    under tmp/performance-binding-warning* and tmp/performance-mesh-retirement*.
    Ignored probes tmp/probes/binding-warning/ and tmp/probes/mesh-retirement/.
    All processes terminal. Version/package/lock/title/changelog1.68.22. Remaining
    whole-memory/startup owners/budgets, native pressure stability, decoded warming/
    next slots, paced uploads/variants,120Hz fidelity/CPU budget and full Phase5
    verification remain required. Covered warnings are resolved; no whole-game
    source-lifetime or resident-GPU peak claim is made.

21. Upload pacing investigation on unchanged1.68.22: ignored worker response hook
    initializes composed colour/emissive and data normal/surface through the same
    painter texture store, in rAF batches targeting4ms. Separate fresh-worker
    comparison differs atstage5(max33); cannot use it as parity proof. Sharing
    identical composed bitmaps between two painters gives exact pixels across9
    stages (fresh-painter PASS21.4s, corrected persistent-painter PASS13.7s).
    Persistent-painter first-draw baseline→paced ms bystage0–8:
    115.3→56.3,12.3→1.2,18.3→1.4,57.1→12.6,30.4→3.6,10.8→1.2,
    12.7→0.6,21.6→6.0,19.5→0.5. Static composed uploads leave first draw, but
    stage0 still uploads4live-fog1774x887 planes. CPU profile samples45.5ms in
    texImage2D atstage0; stage3 fresh-painter profile samples9.9ms in program
    parameter checks. Persistent stage1–8 draws fall below16ms in this sample.
    This is one diagnostic sample, not framep95/cold-load/resident-memory proof.
    Corrected warm wall durations10.5–35.9ms (incl rAF); batches4.8–8.7ms. Another
    run has a single22.6ms upload: a4ms batch target cannot split native uploads.
    Next integrate cancellation/hidden/context-restore-safe warming before worker
    publication/settlement, preserving old layers; include live fog, then shader/
    variant warming and next-slot/local ownership. Do not just add waits to cold
    loading or claim near-instant transitions. Initial persistent probe retained
    nested instrumentation wrappers; corrected probe restores texImage2D eachrun,
    original evidence preserved separately. Stable tmp/performance-scene-upload/
    and runnable index tmp/probes/scene-upload/README.md. All processes terminal.
    No production code, tests, version, assets or standard harness changed this
    checkpoint. Whole-memory/startup/local budgets, native pressure stability,
    next slots, uploads/variants,120Hz and full Phase5requirements remain required.

22. Worker source warming at1.68.23: main services pass the existing painter upload
    port. Incoming composed planes and live stage0fog initialize before replacing
    displayed layers/settling; colour/data interpretation is unchanged.4ms paced
    visible rAF batches cannot interrupt a native upload. Pending sources survive
    ordinary collection, stale/disposed waits abort, rejected bitmaps retire GPU
    consumers, restored context generations restart uploads. Local/demon paths
    retain existing readiness; no alternate cache or incoming display flush.
    Native same-input all9stage pixels exact/first-draw scenery uploads zero;
    real restore plus125collection frames succeeds, stale partial cleanup returns
    GPU count to displayed stage, failed warming settles local fallback, and
    hidden painter disposal cancels uploads. Held runtime loading preserves run/
    hazard/RNG and keeps prewarmed marks before settlement. Initial same-event
    context-restore fixture times out; next-task restore passes.
    Mobile integrated firstdraw stage0–8:61.3,2.5,0.9,66.2,2.9,12.4,0.8,8.5,1.6ms;
    warm wall20.5–125.3ms; upload max17.1ms. Control draws after warmed painter:
    cache/driver order confounds timings, not cold-load/near-zero transition proof.
    Profiles sample getProgramParameter56.7ms(stage0)/22.3ms(stage3); direct
    profiled draws61.6/53.7ms. Shader/figure/next-scene warming still required.
    Evidence tmp/performance-scene-upload/integrated-results.json and integrated
    profiles; probes tmp/probes/scene-upload. Full unit459PASS after updating old
    charm fixture with document events; checked production verification build
    PASS. Runtime worker/retirement/high-refresh13PASS and lifecycle/readiness7PASS.
    Wider scene/context13cases:10PASS/3startup5sdeadline failures before tested
    behavior, isolated3PASS34.7s without timeout changes. Broader native41cases:
    39PASS/2same5sstartup failures; default2worker focused retry also fails and
    both reproduce with only warming port disabled in ignored control probes.
    Isolated2PASS18.1s with warming enabled/timeouts unchanged. Startup parallel
    deadline remains unresolved, not an upload-specific failure. All sessions
    terminal; formatting/diff checksPASS. Version/package/lock/title/changelog1.68.23.
    Frozen standard harness/assets unchanged. Whole memory/startup/local budgets,
    native pressure stability, deterministic next slots, shader/figure warming,
    120Hz fidelity/CPU budget and all Phase5criteria remain required.

23. Ordinary scenery shader warming at1.68.24: paced Pixi shader.bind(skipSync)
    prepares geometry/composite, vector/artwork, light, shared batch and final
    back-buffer copy programs without drawing/target changes/resource sync. A
    guarded Pixi8.22 _bigTriangleShader borrow covers cold surfaces. Shader-ready
    generation skips repeated waits after first warm. Main port now warmScene:
    retain sources across both steps and repeat both after a context generation
    change. Native test forces loss during shader wait after sources warmed,
    drives125collection frames, restores and asserts pixels/no uploads/no links.
    All9same-input pixels exact/first-draw scenery uploads and program creations0;
    focused lifecycle/held-loading7PASS22.0s. Initial fixture wrong artwork handle
    selected local fallback: rejected data preserved, corrected probes require
    worker ownership. Five-program prototype stage3 stillcompilesbatch25.8ms;
    addingbatch fixeslink. Coldsurface catchesfinalcopy46.7ms; adapter fixeslink.
    Final mobile cold-surface firstdraw stage0–8:6.9,3.9,2.7,20.6,14.9,0.6,1.0,
    19.8,0.7ms. Initial warm335.8ms/later23.3–60.9ms; sourcecounts16/stage4=24.
    Native initial shadercall69.6ms stillstallsloading: not no-freeze/cold-load or
    p95proof. Profilesstage0/3draw8.4/45.6ms, zero programcreation; stage3GC8.1ms,
    graphicspreparation5.9/addPath3.6/batching3.2/nativeactiveTexture3.9ms. Remaining
    geometry/uniform/figure warming and nextslotsneeded. Evidence stable
    tmp/performance-scene-upload/shader-final-results.json and finalprofiles;
    probeindex tmp/probes/scene-upload/README.md. Full unit459PASS/checkedbuildPASS,
    version/package/lock/title/changelog1.68.24; frozen harness/assets unchanged.
    Broader native39cases34PASS/4startup5sdeadline failures/1replaypixelmax3(limit2).
    No tolerances/timeouts changed. Isolated5PASS58.6s; shader-disabled replay
    control3PASS18.3s; enabled replay/all-stage warm repeat18PASS34.9s(default2
    workers). One max3 replay remains unexplained; not clean fullsuite proof.
    All sessions terminal; formatting/diff checksPASS. Goal remains full:
    wholefigure/startup/localbudgets, nativepressure
    stability, deterministic nextslots/decode, cold smoothness, complete warming,
    120Hz fidelity/CPUbudget and Phase5allmetrics/traces/suites. Next address broad
    startup/selected figure ownership and remaining first-use scene preparation;
    prediction/nextslots still must be wired, not replaced with loading-only waits.

24. Main-image GPU retirement at1.68.25: companion/startup audit exposed pool
    eviction/final-disposal clearing pixels without notifying native consumers.
    Original-code controls fail with GPU counts1/1 after final disposal and2/1
    colour/data/crop counts after LRU eviction. Existing retirement notification
    now precedes image clearing/blob revoke; unpin retains warm pixels and peer
    disposal preserves the shared source. Native after counts0/0, exact peer
    pixels, uploaded LRU source1→0, callbacks once before width256→0. Accounted
    pressure peak264,485,456bytes within256MiB; not resident/whole-game proof.
    Enhanced16browser casesPASS20.2s/default2workers;8focusedunitsPASS. Evidence
    tmp/performance-main-image-retirement/; all-stage local cycle remains bounded.
    Companion selection/startup integration remains unimplemented: route active
    kits plus explicit preview borrowing, avoid both-kit+stage0+charm mandatory
    pins exceeding256MiB. Complete figures/startup/local budgets, native pressure
    stability, deterministic nextslots/decode, cold smoothness, complete warming,
    120Hz fidelity/CPUbudget and all Phase5 metrics/traces/suites remain required.
    Final checks: all459unitsPASS; checked production verification build/typecheck
    PASS; assets and the frozen standard performance harness remain unchanged.

25. Selected companions at1.68.26: native before control6HTMLimages37,735,212bytes;
    after nopet0, parts18,870,192(crow/cat/shiba), rock18,865,020. Shared main pool
    leases and primary/preview union; live equipment/scarecrow rule reused after
    startup restoration. Companion colours excluded from broad startup preloader.
    Standalone explicit full catalogue retained. Dropped kits unpin; peer scopes
    survive, stale/released loads cannot publish. Panel close/selection changes
    release its3native companion textures. Late preview readiness repaints without
    ticking clock/effects; suspension/disposal cancels callbacks. Repeated same-kit
    selection causes no pin/loader churn. Combined charm/local scenery visits all9
    stages with none/parts/rock:27PASS, peak264,278,624bytes<256MiB,266evictions,
    disposal0bytes. Not whole-figure/startup/resident memory proof. Exact8native
    HTML pixel comparisons and actual context-restore pixels; hidden loads work.
    Real startup succeeds with unused companion requests blocked; Armoury/support
    borrows release correctly. Fixture initially blocked Vite asset modules;
    script allowance fixes that timeout. Four old pose units now fake source leases
    without relaxed assertions.27relatedbrowsersPASS33.9s/default2workers;
    all459unitsPASS/checkedbuild&typecheckPASS. Evidence stable
    tmp/performance-companion-selection/. Assets/frozen harness unchanged.
    Arbitrary both-kit+stage0+charm mandatory union can still exhaust256MiB; normal
    runtime previews share equipped pet. Address shared/local transient headroom
    and remaining enemy/player/outfit/sword/startup inputs next. Complete warming,
    native pressure, deterministic next slots/decode,120Hz fidelity/CPUbudget,
    cold/warm timing/traces and all Phase5 suites remain required; goal active.
    Final bundled checks3PASS23.8s(default2workers), format/diffPASS. All sessions
    terminal; no push/deploy/native build or real player-save mutation.

26. Diagnostic-only local sampling controls; no accepted implementation or version
    bump. Original scenery PNG material requests (60 files, from pre-refactor)
    versus current WebP fail stage0 onward: rawmax255/livemax6. PNG repeat under
    figure decode pressure reproduces the unchanged WebP control: stages0–6 exact,
    stage7 raw127/255/live2/3, stage8 raw255/26/live3/2. WebP is not the sole cause
    of repeat instability. Original-source full-size PNG/WebP parity not audited.
    Software canvas snapshots repeat exactly18compositions(PASS38.8s), but differ
    from original HTML inputs(raw255/live50/alpha162/opaqueRGB186); rejected.
    Snapshot canvases are outside loader accounting, so bounded loader counters
    do not prove total memory. Initial PNG route intercepted figure requests;
    corrected scenery-only route measured successfully. All diagnostic processes
    terminal; one worker intentionally isolates sampling; current production
    inputs/assets/ownership and frozen standard harness unchanged. Stable evidence
    tmp/performance-local-input-release/{png,canvas}-{equivalence,repeat}.json;
    probes and instructions under tmp/probes/local-input-release/. Native sampling
    cause unresolved. Continue remaining figure/startup ownership and transient
    local headroom; next-slot readiness,120Hz and full Phase5 remain required.

27. Enemy duplicate colour decoding removed at1.68.27. Unchanged baseline16native
    images100,652,160bytes; after12PBRplanes75,489,120bytes, saving25,163,040bytes.
    Plain counterparts were readiness-only/unreachable fallback after PBR success;
    retain files for material debugging and exclude eager startup. Native14case
    comparison max1 matches unchanged-control noise; no painting/frame/tone change.
    Stable before/after JSON in tmp/performance-enemy-dedup/; original/probe in
    tmp/probes/enemy-dedup/. New tests block all four plain colours, verify native
    count/bytes/final clearing and real runtime readiness. Related7browserPASS17s,
    default2workers;8affectedunitsPASS;checkedbuild/strictTypeScript/formatPASS.
    Initial6PASS/1FAIL was a stale startup retry fixture blocking now-optional
    companion art. Delay/disposal/retry fixtures now intercept required player
    artwork, allow scripts and verify a real blocked request; assertions retained.
    Direct PBR ownership remains outside shared loader; integrate selected enemy
    kits plus GPU retirement with preview scopes and remaining player/outfit/sword
    startup ownership. Local headroom/native sampling, next-slot readiness,
    120Hz/CPUbudget and full Phase5 metrics/traces/suites remain required.
    Final bundled app/ink3PASS24.5s(default2workers); all processes terminal.
    Version/package/lock/title/changelog synchronized; diff/format checks PASS.

28. Direct PBR retirement at1.68.28: before atlas closure native4/4 and auxiliary
    stores8/4 stay alive despite four cleared images; after native0/0/stores0/0,
    all12texture objects destroyed. Four observers see positive width before
    clearing. Leased atlases only unpin: peer/native4/4 survive with exact pixels;
    final unpin leaves warm textures, final owner disposal clears native0/0,
    all widths/loader bytes0. No decode/sampling/gameplay/seed changes. Three new
    lifecycle units and two native tests, including optional emissive/multiple
    consumers and pending disposal. Initial shared fixture requested an excluded
    unused diffuse; use valid authored runtime colour, preserve all assertions.
    Related17browserPASS19.9s/default2workers; final assertions2PASS3.4s;
    all462unitsPASS;checkedbuild/strictTypeScriptPASS. Evidence
    tmp/performance-pbr-retirement/{baseline,direct-after,shared-after}.json and
    units/build logs. Prepared figure cutout/tone retirement and selected
    enemy/player/outfit/sword/startup ownership still required, plus local headroom,
    native sampling, deterministic next slots,120Hz and all Phase5 measurements.
    Final bundled startup/gameplay/Armoury/offline3PASS24.1s/default2workers;
    diff/formatPASS; version/package/lock/title/changelog synchronized. All check
    sessions terminal; no push/deploy/native build or real player-save mutation.

29. Enemy prepared-cache GPU baseline/rejected experiment; production restored
    exactly at1.68.28. An80palette queued grid stays within CPU cache limits
    (95variants/31tones;5,944,064/1,940,224pixels) but retains242native textures;
    final enemy disposal leaves240prepared colour textures. Two unchanged owners
    match exactly. Immediate eviction/disposal retirement reaches0textures but
    changes pixels by253: queued stamps lose their pooled bindings before flush.
    Reverted; no tolerance relaxation or version bump. Evidence
    tmp/performance-enemy-cache-retirement/{baseline,rejected-immediate}.json;
    saved original/reproducer under tmp/probes/enemy-cache-retirement/. Both runs
    terminal, baselinePASS4.3s/experimentcaseFAIL1.7s. Next: bounded pending live-frame
    GPU ownership and retirement after consumers finish, covering repeated flush,
    cancellation/context loss and peers. Do not force extra render passes or use
    an unbounded deferred-close queue. Existing warming pins do not cover this.
    Full selected figure/startup/local ownership, native sampling, next slots,
    120Hz and Phase5 measurements remain required. No assets/harness/seed changes.
    Restored control rerunPASS3.7s, exact pixels; implementation diff empty.

30. Enemy cache retirement at1.68.29 preserves queued/repeated frames. Explicit
    eviction mode retains only current-frame GPU sources until that painter's next
    begin/context loss/disposal; older/standalone entries release immediately.
    Final cache disposal stays immediate. No timers/extra renders or CPU-budget/
    pixel/simulation/seed changes.80palette original/current comparison exact:
    native242, pending145sources36,271,104nominal bytes; next begin97sources and
    pending0; final owner disposal0.120later frames peak97 with no pending buildup.
    This is source accounting, not a whole-game GPU cap: the synthetic live frame
    temporarily exceeds the CPU cache's8million-pixel budget on the GPU. Add pending
    resources/other owners/targets/driver overhead to full memory verification.
    Native peer/repeated pixels exact; unflushed cancellation/context restore/
    disposal pass. Final22relatedbrowserPASS22.3s/default2workers, all463unitsPASS,
    checkedbuild/strictTypeScriptPASS. Initial fixtures missed fog fields and loss
    dispatch ordering; corrected. First broad failure was evidence-writer import;
    assertions unchanged. Evidence tmp/performance-enemy-cache-retirement/ includes
    before/rejected/frame-retirement/real-cache/peer JSON and units/build logs.
    Other figure caches/selected ownership/startup/local headroom/native sampling,
    next slots,120Hz and full Phase5 measurements remain required; goal active.
    Final bundled app/ink3PASS23.3s/default2workers; diff/formatPASS and synchronized
    package/lock/title/changelog. All check sessions terminal; no push/deployment,
    native build or real player-save mutation.

31. Player/outfit/weapon GPU lifetime at1.68.30: owned raw images, tone/tint canvases
    and weapon cutouts notify native consumers before final closure. Weapon LRU
    eviction preserves queued/repeated frames until the existing painter boundary.
    All20outfits and20weapons match saved original pixels exactly. Player native61
    closes to0 (original48remaining); weapon36 closes to0 (original32remaining).
    Diagnostic100tint aliases exercise80part LRU: queued106native includes22pending
    sources7,731,680nominal bytes; next begin84/pending0; final0 (original104).
    Original/current and repeated pixels exact. New peer/catalogue/warmed eviction
    tests pass; related16browserPASS20.8s/default2workers, final3newtestsPASS5.0s;
    all463unitsPASS; checkedbuild/strictTypeScriptPASS. Evidence and saved original
    probes under tmp/performance-figure-retirement/ and tmp/probes/figure-retirement/.
    This is resource lifetime, not a whole-game GPU/decoded budget. Selected figure
    ownership/startup/local headroom/native sampling, deterministic next slots,
    120Hz and full Phase5 measurements remain required. Goal active at full scope;
    no push/deployment/native build or real player-save mutation.
    Final bundled app/ink3PASS23.0s/default2workers; diff/formatPASS; synchronized
    package/lock/title/changelog. All check sessions terminal.

32. Shared enemy decode trial rejected; production remains1.68.30. Two direct
    owners decode24maps150,978,240bytes. Existing document-loader trial shares12maps
    75,489,120bytes, keeps peer ready and final closure0; native14case differences
    match unchanged control (max1 in firstcase,13zero). Baseline2PASS3.4s/trial2PASS
    3.6s. At deviceMemory2, local stage0 pins34inputs213,952,112bytes; full enemy
    catalogue requires289,441,232combinedbytes, exceeding256MiB by21,005,776bytes,
    before charms/companions/next scene. Only base/clothing become ready; original
    preparationPASS/trialFAIL. Reverted exactly; restored4probePASS5.6s/source diff
    empty. Evidence under tmp/performance-enemy-shared/ and saved original/probes
    under tmp/probes/enemy-shared/. Next combine selected figure families with local
    compose-input lifetime/headroom, respecting prior native sampling failures.
    Do not force all-family sharing or raise/split the budget. No implementation or
    version change; all measurement handles terminal. Goal remains active at full
    scope; no push/deploy/native build/player-save mutation.

33. Completed local input lifetime diagnosticPASS50.0s across9stages/two variants.
    Test-only post-compose release retains fog4inputs or bamboo3; real LRU pressure
    closes every other captured decoded image. All12enemy maps then admit below
    256MiB. After unchanged readback/upload warmup, all18raw/live/replay comparisons
    are exact; no GL warnings. First rawmax1/live0–1 failure was reproduced by the
    immediate unchanged control, not caused by eviction. Stage0 pins34/213,952,112
    bytes fall4/25,176,608; bamboo21/132,140,400 fall3/18,870,192; other stages0.
    Maximum accounted peak264,280,976bytes;39–55evictions/case; final loader0.
    Evidence under tmp/performance-local-live-release/; probe/config/route under
    tmp/probes/local-live-release/. Production unchanged1.68.30/source diff empty.
    Next implement output-preserving release/reacquisition for every composition
    key change. Prior native rebuild sampling remains unresolved. Fresh-owner cases
    do not prove consecutive stage/incoming pin admission or whole-game budgets.
    Do not enable concurrent all-family enemy/startup plus local compose. Selected
    figure ownership, incoming headroom, next slots,120Hz and Phase5 remain required.
    All measurement handles terminal; goal active, no push/deploy/native build/saves.

34. Local compose-input release at1.68.31. Main-thread output retains its own
    colour/data planes; only fog4inputs25,176,608bytes or bamboo3/18,870,192 remain
    pinned. Other stages0. Existing independent cutouts stay bounded. Same-key
    draw/compose reuses output; changed size/DPR/quality/seed/stage reacquires inputs.
    Source-binding release preserves completed/foreground maps; obsolete pending
    generation returnsfalse before wrong-stage publication. Worker decoder/art/
    gameplay/seeds/budgets unchanged. Integrated18eviction casesPASS49.2s/exact.
    Final3all-stage lifetime/key/coalescing testsPASS34.7s, including actual native
    restoration; raw/live/replay exact, restored high-DPR fog/bamboo max1 within
    the native tolerance, no GL warnings. Two-cycle36case
    full SHA256 plane/native outputs exactly match
    saved original actors, confirmed by explicit hash gate. Cross-owner absolute
    comparator fails in unchanged and trial (stage0high29/15,stage7low255/35);
    matching complete hashes proves preservation, not root-cause resolution.
    Related11PASS/1FAIL36.1s was stale all-input peer pin expectation; expected live
    fog4pins25,176,608bytes nowPASS3.5s/exact peer checks retained. CoalescingPASS3.4s;
    all463unitsPASS; checkedbuild/strictTypeScriptPASS; bundled app/ink3PASS23.4s.
    Evidence/provenance/probes under tmp/performance-local-release-integration/
    and tmp/probes/local-release-integration/. Incoming figure/live pin union still
    needs scheduling; selected figure/startup ownership, next slots,120Hz and
    Phase5 remain required. Goal active; no push/deploy/native build/player saves.
    Final diff/formatPASS; version/package/lock/title/changelog synchronized.
    All measurement and verification sessions terminal.
