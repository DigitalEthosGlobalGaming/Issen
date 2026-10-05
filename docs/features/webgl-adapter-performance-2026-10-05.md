# WebGL adapter optimization — 5 October 2026

Version 1.61.3 addresses the state snapshots, matrix work, remaining glyph
geometry, submission and allocation costs identified in the
[rounded-stroke follow-up](webgl-rounded-strokes-2026-10-05.md). These changes
reduce repeated work; they do not eliminate every allocation or geometry build.

## Implementation

- Save/restore records reuse their style objects and matrices by stack depth.
  Clipping restores an append-only active-clip depth; mask objects remain alive
  until submitted draws finish. Numeric matrix composition uses reusable storage.
- Draw slots remember their transforms. Unchanged transforms are skipped;
  axis-aligned sprites use position/scale directly; general transforms retain
  Pixi's decomposition. Submission no longer decomposes identity before
  supplying the real sprite/material transform.
- Solid full circles/ellipses can use one prepared circle texture shared with
  the rounded-stroke caps. Their path commands are deferred until a stroke,
  compound path, gradient or clip needs them. Fixed normal/ghost arrowheads
  share native geometry with a procedural fallback for unsupported state.
- Unclipped frames retain root draw order. Surplus draws detach when the scene
  shrinks. Clipping or film grouping leaves this fast path and retains the
  existing scoped lifecycle.
- Sprite slots remember source, revision and frame coordinates. Hits touch the
  source lifetime without allocating lookup input arrays or rebuilding frame
  keys. Expired/destroyed textures and changed revisions reacquire live frames.
  Parsed colors use a renderer-owned cache capped at 256 entries.

Geometry, textures and caches stay owned by the explicit painter target and are
disposed with it. Existing shader lighting and effects remain in use. No live
scene Canvas texture upload or extra application ticker was introduced.

## Measurement method

Before editing, the 1.61.2 painter and texture-store sources were preserved.
The benchmark compiles these as virtual modules alongside the optimized adapter
in one frozen production build. All other scene code, artwork, seed and lighting
are shared. The preserved painter does not register the new arrow cache, so the
shared glyph controller uses its original procedural arrow path in that variant.
The baseline snapshots are copied and independently fingerprinted in the output.
The legacy selector is absent from normal application builds.

The timed build freezes the 1.61.3 optimization snapshot and retains its source
fingerprint independently of subsequent development checkout changes.

Canvas, baseline Pixi and optimized Pixi rotate order across five fresh contexts
per scene. Settings: Free edition, High quality, seed 424242, 390×844, DPR 2,
three-second warmup, five-second measurement. Stress, combat, title, Demon
Mirror, Glitch and Inferno are included. Backend checks reject silent fallback.

Times measure the synchronous CPU rendering callback, including native command
submission and flush. They exclude deferred GPU execution. Background activity
and the live development preview share this desktop, so use corresponding-repeat
reductions and savings instead of ratios between unrelated aggregate medians.
These measurements do not establish physical phone, battery or GPU-residency gains.

## Results

All 90 timing samples passed. Each rendering column is the median of five
run medians, in milliseconds. Savings and percentages are the median of the
five corresponding baseline-minus-optimized differences and ratios; they are
not calculated by subtracting the displayed aggregate columns.

| Scene            | Canvas ms | Pixi 1.61.2 ms | Pixi 1.61.3 ms | Paired saving ms | Paired reduction |
| ---------------- | --------: | -------------: | -------------: | ---------------: | ---------------: |
| 100-enemy stress |      4.70 |          12.10 |           7.20 |             5.20 |            42.3% |
| Combat           |      1.00 |           3.40 |           3.20 |             0.30 |             9.1% |
| Title            |      3.80 |           6.80 |           5.80 |             1.40 |            20.6% |
| Demon Mirror     |      3.20 |           9.45 |           7.90 |             1.60 |            16.8% |
| Glitch           |      3.30 |           3.70 |           6.70 |             0.50 |            13.5% |
| Inferno          |      2.90 |          12.10 |          11.20 |             1.40 |            11.7% |

