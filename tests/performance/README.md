# Performance testing

This tooling is opt-in. Develop or run performance tests, profiles and related
optimization investigations only when specifically requested by the user, as
required by [AGENTS.md](../../AGENTS.md). Extend this suite incrementally for
requested investigations; it is not part of routine verification or default CI.

Run from the repository root with Node 24, installed dependencies and Microsoft
Edge. The suite builds a disposable instrumented copy of the game, starts its own
server, and runs scenarios sequentially. It never starts the normal development
server, reads a personal browser profile, or installs an Android application.

```sh
npm run test-performance
npm run test-performance -- --suite=menus --mode=timing
npm run test-performance -- --scenario=combat,film-glitch --mode=diagnostic
npm run test-performance -- --viewport=1440x900 --dpr=1
npm run test-performance -- --compare=tmp/performance/<baseline-run>
npm run test:performance-tools
```

The first command is the complete standard **web** suite: five repetitions per
scenario, 3 seconds of warmup, 5 seconds of measurement (at least 30 seconds for
`cinematic-transitions`), then one separate
diagnostic capture. Every repetition starts in a disposable browser context.
These are initial defaults, not a statistical confidence guarantee. Use longer
samples when investigating variance or infrequent events. A short integration
check is `--repeats=2 --warmup=500 --duration=1000`; do not use its numbers to make
release performance claims. Timing runs use one browser at a time, independently
of the normal Playwright regression suite's worker count.

Use `--help` for options and `--doctor` to inspect prerequisites. Unknown options,
scenarios and invalid numeric values fail immediately. Missing Android tooling
does not fall back to a desktop browser. The server defaults to loopback port 5199
with strict port ownership; use `--port` when necessary. An occupied port fails
without stopping or reusing the other server.

## Scenarios and workload

Drift comparisons use `--suite=drift --drift=off|current|new --mode=timing`.
The switch exists only in instrumented builds: off skips leaf and ember submission
while keeping asset preparation and cosmetic simulation. New (the default) uses
the shipped cheap lit renderer. Current requires `--control=<saved-run>` pointing
to a passing current-mode capture from before the replacement. The runner copies
its checked immutable build and records the original source/tool identity, so
full PBR does not remain as a duplicate runtime path. For example:

```sh
npm run test-performance -- --suite=drift --drift=current --control=tmp/performance/<saved-current-run> --mode=timing
```

Calm suppresses gust particles; gust adds repeated bursts through the normal
cosmetic spawn function. Guards require leaves in both scenes, zero gust leaves
in calm and gust leaves in gust. This is a controlled sustained-gust workload,
not an unchanged natural-weather run. Raw frame/render statistics include p99
and counts above 8.3/16.7 ms. `--cpu-rate=4` applies CDP CPU throttling on web;
it approximates slower CPU execution, not mobile GPU bandwidth or 120 Hz delivery.
Record separate off/current/new arms with the same settings. The baseline
comparison command rejects changed drift modes or throttle rates; cross-mode
cost comparisons must explicitly identify the differing mode and saved build
instrumentation. Saved controls are historical application builds, not just a
shader toggle in the new runtime; report other changes and workload differences.

- `menus`: title, Stats, Options, Armoury, inspection, setup, Temple, Trials,
  pause and reduced-motion title. Only Scroll menus exist in the application.
- `gameplay`: combat, Demon Mirror, Glitch, Inferno and Scattered Armour kills.
- `stress`: 100 animated waiting enemies using the real spawn/update/render
  systems. This measures crowd rendering, not 100 simultaneous attackers.
- `lifecycle`: inactive combat and inactive inspection. Web tests inject document
  visibility changes; Android targets use the actual Home/resume lifecycle.
- `memory`: settled-title timing plus a separate eight-cycle Armoury/Options/Stats
  retention experiment, sampling heap after forced garbage collection.
- `transitions`: `scene-transitions` directly calls the stage-preview path every
  650 ms; it does not activate cinematic mode and therefore does not render Demon.
  `cinematic-transitions` opens the real viewer, waits for each requested composition
  to appear, then advances after a 350 ms interval. Its measurement lasts at least
  30 seconds and guards that all nine stages and Demon actually appeared. Preparation,
  decoding and rebuilding remain included; each sample records `measurementMs`.

