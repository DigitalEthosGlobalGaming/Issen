# Performance and seamless transitions

Tracks [the active objective](../../goal-objective.md). Changes remain on develop;
the completed refactor and its restore point are preserved. Packing and the
separate lit-only integration remain cancelled. This goal explicitly authorizes
performance captures. All disposable evidence is under ignored tmp.

## Checkpoint 1 — Phase 0, 8 October 2026

No behavior optimization preceded these baselines. Production source maps and
bounded scene diagnostics are implemented. Scene marks cover preparation,
assets-ready, compose sent/received, first-present texture submission, settlement
and first gameplay. Worker responses separate asset, compose and bitmap-transfer
times and estimate currently decoded image bytes using weak references. Local
worker-failure fallback records the equivalent asset/compose boundaries.
The baseline texture mark explicitly records `prewarmed: false`: existing uploads
occur during presentation, and the mark does not prove GPU execution completed.

### Standard full baseline

The initial process was interrupted after 74 timing samples and 14 diagnostics.
After confirming it had stopped, recovery reused the exact saved build, host,
browser, graphics and instrumentation identity. The original results remain
untouched. Completed recovery has **105 timing samples and 21 diagnostics PASS**.

Evidence: `tmp/performance/2026-10-08T09-36-15.869Z-resumed-b605febf`, including
report, traces, CPU profiles and derived `frame-budgets.json`. Viewport 390×844,
DPR 2, fixed seed 424242, High density, five repetitions, three-second warmup
and five-second windows (30 seconds for cinematic transitions). CPU diagnostic
captures are separate from headline timing.

Pooled raw callback statistics, milliseconds:

| Workload | Interval median | Interval p95 | Interval p99 | Intervals >8.3 / >16.7 | Render median / p95 / p99 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Combat | 16.7 | 19.3 | 30.6 | 1472 / 548 of 1484 | 6.1 / 15.4 / 25.3 |
| Demon | 44.2 | 55.7 | 65.8 | 554 / 554 of 554 | 29.4 / 39.7 / 49.0 |
| Inferno | 46.5 | 82.4 | 107.2 | 495 / 495 of 495 | 45.9 / 81.4 / 98.9 |
| Cinematic cycle | 16.7 | 21.0 | 54.8 | 8459 / 2744 of 8595 | 2.3 / 11.2 / 34.7 |

Every other workload's metrics remain in the derived JSON. Title startup median
is 3273.1 ms, p95 5813.2 ms. Maximum sampled JS heap is 319,292,568 bytes;
maximum main-thread nominal decoded image estimate is 928,462,528 bytes. These
are sampled/estimated quantities, not continuous resident-memory measurements.

The runtime currently hard-caps all frames at 60 fps. Interval p95 therefore
cannot meet 8.3 ms even when CPU work is small. Phase 1 must address high-refresh
gameplay pacing and verify time/RNG boundaries; menus can retain their cadence.
Current browser timing is not evidence of real 120 Hz mobile delivery.

Existing CPU profiles confirm listener churn: `removeListener` accounts for
about 835 ms of self time in the separate Demon capture and 591 ms in Inferno.
Those samples support prioritizing binding idempotence; they do not establish
that it is the only source of slow frames.

### Per-stage worker composition

Evidence: `tmp/performance-compose-baseline/results.json` and saved raw RGBA
planes. Nine stages, five fresh-worker repetitions each, fixed seed 424242,
900×600, DPR 1. Assets are prepared before timing; compose excludes their decode.
Round trip includes bitmap creation/transfer. This is a dev-worker measurement,
separate from the production transition probe below.

| Stage | Compose median ms | Compose p95 ms | Round trip median ms | Decoded bytes |
| --- | ---: | ---: | ---: | ---: |
| 0 | 678.2 | 857.4 | 727.1 | 283,171,432 |
| 1 | 266.4 | 268.3 | 307.7 | 176,170,848 |
| 2 | 322.4 | 340.9 | 365.6 | 201,334,560 |
| 3 | 436.9 | 464.0 | 489.1 | 226,507,712 |
| 4 | 385.3 | 411.0 | 457.0 | 176,187,200 |
| 5 | 261.8 | 289.4 | 307.4 | 151,010,592 |
| 6 | 337.6 | 372.1 | 376.7 | 201,315,520 |
| 7 | 291.4 | 295.0 | 342.4 | 232,802,096 |
| 8 | 193.6 | 286.2 | 209.3 | 207,625,640 |

Stage 0 requires the Phase 2 compose investigation against the 500 ms target.
Other stages still incur transfer cost and may cost more at mobile DPR.

### Production cold/warm transition probe

Evidence: `tmp/performance-scene-baseline-v2/results.json` and 18 scene traces.
900×600, DPR 1, fixed scene seed, isolated instrumented minified production
bundle with local fonts. The probe calls the real preview preparation path while
cinematic presentation is active. It measures assets, compose, submission and
settlement, then captures two seconds after each presentation. These are
synthetic stage changes, not yet normal-run next-scene readiness measurements.

Cold clears HTTP cache after startup; decoded shared startup images remain.
Warm keeps HTTP cache and revisits the same scene seeds. Request counts include
requests satisfied by browser cache, so they do not prove transferred bytes.
The first probe's initial-title wait incorrectly required a scene-transition
flag; that test-only wait was repaired. Failed evidence remains in
`tmp/performance-scene-baseline`. Production behavior was not changed to fix it.

| Stage | Cold load ms | Warm load ms | Cold longest task ms | Warm longest task ms | Cold / warm tasks >16 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0 | 894.2 | 875.0 | 64.4 | 75.4 | 111 / 57 |
| 1 | 313.9 | 373.7 | 11.3 | 29.0 | 0 / 105 |
| 2 | 423.7 | 459.6 | 9.7 | 51.6 | 0 / 91 |
| 3 | 631.8 | 707.4 | 35.0 | 37.1 | 1 / 82 |
| 4 | 548.1 | 577.2 | 13.6 | 43.0 | 0 / 77 |
| 5 | 405.6 | 497.8 | 11.7 | 35.5 | 0 / 72 |
| 6 | 612.8 | 659.0 | 28.7 | 76.8 | 99 / 37 |
| 7 | 548.7 | 547.4 | 28.5 | 45.2 | 8 / 66 |
| 8 | 368.8 | 358.8 | 26.0 | 71.4 | 23 / 61 |

Tasks come from trace `Scheduler::RunTask` events on the presentation marker's
main thread. The task containing presentation is included in full, as are
subsequent tasks intersecting the next two seconds. This detects 16–50 ms tasks
that the Long Tasks API misses. Missing trace/task data fails the measurement.

The repeated-cycle deterioration is consistent with retained pooled binding
churn. Phase 1 will test that hypothesis, retaining this evidence.

This probe's title ready time is 2897.4 ms; its separate fresh gameplay page
reaches the first gameplay frame at 4099.6 ms after navigation, including
automation/button time. Scene preparation after requesting the run is 753.5 ms.
The ten-second gameplay window has interval median/p95/p99 16.7/17.0/17.8 ms,
600 intervals >8.3 and 187 >16.7 of 601; render 2.9/4.2/5.4 ms. This lower-DPR
sample must not replace the standard portrait baseline in comparisons.

Scene-cycle sampled JS heap peaks at 158,149,468 bytes. Main-thread nominal
decoded estimates reach 878,141,824 bytes, and worker estimates 283,171,432 bytes.
Neither includes actual GPU residency or continuous transient peaks. A bounded
loader must account for figure/UI sources as well as stage atlases.

### Verification and continuation

- Strict TypeScript PASS.
- All 18 focused timing, frame-loop, tooling and Pages assembly units PASS.
- All 8 worker-environment, scene-readiness and scene-continuation browsers PASS.
- Checked develop Pages build PASS; maps include runtime, worker and painter
  `src/...` sources. Assembly units verify `.map` preservation.
- Pages nested-path smoke verification is recorded in the handoff.
- Version/package lock/title/changelog are synchronized at 1.68.1.

The Pages workflow recursively copies the branch build, including `.map` files;
live publication is deferred until the goal's final authorized push, so no live
deployment claim is made. Full suites and final traces remain Phase 5 work.

Checkpoint 1 is recorded. Next: Phase 1 binding/listener idempotence, cached live
views, change-only trial DOM, CPU readback canvases and high-refresh pacing;
re-measure before proceeding to compose and bounded loading.

## Phase 1.1 — Light bindings, 8 October 2026

The requested change-only setters, hoisted texture-name arrays, attachment flags
and prepared-slot release are implemented. Native geometry rendering does not
need the routine light detach: removing it passed warning-sensitive pixel,
resize and context-restoration checks. Generation replacement still detaches
the borrowed geometry guide; light rendering detaches before target writes.

Investigation found Pixi 8.22 already checks resource identity internally. The
remaining cost was actual attach/release across many material groups sharing
three sources. A first measured candidate improved render medians but retained
that fan-out. Materials and instanced grass/leaves now borrow one painter-owned
light group through Pixi's public `groups`/`groupMap` API. Atlas bindings and
uniforms retain their own group and disposal. Standalone factories own a light
group. The listener count is independent of mesh-pool size; material disposal
does not destroy a borrowed group. No lighting shader math changed.

The initial candidate's evidence is
`tmp/performance/2026-10-08T10-08-08.648Z-9b4b1032`: 15 timing samples PASS.
Its report's median per-repetition render estimates were combat6.9→3.0ms,
Demon29.8→21.4ms, Inferno52.6→37.6ms. Combat was variable; these medians differ
from the pooled raw baseline table above. The shared-group candidate is measured
separately below. Neither candidate establishes the complete goal's targets.

Verification:

- Strict TypeScript and both change-only/no-op binding units PASS.
- All35 light/composer/geometry/half-resolution/native Pixi browsers PASS.
- All7 shared ownership, shrinking pool, instanced grass and leaves browsers
  PASS. Pixel parity, guide replacement, resize, context restoration and
  warning-sensitive captures remain covered by those checks.
- New ownership test checks borrowed light listeners survive one peer's
  disposal, and both material and painter listeners are released by their
  respective owners. Shrinking-pool test checks40→2prepared slots, constant
  light listener counts, repeated-flush exact pixels and no GL error.
- Version/package lock/title/changelog synchronized at1.68.2.

The full Phase1 checkpoint still requires cached live views, change-only DOM,
CPU readback canvases, high-refresh pacing and their measured comparison.

### Shared-group measurement

Evidence: `tmp/performance/2026-10-08T10-18-38.055Z-a5186c2e`, all15 timings and
3separate CPU diagnostics PASS. The standard instrumentation fingerprint remains
identical to Phase0. Runtime code was captured before the1.68.2metadata update;
the saved build therefore labels itself1.68.1. Conditions match the portrait
baseline. `frame-budgets.json` pools raw samples; `listener-profile.json` sums
actual CPU sample time deltas for qualified `*.removeListener` names. This
weighted calculation replaces the rough profile-inspection estimates above.

| Workload | Render median before→after ms | Render p95 before→after ms | After render p99 ms | After render >8.3 / >16.7 | Interval p95 before→after ms |
| -------- | ----------------------------: | -------------------------: | ------------------: | ------------------------: | ---------------------------: |
| Combat   |                       6.1→2.8 |                   15.4→4.0 |                 5.1 |              5 / 4 of1501 |                    19.3→16.9 |
| Demon    |                      29.4→7.1 |                  39.7→11.0 |                15.5 |            394 / 9 of1493 |                    55.7→19.2 |
| Inferno  |                     45.9→10.1 |                  81.4→17.9 |                30.4 |          1193 / 96 of1485 |                    82.4→18.5 |

Sampled listener self-time in separate five-second profiles:
Combat90.7→10.3ms, Demon1030.4→287.2ms, Inferno748.5→523.5ms. The constant
light-source listener test proves that pooled light-group fan-out is removed;
these profiles still contain other resource listener churn and do not establish
that every hotspot is gone. Combat and Inferno median comparisons are marked
variable by the existing harness. Noisy samples remain in the evidence.

After startup medians across these scenarios are2481–2567ms. Endpoint heap peaks
are43.9/93.1/192.0MB; nominal main decoded estimates remain878.1MB for each.
This optimization does not claim a memory budget or near-instant transitions.
Compose and stage-cycle measurement will be repeated at the full Phase1
checkpoint; those behavior paths were not optimized here. The60fps cap remains.

## Phase 1.2–1.4 — Live views, DOM and readbacks

Presentation and active-equipment/progression projections now use `cacheView`.
Mutable rule capabilities, trial/cinematic selection, clocks, geometry, equipment,
seal and scenery arrays remain getters. Figure/environment hosts retain narrow
live projections; frame bindings retain simulation/post/scene projections with
getter overrides. The entry point caches its deferred rule wrappers too, avoiding
new wrapper objects/functions on every getter read. Renderer construction still
captures current pose inputs: caching that snapshot would be incorrect.

`ui/trial-objective.ts` owns one element reference and change-only visibility/text
writes. Trial identity changes and trial-end hiding reset the cache; session
feedback uses that owner rather than changing the element independently. Other
HUD score/lives/banner writes were inspected: they run on events, not every frame.
All four production readback contexts request `willReadFrequently`: enemy tones,
player tones, sword parts and the existing material normal-transform scratch.

Verification at version1.68.3:

- Strict TypeScript and checked production verification build PASS.
- All19 focused live-state/trial-feedback/trial-session/run-flow/post-frame units
  PASS. Three new objective cases cover120unchanged renders, visibility, displayed
  progress, trial-end/retry reset and Duel Master exchanges.
- All22 live-view/native Pixi/scene-continuation browsers PASS, including context
  restoration and repeated-draw visual/state checks.
- All14 trial/trial-film/enemy-art/artwork-lighting/sword-lighting browsers PASS.
  Enhanced enemy tests separately PASS2: actual readbacks use CPU-backed contexts
  and warm poses/fog variants cause no repeated reads.
- The new browser captures12actual production readers. Each keeps identity across
  100reads with zero descriptor construction; replaced equipment, layout, seal,
  scenery, clocks, camera and trial state stay live. Cinematic activation uses its
  public API. The initial test incorrectly assigned its read-only active getter;
  that test instrumentation was corrected, with no production workaround.

Evidence logs: `tmp/performance-phase1-live-views-browser.log`,
`tmp/performance-phase1-dom-readback-browser.log`,
`tmp/performance-phase1-readback-context-browser.log`,
`tmp/performance-phase1-hot-path-units.log` and
`tmp/performance-phase1-hot-path-build.log`.
Full Phase1 timing/compose/stage-cycle comparison remains due after addressing
the60fps cap. More rendering callbacks must not silently increase simulation/RNG
updates. No Phase2 cache/quantisation or loader work has started.

## Phase 1 — High-refresh pacing

Version1.68.4 permits120render callbacks per second during gameplay. The existing
60Hz simulation schedule is retained independently, including hit-stop/slow-time
consumption. Extra draws reuse the prepared presentation; they do not advance
post effects, game state or RNG. Menus/cinematic/paused/guided states retain60Hz.
Clock restart clears the prepared frame and pending presentation elapsed time.
This permits high-refresh submissions; poses still update at60Hz, with no new
interpolation. Synthetic scheduling does not establish physical120Hz delivery.

A new cap-transition regression exposed a phase shift when returning from120Hz
to60Hz. Render deadlines now align with simulation deadlines on that change.
The preliminary measurement was stopped deliberately: its44saved timings and
8diagnostics in `tmp/performance/2026-10-08T10-57-17.984Z-68f8042d` used the earlier
candidate. Its original running metadata remains preserved, but the runner is
confirmed terminal. Do not resume or accept that build as the final comparison.

Corrected verification:

- All11 focused frame-loop/seeded-trial/post-preparation units PASS, including
  identical update timestamps across menu/gameplay cap changes, idle/resume,
  actual trial spawns/combat/RNG and more than1.9times the draw callbacks.
- All5 corrected high-refresh/scene-continuation/readiness browsers PASS.
  A real runtime extra draw leaves game/post/RNG state identical and performs
  no additional presentation preparation. Pixel allowance matches the existing
  prepared-scene test: maximum2byte difference, fewer than1%changed channels.
  Earlier strict-zero/one-byte fixture assertions failed on edge rounding;
  production code was not changed to accommodate them.
