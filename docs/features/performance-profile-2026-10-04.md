# Issen performance review — 4 October 2026

## Outcome

This review produced three targeted optimizations for **1.50.3**: skip the scene
hidden behind fullscreen equipment inspection, share prepared artwork with
previews, and reduce repeated self-copying in Glitch film. The artwork resolution,
sprite detail, effect density, combat rules, saves and existing frame caps are
unchanged.

The strongest measured CPU improvement is Glitch film: median main-render command
time fell from **2.0 to 1.2 ms (40%)** in the individual optimization experiment.
Fullscreen inspection removed all main-scene image stamps while preserving the
animated preview. Sharing artwork eliminated 32 duplicate image objects and
approximately **0.97 MB of duplicate prepared canvas storage** after opening
Armoury. These are desktop-browser measurements, not claims about phone battery
life, heat or resident GPU memory.

The work is isolated on `codex/issen-performance`, based on `992c39d`.
No merge, push, deployment or Android build is part of this work.

## What the baseline measured

The existing artwork benchmarks were read first. They exercise production
renderers outside the application, which makes them useful for sprite-cache
experiments but insufficient for measuring navigation, startup and the live loop.
The complementary [runtime harness](../../scripts/profile-runtime.mjs) profiles
the mounted application. Its instrumentation and stress controls are inserted
into browser responses; no profiling entry point or stress mode ships in `src/`.

Conditions: headless Microsoft Edge **154.0.4258.53**, Windows desktop, a
**390 × 844 CSS-pixel viewport at DPR 2**, Vite development mode, High cosmetic
quality, no CPU throttling, blocked remote font requests, and deterministic
synthetic saves/random seeds. Each scenario has three sequential fresh-context
samples, each with **1.5 seconds of warmup and 2.5 seconds of measurement**.
Exact hardware information is retained in the ignored local results. The machine
was shared with other desktop activity; an isolated worktree protects source and
server identity, but cannot isolate CPU/GPU scheduling.

CPU sampling, allocation sampling and tracing run separately from headline timing
samples. Canvas-call counters run in a further one-second window, avoiding their
argument-array allocations in the allocation profile. The original exploratory
diagnostics are retained; use `baseline-clean` for baseline CPU/GC/allocation
comparisons. CPU profiles include complete call trees, not only flat function
rankings.

The table reports the median of the three sample medians/p95s. Render time measures
main-scene JavaScript and Canvas command submission; deferred raster/compositor
work is not fully represented. Heap is sample-end JavaScript heap, and canvas MB
is width × height × four bytes for observed live canvases. MB means decimal MB.

| Scenario | Render median / p95, ms | Frame interval median / p95, ms | JS heap, MB | Nominal canvas MB |
| --- | ---: | ---: | ---: | ---: |
| Title | 0.8 / 1.2 | 33.3 / 50.0 | 7.62 | 70.55 |
| Stats | 0.7 / 0.9 | 33.3 / 50.1 | 7.75 | 70.55 |
| Options | 0.7 / 0.9 | 33.3 / 50.0 | 7.98 | 70.55 |
| Armoury | 0.7 / 1.0 | 33.3 / 50.0 | 7.76 | 72.67 |
| Fullscreen inspection | 0.7 / 0.9 | 33.4 / 50.0 | 8.08 | 80.91 |
| Normal combat | 0.8 / 1.2 | 16.7 / 16.9 | 7.71 | 76.61 |
| Demon Mirror | 0.9 / 1.3 | 16.7 / 16.9 | 7.20 | 52.73 |
| Glitch film in combat | 2.0 / 2.7 | 16.7 / 16.9 | 7.19 | 76.61 |
| Inferno film in combat | 0.9 / 1.2 | 16.7 / 17.0 | 8.29 | 76.61 |
| Scattered Armour kill | 0.7 / 1.0 | 16.6 / 17.0 | 7.06 | 76.61 |
| **100-enemy stress** | **3.6 / 3.9** | **16.7 / 16.8** | **8.30** | **86.53** |
| Reduced-motion title | 0.6 / 1.0 | 33.3 / 49.9 | 6.67 | 63.36 |

