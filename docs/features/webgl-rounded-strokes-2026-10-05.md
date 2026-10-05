# Rounded-stroke rendering follow-up — 5 October 2026

Version 1.61.2 retains the fixed outer brush rings on enemy direction markers
and uses textured meshes for simple solid round-ended segments. The outer ring
was the large repeated workload: about 41 rounded arc strokes per enemy, or
4,100 per frame in the 100-enemy fixture. A temporary stroke-count inspection
identified it after the [initial CPU profile](webgl-performance-2026-10-05.md).

## Changes and visual validation

The optional native sink in `scene-brush-ring.ts` lets `glyphs.ts` keep ownership
of the brush recipe. Each Pixi painter retains normalized `GraphicsContext`
geometry for its two outer-ring paint variants. Drawing changes the transform,
opacity and existing rendering state without rebuilding the paths. Contexts
belong to that painter and are disposed with it. Canvas, changing timing rings,
shadows and nonuniform transforms keep the procedural path.

Flattening the outer ring into a sprite was rejected after a visual comparison:
applying figure opacity once to a flattened image differs from applying it to
each overlapping translucent brush mark. Retained geometry preserves those
separate blends. The new regression compares both Canvas and the previous native
arc recipe at three sizes and two marker states. Small-marker Canvas/native
antialiasing differences remain; a stricter comparison with the previous native
rendering bounds the actual visual change.

Straight solid strokes with rounded ends, no active shadow, and a single
segment use a retained 12-vertex mesh. One prepared circle texture supplies two
semicircular caps and an opaque middle. The pieces meet without overlap so
translucent strokes do not acquire dark seams. Rotation, endpoints, width and
tint update in place. Curves, gradients and multi-subpath strokes retain native
Graphics. The straight-segment-only trial did not establish a stress speedup;
the fixed brush rings motivated the larger change.

## Full Canvas/WebGL repeat

One frozen production build, five fresh contexts per renderer/scenario,
alternating order, Free edition, High quality, seed 424242, 390×844, DPR 2,
three-second warmup and five-second measurement. All 60 samples passed.
These are synchronous CPU rendering callback/command-submission measurements;
deferred GPU execution is excluded. This is desktop Edge, not a physical phone
or battery measurement. Pixi includes the shipped selective material lighting.

| Scene | Canvas median ms | Pixi median ms | Canvas p95 ms | Pixi p95 ms |
| --- | ---: | ---: | ---: | ---: |
| Title | 1.80 | 5.40 | 2.30 | 9.10 |
| Combat | 1.80 | 6.30 | 2.90 | 8.00 |
| Demon Mirror | 1.20 | 4.80 | 2.00 | 6.90 |
| Glitch | 1.35 | 7.10 | 4.00 | 8.80 |
| Inferno | 1.70 | 11.20 | 2.20 | 13.60 |
| 100 enemies | 11.40 | 24.90 | 13.30 | 32.00 |

The desktop was shared with other active applications and the live development
preview. Ordinary per-run median ranges were wide: title Canvas 0.9–3.9 / Pixi
2.7–6.3; combat 1.0–2.3 / 3.5–7.9; Demon Mirror 1.1–1.2 / 4.5–9.7;
Glitch 1.2–3.0 / 3.6–7.65; Inferno 1.0–3.5 / 5.6–12.5 ms.
Small differences from earlier captures are not reliable optimization evidence.

Stress ranges were Canvas 10.1–11.8 ms and Pixi 23.9–28.5 ms. Pixi's median
callback interval was 26.2 ms, approximately 38 callbacks per second, versus
16.7 ms for Canvas and for both renderers in ordinary scenes. This does not
establish displayed FPS. WebGL remains slower than Canvas in this capture.

The original 1.61.1 stress result was 49.6 ms, but its Canvas control was also
faster (4.7 ms). A same-build legacy control is needed to attribute an improvement
to these fixes rather than background timing changes.

## Same-build stroke control

The opt-in `--compare-strokes` mode adds `pixi-legacy`. A fingerprinted,
benchmark-only transform disables just the fixed-ring cache and the straight
round-stroke mesh. Canvas, legacy Pixi and optimized Pixi rotate order across
five repetitions. All other artwork, lighting, runtime and color handling are
identical in that build. The transform is absent from normal application builds.

All 30 samples passed. The median paired reduction is **14.8% in combat** and
**74.2% in stress**. Reduction is calculated per corresponding repetition, then
summarized, rather than dividing the two aggregate medians. That matters when
background load changes during a run.