- Strict TypeScript and corrected checked production build PASS. The broader
  native browser set had24PASS plus the initial pixel assertion failure; the
  corrected focused replay and scene checks above supersede that failed case.
- Performance-tool units9PASS; standard harness fingerprint is unchanged.

Evidence: `tmp/performance-phase1-pacing-units.log`,
`tmp/performance-phase1-corrected-pacing-browser.log`,
`tmp/performance-phase1-corrected-pacing-build.log` and
`tmp/performance-phase1-tooling-units.log`. Fresh full timings, compose and scene
measurements remain required before the Phase1 checkpoint and Phase2 work.

## Phase 1 measured checkpoint

Full corrected comparison PASS:105timings and21diagnostics in
`tmp/performance/2026-10-08T11-13-56.661Z-6cf5fb13`. Captured clean commitc625ce8,
version1.68.4, same portrait390×844 DPR2 fixture, seed, density and standard
instrumentation fingerprint as Phase0. Session56608 is terminal with exit0.
Every scenario's retained metrics and comparison are in its report and
`frame-budgets.json`; no timing samples were discarded. Pooled raw values below
differ slightly from the standard report's median-of-repetition medians.

| Workload | Render median before→after ms | Render p95 before→after ms | After render p99 ms | After render >8.3 / >16.7 | Interval p95 before→after ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Combat | 6.1→2.4 | 15.4→3.4 | 4.5 | 5 / 3 of1501 | 19.3→16.9 |
| Demon | 29.4→6.7 | 39.7→9.7 | 13.9 | 246 / 4 of1505 | 55.7→16.9 |
| Inferno | 45.9→10.1 | 81.4→18.2 | 31.1 | 1149 / 104 of1486 | 82.4→19.0 |
| Cinematic cycle | 2.3→1.7 | 11.2→7.5 | 62.9 | 406 / 187 of8606 | 21.0→21.1 |

Gameplay updatep95 is0.2ms in these samples. Stress100 render median/p95/p99 is
13.9/15.4/16.8ms. Actual callbacks remain approximately60Hz on this measurement
display despite the120Hz gameplay cap. Physical120Hz/mobile delivery and the
8.3ms target are not demonstrated. Demon, Inferno and stress CPU still exceed
that budget; cinematic upload spikes remain. Further main-thread investigation
will be required for the final goal, even after the listed Phase1 changes.

Weighted listener self-time in separate CPU captures is Combat90.743→5.626ms,
Demon1030.423→314.242ms, Inferno748.534→539.502ms. Shared light fan-out is removed
by ownership tests; other resource listener churn remains and is not declared
resolved. Title startup median3273.1→2712.1ms, p955813.2→2883.4ms. Maximum sampled
heap319,292,568→191,877,380bytes. Maximum nominal main decoded estimate remains
928,462,528bytes (878,141,824for the main gameplay scenes), without a budget.

### Compose and visual comparison

`tmp/performance-compose-phase1/results.json`: all45fresh-worker repetitions PASS
against `tmp/performance-compose-baseline`. All116raw colour/normal/surface/emissive
planes are byte-identical: maximum, mean and alpha differences are0. This measures
the unchanged worker composition path, not a Phase2 optimization. Session23676
is terminal with exit0. The fixture remains900×600 DPR1, predecoded fixed seed.

| Stage | Compose median before→after ms | After compose p95 ms | After round trip median ms |
| --- | ---: | ---: | ---: |
| 0 | 678.2→574.0 | 757.8 | 621.5 |
| 1 | 266.4→265.6 | 271.7 | 304.7 |
| 2 | 322.4→315.0 | 331.6 | 363.0 |
| 3 | 436.9→438.5 | 449.8 | 512.4 |
| 4 | 385.3→377.5 | 387.5 | 460.5 |
| 5 | 261.8→255.2 | 288.9 | 301.5 |
| 6 | 337.6→344.5 | 383.4 | 395.7 |
| 7 | 291.4→297.6 | 339.7 | 348.6 |
| 8 | 193.6→264.5 | 274.9 | 295.2 |

Worker decoded estimates are unchanged at151–283MB. Stage0still exceeds500ms;
differences on this unchanged path reflect measurement variance, not a claimed
compose optimization. Phase2must cache stamps and remeasure/profile remaining cost.

### Production scene comparison

`tmp/performance-scene-phase1/results.json`:18cold/warm scenes and18traces PASS,
plus separate fresh gameplay. Session72683 is terminal with exit0. Same900×600
DPR1 fixture and trace task definition as the Phase0 production probe. These
preview transitions do not establish normal-run next-scene readiness.

| Stage | Cold load before→after ms | Warm load before→after ms | Cold longest task before→after ms | Warm longest task before→after ms | After cold / warm tasks >16 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0 | 894.2→802.5 | 875.0→808.7 | 64.4→58.0 | 75.4→59.1 | 1 / 1 |
| 1 | 313.9→306.6 | 373.7→286.0 | 11.3→10.7 | 29.0→11.4 | 0 / 0 |
| 2 | 423.7→429.5 | 459.6→496.9 | 9.7→8.0 | 51.6→17.5 | 0 / 1 |
| 3 | 631.8→604.4 | 707.4→542.9 | 35.0→30.7 | 37.1→16.2 | 1 / 1 |
| 4 | 548.1→515.8 | 577.2→520.5 | 13.6→13.7 | 43.0→14.8 | 0 / 0 |
| 5 | 405.6→390.5 | 497.8→392.2 | 11.7→9.3 | 35.5→8.7 | 0 / 0 |
| 6 | 612.8→497.5 | 659.0→513.7 | 28.7→10.9 | 76.8→22.0 | 0 / 1 |
| 7 | 548.7→424.7 | 547.4→452.1 | 28.5→15.8 | 45.2→23.5 | 0 / 1 |
| 8 | 368.8→354.1 | 358.8→366.2 | 26.0→10.5 | 71.4→15.4 | 0 / 0 |

Seven of18captures still have a task over16ms; texture uploads are not warmed.
Stage requests remain0–28atlas requests per transition, including browser-cache
hits. No compressed prefetch or next-slot promotion exists yet. Loading remains
286–809ms; some cold/warm samples are slower, so a blanket no-regression claim
would be unsupported. Phase4must address presentation-time uploads and loading.

Single-probe title ready2897.4→2823.9ms, first gameplay4099.6→4179.3ms including
gesture/automation, run scene ready753.5→868.7ms. Ten-second gameplay render
median/p95/p992.3/3.4/4.6ms (baseline2.9/4.2/5.4); intervals16.7/17.0/17.6ms,
600>8.3 and197>16.7 of601. Scene-cycle sampled heap158,149,468→59,198,100bytes;
main/worker nominal decoded estimates remain878,141,824/283,171,432bytes.
These are endpoint samples/nominal sizes, not resident GPU or continuous peaks.

Phase1findings are recorded before continuing. Phase2cutout-cache quantisation
must retain pixel evidence and its checkpoint; remaining Phase3inventory/budget
and Phase4seed/promotion/loading invariants remain outstanding.

## Phase 2 — Worker method bindings and parallel transfer

Version1.68.5 caches each worker native context method once. Only `drawImage`
and `createPattern` adapt decoded-image wrappers; other methods retain native
bound functions. All composed colour/material/foreground bitmap copies start
concurrently through `layer-transfer.ts`. Failure waits for every plane copy,
including late siblings of a rejected layer, then closes all acquired bitmaps.
The response owner still closes completed layers if posting the response fails.
Colour premultiplication and linear map colour-space options are unchanged.

Four new units PASS: stable/native method binding and selective unwrapping,
all-plane concurrency/order/optional maps, rejection with late sibling copies,
and synchronous copy failure with asynchronous peers. All6focused browsers PASS:
worker construction/runtime/composition fallback, all nine lit stages/foreground,
coalescing/disposal, hidden owners, mirrored material coverage and zero emission.
Strict checked production build PASS. Evidence logs are
`tmp/performance-phase2-worker-units.log`,
`tmp/performance-phase2-worker-browser.log` and
`tmp/performance-phase2-worker-build.log`.

`tmp/performance-compose-phase2-transfer/results.json` PASS45repetitions;
all116raw planes remain byte-identical to Phase0. Session78210 is terminal exit0.
Stage0compose median587.2ms still exceeds500ms. Transfer medians before→after
Phase1: stages0–8 are38.1→46.8,37.7→38.0,43.2→45.5,70.2→55.2,72.7→78.5,
46.1→46.0,48.0→46.2,50.5→48.6,30.3→37.8ms. Results are mixed; concurrent copies
do not establish a uniform speedup on this graphics stack. Round-trip medians
are625.1/304.6/365.8/520.0/462.5/296.0/399.7/339.5/311.7ms. Do not claim the
compose target is met. The bounded cutout cache/scratch reuse and visual-checked
angle quantisation are next; no material quantisation has been introduced yet.

## Phase 2 — Bounded cutouts and quantisation checkpoint

Version1.68.6 adds an owner/document LRU of masked normal/surface/emissive
cutouts. Default budget is4,000,000pixels (16MB nominal RGBA), separate from
decoded-image residency. The key includes map/source identity and revisions,
crop, mask/revision/crop, output pixel size, normalY, reflection and the normal
basis. Normal rotation uses2degree bins; reflection, anisotropy and shear remain.
Cache misses bake directly into retained software canvases, recycling the last
evicted canvas. Oversized entries bypass admission and reuse one scratch.
Clearing a source invalidates dependent cutouts; disposal zeros all retained
canvases and scratch. No run RNG or layout selection changes.

The requested GPU-only scratch for maps without readback was investigated and
reverted: raw stage0normal alpha changed by76levels; medium/high GPU resampling
changed it by104. Evidence is in `tmp/performance-compose-phase2-cutouts-trial`,
`tmp/performance-compose-phase2-cutouts-gpu-medium-probe` and the corresponding
high probe. All map baking therefore retains original software rasterization.
This is a deliberate deviation from Phase2.2 to preserve the stronger visual
guardrail, not a relaxed pixel tolerance.

Other rejected trials: sharing faded-mask provenance added no hits; second-use
admission eliminated stage0hits and measured median rose714ms. Both were removed.
Initially copying scratch into each immutable cache entry added201native copies
in stage0and72in stage4. GPU and software entry copies both stalled on pending
rasterization. Direct baking removes these copies; eviction still reuses canvases.
Intermediate evidence remains under `tmp/performance-compose-phase2-cutouts-*`,
`tmp/performance-compose-phase2-final` and `tmp/performance-compose-phase2-software-cache`.

### Raw planes and visible lighting

`tmp/performance-compose-phase2-direct-cache/results.json` PASS45fresh-worker
repetitions against the original116raw planes at900x600 DPR1, seed424242.
Colour, surface, emissive and every alpha channel are byte-identical. Only normal
RGB changes: largest plane mean0.000743levels/channel; opaque pixels differ by
at most1level, alpha-weighted maximum1.993 and pooled weighted mean0.000101.
Unpremultiplication at very low alpha can amplify raw RGB maxima to255; alpha
itself does not change. The separate visible-lighting comparison is necessary.

The browser fixture compares exact normal rotation with2degree bins under native
Pixi lighting: ten slope/mirror cases, clipping and nonuniform scaling. Lit output
maximum2levels/channel, maximum mean0.032932, identical alpha; normal-plane
maximum mean0.044434. Saved reference/candidate grids were visually inspected:
`tmp/test-results/rendering-v2/material-cutouts-quantised-698b0-clipping-and-cache-lifetime/`
contains lit/normal PNGs and `cutout-parity.json`. This meets the existing small
native rendering tolerance; it does not imply bit-identical normal vectors.
The quantisation finding is recorded here before Phase3.

### Compose measurements and remaining cost

Direct-cache capture/session94785 is terminal exit0. A contemporaneous control
loads the saved7c98425material implementation through a benchmark-only Vite
override, with an undefined snapshot adapter solely for diagnostics compatibility.
`tmp/performance-compose-phase2-contemporary-control-v2` PASS45/116byte-identical
planes; session86236 is terminal. The first control stalled because the saved
owner lacked the new snapshot method; session27088 was stopped, exit1, and its
partial folder is excluded. No application files were replaced for the control.

| Stage | Original median ms | Contemporary control median ms | Cutout median / p95 ms | Cutout round trip median ms |
| --- | ---: | ---: | ---: | ---: |
| 0 | 678.2 | 703.2 | 643.8 / 709.3 | 708.3 |
| 1 | 266.4 | 288.4 | 278.8 / 327.3 | 321.9 |
| 2 | 322.4 | 351.3 | 366.7 / 383.4 | 419.4 |
| 3 | 436.9 | 497.5 | 477.1 / 497.2 | 573.6 |
| 4 | 385.3 | 414.5 | 435.0 / 471.0 | 534.8 |
| 5 | 261.8 | 253.1 | 284.7 / 358.9 | 334.5 |
| 6 | 337.6 | 371.6 | 375.9 / 400.3 | 440.0 |
| 7 | 291.4 | 317.6 | 334.2 / 353.5 | 394.8 |
| 8 | 193.6 | 303.5 | 294.5 / 307.2 | 331.0 |

Results are mixed; no uniform speedup is established. Stage0remains above500ms,
others have medians below500. At this fixture, hits by stage0–8 are24/0/0/24/0/0/0/8/0:
exact mask/output-size keys are predominantly unique. Largest retained cache
3,964,896pixels stays below4,000,000; oversized scratch is separately reported.
Worker decoded estimates remain151–283MB; the cutout budget is not the missing
shared decoded-image budget required in Phase3.

`profile-compose.mjs` records separate diagnostic native wall times and worker
CPU samples. `tmp/performance-compose-phase2-direct-cache-profile` PASS6captures
(stage0and4, three fresh workers each). Stage0has680drawImage calls; software→GPU
225calls account for227–519ms of244–536ms draw wall time. Stage4has240draw calls;
software→GPU72calls account for243–309ms of254–321ms. Normal readback32/9calls
costs about4/2ms in the prior software-cache profile. Native wall time includes
blocking graphics/rasterization work, and instrumentation adds overhead; these
are explanations, not headline timing or resident GPU-memory measurements.
Dev Vite URLs resolve src functions, but sampled line numbers are transformed;
the final production source-map trace requirement remains outstanding.

Seven focused units PASS: rotation/key identity, bounded LRU/recycling/oversize/
invalidation/disposal, and existing worker binding/transfer failure ownership.
Six focused browsers PASS: cutout lighting/lifetime, material coverage, all-nine
worker composition, fallback/coalescing/disposal/hidden owners. Additional
seven browsers PASS for optional emission, zero-map parity, run/boss scene
readiness and cinematic continuation/selection. Checked production verification
build PASS at1.68.6. Logs: `tmp/performance-phase2-direct-cache-browser.log`,
`tmp/performance-phase2-direct-cache-ownership.log`, and
`tmp/performance-phase2-cutout-build.log`. Sessions16116/81757are terminal exit0.
No live captures remain. Next: generated runtime inventory and duplicate-atlas
checkpoint, existing WebP audit, then shared budgeted decoding/prefetch/next slots.

## Phase 3.1 — Duplicate-atlas investigation checkpoint

Generated `scripts/assets/runtime-inventory.json` from the actual startup globs,
static source references, installed material catalog and shared stage selections.
The generator is `scripts/assets/runtime-inventory.mjs`; every row records
repository path, dimensions, encoded/nominal decoded bytes, source consumers,
roles and stage indices. Current scope has361files,120,620,848encoded bytes and
1,564,435,600nominal RGBA bytes, including currently decoded but unused diffuse
maps and startup-only vector sources. These are not resident-memory measurements.

`createAssetMaterials` and `createUiMaterialLighting` load each pack through
`createPbrAtlas`, but only call material(), which reads normal/surface/emissive.
Their colour stamps use the plain compact artwork. Thus `_diffuse` is redundant
in these owners. This includes pine, shrubs, rocks/field rocks, snow boulders,
grass edges, meadow patches, fog wisps, foreground boulders, woodland and snow
woodland landmarks, and every other environment pack: keep plain colour artwork
and aligned data maps; stop decoding the unused diffuse. Pixel equivalence of
plain versus diffuse RGB is unnecessary because diffuse is never drawn here.