Normal combat and Demon Mirror use an automated legal directional cut when the
attacker reaches the chosen progress threshold. The short combat samples include
one kill, not a complete run. Scattered Armour uses the real kill/death path.
The stress fixture creates exactly 100 seeded enemies through `spawnEnemy`, places
them on a fixed grid, and runs the actual update, figure, glyph and scene systems.
It holds them in their animated waiting states and disables new attacks/spawns.
It is a drawing/simulation stress load, **not 100 simultaneous fights or ordinary
encounter population**. The final fixture explicitly resets its visual RNG and
animation clock at scenario entry, so startup frame count cannot change the 100
actors. The stress row uses the final `stress-fixed-baseline` replay; the matching
optimized run also measured 3.6 ms median render time and 86.53 MB of canvases.
Earlier stress samples remain in the data for transparency.

Startup generally took roughly 0.8–1.3 seconds to artwork-ready in the baseline
fresh contexts, including route/server/browser costs. A startup CPU sample
attributed about 65 ms to `startGame`, including 58 ms under `resize`; another
32 ms appeared under `setSealTextures`. These sampled stacks indicate preparation
and layout costs, not a claim that all startup latency is JavaScript execution.
No reliable startup speedup is claimed.

Supplemental allocation-at-startup profiles are retained in `startup-baseline`
and `startup-final`. Their single snapshots at artwork-ready recorded 5.06/6.30 MB
of JavaScript heap and 7.72/10.48 MB of sampled allocation traffic respectively.
These snapshots depend on first-frame work and GC timing; they provide no evidence
of a startup heap reduction. Prepared-canvas savings below are a separate,
repeatable measurement.

Frame results include estimates of missed cadence slots derived from elapsed
intervals. They are **not compositor-confirmed dropped frames**. Combat generally
maintained its existing 60 fps cadence; menus maintained approximately 30 fps but
sometimes alternated short and 50 ms intervals. The existing frame caps, hidden-tab
suspension, silence and Armoury room cache are baseline behavior, not new work.

### Repeatability and uncertainty

The [saved measurement summary](performance-profile-2026-10-04.json) includes
every measurement block, including the later noisy final sweep. In that sweep,
Glitch's median render time was 1.5 ms and the unchanged 100-enemy workload reached
8.9 ms; several unchanged menu workloads also became slower. These observations
must not be hidden behind the earlier percentage improvements.

A further sequential baseline–optimized–optimized–baseline comparison used two
fresh samples per scenario per block. Its first baseline was also heavily affected
(one Glitch sample reached 14 ms median), demonstrating that the later slowdown
was not confined to optimized code. By its final two blocks, the 100-enemy workload
was back near 3.6–3.7 ms, and Glitch was near 1.2–1.3 ms optimized versus 2.0–2.1 ms
baseline. Inspection consistently recorded no hidden-scene drawing.

The percentage gains in this report describe the individual, earlier comparison
blocks; they are not universal speedup promises. The repeat checks support the
direction of the targeted improvements, but host scheduling/load and browser
resource variability prevent tight confidence bounds. The measurements do not
isolate which external factor caused each noisy interval.

## Ranked findings and changes

### 1. Glitch film: repeated canvas self-copies

`applyFilm` in [film.ts](../../src/rendering/effects/film.ts) accounted for about
**152 ms of 214 ms** sampled inclusive main-render CPU time in the clean baseline
Glitch diagnostic. Its 64 distortion strips and six displaced bands repeatedly
read the canvas they were writing. Inferno gradients were substantially cheaper
in this workload; caching their moving flame shapes would not be justified by
these measurements.

Glitch now takes one full-resolution snapshot before each disjoint copying pass
and reuses one backing canvas per drawing context. All strips, colours, bands and
scanlines remain. The second snapshot includes the first pass and colour grading,
preserving compositing order.

| Glitch metric | Baseline | Individual experiment |
| --- | ---: | ---: |
| Median render command time | 2.0 ms | 1.2 ms |
| Median render p95 | 2.7 ms | 1.9 ms |
| Browser task time per 2.5-second sample | 380.1 ms | 257.3 ms |
| Nominal canvas storage | 76.61 MB | 81.87 MB |

