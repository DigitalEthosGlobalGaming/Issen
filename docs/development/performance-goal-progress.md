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
