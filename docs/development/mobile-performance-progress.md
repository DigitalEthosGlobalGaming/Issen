# Mobile performance continuation

The [active objective](../../goal-objective.md) supersedes the earlier exact-pixel
performance goal. Intentional rendering simplifications are allowed when the
game's feel and readability remain good. Worker scenery is required on supported
platforms; automatic local fallback is replaced with error/retry recovery.
Cancelled general packing and the separate lit-only integration remain cancelled.
The requested merged drift atlas is a narrowly scoped exception, not a restart
of general asset packing.

## Drift runtime integration — 9 October 2026

App1.69.15 installs the two1024×512 WebP planes and128px cells. At DPR3,
the controlled largest-gust review remains readable;192px is unnecessary.
Four logical families share the pair, preserving surviving particles during
stage changes. Runtime ownership holds two leases/4,194,304nominal decoded bytes.
Encoded size is155,694bytes; full-set reduction is94.87% decoded and96.44% encoded.
Mipmapped RGBA GPU estimate is5,592,405bytes, not physical GPU measurement.
Original PNG artwork/PBR recipes remain; four unused generated base WebPs and
old drift runtime material entries are removed.

Instancing, analytic motion, alpha quantization, folded faces, depth ordering,
spawn mixtures and density remain. Ambient leaves draw once per layer and weather
embers use the same cheap instanced composite shader. Drift writes no geometry
buffers and binds no normal/surface maps. Scene-light lookup samples lighting
behind the sprite; empty geometry uses scene ambient. Only fire samples emission.
Drift texture sources alone enable automatic mipmaps with linear min/mipmap filters.
Full PBR is removed at every quality: small moving paper does not justify its
extra detail/cost. Saved checked controls retain the old renderer for comparison,
without a duplicate runtime fallback.

Focused browser checks pass14 cases: all32 frames/all cinematic scenes, warming,
two-plane ownership, supersession, pending motion/readiness, instanced flutter,
clipping/order, context restoration, sky lighting/emission and DPR3 review.
Unit suite passes476 cases; production checkpoint passes all4 cases including
strict TypeScript/build/offline resize. Full browser checkpoint executes374:
371 pass/3 fail in18.7m. Historical compaction checks still requested the four
retired base WebPs; they now verify retained PNG authoring sources and preserve
all180 exact data-plane checks. Material preview expected86 packs rather than82.
Those two test expectations are corrected. The native leaf restoration test
reports one alpha mismatch in the full run, with all geometry/HDR targets exact;
its cause is not established. All five cases in the affected three files pass
the focused rerun in16.4s, with the strict alpha assertion retained and added
restoration diagnostics. No unchanged full suite is repeated after test-only
corrections. This does not establish the complete mobile/transition goal.

Checkpoint logs: `tmp/probes/drift-{units,production,browser-full,focus-final}.log`.
Original failures are preserved under `tmp/probes/drift-full-failures/`.

Representative before/after DPR3 captures are under
`tmp/probes/drift-scenes/{current,new}-{daylight,lantern,fire,gust}-DPR3.png`,
with requested/rendered scene evidence in `evidence.json`. The file named lantern
captures the dark Rainwater Hollow; controlled lantern/sky/fire/gust captures
are under `tmp/probes/drift-new/`. All eight gameplay captures were reviewed:
ink silhouettes remain coherent and fire remains visible against dark sky.
Cosmetic timing and preview figure choices vary, so these are representative
visual comparisons, not deterministic pixel oracles. Controlled DPR3 checks
isolate lantern lighting and emission and include enlarged90CSSpx gusts.

### Replacement measurements

All24 samples pass across new/rate1 and off/new/saved-current/rate4, with the
same390×844/DPR2, High, seed424242,3s warmup/5s measurement and three repetitions.
Statistics below are medians of sample statistics; threshold counts sum intervals.

| CPU rate | Mode | Scene | Render median | Frame p95 | Frame p99 | >8.3ms | >16.7ms |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | new | calm | 2.1 | 16.9 | 17.3 | 900 | 277 |
| 1 | new | gust | 2.1 | 16.9 | 17.3 | 899 | 254 |
| 4 | off | calm | 9.3 | 17.4 | 30.2 | 872 | 342 |
| 4 | new | calm | 9.6 | 17.3 | 30.2 | 875 | 337 |
| 4 | current | calm | 10.5 | 17.8 | 30.2 | 863 | 339 |
| 4 | off | gust | 9.7 | 18.2 | 40.3 | 864 | 356 |
| 4 | new | gust | 10.4 | 17.3 | 29.8 | 863 | 335 |
| 4 | current | gust | 10.9 | 18.4 | 30.4 | 867 | 338 |