The tradeoff is **one 5.27 MB native-resolution canvas** at the profiled dimensions.
Changing away from Glitch releases its backing storage. There is no resolution
reduction. Pixel comparison initially exposed fractional-DPR edge feedback, so
fractional/translated transforms, filters and shadows keep the original sequence.
The final algorithm matches the frozen reference exactly across **108 combinations**
of orientation, size, DPR, transparency, translation and accessibility preferences.

### 2. Fullscreen inspection: drawing a completely covered scene

The baseline inspection still drew roughly **2,759 main-scene image stamps per
second**, in addition to its visible preview. The new `render` guard in
[game.ts](../../src/game.ts) uses the inspection state exposed by
[armory.ts](../../src/ui/screens/armory.ts). It skips only main-scene drawing.
Updates retain their previous behavior and the preview still draws through
`afterRender` with its own clock and particles.

The individual experiment reduced median main-render command time from **0.7 ms
to below the timer's useful resolution** and median browser task time from
**122.6 to 57.2 ms per 2.5 seconds (53%)**. Main-scene stamps fell to zero; preview
stamps continued. This does not mean the whole application uses zero CPU.

Ordinary Armoury, Stats and Options use translucent scroll backdrops and expose
the live scene at the edges. They continue rendering. Reduced-motion screens also
retain their existing visible behavior; this work does not reinterpret the
preference as a universal freeze command.

### 3. Memory: duplicate prepared artwork and large image surfaces

[armory-preview.ts](../../src/rendering/armory-preview.ts) previously created a
fresh set of artwork renderers for both Armoury and support previews. The runtime
now lends its prepared artwork renderers and tint caches to them. Clocks, poses,
particles, canvases and room caches remain independent. Borrowers do not dispose
the owner's artwork; standalone previews retain the owning mode.

The individual comparison reduced observed image objects from **156 to 124** and
Armoury's nominal canvas storage from **72.67 to 71.70 MB**. Warm preview drawing
remained about 0.1 ms. No material frame-rate gain is claimed for this change.

The harness observed 89 unique image sources with dimensions corresponding to
**358.06 MB nominal RGBA pixels**. The browser can share decoded surfaces between
image objects, and CSS images/GPU overhead are not fully accounted for. Removing
duplicate objects therefore **does not prove hundreds of megabytes of resident
memory were saved**. The directly measured canvas reduction is the defensible
memory improvement. Decoded artwork and high-DPR surfaces remain the largest
memory-pressure concern to investigate on a physical device.

### 4. Stress allocations and drawing: real, but not a reason to simplify combat

At 100 enemies, `drawEnemy`/`drawFigure` consumed about **369 of 501 ms** inclusive
render CPU in the final fixed-seed baseline diagnostic; `drawGlyphs` accounted for another 89 ms.
`ink-enemy.ts` part preparation/key construction and figure creation dominate
sampled allocations. Approximately **153 MB** was sampled over 2.5 seconds, with
about **24 ms of traced GC**. Normal combat sampled approximately **20 MB** and
12 ms of GC, while median simulation updates remained about 0.1 ms.

Repeated sorting and generic particle arrays were not the leading sampled costs.
No speculative pooling or sorting rewrite was made. There is room for a future
targeted per-figure preparation experiment, particularly for stress populations,
but these results do not justify changing poses, particle richness or combat
timing. Allocation sampling is an estimate of allocation traffic, not retained
heap growth or evidence of a leak.

### 5. Opaque main canvas: investigated, not adopted

An isolated `alpha:false` experiment showed no worthwhile overall improvement:
title render medians stayed at 0.8 ms, normal combat was 0.9 versus 0.8 ms, Demon
Mirror 1.0 versus 0.9 ms, and Glitch 1.9 versus 2.0 ms. Small differences at this
scale are not persuasive on a shared host.

A deterministic pixel probe found identical output for the sampled normal scene,
shake, zoom, flash, Glitch, Inferno and stage transition; each sampled original
frame was fully opaque. That is bounded coverage, not proof for every future
effect. With no clear benefit, the production canvas remains alpha-enabled.

## Validation and reproducibility

