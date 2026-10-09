# Mobile performance and transitions — completion report in progress

App 1.69.56. **The goal is not complete.** Current production verification is
green; the full browser integration run and remaining mode-memory/timing work
are outstanding. This report separates implementation evidence from targets
that have not been demonstrated. See [current handoff](../../current-development-status.md)
and [recorded checkpoints](mobile-performance-progress.md).

## Implemented changes

Drift uses a single 1024×512 colour atlas and matching emissive plane. Each of
32 cells is 128 px with 120 px artwork and a four-pixel gutter. The reproducible
[generator](../../scripts/assets/drift-atlas.py) uses associated-alpha resizing.
Drift-only mipmaps use linear filtering between levels. Instancing, cosmetic
motion and depth layers remain; drift draws once per layer without geometry
buffer writes or normal/surface sampling. Scene light lookup supplies lighting,
scene ambient handles empty background, and fire retains emission. The old PBR
path survives only in an immutable performance-control build.

Scenery preparation requires module workers, OffscreenCanvas and bitmap
creation. Failure terminates the worker, cancels pending work, retires resources
and settles callers. Retry starts a fresh generation with the same scene/seed;
stale replies cannot replace it. Startup and later failures have visible retry
treatments. Capacitor declares WebView 111 and an offline static error page.
These configuration and browser-fixture results do not prove physical Android
compatibility.

Next-scene preparation reserves combined memory, composes and warms textures
before promotion. Incoming figures and weapons use the gameplay renderer's
existing sources. Hidden/busy states and obsolete geometry, quality, scene or
context identities cancel optional work. Ordinary drawing uploads publish their
reservation before reclamation. Optional preparation leaves a 32 MiB allowance
for required gameplay work. Local normal/surface planes request CPU backing to
keep straight-data uploads exact across context restoration; worker composition
continues to use GPU planes and bitmap transfers.

## Recorded measurements and their scope

| Measurement | Before | Recorded after | Scope |
| --- | ---: | ---: | --- |
| Drift nominal decoded RGBA bytes | 81,823,976 | 4,194,304 | Full source set; 94.87% reduction, excludes mip storage |
| Drift encoded bytes | 4,378,340 | 155,694 | Colour/emissive replacement; 96.44% reduction |
| Calm CPU render median, CPU rate 4 | 10.5 ms | 9.6 ms | Saved current vs new application; not isolated GPU timing |
| Gust CPU render median, CPU rate 4 | 10.9 ms | 10.4 ms | Controlled sustained gust, population/host variance documented |
| Cold transition median | 548.1 ms | 487.8 ms | Historical compatible control vs app 1.69.49, desktop 900×600/DPR1 |
| Warm transition median | 547.4 ms | 457.2 ms | Same retained comparison; current 1.69.56 timing still required |

The app 1.69.49 capture records title/first gameplay at 2137.4/2608.0 ms,
CPU render p95 3.0 ms and delivered-frame p95 17 ms. Eighteen post-presentation
two-second windows have no tasks above 16 ms (maximum 9.35 ms). Meadow compose
is 526.7 ms cold / 568.1 ms warm; other stages are below 500 ms. The older
meadow profile attributes most drawing time to native canvas uploads, but is
not a profile of the current build. These timings must remain labelled historical
until the stable final matrix is captured. They do not demonstrate 120 Hz.

The combined ledger counts registered main decoded images/canvases/GPU storage,
worker decoded/canvas storage, transferred planes and pending reservations. Its
decoded tiers are 256/384/512 MiB and combined tiers 512/768/1024 MiB. Estimates
include 64 MiB plus output-surface allowance for opaque native overhead.
This is nominal accounting, not measured browser-process or physical GPU residency.

The heavy-equipment natural nine-stage Rush capture peaks at 518,470,468 of
536,870,912 bytes over 17,152 frame/worker sample boundaries. Eight next scenes
promote prepared; the wrap uses foreground loading. Three cinematic Demon and
real inspection cycles peak at 492,779,248 bytes for pan portrait and
485,163,528 for koken landscape, both low-memory tier/DPR2, with no page errors.
Second and third settled cycles are stable. The latter use 50 ms sampling plus
phase snapshots; they do not cover every transient, Demon Mirror combat,
Inferno gameplay or all loadouts.

## Verification, visuals and open work

Current evidence: 500 unit tests, nine performance-tool tests and all four
checked production cases pass, including strict TypeScript, startup/run,
landscape and offline sprite resize. The 419-case browser suite is running;
do not describe its partial results as a pass. Logs are under ignored
`tmp/{unit,performance-tools,production,browser}-integration-16956.log`.

Representative before/after daylight, dark, fire and gust screenshots are under
`tmp/probes/drift-scenes/`; controlled lighting/sky/emission checks are under
`tmp/probes/drift-new/`. Their recorded review preserves readable ink silhouettes
and glowing fire. They are representative comparisons rather than pixel oracles.

The exact local restoration issue is fixed with native inputs, geometry, HDR
and resolved output all matching. A separate leaf restore intermittently differs
by one alpha byte despite exact inputs/geometry/HDR. Dithering, invariant shader
outputs, second-AA removal, sampler precision, flat colour and opacity rounding
experiments were rejected and reverted. No assertion was relaxed. The bounded
native-rounding proposal remains review-only and requires explicit approval.

Remaining work: terminal browser results and focused failure diagnosis; combined
memory observations during Demon Mirror and Inferno gameplay; current stable
startup/cold/warm/compose/frame measurements including upload-reservation cost;
final requirement audit and report completion. Physical 120 Hz delivery,
Android WebView execution and native residency remain hardware evidence gaps.
Grass geometry bandwidth/maps are a possible separate opportunity and were
not changed. No push, deployment, native package build or real-save modification
has been performed for this goal checkpoint.
