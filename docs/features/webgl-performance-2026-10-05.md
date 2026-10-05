# Canvas and WebGL performance comparison — 5 October 2026

The version 1.61.1 Pixi WebGL renderer increases CPU rendering time in every measured
scene. Ordinary scenes retain approximately 60 rendering callbacks per second,
but have less CPU headroom. The 100-enemy stress scene falls to approximately 20
callbacks per second. These results do not support a performance improvement.
The [rounded-stroke follow-up](webgl-rounded-strokes-2026-10-05.md) records the
subsequent optimization and its repeat measurements.

## Method

The opt-in renderer comparison reuses the existing performance harness and one
frozen, minified production build. Each renderer/scenario has five fresh browser
contexts, alternating Canvas/Pixi order between repetitions. Settings are Free
edition, High quality, seed 424242, 390×844 viewport, DPR 2, three seconds of
warmup and five seconds of measurement. All 60 samples completed successfully;
the runner verifies the actual backend so fallback cannot masquerade as WebGL.

The browser was headless Edge 154.0.4258.53 with hardware-backed ANGLE WebGL.
The desktop environment was shared with the running development preview;
background activity was not completely isolated. Both variants use the same
application build, including the current leaf/debris atlas. Pixi also includes
its shipped selective material lighting; Canvas retains the painted appearance.
This compares shipped behavior rather than equal unlit images.

Rendering time measures synchronous CPU work in the rendering callback,
including native command submission. Deferred GPU execution is excluded.
Callback intervals are not proof of displayed frames. No physical phone,
WebView, GPU utilization, battery or power measurements were made.

## Results

Values below are medians across five per-run medians or per-run p95 values.
Times are milliseconds. Percentages describe this capture, not universal gains
or regressions across devices.

| Scene | Canvas median | Pixi median | Increase | Canvas p95 | Pixi p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Title | 0.9 | 2.5 | 178% | 1.1 | 2.9 |
| Combat | 0.9 | 3.6 | 300% | 1.2 | 4.3 |
| Demon Mirror | 1.1 | 4.8 | 336% | 1.5 | 6.0 |
| Glitch | 1.1 | 3.7 | 236% | 1.8 | 4.5 |
| Inferno | 1.0 | 5.7 | 470% | 1.2 | 6.6 |
| 100 enemies | 4.7 | 49.6 | 955% | 5.5 | 57.1 |

Ordinary per-run median ranges were narrow: Canvas 0.8–0.9 / Pixi 2.5–2.7
for title; 0.9 / 3.6–3.8 for combat; 1.1 / 4.8–4.9 for Demon Mirror;
1.1 / 3.6–3.8 for Glitch; and 0.9–1.0 / 5.6–5.8 for Inferno.

Stress results are noisier: Canvas medians span 4.5–11.6 ms and Pixi medians
49.15–100.8 ms. The direction remains clear even comparing the fastest Pixi
sample with the slowest Canvas sample. Avoid treating the precise percentage
as a stable estimate. Median callback intervals are 16.7 ms for both renderers
in ordinary scenes and for Canvas stress, versus 50.0 ms for Pixi stress.
Pixi stress consumes approximately 5,010 ms of browser task time in a five-second
measurement window, indicating sustained main-thread pressure.

## Comparison with previous repository results

The [leaf renderer investigation](leaf-performance-2026-10-05.md) recorded
0.9 ms title and normal-combat medians for the shipped Canvas sprite mode in
1.60.0. The fresh Canvas results reproduce those medians. Pixi increases them
to 2.5 and 3.6 ms respectively.

The [production follow-up](performance-follow-up-2026-10-04.md) recorded
approximately 0.6 ms title/combat, 0.9 ms Demon Mirror, 1.0 ms Glitch,
0.7 ms Inferno and 3.4 ms stress in 1.58.2. Application artwork and rendering
behavior have changed since then, so those are historical context rather than
a matched renderer comparison. Earlier development-server measurements in the
[initial profile](performance-profile-2026-10-04.md) also used different timing
windows and should not be combined with this production comparison.

## Separate diagnostic and likely next work

A separate five-second Pixi stress CPU/heap/trace capture followed the timing
run. Its timings include profiler overhead and are not used in the table.
Source-map attribution identifies significant self-sample time in Pixi's
rounded stroke construction (`buildLine.round`, approximately 614 ms), line
geometry construction (211 ms), UV generation (244 ms), batching (232 ms),
and garbage collection (770 ms). The trace records 256 GC events totaling
approximately 713 ms; CPU sampling and trace accounting differ.

This supports investigating repeated procedural geometry construction and
allocation before assuming the GPU or leaf atlas is the bottleneck. The
current painter retains draw slots but clears/rebuilds Graphics paths each
frame. A useful follow-up would cache immutable geometry and styles, replace
repeated rounded strokes with prepared sprites or reusable meshes where art
allows, and update transforms instead of rebuilding paths. Then repeat this
same paired benchmark to establish whether each change helps. The profile does
not isolate material lighting cost, and no optimization gain is claimed here.

Heap sampling reports allocation churn, not retained heap or GPU residency;
its byte estimate is not presented as application memory consumption.

## Reproduction and artifacts

```sh
node tests/performance/benchmarks/compare-renderers.mjs --port=5297
node tests/performance/run.mjs --scenario=stress-100 --mode=diagnostic --port=5297
```

Ignored local artifacts retain raw samples, source/build fingerprints, browser
and graphics metadata, frozen builds, source maps and profiles:

- Paired timing: `tmp/performance/2026-10-05T05-29-58.642Z-renderers/`.
- Separate diagnostic: `tmp/performance/2026-10-05T05-39-42.903Z-5c142e04/`.
- Incomplete first attempt: `tmp/performance/2026-10-05T05-24-17.190Z-renderers/`.

The first attempt exposed a real Pixi CSS-color parsing failure when fading
effects emitted scientific-notation alpha. Version 1.61.1 normalizes those
numeric colors before passing them to Pixi. The incomplete timings are excluded;
the successful comparison rebuilt after the fix. The focused color regression
test, four production tests including strict TypeScript checks, and seven
performance-tool tests passed. This fix does not establish a speedup.
