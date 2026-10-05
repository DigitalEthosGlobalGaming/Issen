# Leaf rendering performance comparison — 2026-10-05

Measured application revision `a27bf03bb66412a93d5c4aab9b0393c3035d045d` (1.60.0). No application code or live deployment was changed by this investigation.

## Method

One frozen production instrumented web build with offline fonts, Free edition, High quality, seed 424242, 390×844 CSS viewport and DPR 2. Headless Edge 154.0.4258.53. Five fresh contexts per case, three seconds warmup and five seconds measurement; mode order rotates between repetitions. Title and normal combat both use Field. Forty timing samples and four separate combat allocation/CPU/trace diagnostics completed. The existing performance suite supplied scenario controls, guards and collection. Benchmark-only transforms select rendering mode, optionally remove the sprite density multiplier, and time both leaf depth passes.

This measures CPU-side Canvas submission and whole-render callbacks; it does not isolate asynchronous GPU execution. No physical Android or battery measurements. Equal-count modes have 68 ordinary leaves; the shipped Field sprite mixture has 27. Existing artwork and all four drift atlases load in every mode.

## Title scene

Each value is the median across five runs. Leaf pass is the mean combined front/back pass time within each run. Render median/p95 describe the entire render callback. Task time is total browser task execution over five seconds; overlapping ranges limit small comparative claims.

| Approach | Leaf pass ms/frame | Render median ms | Render p95 ms | Browser task ms (range) | Frame interval ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Original curves | 0.125 | 0.70 | 0.90 | 378.3 (350.8–435.0) | 16.70 |
| Reusable Path2D | 0.120 | 0.70 | 0.90 | 373.2 (347.7–417.2) | 16.70 |
| Sprites, equal count | 0.161 | 0.90 | 1.20 | 407.1 (385.0–427.4) | 16.70 |
| Sprites, shipped count | 0.106 | 0.90 | 1.60 | 416.2 (354.0–490.9) | 16.70 |

## Normal combat

Each value is the median across five runs. Leaf pass is the mean combined front/back pass time within each run. Render median/p95 describe the entire render callback. Task time is total browser task execution over five seconds; overlapping ranges limit small comparative claims.

| Approach | Leaf pass ms/frame | Render median ms | Render p95 ms | Browser task ms (range) | Frame interval ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Original curves | 0.108 | 0.70 | 1.00 | 416.8 (388.2–441.2) | 16.70 |
| Reusable Path2D | 0.102 | 0.70 | 1.10 | 445.8 (402.3–487.3) | 16.70 |
| Sprites, equal count | 0.157 | 1.00 | 1.20 | 446.3 (431.4–537.6) | 16.70 |
| Sprites, shipped count | 0.091 | 0.90 | 1.30 | 444.2 (415.5–558.6) | 16.70 |

## Allocation and asset memory

These are single, separately instrumented five-second combat captures per mode. They are sampled whole-application allocations, not retained memory or isolated leaf allocations, and should be treated as directional evidence.

| Approach | Sampled allocation MiB | GC events | GC duration ms |
| --- | ---: | ---: | ---: |
| Original curves | 29.68 | 20 | 11.76 |
| Reusable Path2D | 28.84 | 19 | 18.01 |
| Sprites, equal count | 30.27 | 22 | 16.08 |
| Sprites, shipped count | 27.08 | 19 | 16.51 |

The four PNGs total 3,385,769 bytes (3.23 MiB compressed). Their combined nominal RGBA pixel size is about 24.01 MiB; actual decoded/GPU residency may differ. Switching to Original does not unload them, so the current toggle does not recover that asset memory or transfer cost.

## Interpretation

All approaches maintained approximately 60 fps on this desktop. The reusable path shaved roughly 4–6% from the small leaf pass, around 0.005–0.007 ms/frame, without an observable median whole-render improvement. At equal counts, sprites increased the leaf pass by about 29% on title and 45% in combat. Reducing sprite counts brought the leaf pass below the original, but the whole-render median remained around 0.2 ms higher (0.9 versus 0.7 ms). Browser task medians/ranges do not establish an overall CPU win for the shipped sprite mode.

The sprite approach earns its place through visual variety. These results do not support calling it a performance optimization. The original and reusable paths remain useful comparison options. Allocation samples suggest a modest reduction with the smaller sprite population, but one diagnostic per mode is insufficient to claim a robust GC improvement. Blossom, fire/weather sprites, Demon, other viewport sizes and physical devices were not performance-tested in this run.

## Reproduce and inspect

Run `node tests/performance/benchmarks/compare-drift.mjs` without other tests/builds running. It owns port 5298 and leaves production code untouched.

Raw evidence: [`results.json`](../../tmp/performance/2026-10-05T02-11-51.714Z-drift/results.json), with all individual timings, build fingerprint, graphics metadata and diagnostic paths. The saved build, per-mode CPU/heap profiles, traces and screenshots remain under the same ignored folder.