Player and four enemy PBR families explicitly read diffuse for lit colour and
retain plain artwork for their existing tone/readiness paths. Blade profiles
explicitly use diffuse as colour. Keep both selections until those separate
consumers can be proven redundant without changing output. The debug material
preview selects plain pack.source, not diffuse. There are80unused material-only
diffuse families:340,955,484nominal decoded bytes across the complete set.

Stage0–8 potential decoded savings are69,219,320 /44,042,712 /50,333,640 /
56,626,928 /44,046,800 /37,752,648 /50,328,880 /56,627,792 /50,332,872bytes.
Local compose kit estimates would fall from151–283MB to113–214MB, before
canvases/cutouts and separate main-thread fog/figures/UI. This supports beginning
with256MB on low-memory mobile and384MB on other mobile, while allowing512MB
desktop; pinning/current+next slots must still be measured against those budgets.
Do not claim combined main/worker memory is bounded yet.

Generated diffuse outputs remain referenced by the installed-pack conversion
catalog and its browser validation; original authoring PNGs/recipes/provenance
must remain. Runtime decode exclusion can be implemented independently. Audit
build emission and source-only output retention in Phase3.2 before deleting files
or claiming compressed-size savings. Startup glob additionally retains4,374,528
nominal bytes of startup-only vectors, listed explicitly for exclusion from the
new runtime prefetch/loader manifest. The checkpoint is recorded before changing
decode selection or selecting the shared loader budget.

### Material-only decode selection verified

Version1.68.7: generic material and UI owners request `colour:false` from
`createPbrAtlas`; direct player/enemy diffuse callers retain the default colour
selection. Missing/optional emission behavior and map alignment are unchanged.
Stage URLs/indices moved unchanged into `environment/asset-sources.ts` so tooling
and future stage-prefetch selection share the actual code-owned mapping.

`tmp/performance-compose-phase3-material-only` PASS45fresh workers and116planes,
all byte-identical to Phase2. Decoded estimates match the predicted savings:

| Stage | Decoded bytes before→after | Compose median / p95 ms |
| --- | ---: | ---: |
| 0 | 283,171,432→213,952,112 | 630.2 / 711.8 |
| 1 | 176,170,848→132,128,136 | 289.9 / 339.4 |
| 2 | 201,334,560→151,000,920 | 346.9 / 359.1 |
| 3 | 226,507,712→169,880,784 | 458.4 / 470.7 |
| 4 | 176,187,200→132,140,400 | 427.1 / 459.8 |
| 5 | 151,010,592→113,257,944 | 290.9 / 335.2 |
| 6 | 201,315,520→150,986,640 | 385.8 / 398.7 |
| 7 | 232,802,096→176,174,304 | 312.7 / 344.2 |
| 8 | 207,625,640→157,292,768 | 305.1 / 336.2 |

No uniform compose improvement is claimed. Six focused units PASS (three new):
unused colour request exclusion with aligned emission/disposal, regenerated
inventory consistency including measured stage totals/duplicate families, SVG
intrinsic dimensions, and existing optional-map/catalog validation. Seven
material/UI/preview/worker browsers PASS; five direct figure/sword/cache browsers
PASS; repeat request checks plus compact-plane validation PASS3. The outfit/charm
and all31UI pack fixtures observe zero diffuse requests. Checked production
build PASS. Logs: `tmp/performance-phase3-material-only-browser.log`,
`tmp/performance-phase3-material-only-figure.log`,
`tmp/performance-phase3-material-requests-webp.log` and
`tmp/performance-phase3-material-only-build.log`. Measurement66010and browser
89376/71874/11881handles are terminal exit0. Decoded budgets are still unimplemented.

## Phase 3.2 — Existing compact WebP checkpoint

The repository already implements the requested conversion policy through
`scripts/assets/compact.mjs` / `compact.py`, integrated with PBR installation.
Do not reconvert, repack or remove authoring originals. Current manifest hash
audit PASS352outputs. Existing encodings:324lossless WebP (194,014,709→120,281,810
bytes),11lossless compact PNG exceptions (66,182→62,365),17lossy WebP
(183,570→127,948). Converted retained inputs total194,264,461→120,472,123bytes;
the earlier266,530,086PNG total additionally includes now-omitted scalar/zero maps.
Lossy manifest maximum8levels/channel and largest mean0.472318 are within the
unchanged0.5/8colour guard. Lossless manifest differences are0.

`compacted-planes.spec.ts` rerun PASS against saved original inputs: every
converted plane keeps dimensions and exact alpha; all180normal/surface/emissive
planes are bit-identical. Raw WebGL sampling uses no colour-space conversion or
premultiplication. Existing UI native unlit/alpha checks and all-nine worker
composition compare complete drawn outputs on their actual decode paths; worker
planes remain byte-identical to the accepted Phase2reference. There is no new
lossy conversion and no new slope/normal visual difference at this checkpoint.
Future shared-loader bitmap decode options still require the same comparison.
Existing generated diffuse files remain conversion-validation inputs, while
their80material-only families no longer decode in gameplay/menu owners. No file
deletion or extra compressed-size gain is claimed for that selection change.

Both duplicate-atlas and existing-WebP findings are recorded. Continue with
compressed prefetch and a shared priority/pin/LRU decoded-image loader, then
next-seed/scene slots and paced GPU warming; startup-only assets must be excluded.

## Phase 3.4 — Shared loader core and worker integration

Version1.68.8 adds `platform/decoded-images.ts`: one serial decode queue with
`now`/`soon`/`idle` priorities, duplicate shared promises, queued priority bumps,
task yields, reference-counted pins and LRU eviction of unpinned resources.
Both background priorities pause while hidden, busy or over the frame budget;
required now requests bypass those gates. Worker callers currently use now only.
Unpin retains a warm source until budget pressure. Only the loader closes shared
ImageBitmaps; clearing a worker image releases its pin and cancels its callback,
without closing a peer owner's bitmap. Loader disposal aborts outstanding work,
rejects queues and closes late decoded results exactly once.

Installed catalog dimensions reserve nominal decoded bytes before worker decode,
evicting unpinned old images first. If mandatory pins leave insufficient room,
the request fails without closing live sources or allocating another known-size
bitmap. Decoded dimensions must match the reservation. This bounds retained plus
reserved RGBA estimates, not native decoder overhead, canvas caches or resident
GPU textures. Unknown-size generic callers have only post-decode admission;
remaining main integration must provide dimensions or measure that limitation.

Budget helper defaults are256MiB for low quality/deviceMemory≤2,384MiB for other
mobile and512MiB desktop. Worker construction uses deviceMemory/user-agent
class; runtime quality/density changes are not yet wired. The core supports
hidden/busy/frame-budget policy, but runtime background requests/policy wiring
are still pending. Main figure/UI/startup owners remain outside the loader.
Whole-application memory is therefore not yet bounded, and no cold-load or
startup no-regression claim is made for this partial integration.

Six new units PASS: shared promises/priority bumps and paused background work,
LRU/pin peers/unpin warm retention, pinned pressure/oversize rejection, pending
disposal/late close/retry, pre-decode reservation, and device defaults. Four
worker method/transfer ownership units also PASS. Existing four worker browsers
PASS for all-nine compositions, local fallback, coalescing/disposal and hidden
owners. Checked production build and strict checks PASS; logs include
`tmp/performance-phase3-worker-loader-build.log` and
`tmp/performance-phase3-worker-reservation-browser.log`.

Persistent worker tests cycle all9stages3times at390x844 DPR2. Test-only worker
navigator settings select the actual256/512MiB constructor policies; no production
code override. Both PASS: desktop peak534,788,792bytes≤536,870,912budget,76evictions;
low-memory peak264,275,504≤268,435,456budget,246evictions. Final pinned kit25images,
157,292,768bytes; final total retention534,784,704desktop/264,252,032low-memory.
`worker-budget-cycle.json` attachments under
`tmp/test-results/rendering-v2/worker-decoded-budget-work-*` retain all27samples
per setting. Log `tmp/performance-phase3-worker-device-budget.log` PASS2.
These browser simulations prove configured retention/pin behavior, not physical
phone CPU/GPU residency or whole-application memory.

`tmp/performance-compose-phase3-worker-loader` PASS45/116raw planes, all
byte-identical to Phase3material-only reference. Compose median/p95 by stage0–8:
715.2/777.5,299.3/339.5,345.4/380.2,459.6/470.2,416.9/437.7,285.9/325.0,
370.3/411.6,307.2/332.3,297.7/321.4ms. Stage0remains above500ms and timing is
mixed; no speedup claim. Fresh worker decoded bytes remain113–214MB. Compose
measurement excludes the predecoded prepare interval; serial cold preparation
must be remeasured after compressed prefetch/main loading integration.

All current processes terminal:15353initial browser,99259cycle,58196reserved
browser,15995compose,96977device budget; no active capture. Continue main-thread
loader ownership/integration and compressed CacheStorage/HTTP prefetch, excluding
startup-only sources. Then implement quiet next-stage decode/prediction/scene
slots, paced texture/variant warming and cosmetic-only loading, and finish the
remaining high-refresh CPU/motion fidelity plus full Phase5verification.

## Phase 3.3 — Compressed prefetch and frame policy

Version1.68.9 adds an inventory-generated runtime manifest selecting275files:
unused80diffuse maps and6startup-only vectors are excluded. The generator uses
the repository Prettier configuration, and a unit check requires reproducible
output. Startup filters its existing source-art glob through the manifest;
this removes4,374,528nominal decoded bytes of startup-only vectors but does
not yet remove lifetime retention of runtime source art.

After the title loading overlay leaves, MainGame starts two low-priority fetches
at a time into base-path-scoped `issen.assets.v1:` CacheStorage. Worker decoding
reads these compressed responses unchanged, falling back to HTTP if storage is
unavailable. Obsolete keys are removed from this scoped cache only. Native
Android mode skips storage/prefetch; saveData skips prefetch. No image decode is
performed by this tier. Root disposal aborts queued transports and removes
visibility/connection/frame listeners and diagnostics.

Runtime frame sampling grants work on settled title/over/between/shrine/paused
states without an open panel, with work≤75%of the frame budget. Combat/loading,
over-budget frames and hidden pages pause newly scheduled requests. At most two
already active requests can finish after pausing. Stage changes reorder pending
URLs: current and adjacent stage, then figures/UI, then remaining environments.
Adjacent stage is only a compressed-file ordering hint; deterministic next-seed
prediction and quiet next-stage decode remain Phase4work.

Five compressed-store/queue/manifest units plus runtime inventory and frame-loop
checks PASS16total; strict and changed-file formatting PASS. Four browser cases
PASS7.7s in `tmp/performance-phase3-prefetch-all-stages.log`: all275files are
prefetched, then atlas networking is blocked and fresh workers prepare each of
the9stages using cached responses; native/saveData leave storage untouched;
visibility/combat/loading/frame-budget gates pause dispatch and quiet resumes it.
Earlier focused checks also PASS4worker fallback/coalescing/hidden cases and
3actual run/boss/cinematic scene-readiness cases; logs
`tmp/performance-phase3-compressed-browser.log` and
`tmp/performance-phase3-prefetch-policy-browser.log`. Checked production build
PASS in `tmp/performance-phase3-prefetch-build.log`.

`tmp/performance-compose-phase3-prefetch` PASS45repetitions/116raw planes,
all byte-identical to worker-loader reference. Compose median/p95 stage0–8:
651.7/711.5,267.6/349.2,393.5/411.6,344.9/477.9,405.6/475.5,272.0/322.1,
382.0/417.3,315.9/348.5,301.2/313.0ms. Mixed timings; no uniform speedup claim.
Stage0remains>500ms with previously profiled software→GPU transfer costs.
This predecoded fixture excludes cold preparation/cache writes. All-nine
cache-only browser proves transport behavior after prefetch completion, not
near-instant compose or no-regression startup. Both need final production
measurements after main image ownership and next-scene/GPU warming integration.

All captures/checks terminal, including compose98178; no browser measurement is
active. Continue main-thread decoded loader integration, preserve independent
preview/material ownership, and release lifetime startup retention. Whole-app
memory, runtime budget adaptation, next-stage decode/seed/scene slots, paced GPU
upload/variant warming, cosmetic loading, high-refresh fidelity/CPU budgets and
Phase5verification remain unresolved. Goal stays active.

## Phase 3.4 — Main native-image pool and local map ownership

Version1.68.10 adds `platform/main-images.ts`, a shared per-Document native HTML
image pool using the existing serial priority/pin/LRU queue. Runtime manifest
dimensions reserve nominal bytes before decode. Compressed responses decode
through native `HTMLImageElement.decode()` from owned object URLs, retaining
the previous main browser interpretation. Only the pool clears image sources
and revokes these URLs. Each caller receives a pin lease and promise; releasing
or disposing one owner prevents its late attachment without cancelling a peer.
The last owner disposes the pool, cancels pending work and closes retained images.

Local-environment material atlases now use this owner. Stage selection disposes
departed atlas leases, leaving warm maps until budget pressure; shared selections
remain pinned. PBR maps are shared safely because source bindings remain on the
separately owned colour artwork. Worker documents retain their existing wrapper
path. Figure/UI/source-artwork/startup owners are still outside the main pool;
whole-application decoded memory and GPU retirement are not yet bounded.
Policy/quality/density wiring and lazy active figure/UI selection are pending.

Strict, changed-file formatting,9focused units and checked production build PASS.
Four existing worker browsers PASS for local constructor/runtime/compose fallback,
all-nine worker lit output, coalescing/disposal and hidden owners. Three new main
browser cases PASS5.4s in `tmp/performance-phase3-main-maps-final-browser.log`:
pending owner disposal preserves a peer request; two atlases share native image
identity and retain the peer after disposal; native/blob decoded normal pixels
are exact against the original source image. These are identity/transport/pixel
checks, not proof of every material or figure pixel after future migrations.

Actual local fallback prepares9stages3times under simulated deviceMemory2,
using the real256MiB main pool: peak264,266,176bytes≤268,435,456budget,134evictions.
Final retention42images/264,246,984bytes,17current pinned maps; final owner disposal
clears all bytes and pins. All27samples are preserved in
`tmp/test-results/rendering-v2/main-image-budget-local-fa-5fc56-in-the-low-memory-main-pool/main-map-budget-cycle.json`.
This accounts only managed PBR maps, excluding still-native source images,
canvases, decoder overhead, JS heap and GPU residency. No cold/startup speed claim.

All check processes terminal, including76631initial browser. Logs also include
`tmp/performance-phase3-main-maps-browser.log`,
`tmp/performance-phase3-main-maps-leases.log` and
`tmp/performance-phase3-main-maps-build.log`. No live capture. Next migrate colour
source/figure/UI owners with independent material bindings, remove lifetime
startup retention, and validate the combined active set on low memory before
quiet next-stage decode/seed/scene slots and paced GPU/variant warming. Remaining
120Hz fidelity/CPU costs, cosmetic loading and Phase5remain required.

## Phase 3.4 — Shared local source artwork and independent bindings

Version1.68.11 routes local-environment colour artwork through the same main
pool as its PBR maps. Sources pin before queued decode; common stage selections
retain leases and departed selections unpin. Released owners ignore late
attachments and never mutate shared image handlers/src. Manifest dimensions
reserve nominal bytes before decode for all local kit sources.

Cached material bindings are indexed by image and owner. Explicit synchronous
`withBindings` scopes cover local drawing, compose and foreground preparation,
including nested temporary canvases. They restore prior ownership in `finally`
and reject promise-returning callbacks. Ambiguous shared stamps without a scope
fail instead of selecting arbitrary peer materials. Disposal removes only the
caller's bindings/layers. No run state, seed or RNG behavior changes.