Calm populations are27, gust0. Rate1/new gust starts35/8 in all samples;
rate4/new/current gust starts55/28, while off starts55/28,55/28,63/36.
Rate4 current→new CPU render medians improve8.6% calm/4.6% gust. Off subtraction
suggests smaller incremental calm cost but varies in gust and is not isolated
GPU timing. Rate1 previous-current→new is5.3→2.1ms, but earlier off results and
rate4 baseline differences show host variance; do not claim that as a causal
60% drift speedup. Saved current uses the checked pre-integration application
build, with original source/instrumentation recorded; comparison includes runtime
ownership/catalog changes. No physical-mobile GPU or120Hz target is proven.
The structural single-pass/texture savings are verified; a substantial isolated
mobile rendering-cost reduction remains a hardware validation gap.

Evidence under `tmp/performance/`:

- `2026-10-09T08-10-22.639Z-2e783e02`: new/rate1.
- `2026-10-09T08-11-34.575Z-b43d97a9`: off/rate4.
- `2026-10-09T08-13-10.952Z-7d3464e9`: new/rate4.
- `2026-10-09T08-14-47.109Z-94027dbf`: saved current/rate4.

All timing/capture processes are terminal. No further desktop drift reruns are
planned without a concrete question that could change implementation. Grass's
geometry bandwidth and large maps may offer similar opportunities; unchanged
because this checkpoint is drift-only.

### Worker capability finding for the next integration

Installed Capacitor8.4.3's `Bridge.DEFAULT_ANDROID_WEBVIEW_VERSION` is60;
`capacitor.config.json` does not override it. That native floor does not prove
the required worker compositor can run. Chrome's documentation places
[OffscreenCanvas](https://web.dev/articles/offscreen-canvas) at69 and
[module workers](https://developer.chrome.com/blog/new-in-chrome-80) at80.
[Capacitor's minimum WebView setting](https://capacitorjs.com/docs/config)
can declare the application's actual floor. Next integration must align that
floor with bundled JavaScript and perform actual worker/canvas capability checks,
plus visible failure/retry for constructor, message and composition failures.
Android version alone cannot establish those capabilities. No physical Android
WebView validation has been performed for the new requirement yet.

## Required-worker recovery integration — 9 October 2026

App1.69.16 removes factory/owner automatic local fallback. The shared
composition module remains inside the worker and in diagnostic comparisons.
The owner checks required APIs, handles constructor/error/messageerror/post/
compose/upload/timeout failures, aborts uploads, terminates the worker, releases
planes and settles callers. Retry starts a fresh generation; stale preparation,
response or warming cannot publish or settle new callers. Scene flow retries
the same identity without advancing the visit seed or clearing its continuation.
Startup reports scene failure with reload retry; later failures use a concise
scene retry panel and keep simulation held. Disposal removes the error panel.

Capacitor now declares WebView111, matching installed Vite8.3.1's Chrome111
baseline. This is a capability/build alignment, not physical-device proof.
The native error path serves a static offline startup message without JavaScript
or plugins; the configured floor alone would only log an error in Capacitor.
Strict TypeScript and16 focused unit/tool cases pass. Initial21-case browser
selection passes18 and fails3: startup's unavailable diagnostic was absent in
two cases, and the new gameplay test remained on setup without pressing Begin.
The startup diagnostic and test flow are corrected; those three cases pass the
focused rerun in14.8s. The failure/retry case also passes with a silent-worker
timeout added, using a shortened fixture timer instead of waiting45seconds.
The native error page passes with JavaScript disabled. Logs are under
`tmp/probes/worker-{required-browser,required-repair,required-timeout,native-error-page}.log`.
Checked production verification build passes and contains the static page;
`tmp/probes/worker-required-build.log` records the build. Formatting/diff checks pass.
No full suite is repeated for this iteration. Next-scene promotion,
figure warming and combined memory ownership remain incomplete.

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
