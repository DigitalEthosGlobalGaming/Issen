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
scenario, 3 seconds of warmup, 5 seconds of measurement (at least 10 seconds for
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
  10 seconds and guards that all nine stages and Demon actually appeared. Preparation,
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

For a failed full web run, a bounded recovery can reuse its exact saved build and
retain every completed sample:

```sh
node tests/performance/benchmarks/resume-run.mjs tmp/performance/<failed-run>
```

This writes a new folder, preserves the original failed results and records which
missing samples/diagnostics were completed. It rejects changed host, browser,
graphics or tooling identity. It neither rebuilds nor replaces successful samples.
A recovered run becomes passing only when all required repetitions and diagnostics
exist. Report the failure and recovery when using it as a baseline.

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

### Canvas / WebGL renderer comparison

```sh
node tests/performance/benchmarks/compare-renderers.mjs --port=5297
```

This opt-in timing comparison uses one frozen instrumented production build,
selecting `?renderer=canvas` or `?renderer=pixi` in fresh browser contexts.
Renderer order alternates across five repetitions per scenario. Defaults match
the suite's seed, High quality, Free edition, 390×844 viewport, DPR 2, three-second
warmup and five-second measurement. Title, combat, Demon Mirror, Glitch, Inferno
and the 100-enemy stress scene are included. Supported timing options such as
`--scenario`, `--repeats`, `--warmup`, `--duration`, `--viewport` and `--dpr` can
override these defaults. The observed backend is checked, so a failed WebGL
initialization cannot silently become a Canvas result.

The runner writes raw samples, source/instrumentation fingerprints, browser and
graphics metadata, and a Markdown summary beneath ignored `tmp/performance/`.
Measurements include the full rendering callback and native command submission;
they exclude deferred GPU execution. Pixi uses the shipped material lighting,
while Canvas keeps its painted appearance. Historical reports are context, not
matched baselines; use the paired current-build comparison for renderer deltas.
See the [5 October comparison](../../docs/features/webgl-performance-2026-10-05.md)
for measured results and the separate stress diagnostic.

For a before/after comparison of the rounded-stroke fixes in one build:

```sh
node tests/performance/benchmarks/compare-renderers.mjs --compare-strokes --scenario=combat,stress-100 --port=5297
```

This adds `pixi-legacy`, a benchmark-only variant disabling the cached outer
direction rings and textured straight round strokes. Canvas, legacy Pixi and
optimized Pixi rotate order between repetitions. The transform is fingerprinted
and fails if its source seams no longer match. It is absent from normal builds;
`legacyStrokes` has no effect in the shipped application. This control measures
these two changes without relying on earlier runs under different background load.
See the [rounded-stroke follow-up](../../docs/features/webgl-rounded-strokes-2026-10-05.md)
for implementation and measurement evidence.

To compare a renderer adapter change with preserved source snapshots:

```sh
node tests/performance/benchmarks/compare-renderers.mjs --adapter-baseline=tmp/webgl-adapter-baseline --port=5297
```

Before editing, save `src/rendering/pixi/scene-painter.ts` and `texture-store.ts`
under the supplied baseline directory. This mode compiles those snapshots as
benchmark-only virtual modules and selects the legacy painter in fresh contexts;
other scene modules and artwork are shared. Use it for adapter changes whose
baseline still works with the current scene contract. It cannot restore arbitrary
gameplay/art changes. The runner copies and fingerprints the snapshots alongside
the frozen build, rotates Canvas/legacy Pixi/optimized Pixi order, and records
paired percentage reductions and paired milliseconds saved. Normal builds do not
include either the snapshots or the `legacyAdapter` switch.
The [adapter optimization report](../../docs/features/webgl-adapter-performance-2026-10-05.md)
records the 1.61.2/1.61.3 comparison.