Strict,12focused units, changed-file formatting and checked production build
PASS. Four worker browsers PASS for all-nine lit output, local failure fallback,
coalescing/disposal and hidden owners. Four main-image browsers PASS10.6s in
`tmp/performance-phase3-main-source-final-browser.log`: simultaneous previews have
byte-identical colour/normal/surface/emissive planes, surviving planes remain alive
and rebuild after disposal; pending disposal preserves peer decode; leased native
colour/data planes match original direct-image decode exactly; all9local kits
cycle3times inside the low-memory pool.

Local source+map peak264,275,504bytes≤268,435,456budget; final264,252,032bytes,
42decoded/25current pinned,245evictions. Last owner disposal clears all bytes.
Preserve27samples at `tmp/performance-main-source-budget/results.json`, copied
before later browser runs clear test output. This bounds local source+map nominal
retention/reservations, not other image owners, decoder overhead, composed
canvases, JS heap or GPU residency.

`tmp/performance-compose-phase3-main-sources` PASS45repetitions/116raw planes,
byte-identical to prefetch reference. Compose median/p95 stage0–8:
709.7/793.2,293.2/326.4,354.2/410.3,464.6/481.4,441.1/466.1,295.9/374.6,
383.4/398.1,318.3/360.8,308.9/334.6ms. Stage0remains>500; previous native transfer
profile explains its largest remaining cost. No speedup/cold-start claim.
Logs include `tmp/performance-phase3-main-sources-browser.log`,
`tmp/performance-phase3-main-shared-sources.log` and
`tmp/performance-phase3-main-sources-build.log`. All processes terminal, including
90873/31945/86121browsers and4516compose; no active capture.

Continue lazy figure/UI/source ownership and remove startup lifetime retention;
demon realm, live fog and Armoury room also require integration. Validate combined
active pins on low memory rather than pinning all menus/variants permanently.
Runtime budget/background wiring, quiet next decode/seed/scene slots, paced GPU/
variant warming, cosmetic loading,120Hz fidelity/CPU budgets and final full
Phase5measurements remain required.

## Phase 3.4 — UI input leases, upload retirement and quiet export policy

Version1.68.12 changes UI jobs to retain pack metadata and their rendered CSS
outputs. One job at a time acquires main-pool colour/data leases, exports through
the same shader and releases its pins afterwards. Warm unpinned inputs remain
subject to LRU pressure. The painter's existing texture store explicitly retires
uploaded source textures after the export copies pixels; no parallel GPU cache.

The initial retirement experiment produced Pixi destroyed-while-bound warnings.
Corrected cleanup detaches prepared material, geometry, lookup and leaf source
bindings before destroying stored source textures. The warning-sensitive test
now requires no bound-source/feedback/invalid-operation warning. No warning-bearing
implementation was committed. Repeated lighting changes reuse the painter and
reacquire its source textures when needed.

`asset-background` now supports independent subscribers. Background UI exports
wait for quiet settled work≤75%frame budget and visible pages before decode and
again before upload. A state change during async decode therefore pauses upload.
Required explicit prepare/custom texture requests bypass those gates; disposal
wakes a waiting pass and unregisters observers. No gameplay/RNG changes.

Strict,14focused units, changed-file formatting and checked production build PASS.
Final6browsers PASS28.9s: quiet/visibility/busy gating and waiting disposal, combined
low-memory UI/local-stage ownership with warning-sensitive cleanup, all31UIpacks
plus lit/unlit colour/alpha/slice/custom seal/restoration checks, and3actual
cinematic/run/boss scene-readiness cases. Earlier4native material/independent light
owner checks and4prefetch gates/cache-only cases PASS; the first policy run exposed
the corrected warning. Logs `tmp/performance-phase3-ui-detached-browser.log`,
`tmp/performance-phase3-ui-budget-browser.log`,
`tmp/performance-phase3-ui-policy-browser.log`,
`tmp/performance-phase3-ui-final-browser.log` and
`tmp/performance-phase3-ui-build.log` preserve the distinction.

Stage0's34images stay pinned while all31UIpacks render, then relight. Actual
256MiB shared main pool peaks268,383,920/268,422,128bytes≤268,435,456budget;
final266,450,576bytes/88decoded/34pinned,142evictions. UI completion retains no
input pins beyond the stage's34, and zero uploaded source textures. Disposing UI
preserves a valid stage compose; last stage disposal clears all pool bytes.
Stable evidence: `tmp/performance-ui-stage-budget/results.json`, copied before
later browser output cleanup. This includes local scene and UI decoded inputs,
not figures/startup/demon/fog/Armoury, browser-owned exported CSS/DOM images,
composed canvases/decoder overhead/heap or resident GPU targets. No whole-app
memory, startup speed or full120Hz completion claim.

All processes terminal:22280/46291/21974/52816, no active captures. Continue figure
and remaining image-owner migration with active selections, remove lifetime
startup retention, runtime budget/quiet decode wiring and combined low-memory
tests, then next seeds/slots, GPU/variant warming, cosmetic loading and Phase5.

## Startup retirement and URL-filter correction

Version1.68.13 clears every retained preload image's src after successful startup
mounting and overlay removal. Disposal is idempotent and still settles pending
loads without late mounting. Failed startup keeps successful preloads for retry.
This releases the startup owner's lifetime references; it does not yet remove
the initial broad source decode or bound browser decoder caches/other owners.

Focused startup browsers found a prior Phase3prefetch integration bug: Vite glob
URLs were relative but manifest URLs absolute, so direct Set matching filtered
out the preload list. Canonicalizing against document.baseURI restores the
intended runtime selection and startup load/decode/failure gate. The initial
browser run failed2existing loading/retry cases and passed4others; corrected
run PASS6in34.3s, including delayed load, failed/retry, pending disposal and
3cinematic/run/boss scene-readiness cases. No test expectations were loosened.
Prior scene-readiness passes did not cover this gate and cannot establish
startup no-regression. Final startup measurements must use this corrected path.

Four preload units PASS, including successful-source cleanup, priority ordering,
deduplicated decode/retry and pending disposal. Strict/formatting/checked build
PASS. Logs `tmp/performance-startup-retention-browser.log` preserve the failures;
`tmp/performance-startup-retention-corrected-browser.log` and
`tmp/performance-startup-retention-corrected-build.log` preserve final checks.
Processes12724/72369terminal; no active captures. Next replace broad startup decode
while migrating required active figure/source owners, preserve cold first-appearance
readiness, then complete memory/transition/frame-budget requirements and Phase5.

## Phase 3.4 — Charm figure leases

Version1.68.14 routes charm colour and data maps through the shared main pool.
The18,874,368-byte kit decodes once for peer owners. Each renderer retains its
own small tint cache, and disposal releases only its pins without clearing a
peer's image. Preparation validates dimensions/maps before ready; disposal
prevents late attachment. Larger figure families and active selections remain
pending, so this is not a whole-figure or whole-app memory claim.

Strict,9focused units, checked production build and4browsers PASS10.7s, including
existing aligned outfit/charm material stamps, all31UIpacks, quiet export policy
and combined low-memory ownership. Two charm owners prepare; one disposes, the
peer stays ready while stage0 and all31UIpacks render and relight. Combined
mandatory set37images/232,826,480bytes; retained peak268,424,816≤268,435,456budget,
145evictions, final37pins/266,454,704bytes/88decoded. UI still retires all upload
sources, stage composes successfully and last owner disposal clears pool bytes.
Stable evidence `tmp/performance-charm-ui-stage-budget/results.json`. Logs
`tmp/performance-phase3-charm-leases-browser.log` and
`tmp/performance-phase3-charm-leases-build.log`. Session57939terminal; no active
capture. Continue player/outfit/enemy/weapon/companion and remaining environment
owners, narrow initial startup decode, then combined budgets/Phase4/Phase5.

## Next-stage decode prerequisite — Non-mutating visit seed peek

Version1.68.15 adds `stageVisits.peek(stage, forceNewVisit)` before quiet decode/
precomposition integration. It returns the current seed for a repeated entry,
otherwise calculates the existing formula with visit+1. `enter` is unchanged;
peek never updates stage/visit/seed or consumes randomness. This solves the seed
identity prerequisite without a sequence change, so Checkpoint3's decision gate
does not apply. Mode-specific next-stage selection and renderer slots are pending.

Four stage-variation units PASS, including a new full identity comparison across
initial seeds0/19/47/0xffffffff, repeated entries, forced run/preview-style visits,
three9-stage cycles and intervening unrelated peeks. Ledger state stays unchanged
until entry and all subsequent enter results/visit counts match the unpeeked
control. Strict, formatting and checked production build PASS; log
`tmp/performance-stage-seed-peek-build.log`. No runtime uses peek yet, so no stage
change speed or new precompose claim. No active capture. Continue remaining main
image-owner/active selection work and use this API when wiring quiet next decode,
normal/trial/daily/cinematic prediction and next-slot promotion/invalidation.

## Phase 4.4 — Cosmetic loading dispatch

Version1.68.16 replaces the loading simulation's immediate return with cosmetic
clock/ambient/transition/weather/camera/apparel updates. Unscaled raw elapsed time
keeps presentation moving even while a combat hit-stop delta is zero. Gameplay
timers, player/enemy/encounter/phase dispatch, trial completion and first-gameplay
markers remain stopped until readiness. Reduced motion suppresses weather motion
and is passed to apparel. No loading lightning/gust/smoke hazards are dispatched.

Loading weather updates particles using cosmetic randomness and a temporary copy
of live hazard fields/banks. Live timers/banks and the combat hazard RNG stay
unchanged. Two new units prove only cosmetic ports run while loading, run timers
remain unchanged even with a pending trial failure, reduced motion is respected,
and all6weather families preserve live hazard state without run-RNG/effect calls.
Five focused units total PASS, strict/formatting/checked production build PASS.
Four real readiness/continued-run browsers PASS32.9s; logs
`tmp/performance-cosmetic-loading-browser.log` and
`tmp/performance-cosmetic-loading-build.log`. Session14400terminal; no active capture.

The150ms ink-style loading treatment and direct moving-pixel loading evidence
remain pending; this dispatch step does not prove seamless promotion or no frozen
screen under every slow load. Remaining image/active selection budgets, mode
prediction/next slots, paced texture/variant upload,120Hz fidelity/CPU budget and
full Phase5measurements/suites/report remain required.

## Phase4 — Delayed loading veil and actual held-load motion (1.68.17)

The static ink veil says “Preparing scenery” through a semantic status region.
`ui/scene-loading.css` follows the existing canvas scene-state attribute, becoming
visible after150ms and hiding immediately on presentation. Short loads never show
it; repeated loads restart the delay. No continuous movement, opacity pulse or
flashes are added, including under reduced-motion media. Mobile screenshot reviewed.

The held-load test exposed a scheduler edge case: `frameDelta` could consume slowT/
hit-stop before the cosmetic-only simulation dispatch, while pause could suppress
cosmetic updates. `runtime/frame-bindings.ts` now masks those timing inputs during
loading, forces cosmetic update/render demand, and permits the loading dispatch
while paused. Normal scheduling and paused continuation adoption are unchanged.

Actual held stage requests at390x844 produced303,422changed pixels over0.8167s
in active play and304,235over0.8333s paused (RGB difference sum>6). G/player/hazard
state, run RNG, hit-stop and slow-motion timers remain identical across each
capture. This includes nonzero5s slowT/hit-stop inputs. Seven focused scene/readiness/
continued-run browsers PASS1.0m;13loading/weather/frame-loop units PASS;
strict/format/checked production build PASS. Stable PNG/JSON evidence lives under
`tmp/performance-loading-veil`; browser/build logs use that prefix with
`-browser.log`/`-build.log`. Session72306terminal, no measurements active.

This is direct moving-pixel evidence for the tested held request, not proof for
every cold/warm stage or next-slot promotion. Main figure/other source ownership,
startup budget narrowing, mode prediction/next slots, paced uploads/variants,
120Hz fidelity/CPU budget and full Phase5requirements remain outstanding.

## Phase3 — Runtime pacing for the shared main decode pool (1.68.18)

`platform/main-images.ts` owns one background-frame and visibility subscription
per shared document pool. Soon/idle requests start blocked, then run only after a
visible settled frame uses<=75% of its budget. Busy/expensive/hidden frames block
new dispatch; required requests remain immediate. Returning to visibility waits
for a new quiet frame. Policy updates are change-only so each settled frame does
not scan the loader's retained entries. Final-owner disposal removes both
subscriptions; creating a new pool starts blocked again. Callers no longer expose
an independent policy override that could conflict with the runtime controller.

New native browser evidence covers shared queued priority bump, peer disposal
without cancellation of the remaining lease, initial/expensive/busy/hidden gates,
hidden required requests, fresh visible grant and final-owner/fresh-pool lifetime.
Eight main-pool/UI/27stage-cycle browsers PASS12.9s;6loader units PASS;
strict/format/checked production build PASS. Logs:
`tmp/performance-main-queue-policy-browser.log` and
`tmp/performance-main-queue-policy-build.log`. Session75826terminal; no active capture.
No automatic next-stage decoded requests are introduced yet.

Companion inspection identifies a prerequisite for further migration: parts and
mystic-rock each have colour/normal/surface planes, totalling37,735,212bytes.
Adding both as permanent pins to the measured stage0+charm232,826,480bytes gives
270,561,692bytes, exceeding256MiB by2,126,236bytes before other figure owners.
The renderer/callers currently prepare both eagerly. Their migration must handle
active selection and startup/preview readiness together; companion code remains
unchanged here. Whole-memory budgets and remaining main ownership/startup,
prediction/next slots, uploads/variants,120Hz fidelity/CPU budget and full
Phase5requirements remain outstanding.

## Phase3 — Pinned-byte diagnostics and rejected input retirement (1.68.19)

Loader snapshots now report uniquely pinned resident decoded bytes. Multiple
owners of one URL count once; released warm entries remain in total bytes but
leave pinned bytes. Unit assertions cover two owners and both releases. Six loader
units and9main-pool/worker browsers PASS17.3s; strict/formatting/checked production
build PASS. Logs `tmp/performance-pinned-bytes-browser.log` and
`tmp/performance-pinned-bytes-build.log`; session79229terminal.

Measured local mandatory input bytes for stages0–8 are213,952,112;132,128,136;
151,000,920;169,880,784;132,140,400;113,257,944;150,986,640;176,174,304;157,292,768.
This reproduces the inventory; it is not a new memory reduction.

An experiment released non-live raw inputs after composing while retaining fog/
bamboo inputs and completed material planes. The pixel comparison failed. Clearing
independent colour cutouts initially changed stage0colour by32; retaining those
cutouts removed that mismatch but normal/surface differences remained, including
alpha changes. Software Canvas preparation also failed the candidate comparison.
All rendering/test changes for retirement were reverted; only diagnostics remain.
No tolerance was loosened and no input-retirement saving is accepted.

An unchanged-renderer control repeats all9stages across two seed/resize/DPR/quality/
reduced-motion/flash variants, inserting unrelated figure decodes between compose
and draw in its second pass. Stages0–6 are exact. Stage7raw max127/255 and live
max2/3; stage8raw max255/26 and live max3/2. Across the differing normal/surface
planes, alpha max28 and opaque RGB max21. No shader/feedback warnings; pool peak
264,282,368bytes stays below268,435,456. This proves an unresolved existing repeat/
pressure pixel-stability issue, not its cause. Cache identity, canvas raster mode
and source reload remain hypotheses requiring isolation.

Stable results: `tmp/performance-local-input-release/unchanged-control.json`;
earlier candidate/control/software JSON and logs use the same prefix. Rejected
patch and runnable unchanged-control probe are preserved under
`tmp/probes/local-input-release/README.md`. These are ignored investigation artifacts,
not a passing regression test. Next isolate reload/raster stability before retiring
inputs, then implement companion selection/startup/preview readiness together.
Whole-memory budgets, remaining source owners/startup, prediction/next slots,
uploads/variants,120Hz fidelity/CPU budget and full Phase5requirements remain required.

## Phase3 — Pressure pixel-stability isolation, unchanged implementation

