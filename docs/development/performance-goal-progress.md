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
