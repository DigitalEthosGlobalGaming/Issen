# Artwork performance measurements

Run a Vite development server on port5183, then run
`node scripts/benchmark-production-rendering.mjs http://127.0.0.1:5183`.
The script opens a separate headless Edge page at `/privacy/index.html`, checks
that the game entry point is absent, and imports only the renderers. It does not
mount the game, change player saves, build production output, or emulate tablet
hardware. Desktop1440×900 and tablet1024×768 are drawing-buffer sizes at DPR1.

The production workload uses all five artwork hooks, actual `drawFigure`, varied
front-view enemy hats/tones/fog,10% rear players across five outfits, moving sword
poses, four valid sword aura modes, shoulder crows, suzu charms, grounded pets,
and actual environment layers/foregrounds.100 and500 figures are stress loads,
not ordinary encounter counts. Each case renders28 frames, discards the first8
for timing, and records command submission time and requestAnimationFrame
intervals. Allocation/read counters include all28 frames. Scene-switch cases
cycle all nine scenes; intervals include asset preparation waits while command
timings cover drawing. Static cases use the production environment layer cache.

For a controlled old-enemy-cache comparison, add
`--baseline=b20b451eedb22c4604397df24d4eb867482005f3`. The tool reads that revision's
enemy renderer, strips TypeScript through Node, and supplies it through a browser
route. All other modules and conditions remain the current version. The revision
must contain the original96-entry cache; the script rejects other baselines.
Run baseline and optimized cases sequentially to avoid competing workloads.

`scripts/benchmark-artwork.mjs` is a separate synthetic upper-bound experiment:
60 faded sprites or1000 modular part stamps rebuilt versus a frozen full-canvas
composition. Its static cache is not suitable for moving player poses. It also
measures actual player outfit first-draw versus warm-draw tint costs. Do not use
the synthetic rebuild workload to claim the production scene redraws every sprite
each frame: production already caches scene layers.

## Enemy cache correction

Measured on 2026-10-01 in headless Edge 154, Windows, DPR 1. The table reports
median drawing-command milliseconds from sequential baseline/optimized runs.
These clean runs use the standalone privacy document and supersede exploratory
runs that used the SPA fallback URL.

| Buffer | Figures | Scene | Original cache | Separate caches |
|---|---:|---|---:|---:|
| 1440×900 | 100 | Cached field | 52.8 | 5.0 |
| 1440×900 | 100 | Switch each frame | 103.7 | 14.3 |
| 1440×900 | 500 | Cached field | 383.3 | 22.0 |
| 1440×900 | 500 | Switch each frame | 428.1 | 30.7 |
| 1024×768 | 100 | Cached field | 67.9 | 5.2 |
| 1024×768 | 100 | Switch each frame | 100.9 | 20.8 |
| 1024×768 | 500 | Cached field | 378.6 | 21.3 |
| 1024×768 | 500 | Switch each frame | 397.4 | 47.8 |

For 500 figures in a cached scene, pixel reads fell from 6,860 per 28 frames to
zero after warmup from the preceding cases. Final enemy caches retained 6,452,224
pixels (25.8 MB nominal RGBA), below the 8-million-pixel ceiling. The first
optimized 100-figure case still performed 52 cold reads across player and enemy
art, so this change does not eliminate initial outfit tint preparation.

Median frame intervals for optimized cached scenes were 16.7 ms at 100 figures
and 33.3–33.4 ms at 500. Switching scenes every frame remained more expensive
(up to 66.6 ms median at 500/tablet). This is not a claim that 500 animated actors
run at 60 fps; the measured fix removes repeated tint work without freezing poses
or caching animated figures as static images.

The previous96-entry LRU keyed recolored parts by outfit *and* fog. A working set
of hats, cloth palettes, and fog buckets overflowed it, repeatedly performing
`getImageData`, pixel recoloring, canvas allocation, and eviction during drawing.

`ink-enemy.ts` now keeps costly unfogged recolors in a separate LRU (at most48
entries and2million pixels). Final fog variants use a separate LRU (at most192
entries and6million pixels). Both limits apply together. Eviction zeros the canvas
backing dimensions; disposal clears both stores and their pixel counters.
The combined maximum is8million RGBA pixels (32MB of nominal pixel storage,
excluding browser/GPU overhead and decoded source images). Fog quantization,
palette math, native sprite sizes, and compositing behavior are unchanged.

Focused browser check: `npx playwright test tests/browser/enemy-art-cache.spec.ts`.
It verifies three body parts require only three recolors across repeated fog
changes, drives arbitrary palettes beyond both cache limits, and confirms disposal
clears retained pixel counts. Timing benchmarks are diagnostic, not hardware-
independent pass/fail performance assertions. Device release profiling remains
necessary, particularly at higher DPR and under mobile memory pressure.