Follow-up probes preserve1.68.19 renderer behavior. Test-only module interception
adds readbacks or disables cutout retention; no renderer fix is accepted.
Software Canvas control still differs at stages5/7/8. Disabling material-cutout
retention also differs, with larger surface errors, so neither switch resolves
the issue. These probes remain failing investigation artifacts.

Full-size decoded pixel hashes match for all53authored colour/data images used by
stages5/7/8 after127evictions (one browser PASS10.7s). Isolated stamps match for
17source kits across six rotation/mirroring variants each after127evictions
(one browser PASS8.7s). Direct fractional crop/downsample comparisons match for
all53images after127evictions (PASS7.1s); keeping the three suspect normal maps
continuously pinned also matches (124evictions, PASS6.7s).

Intermediate traces locate the first full-composition difference at stage7's
mountain stamp. Raw sampled map pixels already differ immediately after native
drawImage, before normal correction and source masking. Both passes have matching
full-size source hash1193658613, crop[0,443.5,887,443.5], normal matrix[1,0,0,1],
target62x31 (low) or103x52 (high), and matching colour-mask hashes. Stage8 first
divergent low/high stamps are pine/temple posts. Thus normal quantization, final
scene-plane placement and colour-mask generation occur after or independently of
the earliest observed mismatch. Full composition history is still required by
the current reproducer; direct native sampling alone passes. This does not prove
a browser/driver bug or identify the missing draw-state/history variable.

Stable evidence `tmp/performance-local-input-release/` contains source-reload,
stamp-reload, source-downsample, pinned-downsample, stamp-trace, bake-trace and
raw-bake JSON, plus software/no-cache controls. Runnable probes/configs and their
roles are recorded in `tmp/probes/local-input-release/README.md`. All sessions
64218/64936/99090/23938/20117/66607/32623terminal; final direct probes exited0.
No captures active. Next capture Canvas attributes/draw state and reduce source
sampling history at the first divergent draw, before reconsidering input
retirement. All previously listed goal requirements remain outstanding.

## Phase3 — Native sampling isolation and rejected bitmap map inputs

Draw-state tracing confirms matching transform, alpha, composite, filter,
smoothing, shadows, srgb/unorm8/software-readback attributes and no context loss
at divergent samples. Removing WebGL presentation still differs at stages5/7/8.
Initial no-WebGL probe lacked a required material sink and failed before comparison;
the corrected diagnostic sink produces raw-plane evidence, not live-view parity.
A continuously pinned mountain-map-only crop/size history replay with pressure
PASS24.2s, so that isolated history is insufficient to reproduce the difference.

Snapshots of decoded HTML PBR maps via createImageBitmap make bitmap-versus-bitmap
repeats exact across18full compositions under pressure (PASS39.9s). They fail
original native-versus-bitmap parity, as do blob decoding with default or explicit
premultiplication/colour-space options. All three differ from stage0, with large
normal/surface/alpha differences and live-view max up to50. Therefore stability
alone is insufficient: no bitmap map-input implementation is accepted. The explicit
options probe first had a quoting syntax error; corrected evidence is separate.
No renderer baking/input behavior or tolerance changed. Cause remains unresolved.
Ignored probe/config index `tmp/probes/local-input-release/README.md`; corresponding
JSON `tmp/performance-local-input-release/`. Sessions5497/4650/65911/5594/57303/
84483/97435terminal; no captures active. Continue other required goal work.

## Phase3 — Prompt GPU retirement for closed composed bitmaps (1.68.20)

`environment/worker-types.ts` announces final source retirement before closing
each transferred composed bitmap. `texture-revision.ts` uses weak source keys and
one-shot disposable subscriptions. Each SceneTextureStore releases its own
colour/data/frame textures immediately; peers retain unrelated sources. Temporary
disuse retains the existing120-frame grace period. Old subscriptions cannot remove
a later canvas lifetime's listeners. The source owner remains responsible for close.

The first actual worker/painter test caught shader-source destruction while still
bound. Before releasing a GPU source, the painter now detaches only matching
composite/geometry/artwork/leaf bindings throughout its pooled slots, including
inactive ones. Sprite slots also drop matching textures. Final painter disposal
removes subscriptions after its shaders are disposed. The existing offscreen
export release path uses the same targeted detachment. No per-frame listener scan
is added and scene decoding/baking/seed sequencing stay unchanged.

Eight retirement/loader units PASS;36native worker/lifetime/lighting/instancing/
UI/resize/context-restore/rendering browsers PASS1.7m; strict/formatting/checked
production build PASS. New browser tests prove independent GPU consumers,
colour/data/crop destruction, unrelated-source survival, peer disposal and actual
worker replacement before the next draw, without feedback/GL/destroyed-binding
warnings. Initial focused failure and corrected passes are preserved separately.

A mobile-size390x844 DPR2 control disables only final retirement notifications:
uploaded source counts before replacement/after replacement/after the next draw/
after owner disposal are12/12/24/24, versus12/0/12/0 with retirement enabled.
The final rendered pixels match exactly (max0).585x1266 backing planes yield
nominal RGBA8 source allocation71,098,560→35,549,280bytes after the second draw.
This excludes renderer attachments/driver allocations and does not prove resident
GPU peaks. Stable `tmp/performance-texture-retirement/counts.json`; ignored control
`tmp/probes/texture-retirement/playwright.config.ts`. Logs
`tmp/performance-texture-retirement-focused.log`, `-corrected.log`, `-browser.log`,
`-counts.log`, `-build.log`. Session22380terminal; no measurements active.

This covers final composed worker bitmap lifetimes. Other source owners, whole
decoded/GPU budgets, startup narrowing, native pressure stability, next-mode
prediction/slots, paced uploads/variants,120Hz fidelity/CPU budget and full
Phase5measurements/suites/report remain required.

## Phase4 prerequisite — Mode-aware stage prediction and compressed priority (1.68.21)

`game/session/stage-progression.ts` owns the shared encounter stage/lap formula.
Wave entry and rush duel entry call it at their existing boundaries. Normal/daily
runs predict the next three-wave visit; rush predicts the next duel. Trials never
change scenery in their encounter lifecycle, so they have no future stage to warm.
Cinematic selections are user-directed; inactive and mismatched encounter/stage
state also skip prediction. Prediction uses primitive arithmetic and a module-owned
state set without per-frame object/array allocation, visit mutation or randomness.
The existing pure visit-seed peek remains unchanged and is ready for next-slot use.

Actual runtime frame sampling forwards the optional predicted stage to compressed
prefetch. The fetcher reprioritizes when either current or predicted stage changes,
including mode changes at the same stage. Current-stage files remain first; all
runtime files remain in the broad compressed queue. Native/saveData/hidden/busy-frame
gates remain in force. This does not start next-stage decoding or precomposition.

Nineteen units PASS, including original entry/trial/visit tests, ten-lap historical
stage/lap parity, three-cycle wave lifecycle state/RNG/trace parity, next-entry seed
identity and rush wrap/unknown-mode guards. Ten prefetch/main-pool browsers PASS12.0s,
including same-stage prediction reprioritization and all-nine-stage cache-only worker
loads. Seven live runtime/trial browsers PASS; expanded actual frame sampling/replay
PASS9.0s publishes normal/daily nextstage1 and no trial prediction while preserving
the existing high-refresh replay checks. Trial checks emit destroyed-source/sampler
binding warnings; their origin is unresolved and needs follow-up. No claim of fully
settled GPU lifetimes follows from these functional passes. Checked production
build/strict TypeScript PASS. Logs `tmp/performance-next-stage-prefetch-browser.log`,
`tmp/performance-next-stage-prediction-unit.log`, `tmp/performance-next-stage-runtime-browser.log`,
`tmp/performance-next-stage-runtime-sampling.log`, `tmp/performance-next-stage-build.log`.
All processes terminal; no performance capture ran. Future decoded warming/next slots,
paced uploads/variants, whole-memory/startup budgets, native pressure stability,
120Hz fidelity/CPU budget and full Phase5measurements/suites/report remain required.

## Phase3 — Detach cached native source/sampler bindings (1.68.22)

The trial warnings recorded at1.68.21 reproduce in the unchanged120-frame expiry
path, `SceneTextureStore.collect`. Test-only creation/destruction stacks identify
Pixi's default mesh shader and cached graphics texture batch BindGroups. They can
retain sources beyond the lifetime of the currently pooled scene shaders. The
first targeted default-mesh-only change removed one reproducer's warnings, but
all-eight-trial traversal still warned from groups created by
GraphicsContextSystem/getTextureBatchBindGroup. That partial adapter was replaced.

`pixi/source-bindings.ts` now snapshots the source and sampler's change observers
before GPU destruction, restricts detachment to actual BindGroups, and replaces
only resource slots matching the retiring GPU source/style through public
setResource. Other resource slots and non-BindGroup observers are untouched.
Pixi's EventEmitter exposes no public listener-context inventory, so this small
guarded adapter reads its private event/context structure; revalidate it when
changing Pixi8.22. Existing owned texture destruction and temporary120-frame grace
remain unchanged. It runs on release, not every frame, and changes no decoding,
baking, rendering inputs, seeds or gameplay rules.

An initial isolated draw used batching and passed with cleanup disabled, so it
was insufficient. Revised native unbatched mesh and graphics pattern expiry
controls both FAIL on source/sampler warnings when final detachment is disabled.
Both PASS enabled, with uploaded source counts1/0/1/0 after draw/expiry/reuse/
disposal. Actual all-eight trial traversal and seeded retry now assert no destroyed
binding/feedback/GL warnings; final4focused browsers PASS50.1s. Final29native
rendering/lighting/UI/worker/lifetime/resize/context browsers PASS1.6m. Earlier
broad/recovery runs timed out at the unchanged5s startup wait before the #prevC
context-loss action; isolated PASS16.1s and final broad passes without wait changes.
Do not infer cold-start improvement from recovery. Four retirement/resource units,
strict TypeScript, targeted formatting and checked production build PASS.

Evidence: `tmp/performance-source-bindings-control.log` (expected2FAIL), `-final.log`,
`-browser.log`, `-build.log`; first trace/owner stacks in
`tmp/performance-binding-warning-trace.log` and `-owners.log`. Initial partial
implementation/probe and startup recovery logs use
`tmp/performance-mesh-retirement-*`. Ignored runnable probes are under
`tmp/probes/binding-warning/` and `tmp/probes/mesh-retirement/`. All processes
terminal; no new performance capture ran. This resolves the covered expiry/trial
warnings; whole-memory/startup owners/budgets, native pressure stability,
next-slot/decoded warming, paced uploads/variants,120Hz fidelity/CPU budget and
full Phase5verification/report remain required.

## Phase4.3 baseline — Paced native uploads and residual first draw (no integration)

Ignored probes initialize worker-composed sources through the existing painter's
SceneTextureStore and renderer.texture.initSource; colour/emissive use colour
textures, normal/surface use data textures. A4ms batch target yields through rAF.
Nothing changes production scene readiness, source inputs or texture cache policy.
The probe uses390x844 DPR2 and780x1688 main canvas, high quality and reduced motion.

Separate fresh workers measured lower first-draw cost but differed atstage5
(live max33), so that comparison fails the pixel guardrail. It does not isolate
input composition from upload order. A compose-once comparison shares identical
completed bitmaps between two fresh painters and matches pixels exactly across
all9stages (PASS21.4s). A persistent-owner/two-painter comparison also matches all
9stages exactly (corrected PASS13.7s). It avoids repeated cold shader compilation
when evaluating sequential transitions. One sample perstage/mode is diagnostic;
these are not steady-state p95 values or real-device/GPU-residency measurements.

| Stage | First draw baseline ms | Paced first draw ms | Warm wall ms |
| --- | ---: | ---: | ---: |
| 0 | 115.3 | 56.3 | 27.7 |
| 1 | 12.3 | 1.2 | 10.5 |
| 2 | 18.3 | 1.4 | 17.9 |
| 3 | 57.1 | 12.6 | 14.1 |
| 4 | 30.4 | 3.6 | 35.9 |
| 5 | 10.8 | 1.2 | 27.6 |
| 6 | 12.7 | 0.6 | 14.9 |
| 7 | 21.6 | 6.0 | 27.3 |
| 8 | 19.5 | 0.5 | 21.7 |

Static composed planes upload before the first draw; source counts are unchanged.
Warm wall includes rAF waits. Corrected persistent batches span4.8–8.7ms despite
the4ms target; individual uploads cannot be interrupted. Another run observes a
single22.6ms upload and26ms batch. Moving work into loading alone can increase
cold-load wall time; earlier/later HTTP-cache ordering also confounds separate
worker compose times, so none of these proves the cold-load acceptance criterion.

Residual stage0 first draw uploads four live-fog1774x887 sources outside the
composed planes. A dedicated first-draw CPU profile samples45.5ms in texImage2D;
recorded upload calls total45.2ms, with individual9.4–12.9ms calls. The stage3
fresh-painter profile samples9.9ms in getProgramParameter checks. Its persistent
first draw falls to12.6ms. CPU profile wall durations include exposed-function/CDP
boundaries; use the direct draw measure, not total profile duration, as draw time.
Function names and src URLs are visible in the dev CPU profiles; this is not a
new production cold/warm trace. The initial hook assertion failed due to transformed
Vite whitespace and was corrected. Initial persistent instrumentation retained
nested texImage2D wrappers and collected later readback-tagged calls in old rows;
the corrected run restores the original method after each measurement, preserving
the first version separately.

Required next work: feed the complete scene source set, including live fog, into
cancellable paced warming before worker publication/settlement; preserve current
layers until the warmed key is valid, stop while hidden, restart after context
generation changes, and close stale partially uploaded responses through existing
retirement. Then warm shader/figure variants and use the predicted next slot to
hide preparation time. Local fallback needs explicit current/next canvas ownership
and input-budget handling before equivalent asynchronous warming; it must not
mutate displayed layers while awaiting uploads. This evidence supports the upload
approach, not its integration or completion of transitions.

Stable `tmp/performance-scene-upload/` contains independent-workers-results.json,
same-output-results.json, persistent-v1-results.json, corrected persistent-results.json,
profile-results.json and stage0/3 paced-first-draw CPU profiles. Runnable role/index
`tmp/probes/scene-upload/README.md`. All sessions terminal; no new production code,
version, assets, committed tests or standard performance harness changes. Whole
memory/startup budgets, native pressure stability, decoded/next-slot warming,
uploads/variants,120Hz fidelity/CPU budget and full Phase5verification remain required.

## Checkpoint 22 — Worker source warming before publication, 1.68.23

The main native scene now supplies the worker owner's upload port. Incoming
composed colour/emissive and data normal/surface planes, plus live stage 0 fog
colour/normal/mask/surface/emissive, use the existing painter texture store.
The owner retains its displayed layers until warming succeeds for the desired
key, then replaces layers and settles readiness. No parallel texture cache or
incoming-scene flush is introduced. Sources stay pinned against ordinary frame
collection while warming; hidden waits retain no rAF, stale/disposed requests
abort, rejected responses close through existing retirement, and restored
context generations restart the complete source set. Warming failure settles
through the local composition fallback. Local/demon readiness stays unchanged.

Same-input native checks preserve exact pixels across nine stages and leave
zero ImageBitmap/HTMLImageElement uploads on their first draw, including live
fog. Cancellation retains the old pixels and closes partially uploaded inputs;
GPU source counts return to the displayed stage. A real context-loss/restore
check retains pending sources through 125 collection frames and confirms both
sources draw without reupload after readiness. Disposal cancels hidden waits.
Actual held-load checks preserve gameplay/hazard/RNG snapshots while presentation
advances, and confirm the runtime retains the prewarmed mark before settlement.
Chromium restoration must occur after loss-event dispatch finishes; the initial
same-event restoration fixture timed out, and a next-task restore fixes it.

One mobile-resolution integrated sample uses one worker and two persistent
painters sharing identical bitmaps. The warmed painter draws before the control;
HTTP cache and cross-context driver/shader caches confound timing, so the control
is a pixel/upload guard, not a controlled cold-load comparison.

