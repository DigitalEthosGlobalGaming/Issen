# Mobile performance continuation

The [active objective](../../goal-objective.md) supersedes the earlier exact-pixel
performance goal. Intentional rendering simplifications are allowed when the
game's feel and readability remain good. Worker scenery is required on supported
platforms; automatic local fallback will be replaced with error/retry recovery.
Cancelled general packing and the separate lit-only integration remain cancelled.
The requested merged drift atlas is a narrowly scoped exception, not a restart
of general asset packing.

## Drift baseline tooling and trial atlas — 9 October 2026

The existing opt-in performance runner now supports calm/gust scenes, an
instrumented-build-only off/current switch, optional CPU throttling and raw p99
and counts over 8.3/16.7ms. The new mode explicitly fails until implemented.
Off suppresses drawing, not simulation or preparation. Normal bundles are
unchanged. CPU throttling approximates CPU execution only, not a mobile GPU.

Calm removes gusts after updates because both weather and combat can generate
them. Gust uses repeated normal cosmetic bursts. Initial contaminated calm
captures are retained but excluded from the baseline. Guards reject contaminated
calm scenes or missing drift/gust populations. Controlled gust populations still
vary with lifetime and sample boundaries; recorded counts must accompany timing
comparisons. Do not infer precise isolated GPU cost from these CPU timings.

`scripts/assets/drift-atlas.py` produces reproducible trial colour/emissive WebP
planes under ignored tmp, retaining sources. A128px cell contains120px artwork
and a4px transparent gutter. Associated-alpha Lanczos resizing prevents hidden
transparent RGB leaking into visible edges. All32 frames fit1024×512.

Complete old drift base/normal/surface/emissive set:4,378,340 encoded bytes and
81,823,976 nominal decoded bytes. Trial two-plane output:155,694 encoded bytes
and4,194,304 decoded bytes (94.87% reduction); mipmapped RGBA GPU estimate
5,592,405 bytes. This is a full-set comparison, not current-stage residency or
measured physical GPU memory. Runtime remains on the original assets and shaders.

Generator checks cover alpha-safe resizing, odd source dimensions, frame layout
and gutters. Sheet review passes initial legibility; largest-gust DPR3 and
daylight/dark/fire/gust scene reviews remain required before installation.

Next: integrate the reviewed atlas, drift-only mipmaps and one-pass lit shader,
then compare against saved controls. Complete drift checkpoint before moving to
worker simplification and transition/resource integration. Reserve full suites
for substantial checkpoints and final verification.

### Corrected baseline

All four runs pass, with three repetitions per calm/gust scenario, 3s warmup and
5s measured windows at390×844/DPR2, High quality, seed424242. Native Edge on the
same host; CPU rate4 is CDP throttling. Table timing is the median of each run's
three sample statistics, in milliseconds; threshold counts sum raw intervals.

| CPU rate | Mode | Scene | Render median | Frame p95 | Frame p99 | >8.3ms | >16.7ms |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | off | calm | 6.6 | 18.2 | 21.7 | 894 | 388 |
| 1 | current | calm | 5.3 | 19.1 | 25.2 | 888 | 349 |
| 1 | off | gust | 5.1 | 18.1 | 30.0 | 889 | 342 |
| 1 | current | gust | 5.3 | 19.4 | 27.7 | 887 | 350 |
| 4 | off | calm | 4.9 | 25.4 | 39.9 | 847 | 409 |
| 4 | current | calm | 9.3 | 17.4 | 30.2 | 872 | 386 |
| 4 | off | gust | 4.4 | 17.9 | 27.2 | 890 | 407 |
| 4 | current | gust | 9.1 | 17.7 | 29.2 | 869 | 373 |

Desktop calm off is slower than current in render CPU time; this matrix does not
establish an isolated causal cost. CPU-throttled current is slower in CPU render
time, but frame-p95 does not track that difference. Do not turn the subtraction
into a claimed speedup or120Hz result. Retain raw samples and workload counts for
the replacement comparison; do not spend additional iteration rerunning baseline
noise before implementing the requested cheaper path.

Evidence under `tmp/performance/`:

- `2026-10-09T07-47-49.482Z-ef7d859c`: off/rate1.
- `2026-10-09T07-49-07.089Z-225a0523`: current/rate1.
- `2026-10-09T07-50-25.720Z-5c950fb1`: off/rate4.
- `2026-10-09T07-52-02.672Z-acf5641d`: current/rate4.

All measurement handles are terminal. Runtime rendering remains unchanged;
package/lock/title/changelog advance to1.69.14 after the1.69.13 baseline captures.