- Strict TypeScript and the isolated production build passed.
- **220 unit tests passed.**
- The final focused browser run passed **19 tests**, including film pixels, inspection
  resize/return, preview isolation and lifecycle behavior.
- The full browser run passed **175 of 178 tests**. All three failures reproduced
  with the original four runtime files restored: the Steel form cycling assertion,
  the outfit activation assertion, and the small-screen setup-height assertion in
  `mobile-temple.spec.ts`. These were left unchanged; their original and optimized
  logs are retained. This is not a claim of a completely green browser suite.
  The final focused run additionally strengthened shared-artwork checks with
  different outfits and disposal, and added an inactive-inspection-preview case.
- **All four production browser tests passed.**
- The suspension checks verify no render stamps, gameplay/particle state changes
  or audio playback while inactive, and no elapsed-time catch-up on return. Blur
  and document-hidden events are injected in disposable headless contexts; native
  Android app switching remains a physical-device check.

From the isolated checkout, start the profiling server in one terminal:

```powershell
npm run dev -- --host 127.0.0.1 --port 5197 --strictPort
```

In another terminal, run comparisons **sequentially**, without other tests or
builds running at the same time:

```powershell
node scripts/profile-runtime.mjs --baseline --diagnostics --out=.verification-build-profile/baseline-replay
node scripts/profile-runtime.mjs --diagnostics --out=.verification-build-profile/current
node scripts/profile-runtime.mjs --baseline --opaque --scenarios=title,combat,demon,film-glitch --out=.verification-build-profile/opaque-replay
node scripts/profile-runtime.mjs --scenarios=stress-100 --out=.verification-build-profile/stress-replay
node scripts/check-opaque.mjs
node scripts/summarize-runtime.mjs
node scripts/profile-runtime.mjs --diagnostics --startup-allocations --repeats=0 --scenarios=title --out=.verification-build-profile/startup-replay
```

`--baseline` disables this change's inspection/artwork optimizations and serves
the original film module from `992c39d`; that Git object must be available. The
initial `baseline` directory was captured before implementation. Replays assert
their injection anchors. `--repeats`, `--warmup`, `--duration`, `--scenarios`,
`--origin` and `--out` can be set explicitly. Keep all comparison parameters equal.

Each diagnostic saves `.cpuprofile`, `.heapprofile`, `.trace.json` and a compact
`-diagnostic.json`; timing samples are in `results.json`. Open CPU profiles in
DevTools' JavaScript profiler and traces in its Performance trace viewer. All raw
artifacts, logs and screenshots live under the ignored repository-local
`.verification-build-profile/` directory. They do not enter the production bundle.
The portable JSON beside this report omits personal hardware identifiers and
absolute paths. `baseline`, `inspection`, `shared-artwork` and `film-copy` preserve
the individual experiments; `final` preserves the complete follow-up sweep;
`paired-*` preserves the counterbalanced repeat checks. `opaque-pixels.json` records
the rejected canvas experiment's visual comparison. The frozen film reference and
pixel regression remain in `tests/fixtures/` and `tests/browser/film-parity.spec.ts`.
CPU profile line numbers describe served, transformed JavaScript; use the function
names and source maps when navigating TypeScript. `stress-fixed-*` is the final
reproducible stress pair.

Verification commands use dedicated ports and output directories:

```powershell
npm test
npx playwright test --config playwright.performance.config.ts
npm run build -- --outDir .verification-build-performance-production
$env:ISSEN_PROFILE_PRODUCTION = '1'
npx playwright test --config playwright.performance.config.ts
Remove-Item Env:ISSEN_PROFILE_PRODUCTION
```

Development browser tests use port 5198; production checks use 4197. Both refuse
to reuse an existing server. No real player browser context or save was opened.

## What still needs a phone

These results show lower submitted CPU work for inspection and Glitch and fewer
duplicate prepared surfaces. They do not establish lower battery drain, reduced
temperature, Android WebView raster performance, background audio behavior at the
OS level, or stability under mobile memory pressure. Physical Android follow-up
should compare long sessions with identical brightness, refresh rate, scene,
equipment and quality settings, including repeated Armoury visits and Glitch
switching. Preserve gameplay and image quality while measuring sustained frame
pacing, process memory, thermal throttling and energy use.