| Stage | Control first draw ms | Integrated first draw ms | Warming wall ms |
| --- | ---: | ---: | ---: |
| 0 | 70.4 | 61.3 | 125.3 |
| 1 | 10.1 | 2.5 | 37.5 |
| 2 | 17.8 | 0.9 | 20.5 |
| 3 | 34.4 | 66.2 | 63.7 |
| 4 | 15.3 | 2.9 | 59.0 |
| 5 | 12.5 | 12.4 | 31.5 |
| 6 | 9.3 | 0.8 | 35.0 |
| 7 | 19.3 | 8.5 | 49.1 |
| 8 | 12.7 | 1.6 | 55.8 |

All pixel maxima are zero; all first-draw scenery uploads are zero. Source counts
after drawing are 16 except stage 4's 24, including cached live fog. These are
nominal counts, not peak GPU residency. Native upload maxima reach 17.1 ms;
the 4 ms pacing target cannot interrupt an individual call. Separate first-draw
CPU profiles sample 56.7 ms in getProgramParameter at stage 0, and 22.3 ms at
stage 3, which also samples Graphics path construction and GC. Direct profiled
draw durations are 61.6/53.7 ms; profile wall includes CDP callback boundaries.
Moving source uploads before readiness does not establish the no-long-task goal,
shader readiness, GPU completion, improved cold-load time or near-zero transitions.

Evidence: tmp/performance-scene-upload/integrated-results.json,
integrated-profile-results.json and stage-0/3-integrated-first-draw.cpuprofile;
runnable integrated and integrated-profile probes under tmp/probes/scene-upload.
The frozen standard performance harness and assets remain unchanged. Next work
must warm shader/figure variants and prepare the deterministic next scene early;
local ownership, complete figure/startup budgets, native pressure stability,
120Hz fidelity/CPU budget and full Phase 5 verification remain required.

Verification: all 459 unit tests PASS, strict checked production build PASS,
format/diff checks PASS. Focused worker/retirement/high-refresh 13 PASS and
lifecycle/held-readiness 7 PASS. Wider scene/context run passes 10/13; three
five-second startup assertions fail before their target behavior, then all three
pass isolated (34.7s) without test timeout changes. Broader native run passes
39/41 (1.9min); two lighting-control cases fail at the same startup deadline.
Both still fail in a focused default-two-worker retry and in ignored copies
with only the new warming port disabled, then pass isolated with warming enabled
(18.1s). The parallel startup delay remains unresolved; this is not a clean full
suite or final startup verification. The old charm catalogue unit fixture lacked
document event methods required by the existing shared image owner; replacing
its bare stub with an EventTarget fixes that fixture without production changes.
All measurement/test sessions are terminal.

## Checkpoint 23 — Ordinary scenery shaders before presentation, 1.68.24

The source-only checkpoint profiles locate first-use program reflection/linking.
A paced binding prototype uses Pixi's existing shader system with resource sync
disabled. Five programs preserve exact all-stage pixels and reduce stage 0's
sampled first draw to 3.4 ms, but stage 3 still compiles the default batch shader
(25.8 ms). Adding the shared default batch removes that compilation; a cold
surface without an initial white draw identifies the remaining back-buffer copy
(46.7 ms). The first fixture used the wrong artwork handle and silently selected
local fallback; its results are invalid, preserved separately. Corrected probes
explicitly require worker ownership. Literal-newline and bare module-import
fixture errors were also corrected before successful measurements.

`warmSceneShaders` prepares material geometry/composite, vector/artwork lookup,
light, default batch and final back-buffer copy programs. Bindings use
`renderer.shader.bind(shader, true)`: existing native program cache, no drawing,
target mutation or resource synchronization. Templates/wrappers are disposed;
shared GlPrograms and native program ownership stay with Pixi/the renderer.
The copy shader is borrowed through a guarded Pixi 8.22 adapter. Shader readiness
is cached per context generation, so later scenes do not repeat shader rAF work.

The main port now calls coordinated `warmScene`. It retains incoming sources
through both steps and repeats both if context generation changes between them.
This closes a lifecycle gap: separately awaited source/shader warming could lose
source GPU storage during the shader wait. A native test forces that exact loss
after source initialization, drives 125 collection frames, restores the context,
and asserts correct pixels with zero first-draw uploads/links. Hidden disposal
and stale-request ownership remain covered. Initial cold-surface tests caught
the missing copy shader; the guarded adapter fixes them without loosening checks.

Final diagnostic uses one worker, two cold persistent painters, identical bitmaps,
390x844 DPR2. All nine pixel maxima, first-draw scenery uploads and program
creations are zero. First-draw ms by stage 0–8:
6.9, 3.9, 2.7, 20.6, 14.9, 0.6, 1.0, 19.8, 0.7.
Source counts remain 16 except stage 4's 24. Initial source/program warming wall
is 335.8 ms, later scenes 23.3–60.9 ms. Initial native program creation includes
35.1 ms composite, 69.6 ms vector and 53.8 ms artwork calls: pacing cannot split
native compilation. These calls occur before readiness, but can still stall
loading cosmetics. Driver/cache/order confounds control timing, and this does
not prove cold-load speed, no frozen screen, frame p95 or resident memory.

Separate post-warming profiles directly measure stage 0/3 draws at 8.4/45.6 ms.
No program creation occurs in either first draw. Stage 3 samples 8.1 ms GC,
5.9 ms graphics preparation, 3.6 ms addPath, 3.2 ms batching and 3.9 ms native
activeTexture. Profile wall includes exposed-function/CDP boundaries; program/
idle samples are not equivalent to direct draw time. Remaining first-use
geometry/uniform preparation and GC require investigation; simply compiling
programs is not full shader/figure/scene readiness.

Evidence: tmp/performance-scene-upload/shader-prototype-five-programs-results.json,
shader-prototype-results.json, shader-integrated-results.json,
shader-no-init-results.json, shader-final-results.json,
shader-final-profile-results.json and stage-0/3-shader-warmed-first-draw.cpuprofile.
Runnable probes and their role index remain under tmp/probes/scene-upload.
Standard performance harness/assets unchanged. Next-scene slots/decoded warming,
complete figure/startup budgets, local/demon warming, native pressure stability,
120Hz fidelity/CPU budget and full Phase 5 acceptance remain required.

Verification: all 459 unit tests PASS; checked production verification build,
format/diff checks PASS. Coordinated lifecycle/held-readiness 7 PASS (22.0s).
Broader native/runtime run passes 34/39 (1.6min), with four five-second startup
assertions failing before target behavior, plus one extra-frame replay pixel
maximum 3 against the existing limit 2. All five pass isolated (58.6s).
Three shader-disabled replay controls pass (18.3s); enabled replay/all-stage
warming repeated three times passes all 18 cases with default two workers
(34.9s), including the final coordinated-disposal check. Tolerances and timeouts
remain unchanged. The single replay difference is unexplained, not demonstrated
to be caused by shader warming or resolved for the full goal. Startup and native
pressure stability remain required. All sessions terminal; no full-suite,
cold/warm production trace or final acceptance claim.

## Checkpoint 24 — Main-image final GPU ownership, 9 October 2026

The companion/startup audit found a shared-pool lifetime gap first. The existing
HTML-image resource cleared its source URL on LRU eviction or final pool disposal
without notifying native GPU consumers. Two original-code browser controls fail:
final disposal clears image pixels but leaves one source texture in each of two
painters; LRU eviction leaves two colour/data textures and one crop texture.
This is independent of the still-unintegrated companion/figure selection work.

Version 1.68.25 calls the existing retirement port before clearing pixels and
revoking the blob URL. Pool ownership remains unchanged: releasing a lease keeps
warm pixels, and disposing one owner preserves its peer's shared image. No new
cache, forced eviction or budget increase is introduced. Native stores already
perform binding detachment and texture destruction when notified.

After: final disposal removes both painters' source textures immediately (1/1
before, 0/0 after). Peer disposal retains the identical 256-pixel-wide image and
both source textures, with exact native pixels (maximum difference 0). Low-memory
LRU pressure releases all three colour/data/crop textures and the uploaded native
texture before the source width becomes zero; the retirement callback observes
width 256 and fires exactly once. Sampled loader peak 264,485,456 bytes stays below
the configured 268,435,456-byte budget; final snapshot 264,354,384 bytes, 42 decoded
sources, two evictions. These are loader-accounted bytes/source texture counts,
not resident GPU memory or a whole-application budget guarantee.

The enhanced 16-case browser run passes in 20.2s with default two workers:
shared image scheduling/cancellation/peers, all-stage local source cycling,
actual native eviction/final disposal, colour/data/crops, pooled mesh/pattern
bindings, worker replacement, catalogue figures and all nine native scenes at
two viewport sizes. No feedback/bound-resource warnings; peer pixels exact.
Eight focused loader/retirement unit checks pass. Additional final checks are
recorded in the handoff after completion. Browser JSON evidence is copied to
`tmp/performance-main-image-retirement/`; tests attach through outputPath.

Companion audit: startup, figure factories and both preview constructors still
request both kits. A safe selection migration must include active equipment and
explicit preview borrowing/release. Simply routing both kits through the pool
can exceed the low-memory budget alongside stage 0 and the pinned charm kit.
Complete main-figure/startup integration remains required; no claim of a new
startup bound, faster transitions, frame-p95 improvement or full goal acceptance.

Final checks: all 459 unit tests PASS; checked production verification build and
strict type checks PASS. Assets and frozen standard performance harness unchanged.
No push/deployment/native build or player-save mutation. Whole goal remains active.

## Checkpoint 25 — Selected companion ownership, 9 October 2026

Before changing ownership, the native companion control prepares six HTML images:
37,735,212 nominal decoded bytes, both parts and rock colour/normal/surface kits.
All eight animated/reduced-motion native comparisons against directly decoded
original URLs have exact pixels. This control is retained as the explicit full
catalogue path; it is not a startup timing or resident-memory measurement.

Version 1.68.26 routes companion inputs through the existing shared HTML-image
pool. Runtime selection retains only the equipped kit. It uses the existing
visible-pet rule after startup equipment restoration and through live equipment
views, including scarecrow's crow. Crow/cat/shiba share the 18,870,192-byte parts
kit; rock uses 18,865,020 bytes. No pet needs no kit. Companion colour URLs are
excluded from the broad startup preloader, which would otherwise decode both
before runtime selection. Aligned raw colour/PBR inputs and rig geometry remain
unchanged. Explicit standalone preparation can still select the whole catalogue.

Each preview owns an explicit borrow of its frame's kit. Primary and preview
selections form a union, with one lease per selected source in each renderer.
Changing the primary does not invalidate a preview still borrowing its old kit.
Releasing a borrow unpins only kits outside that union; warm resources remain
LRU-managed. Independent renderer owners share native image identity and retain
peer pixels after disposal. Obsolete/released pending loads cannot publish old
readiness; disposal cancels pending publication and releases all owned leases.

Preview selection changes/panel closure release that painter's companion GPU
textures. Other painters retain their own textures and source leases. A late
selected load repaints the most recent matching preview, preserving its clock
and effects simulation. Suspension/disposal invalidates late repaint callbacks.
Live Armoury draw selection updates the primary before borrowing a changed kit.
All current runtime previews read the same equipped companion; arbitrary
cross-kit borrowers remain supported within available loader capacity. A caller
requesting both kits alongside all stage-0 inputs and the pinned charm kit can
still exhaust 256 MiB. Whole-figure/source headroom must be addressed; increasing
the budget or silently dropping required artwork is not the solution.

Measured selected ownership: no selection decodes/pins zero images; one kit
pins three; both explicitly borrowed kits pin six. Repeated cat/shiba selections
leave loader counters unchanged. Releasing the parts preview while rock remains
selected drops pins to three (18,865,020 bytes), retaining warm cached inputs.
Final peer disposal clears all bytes and native GPU consumers. Exact original
HTML/native pixels are preserved for every companion and reduced-motion pose.
Required decoding succeeds hidden; actual WebGL context restoration preserves
exact pixels, three source textures, and final disposal returns that count to zero.

The combined low-memory preparation test visits all nine scenery stages in
three scopes: no companion, the parts kit, and rock, while charms remain pinned.
All 27 visits succeed. Loader-accounted peak 264,278,624 bytes stays below
268,435,456; final live snapshot 264,242,668 bytes, 42 decoded, 31 pinned,
195,032,156 pinned bytes, 266 evictions. Final owner disposal returns bytes to
zero. This covers selected companion/charm/local source inputs, not all startup
images, other figures, composed canvases or resident GPU/whole-game memory.

Real startup succeeds with unused companion image/fetch requests blocked. Live
scarecrow and both panel flows select/borrow correctly. Closing each preview
removes its three companion textures. A previously unloaded rock preview repaints
on arrival; a suspended pending preview does not repaint or advance effects.
Initial request blocking also blocked Vite asset modules and caused a fixture
startup timeout; allowing script requests fixes the fixture. Existing four pose
units used raw image callbacks; their transport fake now exercises image leases
without changing their geometry, accessibility, invalid-dimension or disposal
assertions. Native browser checks retain actual shared loading coverage.

Final related browser run: 27 PASS (33.9s), default two workers; all 459 units
PASS; checked production build/typecheck PASS. Bundled startup/gameplay/Armoury/
offline resize checks are recorded in the handoff once terminal. Format/diff
checks and synchronized package/lock/title/changelog metadata are required before
commit. Evidence: tmp/performance-companion-selection/baseline.json,
selected-kits.json, html-parity.json, local-charm-budget.json and runtime.json.
Assets and frozen standard performance harness unchanged. No push/deployment,
native build or real player-save mutation.

Next: complete selected enemy/player/outfit/sword and remaining startup ownership,
including shared preview scopes and transient local-source headroom. Complete
GPU/variant/local/demon readiness, deterministic next-slot/seed wiring, native
pressure stability, actual 120Hz fidelity/frame budget and every Phase 5 metric,
production trace and suite remain required. Goal stays active at full scope.

Final bundled app/ink checks: 3 PASS (23.8s), default two workers, against the
final checked build. Formatting and diff checks PASS; all sessions terminal.

## Checkpoint 26 — Local sampling format controls (no implementation accepted)

Continued the rejected local-input retirement investigation using the unchanged
renderer. Production source ownership, baking and assets remain unchanged. The
earlier retirement patch remains rejected; ordinary browser passes cannot replace
the pressure comparison. This checkpoint records diagnostic results, not a
completed memory or visual requirement.

Two fresh-context PNG controls substitute original material PNGs from the
immutable pre-refactor tree through test-only scenery request routes. Sixty
normal/surface/emissive files are actually requested across nine stages with two
size/DPR/seed/quality variants. Figure pressure inputs retain current WebP files.
Original PNG versus current WebP composition fails exact parity from stage 0:
maximum raw delta255 and live delta6. This comparison alone cannot establish a
codec cause; original-source full-size RGBA equivalence was not audited here.
PNG versus PNG repeat also fails, despite identical format on both sides:
stages0–6 exact, stage7 raw127/255 and live2/3, stage8 raw255/26 and live3/2.
Those late-stage maxima match the earlier unchanged WebP control. WebP encoding
therefore cannot be the sole explanation of that repeat instability. Loader
peak264,282,368bytes remains below256MiB and final disposal returns bytes to zero.
The initial route inadvertently intercepted figure maps absent from the PNG
fixture; narrowing it to environment URLs fixed the fixture before measurement.

Two additional test-only controls snapshot HTML material maps into full-size
software canvases. Canvas versus canvas repeats exactly across all18compositions,
including decoded-figure pressure and native live presentation (PASS38.8s).
Original HTML versus canvas fails from stage0 (38.4s): maximum raw255/live50,
alpha162, opaqueRGB186 and alpha-weightedRGB187.73. This input substitution is
rejected for the same visual-preservation reason as the previous bitmap attempt.
The extra full-size snapshot canvases are outside loader accounting: its bounded
bytes and disposal counter do not prove a bounded total for this experiment.