Fixtures fix seed 424242, Free edition, High cosmetic density and synthetic saves.
Gameplay and lifecycle fixtures initialise audio through a real button gesture;
inactive checks require a running audio context before testing suspension and
verify frame resumption without simulation catch-up. Legal automatic swipes keep
normal combat reproducible without modifying damage
or enemy rendering. Scenario guards fail on unexpected death, stress population
drift, or inactive simulation/render/audio work. Synthetic fixtures are restricted
to the instrumented build. The renderer, menu policy, resolution and game rules
are not optimized by this tooling.

## Builds and instrumentation

`run.mjs` performs the application's strict TypeScript check and a minified Vite
production build into that run's `build/` directory. Android asset mode supplies
local fonts and relative URLs; this is a **web asset build**, not an APK build.
Purchases are disabled. A test-only Vite plugin exposes the scenario controls and
wraps the update/render/preview callbacks. It asserts its source anchors and emits
source maps through MagicString. The normal Vite config never loads this plugin,
so normal bundles contain neither the probe nor the stress fixture.

Instrumentation adds timing calls and sample arrays. Compare only identically
instrumented runs. CPU/heap/trace collection takes place in separate contexts
from headline timing; allocation-heavy canvas counters run in a further separate
one-second window. The probe does not create a requestAnimationFrame loop of its
own. Preview callback intervals are recorded independently from main
render intervals. Settled snapshot scenarios may have no main callbacks; animated
scenes and visible Armoury previews must still produce callbacks. The estimated
missed-slot calculation uses a 60 fps target for visible animated scenes.
Forced GC is used only in the explicit retained-memory experiment, not in
timing windows. Audio contexts and observed canvas/image objects are instrumented;
CSS images, worker OffscreenCanvases/ImageBitmaps, browser-internal surfaces and all
resident decoded/GPU storage are not counted.

## Results and interpretation

For an explicitly requested Graphics option comparison:

```sh
node tests/performance/benchmarks/measure-graphics.mjs tmp/performance-graphics-options
```

This runs two opposite-order sweeps of sixteen arms using the existing fixed-seed
gust gameplay fixture, a500ms warmup and3s timing window. Each arm has fresh
synthetic settings and an isolated context. It records raw frame/render samples,
preparation timings and the existing nominal pixel-memory ledger. It does not
measure mobile GPU speed or whole resident memory. Adaptive changes are disabled
for quality comparisons; the separate adaptive arm enables them.
After confirming a failed run's process has stopped, pass its folder as a third
argument to reuse its exact build and completed samples. Revision, tracked-source
changes and browser version are checked before recovery. Treat noisy short
results as directional evidence, not precise per-option FPS promises.

For a requested gameplay allocation investigation, capture a focused combat
diagnostic before and after an implementation change using identical options,
then inspect its source-mapped allocation samples:

```sh
npm run test-performance -- --scenario=combat --mode=diagnostic --warmup=1000 --duration=3000 --repeats=1
node tests/performance/benchmarks/summarize-allocations.mjs tmp/performance/<baseline> tmp/performance/<after>
```

The summarizer writes `allocation-summary.json` alongside the existing CPU,
heap and GC captures. It reports sampled bytes per second and maps frame
locations through the capture's own build source maps. This short diagnostic
guides allocation fixes; it does not establish FPS gains or mobile performance.

For a failed full web run, a bounded recovery can reuse its exact saved build and
retain every completed sample:

```sh
node tests/performance/benchmarks/resume-run.mjs tmp/performance/<failed-run>
```

For an interrupted run still marked `running`, first confirm its process has
stopped, then pass `--interrupted` to the recovery command. Never recover a live
run or overlap measurements.

This writes a new folder, preserves the original failed results and records which
missing samples/diagnostics were completed. It rejects changed host, browser,
graphics or tooling identity. It neither rebuilds nor replaces successful samples.
A recovered run becomes passing only when all required repetitions and diagnostics
exist. Report the failure and recovery when using it as a baseline.

For the explicitly requested stage-loading investigation, run these sequentially:

```sh
node tests/performance/benchmarks/summarize-frame-budgets.mjs tmp/performance/<completed-run>
node tests/performance/benchmarks/measure-compose.mjs tmp/performance-compose-baseline
node tests/performance/benchmarks/measure-scene-flow.mjs tmp/performance-scene-baseline
```

