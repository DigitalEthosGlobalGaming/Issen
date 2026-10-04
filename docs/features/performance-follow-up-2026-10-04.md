# Menu scheduling follow-up — 4 October 2026

The completed feature release is **1.58.1** on main. The performance follow-up is
**1.58.2** on develop and must remain there. Measurement and local release
verification are complete. Its deployment target is the
[develop preview](https://digitalethosglobalgaming.github.io/Issen/develop/);
main remains at feature-release commit `3061e77`.

## Ownership and behavior

`src/ui/screen-animation.ts` declares each screen's scene and preview needs.
Snapshot menus hold the last complete scene after the 450 ms screen fade. The
generic frame loop independently gates simulation, main rendering and presentation
callbacks. Its elapsed-time clock keeps advancing, so returning does not catch up
the time spent in a menu. Resize invalidation survives fullscreen inspection.

Title, results, Shrine and gameplay scenes draw at up to 60 fps. Visible Armoury
previews use that cap independently of the held main scene. Existing preview
clocks, reduced-motion/flashes preferences, canvas resolution, artwork, effects,
combat rules and save formats are preserved. Foreground suspension still stops
all callbacks and audio.

## Repeatable measurements

Conditions: Windows desktop, headless Edge 154.0.4258.53, 390 × 844 CSS pixels,
DPR 2, High cosmetic quality, Free edition, deterministic seed 424242, production
instrumented assets with offline fonts, no CPU throttling. Each scenario uses
five fresh contexts, three seconds of warmup and a five-second timing window.
CPU/allocation profiles, traces and canvas counters run in separate windows.

The initial feature baseline passed all scenarios. The harness was then extended
to recognize settled snapshots, require visible previews and record preview
intervals separately. A matching baseline was captured with the updated harness.
Its final fresh-context startup timed out before measurement; the original failure
was preserved, and only the two missing timing samples and final diagnostic were
rerun against the exact saved build. Host, browser, graphics and instrumentation
checks matched. The completed recovery contains all 95 timing samples and 19
diagnostics. No completed timing sample was replaced.

Local saved artifacts (ignored, not included in the deployed preview):

- Initial baseline: `tmp/performance/2026-10-04T04-27-53.656Z-e8311d9e/`.
- Matching baseline, including original failure:
  `tmp/performance/2026-10-04T04-48-29.674Z-7a34b553/`.
- Completed matching baseline and recovery provenance:
  `tmp/performance/2026-10-04T05-10-20.612Z-resumed-06948455/`.
- Completed scheduling comparison:
  `tmp/performance/2026-10-04T05-12-27.480Z-a3346000/`.
- Resize-guard build: `tmp/performance/2026-10-04T05-36-08.490Z-5c74611b/`.
- Resize results: `tmp/performance/noop-resize-before.json` and
  `tmp/performance/noop-resize-after.json`.

Each folder contains the report, manifest, raw samples, profiles, traces,
screenshots, and the exact build with source maps. Recovery also retains
`original-failure.json` and `recovery.json`.

The matching baseline source fingerprint is
`fc4c013309a8a600fffc03178dd760b157660f064dad047f7cacee6703e87818`;
the scheduling build is
`b98ec12b1731c6eaa253bf207d57d9318189e20c0b6236a782e6e94916b3bce4`.
Both use instrumentation fingerprint
`8144fa2c6928070d180b79573e41da4616b5f0a1e395941f60dc92ddfcd4cca0`.
The resize guard was measured as a second step with source fingerprint
`3412dd31f7f8d895e75d237416757353c86e321e41289d40197dc38bd518e770`.
The full-suite table isolates scheduling; the separate resize experiment measures
the later guard. Each step retains its exact build.

## Scheduling observations

| Scenario                  | Main render callbacks per 5 s, before → after | Browser task ms, before → after |              Task change |
| ------------------------- | --------------------------------------------: | ------------------------------: | -----------------------: |
| Title                     |                                     150 → 301 |                 214.76 → 313.83 |                   +46.1% |
| Stats                     |                                       150 → 0 |                  233.29 → 20.29 |                   -91.3% |
| Options                   |                                       150 → 0 |                  207.97 → 20.70 |                   -90.0% |
| Armoury                   |                                       150 → 0 |                 246.99 → 134.25 |                   -45.6% |
| Inspection                |                                       150 → 0 |                  87.76 → 106.46 |                   +21.3% |
| Setup                     |                                       150 → 0 |                  216.13 → 19.52 |                   -91.0% |
| Temple                    |                                       150 → 0 |                  226.71 → 19.84 |                   -91.2% |
| Trials                    |                                       150 → 0 |                  235.75 → 19.63 |                   -91.7% |
| Paused                    |                                       150 → 0 |                  171.54 → 25.20 |                   -85.3% |
| Reduced-motion title      |                                     150 → 301 |                 188.61 → 304.59 |                   +61.5% |
| Normal combat             |                                     301 → 301 |                 380.95 → 375.82 |                    -1.3% |
| Demon Mirror              |                                     301 → 301 |                 608.53 → 595.93 |                    -2.1% |
| Glitch film               |                                     301 → 301 |                 448.58 → 446.56 |                    -0.5% |
| Inferno film              |                                     301 → 301 |                 406.34 → 404.06 |                    -0.6% |
| Kill effects              |                                     301 → 300 |                 373.87 → 382.76 |                    +2.4% |
| Stress-100                |                                     301 → 301 |               1464.10 → 1467.94 |                    +0.3% |
| Inactive combat           |                                         0 → 0 |                     0.94 → 0.91 | negligible absolute work |
| Inactive inspection       |                                         0 → 0 |                     0.39 → 0.45 | negligible absolute work |
| Menu-cycle timing (title) |                                     150 → 301 |                 206.11 → 327.58 |                   +58.9% |

Task time is browser work during the window, not GPU execution or battery usage.
Title callback interval p95 fell from 49.9 to 17.0 ms. Both Armoury preview sizes
increased from 150 to 301 callbacks per window, with preview interval p95 falling
from approximately 50 to 17.1 ms. Their main update count fell from 150 to zero.
All settled snapshot scenarios recorded zero main updates and render callbacks.
The old inspection render callback returned immediately behind the opaque modal;
the new policy also suppresses its simulation and callback overhead.

The extra title and inspection work accompanies the requested higher animation
cadence. Reduced-motion settings remain in force; the title retains its existing
limited ambient animation. Normal gameplay command-render medians are unchanged
(0.6 ms combat, 0.9 ms Demon, 1.0 ms Glitch, 0.7 ms Inferno). The small gameplay
task differences are observed variation, not claimed optimizations. The pause
baseline had variable render medians; its callback removal is directly observed.
Empty render samples indicate no callbacks, not zero-duration rendering.

Separate diagnostic captures sampled these allocations over five seconds:

| Scenario   | Sampled allocation MB, before → after | Main image stamps per 1 s, before → after | Nominal canvas MB, before → after |
| ---------- | ------------------------------------: | ----------------------------------------: | --------------------------------: |
| Stats      |                          15.35 → 0.10 |                                 2,670 → 0 |                     70.55 → 70.55 |
| Armoury    |                          14.83 → 2.79 |                                 2,670 → 0 |                     71.70 → 71.70 |
| Inspection |                           3.02 → 2.95 |                                     0 → 0 |                     79.94 → 79.94 |

These are sampled allocation estimates and nominal pixel storage, not resident
graphics memory. Holding the scene preserves its buffers; the improvement comes
from stopping repeated work without reducing canvas resolution or sprite detail.

## Resize preparation

The separate experiment uses five fresh contexts. Each receives five synthetic
resize events with unchanged CSS geometry and DPR, 650 ms apart in settled Stats.
Median browser task time fell from **184.76 to 14.18 ms** (92.3%); every repetition
went from **20 new canvases to zero**. The scene remains unchanged after the guard.
These figures apply to this event workload, not normal combat or real resizes.

The guard requires successful initial preparation, unchanged CSS dimensions and
capped DPR, and matching backing dimensions. Boot, real geometry/DPR changes and
a cleared/mismatched backing size still rebuild the same layers and reposition
actors. Browser coverage checks unchanged events, backing recovery, DPR changes
and a real orientation/viewport change through inspection.

Reproduce with the commands in [the performance guide](../../tests/performance/README.md).

## Other candidates

The matching baseline's source-mapped allocation profile puts most normal-combat
sampled allocation in ambient grass/leaves, ahead of enemy sprite lookup and glyph
colour helpers. At mapped function locations, the three ambient routines account
for about 12.1 MB, enemy sprite colour parsing about 1.1 MB and the glyph colour helper
about 0.5 MB in the combat diagnostic. Sampling and source-map attribution are
estimates. Warm combat had no canvas readbacks. A broad sprite pool, cache rewrite
or Path2D ring rewrite is not justified by these normal-run results. The glyph
renderer accounted for approximately 5.7 ms of inclusive sampled CPU in the
separate five-second ordinary-combat diagnostic. Animated grass
and leaves also should not be replaced by still images. No such rewrite is shipped.

Eight forced-GC menu cycles ended at 5.03 MB of JavaScript heap before and 5.13 MB
after. First-open cache warming accounts for most growth; the optimized series
rose from 4.91 MB after the first cycle to 5.13 MB after the eighth. This short
series does not prove absence of leaks. Preview artwork remains shared, inspection
moves one canvas, and the room cache resizes to that canvas on drawing. Disposal
zeros its backing size. There is no measured large retained-buffer improvement
that warrants discarding these reusable buffers on every menu close.

## Verification and release

The scheduling draft passed strict TypeScript checking, 14 focused unit/tool
checks and seven browser checks covering settled scenes, both preview sizes,
resize recovery, return to title, foreground suspension and manual pause. Broad
final unit validation passed **239 tests**, performance-tool validation passed
**seven tests**, browser validation passed **192 tests**, and production validation
passed **four tests** including strict type checking and the checked asset build.
Production cases completed successfully, but Windows preview-server teardown
needed the owned test server to be closed before the command exited successfully.
The release workflow publishes develop previews; this performance release does
not promote changes to main.

Verification logs are saved under ignored `tmp/` as
`performance-final-unit.log`, `performance-final-tools.log`,
`performance-final-browser.log` and `performance-final-production.log`.

These desktop-browser measurements do not establish physical Android/WebView
frame pacing, long-session heat, battery life, GPU utilization or resident GPU
memory. Browser task and allocation results can vary with other host activity;
fresh contexts do not isolate operating-system or graphics scheduling.