The stress baseline stayed between 11.9 and 12.6 ms; optimized runs ranged
from 6.8 to 13.7 ms. Four pairs improved by 4.7–5.4 ms; one regressed by
1.6 ms. Combat improved in all five pairs by 0.2–1.6 ms. Demon Mirror and
Inferno also improved in every pair, although their absolute times varied.

Background load visibly changed during the run: even Canvas combat medians
ranged from 0.9 to 4.0 ms. Title includes one regression. Glitch paired
differences ranged from a 4.6 ms regression to a 4.8 ms improvement, and its
aggregate optimized median was worse. Treat Glitch as inconclusive, not a
proven 13.5% improvement. Pairing reduces timing drift but cannot eliminate it.
No sample was discarded.

The optimized stress median rendering p95 was 11.1 ms; its median callback
interval p95 was 16.9 ms. This is consistent with reaching the 60 Hz callback
budget in most of these captures, not proof of GPU completion within that
budget. Canvas still uses less CPU rendering time in every aggregate scene.
These fixes narrow the adapter overhead; they do not establish WebGL as the
faster backend overall.

## Separate CPU diagnostic

The follow-up capture under ignored
`tmp/performance/2026-10-05T07-41-54.622Z-2be9f9ab/` passed. Its 5.13-second
CPU window contains 282 complete game animation callbacks. A further 282 Pixi
system ticker callbacks are excluded from the game-frame denominator. Mapped
self samples and callback counts are retained in `profiles/adapter-summary.json`.

| Selected sampled cost per game frame                              | Previous diagnostic | Optimized diagnostic |
| ----------------------------------------------------------------- | ------------------: | -------------------: |
| Painter save/restore, including previous style callback           |             ~2.1 ms |              ~1.5 ms |
| Matrix decomposition, skew/local-transform updates, setFromMatrix |             ~1.5 ms |              ~0.8 ms |
| Painter curveArc                                                  |            ~0.46 ms |            ~0.006 ms |
| Painter submit plus drawImage                                     |             ~1.1 ms |              ~1.1 ms |
| Garbage collector self samples                                    |             ~0.8 ms |              ~0.5 ms |

The previous diagnostic used 265 complete game callbacks. These are separate
sampled captures under changing load, not an additive accounting of benchmark
savings. Native GC trace events dropped from 122 / 178.7 ms to 44 / 101.6 ms
over the respective windows. Samples attributed to `(program)` remain
unassigned; they are not labeled GPU time.

The profile supports reduced transform/geometry and collection work. It also
shows the limit: pooled state still needs field copies, and submission/image
dispatch remains substantial. Palette evaluation, enemy drawing, batching and
remaining compound-path tessellation are still present. Allocation sampling
measures churn rather than retained memory or GPU storage; this capture makes
no claim that total resident memory fell.

## Verification and reproduction

The 248 unit tests, 20 native renderer/browser cases and four production checks
passed, including strict TypeScript checks. A further browser regression passed
for retained sprite slots after source expiry and recreation. Seven performance
tool tests passed. Native coverage includes figure/film parity, gradients, high
DPI, texture revisions, resize, separate previews and context-loss recovery.
The added pooled-state comparison covers nested clipping, transforms, shrinking
frames and ellipse path continuation against Canvas.

```sh
node tests/performance/benchmarks/compare-renderers.mjs --adapter-baseline=tmp/webgl-adapter-baseline --scenario=stress-100,combat,title,demon,film-glitch,film-inferno --port=5297
```

The final capture is under ignored
`tmp/performance/2026-10-05T07-27-05.284Z-renderers/`.
Its `baseline/` directory preserves the required source snapshots for a rerun;
pass that directory to `--adapter-baseline` after the original local copy is
removed. Raw samples, source/baseline fingerprints, browser/graphics metadata,
settings and the frozen build are retained together.

An earlier run under `tmp/performance/2026-10-05T07-22-34.736Z-renderers/` was
stopped to add destroyed-texture validation. Its partial timings are excluded.
The earlier short benchmark smoke run also does not contribute headline timings.