| Scene | Canvas median ms | Legacy Pixi median ms | Optimized Pixi median ms | Median paired reduction |
| --- | ---: | ---: | ---: | ---: |
| Combat | 3.70 | 8.80 | 3.50 | 14.8% |
| 100 enemies | 11.40 | 100.10 | 25.55 | 74.2% |

Paired combat reductions were 14.8%, 14.6%, 61.8%, 20.5% and 13.2%.
The 61.8% outlier accompanies a load change; the median describes a modest
improvement rather than the misleading 60% ratio between aggregate medians.
Legacy per-run medians span 3.8–8.9 ms, optimized 3.3–7.6 ms.

Paired stress reductions were 73.8%, 77.2%, 74.2%, 74.5% and 74.0%.
Legacy medians span 50.0–104.9 ms; optimized 13.1–27.25 ms. Their ranges do
not overlap, and the reduction is consistent despite the changing load. Median
per-run p95 rendering time falls from 117.2 to 32.9 ms in this capture.

This fixes a substantial CPU bottleneck, but does not establish that WebGL is
faster than Canvas or consistently reaches 60 callbacks per second. It also
does not isolate how much of the smaller combat gain comes from each fast path.

## Reproduction and artifacts

```sh
node tests/performance/benchmarks/compare-renderers.mjs --port=5297
node tests/performance/benchmarks/compare-renderers.mjs --compare-strokes --scenario=combat,stress-100 --port=5297
```

The full repeat is saved under ignored
`tmp/performance/2026-10-05T06-28-28.820Z-renderers/` with raw samples, settings,
backend checks, browser/graphics metadata, source fingerprints and the frozen
build. The same-build control is under
`tmp/performance/2026-10-05T06-38-51.730Z-renderers/`.
Its `paired-summary.json` and report appendix retain the corresponding-repeat
reduction calculations; raw timing samples are unchanged.
Its timing build initially warned about the benchmark transform's source map;
no CPU profiles from that build are used. The runner now generates a source map
for future captures. A preceding failed control build is excluded from timings.

Verification: 248 unit tests, 19 native renderer/browser tests, four production
tests including strict TypeScript checks, and a final three-case focused rerun
after adding the nonuniform-transform guard passed. No app-wide performance
claim, physical-device speedup or retained-memory improvement follows from these
desktop timing captures.

Seven performance-tool tests and formatting/link/version checks also passed.
A short three-variant smoke run verified the corrected source maps and paired
report generation; its one-second samples are excluded from the performance
conclusions above.

## Remaining CPU costs after the fix

A subsequent stress diagnostic is saved under
`tmp/performance/2026-10-05T06-55-31.246Z-238b8d12/`. Its source-mapped summary
is in `profiles/source-summary.json`. Aggregating self samples across call sites
identifies drawing-state snapshots (`save`, approximately 311 ms plus 142 ms in
its style-entry callback), matrix decomposition (222 ms), garbage collection
(211 ms), draw-slot submission (156 ms), image drawing (130 ms), and arc
construction (122 ms) as remaining costs. Rounded-cap construction (102 ms),
polygon triangulation (106 ms), color conversion and scene traversal also remain.
These are cumulative samples in a separate diagnostic window, not per-frame
render times or the timing benchmark above. Unattributed `(program)` samples
are not assigned to a particular application or GPU operation.

The painter currently allocates a new style object, entry arrays, matrix and clip
array on each save. Submission resets every item through matrix decomposition;
sprite drawing then supplies another composed matrix. Reusing state-stack storage
and matrices, and avoiding redundant transform resets, are strong next candidates.
Stable remaining circles/arrows could also reuse geometry. Shader/GPU cost has
not been isolated by this CPU diagnostic, so it does not establish lighting as
the remaining bottleneck.

The trace contains 265 complete game-frame callbacks within the CPU profile
window (approximately 5.16 seconds), plus 265 separate Pixi system-ticker
callbacks. Source maps identify the game callbacks as `platform/frame-loop.ts`;
the system ticker is excluded from the denominator. Dividing the attributed
self samples above by those 265 game frames gives approximate costs per frame:
state save/restore including style entries 2.1 ms; transform decomposition/skew/
local-transform work 1.5 ms; the listed arc, adaptive-curve, triangulation,
rounded-cap and UV builders 1.7 ms; slot submission and image drawing 1.1 ms;
garbage collection 0.8 ms. These selected costs total about 7.2 ms per frame.
They are sampling estimates from the profiled stress workload, not exhaustive
category timers, uninstrumented render times or guaranteed recoverable savings.
