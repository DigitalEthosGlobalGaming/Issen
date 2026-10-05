# PBR coverage and performance follow-up

The inventory pass installed 80 missing six-map exports and connected active
scenery, equipment and raster UI to the shared lighting rig. All 86 families,
including the original packs and retained artwork, are available in Material
preview. Visual approval remains separate from renderer coverage.

## Measured changes

The 1.66.0 follow-up removes all generated maps from the lifetime startup
preloader. Material owners decode selected packs; scenery retains packs shared
by consecutive scenes and releases departed selections. Cached map transforms
use destination backing resolution and copy aligned OpenGL normals directly.
The PBR tool now prepackages roughness, metallic and AO into `_surface.png`;
all 86 textures passed exact browser comparison with the old packing path.

Three passing production-instrumented web runs used identical harness fingerprints,
Edge headless, portrait 390×844 at DPR 2, seed 424242, High density, five fresh
contexts per scenario, 3-second warmup and 10-second measurements. Diagnostic
captures ran separately from timing. Reports, profiles, source maps and exact
builds remain under ignored `tmp/performance/`.

| Observation | Initial | Selective loading / packing | Worker composition |
| --- | ---: | ---: | ---: |
| Combat frame-interval p95, median across samples | 16.9 ms | 16.9 ms | — |
| Scene-transition frame-interval p95, median across samples | 664.2 ms | 26.5 ms | 17.4 ms |
| Scene-transition maximum interval across samples | 1167.4 ms | 372.7 ms | 68.4 ms |
| Scene-transition task time per 10-second sample, median | 9831.6 ms | 5431.8 ms | 3429.2 ms |
| Fresh-context combat startup readiness, median | 6244.3 ms | 1911.5 ms | — |
| Transition diagnostic nominal canvas storage | 328.0 MB | 119.3 MB | — |
| Transition diagnostic nominal unique decoded-image storage | 2322.1 MB | 1205.2 MB | — |
| Readbacks in separate transition counter window | 89 | 16 | — |

The comparative `scene-transitions` scenario calls `previewStage` every 650 ms
without activating cinematic mode. It covers the nine environments; its nominal
Demon iteration renders the ordinary stage-zero fallback. It does not establish
Demon transition performance. The separate `cinematic-transitions` fixture opens
the actual viewer and guards that all ten compositions appeared during measurement.
The slower baseline completed 12 scene changes per measurement; the optimized
run completed 15. Timed task totals therefore include more transitions after the
fix. Baseline render medians varied by more than 25%; preserve individual samples
when interpreting comparisons. Combat frame cadence remained essentially stable.

These are callback/main-thread CPU observations, not measured display drops or
resident GPU memory. Worker OffscreenCanvas/ImageBitmap storage and worker task
time are outside the page probe's nominal counts; the worker column therefore
does not report them as whole-application memory/CPU savings. Android hardware
was not measured. An intermediate run completed its
samples but failed the comparison guard because formatting changed harness line
endings. Restoring the original harness fingerprint allowed the final comparison;
the failed run is not used as a passing baseline.

## Background composition

The 1.66.0 follow-up moves cold composition to an owned worker, retaining the
last completed scene until replacement colour and material planes arrive. Requests
coalesce, inactive owners defer work, and disposal closes transferred bitmaps and
terminates the worker. Live motion remains on the presentation clock. Browsers
without Worker/OffscreenCanvas and failed workers use the local renderer.

All nine worker compositions match the local renderer exactly with lighting off,
preserve alpha, and have mean lit colour error below one byte per RGB channel.
Foreground bamboo, independent ownership, pending disposal and inactive/resume
also pass. Monotonic material revisions fix stale GPU uploads when canvases are
reused across scenes. The passing five-sample comparison eliminates the earlier
300–370 ms composition stalls in this workload; occasional 54–72 ms main-thread
long tasks remain, so the result is not a guarantee of every frame meeting 60 fps.

The final 1.66.0 check uses the corrected real cinematic viewer, with three
fresh-context 10-second samples per scenario. Every cinematic sample displayed
all ten scenes, including Demon. Median frame p95 was 20.2 ms for transitions,
20.8 ms for ordinary combat and 29.6 ms for Demon combat. The largest cinematic
interval was 317.1 ms: cold transitions still hitch occasionally. The separate
CPU capture includes substantial texture-upload work; moving CPU composition
off-thread does not eliminate GPU upload costs. This workload differs from the
nine-environment comparison above and is not a like-for-like percentage gain.
The eight-cycle menu retention capture warmed from 13.8 MB to 15.4 MB of JS heap,
with later samples staying near 14.6–15.4 MB; these figures exclude resident GPU
and decoded-image storage.
The final run passed all 18 timing samples and six diagnostic captures with no
reported errors. Both inactive fixtures stopped simulation/render/preview work,
suspended audio and resumed without catch-up. The retained report is under ignored
`tmp/performance/2026-10-05T13-20-24.828Z-b4991f8b/`.

## Reproduction and validation

```sh
npm run test-performance -- --scenario=combat,armoury,inspection,scene-transitions,menu-cycles --duration=10000
npm run test-performance -- --scenario=combat,scene-transitions,menu-cycles --duration=10000 --compare=tmp/performance/<passing-baseline>
npm run test-performance -- --scenario=cinematic-transitions --duration=10000
```

The final strict TypeScript build, 248 unit checks, six PBR CLI checks and seven
performance-tool checks passed. The broad browser sweep passed 199 cases;
its failed cases were corrected and rerun successfully, followed by focused
checks of shared previews, compact setup and all four worker cases. Checks retain
pixel/alpha, gameplay, save compatibility and resource ownership assertions.
Four production smoke cases and the develop-base-path smoke case passed on the
final 1.66.0 build, including the nested worker resource path.

The final production verification build and additional timing guards passed:
three fresh contexts each for Demon combat, kill effects, 100 waiting enemies,
inactive combat and inactive inspection, with the normal 3-second warmup and
5-second sample. Demon and kill-effect frame p95 medians were 17.2 ms; the stress
fixture was 23.4 ms and retained all 100 enemies. Both inactive fixtures stopped
simulation/render/preview work and resumed without simulation catch-up. These
guard runs have no comparative baseline and do not replace Android measurements.