Both two-case runs used one worker deliberately for isolated sampling diagnostics,
with a dedicated strict-port server owned by each run. All processes are terminal.
Stable reports: tmp/performance-local-input-release/png-equivalence.json,
png-repeat.json, canvas-equivalence.json and canvas-repeat.json. Runnable ignored
probes and configurations are documented in tmp/probes/local-input-release/README.md.
No tolerance was relaxed, no production alternative accepted, and no benchmark
claim or version bump follows from these diagnostic-only changes. Frozen standard
performance harness unchanged. No push/deployment/native build or player-save
mutation. The causal native-sampling explanation remains unresolved; remaining
figure/startup ownership, local transient headroom, next-slot readiness, 120Hz
budget and full Phase5 verification still require completion.

## Checkpoint 27 — Enemy duplicate colour ownership baseline

Before changing loading, two unchanged enemy renderer instances each decode
16HTMLimages totaling100,652,160 nominal RGBA bytes. The four plain colour
atlases contribute25,163,040bytes. All successful body/head/arm/hand paints use
the PBR diffuse family; the plain counterparts only gate readiness and are an
unreachable fallback after successful PBR preparation. They remain useful to the
explicit material debug viewer, so keep the files but stop eagerly decoding them
for enemies/startup. Expected enemy catalogue after removal:12images75,489,120bytes.
The native unchanged-control comparison covers14varied/authored look/pose/fog
cases:13exact and one maximum channel delta1. Record that observed control noise
before setting a one-channel tolerance for this focused native comparison.
Baseline: tmp/performance-enemy-dedup/baseline.json; saved original module and
probe are under tmp/probes/enemy-dedup/. Shared/pinned selection and whole-game
memory remain separate required work; this duplicate removal does not prove them.

Implemented at1.68.27: enemy preparation loads only its twelve PBR planes;
loaded-family diagnostics now reflect successful material preparation. Colour,
tone, frames and material painting use the same diffuse images as before. The
four plain colours remain exported for eager-startup exclusion and available to
material debugging; no asset files removed. Native after comparison passes with
maximum1, matching the unchanged-control noise: tmp/performance-enemy-dedup/after.json.
The nominal saving is25,163,040bytes (24.0MiB), excluding transient/browser/cache
and GPU overhead. Current sources still use direct native loading; selected kits,
shared decoded-budget integration and immediate final texture retirement remain
required and must not be claimed complete by this duplicate removal.

New browser tests block all four plain enemy colours and verify12HTMLimages,
75,489,120bytes, all four ready families, final source clearing, and successful
real runtime artwork readiness. Existing native family/tint cache checks pass.
The first related run had6PASS/1FAIL: the startup retry fixture still blocked
optional companion artwork from before1.68.26 and therefore no longer triggered
a required-art failure. All three startup fixtures now block required player
artwork, allow Vite script requests, and assert an intercepted image request.
Delay/disposal/retry assertions retained; corrected7PASS17.0s/default2workers.
Eight affected preloader/enemy-presence units PASS. Checked production build with
strict TypeScript and focused formatting PASS. Final bundled checks are recorded
in the handoff once terminal. No standard harness edits, push/deployment/native
build or player-save mutation. All remaining full-goal requirements stay active.

Final bundled app/ink checks:3PASS24.5s/default2workers against the checked1.68.27
build. Version/package/lock/title/changelog synchronized; diff/format checks PASS.
All sessions terminal. Enemy/figure/shared/local ownership work remains required.

## Checkpoint 28 — Direct PBR source retirement baseline

Measured before editing disposal: one directly owned four-plane PBR atlas supplies
two native painters (4source textures each) and two independent colour/data/crop
stores (8/4entries). Atlas disposal clears every image to zero natural width but
leaves every GPU entry alive; no retirement observer fires. Baseline evidence:
tmp/performance-pbr-retirement/baseline.json and runnable ignored probe under
tmp/probes/pbr-retirement/. Final native disposal must notify the existing source
retirement hook before closing pixels. Leased images have a different lifetime:
unpinning an atlas must preserve warm/shared resources and peer pixels until the
shared loader's actual eviction or final owner disposal. Preserve that distinction.

Implemented at1.68.28: directly owned images call retireSceneTexture before
source removal/size clearing. Leased images continue to release their pins only;
the shared pool controls their final retirement. No decode/sampling/material,
gameplay or seed change. Direct after counts: native0/0, stores0/0, all12texture
objects destroyed, four callbacks observe positive source width before clearing.
Shared after test: source identity shared, native4/4 and four pins survive peer
atlas/owner disposal; pixels match exactly. Last atlas unpin drops pins to zero
while warm source/native4/4 survive. Final owner disposal clears native0/0,
all four widths and loader bytes to zero. No binding/feedback warnings.

Three new units cover direct callback order/exactly-once closure, leased lifetime,
and disposal during a pending decode without late readiness. Two native browser
tests cover optional emissive alongside colour/normal/surface, every colour/data/
crop consumer, shared warm/peer lifetime and exact surviving pixels. Initial
shared fixture requested a material-only pack's excluded diffuse sibling, which
the runtime manifest correctly rejected; corrected fixture uses that pack's
authored runtime colour with unchanged lifetime/count/pixel assertions.
Final related retirement/warming/enemy checks17PASS19.9s/default2workers; final
assertion additions for native before counts and closed readiness2PASS3.4s.
All462units PASS; checked production build with strict TypeScript PASS. Evidence:
tmp/performance-pbr-retirement/{baseline,direct-after,shared-after}.json, units.log
and build.log. Inputs/assets/frozen standard performance harness unchanged.
Final bundled checks recorded in the handoff once terminal. Prepared figure
cutout/tone retirement, selected enemy/player/outfit/sword/startup ownership,
local transient headroom/native sampling, deterministic next-slot readiness,
120Hz budget and full Phase5 metrics/traces/suites remain required. Goal active
at full scope; no push/deployment/native build or real player-save mutation.

Final bundled app/ink checks3PASS24.1s/default2workers; focused formatting/diff
PASS and version/package/lock/title/changelog synchronized. All check sessions
terminal. These checks do not substitute for remaining full-goal verification.

## Checkpoint 29 — Enemy prepared canvas retirement baseline

Before editing cache retirement, an80palette body grid crosses the variant/tone
LRU pixel budgets within one queued native frame. Both unchanged renderer owners
produce identical pixels. Each holds242native source textures before disposal;
direct atlas cleanup leaves240prepared colour textures alive. CPU cache counts
remain95variants/31tones with5,944,064/1,940,224pixels under their limits. This is
not bounded GPU ownership: already evicted canvases still have native consumers.
Baseline: tmp/performance-enemy-cache-retirement/baseline.json; saved original
renderer and queued-grid probe under tmp/probes/enemy-cache-retirement/. Test
eviction and final disposal together; a release must preserve already queued
draws, including warmed sources that leave the LRU later in the same frame.

Immediate retireSceneTexture on variant/tone eviction plus final disposal was
tested and reverted. It clears every native texture (final0) but changes queued
grid pixels by253, versus unchanged-control max0. Evicted sources may already
have queued native material stamps, including GPU-warm colours. Existing texture
store retirement detaches pooled slot bindings immediately, invalidating those
stamps before flush. This is a real lifetime constraint, not a tolerance issue.
Rejected evidence: tmp/performance-enemy-cache-retirement/rejected-immediate.json.
The source/cache ownership implementation is restored exactly; no version bump.

Next retirement work must distinguish final closure from removal of a cache entry
whose consumers still belong to the pending frame. Preserve queued and repeated
flush/readback behavior, frame abandonment, context loss, disposal and multiple
painters. Track pending resources within the memory budget rather than using an
unbounded timeout/microtask queue or forcing extra render passes. Current texture
stores pin warming uploads but do not own pending live-frame retirement; begin
resets slot cursor and flush releases unused slots/collects120-frame resources.
This identifies where the lifecycle work belongs. Do not reapply immediate cache
retirement or accept zero disposal counts without the queued-pixel comparison.

Both isolated captures completed (one worker/dedicated strict-port server);
baseline PASS4.3s, immediate-retirement case FAIL1.7s. Ignored probes contain the saved
original module and reproducible80palette grid. Production assets, decoding,
simulation, seeds and frozen standard performance harness remain unchanged. Goal
remains active at full scope; no push/deploy/native build or player-save mutation.
Restored renderer/control rerun PASS3.7s, exact queued pixels; source diff empty.

## Checkpoint 30 — Enemy cache retirement preserves queued frames

Implemented at1.68.29. Enemy variant/tone eviction notifies the existing texture
retirement hook with explicit frame preservation. Native texture stores keep only
retired sources used in their current frame; prior-frame or standalone store
entries release immediately. The next begin retires them before new drawing,
including an abandoned unflushed frame. Repeated flushes retain the same bindings.
Context loss and painter disposal also release the pending set. Each native
consumer keeps its own boundary; clearing one painter does not invalidate peers.
Final cache/source disposal keeps the original immediate retirement mode. CPU
canvas clearing, pixel budgets, art/material sampling and gameplay/seeds unchanged.
No timers, extra renders, per-frame source-map scan or deferred pixel-close queue.

The rejected queued80palette probe now matches the saved original exactly,
including repeated flush/readback. Native sources242 while that frame remains
replayable;145retired sources36,271,104nominal RGBA bytes are accounted explicitly.
Next begin clears that set and leaves97sources (95live variants plus2material
maps). Final enemy disposal after the boundary returns source count/pending bytes
to zero.120subsequent palette frames peak97 and never accumulate pending sources.
This accounts a live frame's resources, not a configured whole-game GPU cap:
the synthetic80body frame temporarily exceeds the CPU cache's live8million-pixel
budget on the GPU. Pending figures, render targets/driver overhead and other
source owners still need whole-game peak/budget verification. No budget increase.

New native checks preserve exact peer/repeated pixels, independent boundaries,
actual context restoration and painter disposal. An abandoned unflushed source
releases before fresh drawing, whose pixels match a fresh frame exactly. A new
unit proves explicit preservation and unchanged default immediate notification.
Existing direct/shared PBR, main-image eviction, worker/fallback/hidden warming,
all-stage warm pixels and enemy family/cache tests pass. Final22related browsers
PASS22.3s/default2workers; all463unitsPASS; checked build/strict TypeScriptPASS.
Initial synthetic material omitted required fog fields; corrected fixture.
Restoration initially ran before loss dispatch finished; zero-delay dispatch
boundary matches existing Chromium fixture practice. First broad run21PASS/1FAIL
was the new evidence writer's missing import; corrected without assertion changes.

Stable evidence: tmp/performance-enemy-cache-retirement/frame-retirement.json,
enemy-cache-frame-retirement.json, queued-retirement-{next-frame,context-loss,
dispose}.json, units.log and build.log. Prior baseline/rejected evidence preserved.
Final bundled checks recorded once terminal. Assets/frozen standard performance
harness unchanged. Other figure caches, selected enemy/player/outfit/sword/startup
ownership, local transient headroom/native sampling, deterministic next slots,
120Hz/CPUbudget and full Phase5 metrics/traces/suites remain required. Goal active
at full scope; no push/deployment/native build or player-save mutation.
Final bundled app/ink checks3PASS23.3s/default2workers; diff/formatPASS;
version/package/lock/title/changelog synchronized. All check sessions terminal.

## Checkpoint 31 — Player/outfit/weapon retirement baseline

Before editing lifetimes, two unchanged native renderers match exactly across all
20outfits and20weapon recipes. Player/outfit preparation and painting hold61native
sources (35tone parts/8outfit tints); owner disposal leaves48sources alive. Sword
holds36sources/30cached parts; disposal leaves32sources. Baseline evidence:
tmp/performance-figure-retirement/baseline.json. Saved original player/outfit/sword
modules and reproducible whole-catalogue probe under tmp/probes/figure-retirement/.
Keep the same pixels and frame-preserving weapon eviction while retiring owned
raw images and prepared canvases on final disposal. Decoded source selection and
shared-budget integration remain required; this is a GPU-lifetime checkpoint.

Implemented at1.68.30: notify existing native consumers before closing player
tones/base images, outfit raw images/tints and weapon raw images/cached parts.
Weapon LRU eviction uses the existing explicit frame-preserving retirement mode;
final owner disposal remains immediate. No decode, art, budget, seed or gameplay
change. Whole-catalogue original/current comparison is exact across40cases.
Player native61 now closes to0 (original48); weapon36 closes to0 (original32).

A100tint-alias diagnostic exercises the weapon80part LRU without changing the
authored catalogue. Original/current and repeated frame pixels are exact. Queued
native106 includes22pending sources7,731,680nominal RGBA bytes; next begin leaves
84sources/pending0; final disposal0, versus original104remaining. This measures
source lifetime rather than establishing a configured whole-game GPU cap.
New permanent native tests cover all catalogue items, mirrored player artwork,
reduced effects, exact peer pixels, repeated disposal and a warmed queued weapon
evicted before replay. Pending weapon textures survive until the next begin.
Related16browser checks PASS20.8s/default2workers, then all3final new tests
PASS5.0s. All463unitsPASS; checked build/strict TypeScriptPASS.

Stable evidence: tmp/performance-figure-retirement/{baseline,after,weapon-lru}.json,
figure-retirement-{player,sword}.json, weapon-cache-retirement.json and units/build
logs. Saved original modules and isolated reproductions remain under
tmp/probes/figure-retirement/. Selected player/outfit/weapon/enemy decoded ownership,
startup/local transient headroom/native sampling, deterministic next slots,
120Hz/CPU budget and full Phase5 metrics/traces/suites remain required. Goal active
at full scope; no push/deployment/native build or real player-save mutation.
Final bundled app/ink checks3PASS23.0s/default2workers; diff/formatPASS;
package/lock/title/changelog synchronized. All check sessions terminal.

## Checkpoint 32 — Enemy shared decoding rejected for low-memory admission

Two independent enemy owners decode24HTML maps150,978,240nominal RGBA bytes;
disposing one leaves the peer's12maps75,489,120bytes, final closure0. This repeats
all four families rather than sharing the existing document loader. The saved
original/current14case native comparison has max1 in its first case, zero in the
other13, matching prior unchanged native control tolerance. Baseline2testsPASS3.4s
on a dedicated strict-port server/one worker; stable evidence under
tmp/performance-enemy-shared/baseline-*.json, saved module/reproducer under
tmp/probes/enemy-shared/. Trial routed all four PBR families through the existing
document HTML-image loader. Two owners share12maps75,489,120bytes (half the baseline),
peer stays ready after first disposal, final closure0. Native14case comparison
retains exactly the unchanged-control max1/13zero pattern;2testsPASS3.6s.
After-sharing evidence: tmp/performance-enemy-shared/after-*.json.

Admission gate rejected this change: at deviceMemory2, local stage0 retains
34inputs213,952,112bytes. Adding the full enemy catalogue needs289,441,232bytes,
21,005,776over the existing268,435,456budget, even without charms/companions or a
next scene. Shared loader stops at42pinned sources264,279,584bytes; only base and
clothing become ready, so enemy preparation returns false. Original direct owner
prepares successfully alongside the same local inputs. Diagnostic originalPASS/
trialFAIL3.9s; evidence tmp/performance-enemy-shared/rejected-low-memory-*.json.
No budget increase, separate pool or weakened readiness assertion.

Reverted the integration exactly; source diff empty. Full isolated control rerun
4PASS5.6s confirms native pixels, peer lifetime and low-memory readiness restored;
evidence restored-*.json. This trial demonstrates that all-family sharing alone
would break the required local fallback. Next work must combine selected figure
families with local compose-input lifetime/headroom, retaining exact pixels before
shared admission. The native sampler/release constraint from prior checkpoints
still applies. All measurements terminal; initial probe-directory creation and a
copied de-duplication saving assertion were corrected before baseline capture.
No implementation/version change, assets, gameplay/seeds, frozen harness, real
player saves, push/deployment or native build. Goal remains active at full scope;
all remaining Phase3/4/5 requirements remain required.

## Checkpoint 33 — Completed local scenes survive input eviction

Isolated diagnostic separates final composition lifetime from the previously
unstable native rebuild comparison. Test-only module interception releases raw
colour leases and material selections after compose, retaining stage0 fog and
stage4 bamboo. It does not reset foreground, alter source decoding, dispose the
composed material canvases or change production code. Each case prepares once,
captures its current scene, releases inputs, admits all12enemy maps, then applies
actual figure decode pressure and redraws the same frame. Nine stages at two
seed/size/DPR/quality/motion variants:18cases, one worker/dedicated strict port.