The first derives median/p95/p99 and counts above 8.3/16.7 ms from retained raw
samples without changing the standard harness or its fingerprint. The compose
probe covers all nine stages, five repetitions and fixed seed, retaining raw
colour and material planes for subsequent pixel comparison. The scene probe
builds a separate instrumented production bundle, uses fixed-seed cinematic
presentation ports, and records cold/warm stage cycles, worker timings,
decoded-byte estimates, sampled heap peaks, startup, and gameplay intervals and
CPU update/render times. It saves a trace per scene; `Scheduler::RunTask` events
on the presentation mark's thread cover the presenting task and the next two
seconds, including tasks between 16 and 50 ms that Long Tasks does not expose.
Missing trace task events fail the probe rather than being reported as zero.

Cold clears HTTP cache after startup; shared decoded startup images remain.
Warm retains HTTP cache and uses the same scene seed. Neither means cold browser
process or OS cache. Decoded estimates are nominal RGBA sizes and do not measure
resident GPU memory. Desktop captures do not establish mobile/120 Hz delivery.
The scene probe owns port 5298; do not run it concurrently with other captures.

For the separate unchanged-viewport resize investigation:

```sh
node tests/performance/benchmarks/measure-noop-resize.mjs tmp/performance/<saved-build> tmp/performance/<result>.json
```

This uses five fresh contexts, each with five unchanged-geometry resize events
650 ms apart in settled Stats. It records browser task time, created canvases and
scene state, preserving build provenance. Its server owns port 5299. Run cases
sequentially, without overlapping the main suite. This synthetic event workload
does not represent normal combat, real viewport changes or phone power usage.

Each invocation creates `tmp/performance/<timestamp-id>/` containing:

- `report.html` and `report.md`: measurements, variability, comparison and links.
- `manifest.json`: revision, fingerprint of tracked/untracked non-ignored content,
  dirty status, browser, host, graphics information where available, viewport,
  DPR, seed and sampling configuration. Ignored environment files are not hashed;
  effective fixture settings are recorded explicitly.
- `results.json`: individual samples, raw callback timings and diagnostic summaries.
- `profiles/`: CPU profiles (including startup), allocation profiles, canvas
  counters, GC events, sampled CPU hotspots and retained-heap series.
- `traces/`: Chromium timeline/V8/graphics-category traces.
- `screenshots/`: diagnostic scenario captures, outside timing windows.
- `build/`: the exact instrumented bundle and source maps; `logs/`: typecheck log.

Import `.cpuprofile` into DevTools' JavaScript profiler, `.heapprofile` into Memory,
and trace JSON into a compatible timeline viewer such as Perfetto. The files use
generated bundle locations; retained source maps allow source-level inspection
when serving the exact saved `build/` directory. No upload is required by the
runner. Reports and traces may contain local machine/path details and stay
ignored; sanitize anything selected for a committed report.

Startup is fresh-context navigation to artwork readiness. It is not cold OS,
WebView-process or Android-activity startup. Render timings measure JavaScript
command submission; deferred raster/compositor/GPU work is not included. Frame
intervals are game callback intervals, with estimated missed slots, not confirmed
display drops. Empty callback arrays are reported as unavailable observations,
not zero-duration frames. Nominal canvas/image RGBA bytes are not resident memory.
GPU utilisation, resident GPU bytes and watts are explicitly unsupported.

Comparison requires a completed passing baseline and matching instrumentation
fingerprint, browser, target,
host/device identity, graphics metadata, geometry, settings and sampling parameters.
It permits changed source fingerprints because that is the purpose of an A/B test.
A >25% range between render medians flags variability; timing deltas are diagnostic,
not universal pass/fail gates. For important changes collect alternating A/B/B/A
runs from isolated checkouts, on the same ports/settings, without overlapping
loads. The runner compares saved runs; it does not switch Git revisions itself.

Partial results and a failed report survive ordinary errors and graceful
cancellation. Only owned browser contexts, servers and ADB forwards are cleaned up.
Artifacts are retained rather than automatically deleted; remove old run
directories deliberately when no longer needed. A hard process kill can prevent
final report writing, but previously saved samples remain.

## Android emulator and physical WebView

The adapter is provided, but requires an already running Android device and an
already installed **dedicated debuggable performance app**. It is not validation
on Android until that target has actually run successfully.

```sh
npm run test-performance -- --target=emulator --doctor --device=<serial> --adb=<adb-path>
npm run test-performance -- --target=emulator --mode=build
npm run test-performance -- --target=emulator --device=<serial> --package=com.digitalethosglobalgaming.issen.performance --adb=<adb-path>
```

The build-only command produces instrumented web assets. Packaging those assets
into a separately identified debuggable Capacitor application is an explicit
prerequisite; this runner does not invoke Gradle, install APKs, change application
IDs, download SDKs, or launch an emulator. Use `ISSEN_ADB`, `ANDROID_HOME`, or
`--adb` to locate ADB. Physical devices use `--target=android-device` and an explicit
serial. Emulator/device type is verified, not inferred from a name.

The adapter rejects production and ordinary debug package IDs. It accepts only
the Issen namespace ending in `.performance`, verifies debuggability, connects
to that process's WebView socket through its own ADB forward, and checks the
embedded source fingerprint before touching storage. Each sample clears only
the dedicated app's WebView local/session storage and reloads its fixture. Never
use that app identity for player progress. Browser process caches remain warm;
Android samples do not claim fresh-process isolation. Actual viewport and DPR
are recorded; desktop viewport overrides do not resize Android hardware.

Emulator profiles can diagnose Android lifecycle and WebView work, but timings
reflect the host and emulator graphics backend. They do not establish phone
battery life or heat. Physical testing remains necessary for sustained thermal
and energy conclusions. Native Perfetto scheduling/power-rail collection, screen
lock automation, cold process startup and long-duration soak orchestration are
not implemented in this first tooling batch.

## Earlier investigations

For the explicitly requested seamless-stage goal, isolated worker tools use
predecoded assets, fixed seed424242 and900x600 DPR1:

```sh
node tests/performance/benchmarks/measure-compose.mjs tmp/compose [tmp/raw-baseline]
node tests/performance/benchmarks/profile-compose.mjs tmp/compose-profile 0,4
```

The first records five fresh workers per stage and saves raw colour/map planes
for parity. An optional `ISSEN_COMPOSE_MATERIAL_SOURCE` pointing to a compatible
saved implementation under ignored `tmp/` supplies a benchmark-only control;
normal builds never use it. The profiler records three workers per requested
stage, native drawing/readback wall times and worker CPU profiles. Native times
include blocking graphics work and instrumentation overhead; do not compare
them directly with uninstrumented headline timings. These tools do not measure
physical mobile performance or resident GPU memory. Never overlap captures.

`benchmarks/` contains the existing isolated artwork benchmarks and film/opaque
pixel comparisons. `legacy/` retains the earlier development-server runtime
profiler and historical report summarizer. The old `scripts/` entry points remain
small compatibility wrappers so historical commands still resolve. The historical
summarizer intentionally reads the previous investigation's saved directories;
the new runner is the supported path for new whole-application measurements.

### Leaf renderer comparison

```sh
node tests/performance/benchmarks/compare-drift.mjs
```

This opt-in comparison freezes one production instrumented build and reuses the
standard target, scenario and collection helpers. It runs original curves,
retained Path2D, equal-count sprites and shipped-density sprites in interleaved
order, with five fresh contexts for title and normal combat, then separate
combat allocation diagnostics. It owns port 5298 and writes its build, source
fingerprint, raw samples and profiles beneath `tmp/performance/*-drift/`.

The benchmark-only transform selects a renderer and optionally disables the sprite
density reduction. It also records the combined CPU submission time for both leaf
depth passes. Equal-count comparisons isolate drawing more closely; shipped-density
comparisons include the new art direction's lower particle count. The transform is
not imported by normal builds. These desktop measurements do not measure physical
phone performance, native GPU execution time, battery consumption or GPU memory.

### Retired Canvas comparisons

W2 removed the Canvas scene renderer and its dual-backend comparison runners.
Historical reports remain as evidence; their commands describe the old implementation.
Native adapter/stroke controls formerly bundled with the dual-backend runner can
be recovered from the pre-refactor restore point for a separately authorized
profiling task. Do not select `renderer=canvas` against the current application.
No profiling was run during the runtime and lighting refactor.