First capture failed exact raw-plane assertion: max1 in every case; live max0/1,
replay0. Added an unchanged immediate readback/draw control before release. That
control reproduces rawmax1 in all18 and livemax1 in the same three cases (stage3
high,4low,6high); this is initial readback/upload warmup, not input eviction.
After that control, post-eviction raw/live/replay maxima are all0 across18cases.
Assertions compare eviction against measured per-case control, without changing
production tolerances; actual final differences are exact. Captured decode-image
references prove all non-live inputs have naturalWidth0 after pressure. Fog keeps
four inputs (including emissive), bamboo three; all other stages retain none.
No feedback/invalid-operation/bound-source warnings. Final diagnosticPASS50.0s.

Stage0 pins fall34/213,952,112bytes to4/25,176,608bytes; bamboo21/132,140,400 to
3/18,870,192. Other stage pins21/24/27/18/24/28/25 fall to0. All12enemy maps admit
successfully: combined live pins100,665,728bytes with fog,94,359,312 with bamboo,
75,489,120 elsewhere. Actual LRU evictions39–55/case; maximum accounted peak
264,280,976bytes below268,435,456budget. Every case's final owner closure returns
loader bytes0. These are decoded-source accounting and same-scene pixel results,
not resident GPU/whole-game memory, consecutive stage cycling or next-slot proof.

Evidence: tmp/performance-local-live-release/{first-capture,completed-scene-release}.json
and probe/control-probe logs; isolated route/probe/config under
tmp/probes/local-live-release/. Production diff empty/version1.68.30 unchanged.
This establishes that completed output planes are independent of non-live inputs.
Next implement release and reacquisition on resize/DPR/quality/seed/stage changes,
preserving output ownership and live sources. Rebuild sampling remains unresolved;
incoming compose plus existing figure/live pins still needs admission scheduling.
Do not treat these fresh-owner cases as a whole-run budget or enable all-family
startup sharing concurrently with local compose. Full selected figure loading,
next slots,120Hz and Phase5 remain required. All measurement handles terminal;
goal active at full scope; assets/harness/gameplay/seeds/saves unchanged, no release.

## Checkpoint 34 — Integrated local composition input release

Implemented at1.68.31. Main-thread local compose/draw releases non-live raw colour
leases and material selections once independent output planes exist. Fog retains
four inputs; bamboo three; other stages none. Immutable colour cutouts retain
their existing bounded cache. Source bindings release without destroying completed
maps; full owner disposal still closes them. This preserves bamboo foreground
maps through seed-only/DPR changes and explicit preparation. Composition-key
changes reacquire full inputs; repeated same-key draws/compose do not. Generation
checks reject an obsolete pending scene before it can build using newer inputs.
Worker-document ownership/decoder, assets, masks/normal sampling, budgets and
gameplay/seeds unchanged. No native representation substitution or budget increase.

Integrated18case eviction probePASS49.2s: all9stages/two variants, actual figure
pressure/all12enemy map admission; warmed raw/live/replay exact. New permanent
tests exercise all9stages plus high-DPR fog/bamboo, complete source closure/live
pins, replay, native restoration, resize/DPR/quality/seed/repeated keys, explicit
prepare and obsolete coalescing. Final3native lifecycle testsPASS34.7s: final
raw/live/replay differences exact; actual restored fog/bamboo high-DPR frames
have max1, within the small native tolerance. No GL warnings.
The source-lifetime counts/bytes remain those measured at checkpoint33.

The two-owner rebuild comparison fails its absolute max1 assertion in both
unchanged and integrated runs: stage0high raw29/live15 and stage7low raw255/live35,
twice each over two cycles. Clearing or retaining independent colour cutouts did
not change that pattern. Matching maxima alone was insufficient, so capture full
SHA256 hashes for every raw plane and native frame. Across all36cases, both
original-owner and candidate-owner hash arrays match their corresponding saved
unchanged-control arrays exactly, including the four failing cross-owner cases.
Final source-binding/output-preservation version repeats this exact hash result.
Dedicated hash gate verifies row identity, all hashes and same-key build counts;
PASS36. This is unchanged output against each original actor's baseline, not a
relaxed cross-owner tolerance or explanation of the legacy sampling discrepancy.
The absolute comparator failures remain preserved and explicitly unresolved.

Related browser run11PASS/1FAIL36.1s/default2workers: failure was old peer fixture
requiring all34decoded inputs pinned after compose. Updated expected live-fog
contract to4pins/25,176,608bytes, preserving exact peer planes/widths/bytes and
rebuild checks; targetedPASS3.5s. Obsolete coalescingPASS3.4s. All463unitsPASS;
checked production build/strict TypeScriptPASS; bundled startup/gameplay/Armoury/
offline resize3PASS23.4s/default2workers. Evidence under
tmp/performance-local-release-integration/: original modules, rejected cutout-clear
patch, baseline/trial/final comparator/hash JSON, verify-hashes.mjs/hash-gate.json,
completed-scene-release.json, main-map-budget-cycle.json and verification logs.
Isolated probes/configs under tmp/probes/local-release-integration/.

This releases decoded leases after composition, not all figure/startup artwork,
composed canvas/GPU resources or driver allocations. Incoming scene plus existing
figure/live pins still needs admission scheduling. Selected figure ownership,
next seeds/slots/promotion,120Hz/CPU budget and full Phase5 metrics/traces/suites
remain required. Goal active at full scope; no push/deploy/native build/saves.
Final diff/formatPASS; synchronized package/lock/title/changelog. All measurement
and verification sessions terminal.

## Checkpoint 35 — Worker transfer input release rejected

Before changing worker input ownership, both256/512MiB three-cycle captures pass
54stage visits in41.3s on an isolated strict-port server/one worker. Completed
stage0 still pins34inputs213,952,112bytes; remaining stages pin21/24/27/21/18/24/
28/25inputs132,128,136/151,000,920/169,880,784/132,140,400/113,257,944/150,986,640/
176,174,304/157,292,768bytes. Low-memory sampled peak264,275,216bytes. Output-plane
SHA256 baseline also captured: two cycles/nine stages/two seed/size/DPR/quality
variants for each capacity,72cases;2PASS24.1s. Evidence under
tmp/performance-worker-input-release/baseline-*.json/logs; source copies and isolated
probes under tmp/performance-worker-input-release/ and tmp/probes/worker-input-release/.
Trial releases compose-only inputs after all output copies complete. Its72case
capture passes loader bounds/zero post-transfer pins, but the full SHA256 gate
fails: second-cycle stage0low colour plane differs at deviceMemory8. All remaining
cases/planes match, including every256MiB case and all material planes. Zero pins
alone is insufficient to accept the change.

Independent native controls compare two unchanged workers and the candidate over
36cases. Both original controls are exact; candidate stage0low on the second cycle
differs by24channel levels, exceeding the existing max1 tolerance. Reusing empty
raw wrappers does not fix it. Retaining warm raw bitmap references/metadata,
unpinning them and re-pinning required inputs before new map decoding also fails:
stage0low colour max24 and second-cycle stage7low colour max255. Both controls
remain exact. Wrapper replacement is not an established cause; material/source-cache
lifetime or native sampling history remains unresolved. No tolerance increase.

Reverted all four implementation/test files exactly to1.68.31. Restored original
comparisonPASS21.8s/all36cases exact against both unchanged controls. No version
or changelog change. Original worker pins/budgets remain; main-thread local release
from checkpoint34 remains integrated. Failed patches, original modules, hashes,
colour comparisons and logs retained under tmp/performance-worker-input-release/;
isolated probes under tmp/probes/worker-input-release/. All handles terminal.
Next selected figure ownership/incoming pin admission still requires full native
parity and coordinated headroom; worker release needs a separate proven fix.
Next slots,120Hz/CPU budgets and full Phase5 remain required. Goal active at full
scope; no push/deploy/native build/player saves.

## Checkpoint 36 — Ordered shared enemy admission diagnostic

Production remains1.68.31. Compare original direct maps and a test-only shared
main-image owner after local composition finishes, then release both enemy owners
before the next compose. Both three-cycle/all9stage fixturesPASS41.7s total
(original22.2s/shared17.6s). These are diagnostic durations, not a compose speedup.
At390x844 DPR2, all27visits per fixture admit all12enemy maps with two owners;
shared pins add75,489,120bytes once. Maximum accounted loader bytes264,280,976
below268,435,456; pinned peak100,665,728 including live fog. Every14appearance
native comparison, peer comparison and peer-after-disposal comparison is exact
on all27visits; original repeat exact, no GL warnings. Final loader0. Original
fixture peak264,275,216 excludes direct enemy maps outside the pool; it is not a
whole-app resident-memory baseline. Original duplicated enemy maps150,978,240bytes
versus shared75,489,120 are already measured at checkpoint32.

Holding shared enemy inputs during the next local stage1→0 compose still fails
admission: composefalse/backendunavailable while enemy stays ready,42decoded pins
264,264,624bytes; four required inputs cannot fit. Original direct-enemy control
composes successfully because those maps remain outside its loader. Both fixtures
confirm this predicted differencePASS4.9s. This is evidence against unconditional
shared-owner integration, not a changed production test or accepted failure.
Existing presentation suppresses enemies/boss/player/pet while sceneLoading;
runtime must release their compose-conflicting leases before incoming preparation
and reacquire required artwork before presentation. Startup prepares all figures
and scene together, while two preview constructors also eagerly prepare the same
runtime artwork; those calls need coordinated admission, including stale requests
and preview ownership, before integration. No new rendering backend or budget raise.

Evidence under tmp/performance-enemy-admission/: ordered original/shared samples,
incoming original/shared samples, original source, logs and isolated probes under
tmp/probes/enemy-admission/. Persistent-owner test-only port then releases PBR
leases/material bindings, reconstructs atlases and resets readiness/pending while
preserving bounded colour/tone caches. Same two enemy owners survive all27visits
with high-DPR/low-quality/high-DPR cycles and new visit seeds; each owner releases
before compose and reacquires afterward. Native14appearance/peer/peer-after-release
comparisons are exact every visit; one owner releasing keeps the peer's12maps
pinned/ready, both releasing leaves only local live inputs. No GL warnings;
PASS18.6s. This tests settled ownership boundaries, not concurrent pending release,
runtime startup/preview gates, complete context restore or first-present scheduling.
Production unchanged/source-test diff empty. Next integrate the proven lifetime
with runtime admission/stale-generation guards and startup/preview readiness,
then strict/unit/browser/build verification and version notes. Remaining player/
outfit/sword/startup ownership, next slots,120Hz/CPU budgets and Phase5 still
required. All handles terminal; goal active, no push/deploy/native build/saves.

## Checkpoint 37 — Runtime-wide enemy suspension rejected

Trial routes all enemy maps through the existing main pool and adds deferred
prepare/suspend/resume/cancel with generation guards. Runtime suspends before
compose, reacquires before readiness, and startup uses that same readiness path
instead of duplicate composition. Existing eager preview prepare waits behind
the gate. Bounded colour/tone caches survive source release. No asset/decoder,
budget, gameplay or seed changes. Baseline/checkpoint36 preceded this trial.

Strict TypeScriptPASS; all467unitsPASS, including4new ordering/stale/failure/
disposal checks. Saved-original native comparison across27high/low/high visits
PASS18.9s with existing max1 tolerance. New pending decode/waiter cancellation
and source identity checks, startup, cinematic/paused continuation/loading-state
browsers14PASS47.0s. Native lifetime/real runtime/GPU related first run15PASS/1FAIL
11.8s: queued0 assertion counted unrelated UI exports. Lease URL diagnostics show
button/panel/scroll/logo jobs; queued3/4 occurs while all enemy maps are ready.
All-stage lifetime/runtime2PASS21.1s after recording that shared queue accurately.
First source fixture also needed requested URLs behind blob URLs; no decode or
selection assertion removed. Both assertion failures/logs remain preserved.

Real low-memory fallback startup plus27stage visits per selection (empty/crow)
2PASS39.3s. UI/charm/companion leases stay in the same pool. Samples under
tmp/performance-enemy-admission/integrated-runtime-{empty,crow}.json record all
required scene/enemy readiness and peaks268,183,176/268,245,408below268,435,456;
crow selection holds3companion leases. Other figure/startup/
canvas/GPU resources remain outside this accounting. This is not whole-game memory
or latency completion. Preview ownership still required a separate guard check.

That guard fails: a visible Armoury effects preview successfully draws all8enemy
parts before incoming scene preparation, then0/8 while compose is held. Controls
pass the same runtime artwork instance to both previews; runtime-wide suspension
therefore suppresses another visible consumer. Independent preview output cannot
be sacrificed for compose headroom. Rejected integration despite other passes;
reverted all7tracked source/test files exactly to1.68.31 and moved4new trial tests
to ignored evidence. Restored preview guardPASS6.6s/all8parts during held load.
No version/changelog change. Trial patch/full sources/tests and logs under
tmp/performance-enemy-admission/rejected-runtime/ and rejected-runtime.patch;
isolated guard under tmp/probes/enemy-admission/preview-loading.spec.ts.

Next ownership must distinguish visible preview requirements from hidden runtime
figures and coordinate incoming admission without hiding either consumer or
raising/splitting budgets. Settled lease release/reacquisition remains proven at
checkpoint36; applying it indiscriminately is unsafe. All handles terminal; full
goal active, no push/deploy/native build/player saves. Selected figure/startup
ownership, next slots,120Hz/CPU budgets and Phase5 still required.

## Checkpoint 38 — Exact live upcoming scene identities, 1.68.32

Baseline on checkpoint37/1.68.31: existing stage progression, visit seeds and
compressed-loader units13PASS703.9ms. The visit ledger already exposes a pure
peek; frame sampling previously sent only a numeric next stage to compressed
prefetch. No next-slot loading or latency improvement is claimed here.

The runtime now reads that same live ledger and geometry/quality ports to publish
an immutable six-field upcoming composition identity: stage, stage seed, width,
height, DPR and low quality. Unchanged fields reuse the object, so background
metadata serializes/writes only on identity changes. Existing compressed queue
ordering and quiet/visible/frame-budget/native/saveData gates are retained.
Normal and daily progression predicts the next three-wave visit; rush predicts
the next duel. Trials retain fixed scenery; cinematic choices are unknown.
Inactive/mismatched runs and invalid geometry clear the prediction. No entry,
checkpoint, layout, gameplay random draw or decoder operation is added.

New3unit checks cover720normal/rush wave entries across two initial seeds and ten
laps, unchanged ledger/state, exact eventual entry/key,100same-reference reads,
all six identity invalidations, every trial, unknown cinematic choices and invalid
geometry/inactive runs. Existing actual wave/RNG replay remains included.
All466unitsPASS1876.3ms. Strict TypeScript passed during focused iteration.
New actual normal/daily browser samples follow waves1/4/7/10, compare future peek
to eventual entry, and preserve settled combat RNG/current seed/visit count.
Initial5prefetch browsers passed but both new live tests compared RNG before the
legitimate pending encounter continuation; fixed the test sampling point to scene
settlement, retaining the RNG assertion. Corrected2live testsPASS17.2s.
Failed evidence is preserved; production behavior was not changed for that failure.

Evidence under tmp/performance-next-scene-identity/: baseline/units/browser logs
and normal/daily visit JSON. Decoded soon requests and worker/local next slots,
slot admission/promotion/invalidation, enemy/startup ownership, whole-game memory,
120Hz/CPU budgets and final Phase5 remain required. No latency benchmark repeated
for a prediction-only change; the standard performance harness remains unchanged.

Related27browser checksPASS1.9m, including compressed ordering/policy, cinematic
restoration and saved-run isolation, daily presets, held loading and all trials.
Checked production build (strict TypeScript) and all4bundle testsPASS20.9s:
startup, Armoury/gameplay/landscape, edition gates and offline resize. Rendering, seed-entry, layout and decode paths retain their existing behavior. Full goal active;
no push/deploy/native build/player saves.
