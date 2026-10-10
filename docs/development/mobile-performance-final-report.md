# Mobile performance and transitions — verification report

App 1.69.58. **Exact leaf restoration remains unresolved.** Current focused,
checked production and Android web verification passes. The preceding full
browser run has 416 passes and three failures; two have focused follow-up below.
The prior integration checkpoint passed on 1.69.56.
The batching capture improves cold loading and has no
above-16-ms post-presentation tasks. This report separates implementation evidence from targets
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
The shared composer no longer registers fallback-era main-thread scenery
preloading. Future scenery belongs to the required worker runtime; local
reference composition still uses the shared image pool without speculation.
These configuration and browser-fixture results do not prove physical Android
compatibility.

Next-scene preparation reserves combined memory, composes and warms textures
before promotion. Incoming figures and weapons use the gameplay renderer's
existing sources. Hidden/busy states and obsolete geometry, quality, scene or
context identities cancel optional work. Ordinary drawing uploads publish their
reservation before reclamation. Optional preparation leaves a 32 MiB allowance
for required gameplay work. Local normal/surface planes request CPU backing to
keep straight-data uploads exact across context restoration; worker composition
continues to use GPU planes and bitmap transfers. Texture warming refreshes
the full job's admission once per synchronous upload batch, after each yield or
context change, instead of scanning whole-app memory per source. Admission
remains inside the 4 ms batch budget; cancellations can stop before allocation.

## Recorded measurements and their scope

| Measurement | Before | Recorded after | Scope |
| --- | ---: | ---: | --- |
| Drift nominal decoded RGBA bytes | 81,823,976 | 4,194,304 | Full source set; 94.87% reduction, excludes mip storage |
| Drift encoded bytes | 4,378,340 | 155,694 | Colour/emissive replacement; 96.44% reduction |
| Calm CPU render median, CPU rate 4 | 10.5 ms | 9.6 ms | Saved current vs new application; not isolated GPU timing |
| Gust CPU render median, CPU rate 4 | 10.9 ms | 10.4 ms | Controlled sustained gust, population/host variance documented |
| Cold transition median | 548.1 ms | 486.7 ms | Compatible historical control vs app 1.69.57, desktop 900×600/DPR1 |
| Warm transition median | 547.4 ms | 503.7 ms | Same retained comparison; no uniform per-stage speedup claim |
| Startup to title | 2897.4 ms | 2210.9 ms | Same desktop capture conditions; single-run comparison |
| Startup to first gameplay | 4099.6 ms | 2971.9 ms | Includes scene preparation; single-run comparison |
| Gameplay CPU render p95 | 4.2 ms | 3.2 ms | CPU submission time, not delivered-frame time |
| Gameplay delivered-frame p95 | 17.0 ms | 17.0 ms | Host does not demonstrate 120 Hz delivery |

The retained 1.69.57 capture records title/first gameplay at 2210.9/2971.9 ms,
CPU render p95 3.2 ms and delivered-frame p95 17 ms (600 intervals; 187 above
16.7 ms). CPU renders have one sample above 8.3 ms and none above 16.7 ms.
Cold/warm maxima are 835.9/834.4 ms. Texture warming medians are 35.0/35.2 ms.
Composition maxima are 509.2 ms cold / 504.4 ms warm. All eighteen
post-presentation windows have no task above 16 ms; maximum is 11.214 ms.
Evidence: `tmp/performance-scene-batch-admission-16957/results.json` and traces.

The preceding 1.69.56 capture had cold/warm medians 594.0/459.4 ms, and one
above-16-ms task:
17.257 ms, 1.331 seconds after cold stage 8 presentation. It contains a
16.615 ms animation callback, mapped through the saved source map to
`src/platform/frame-loop.ts`; the trace does not localize its inner cost.
This earlier result remains recorded; its inner cost was not localized.

Earlier app 1.69.49 medians were 487.8/457.2 ms with zero above-16-ms tasks.
Two counterbalanced contemporary baseline cold medians are 515.2/457.3 ms;
1.69.56 current medians are 528.1/534.5 ms. Current cycles have zero above-16-ms
tasks; baseline has 226/269, maxima 65.363/65.989 ms. Together these show host
variation and the cost of pre-presentation decoding/warming; do not attribute
the full latest median improvement solely to batching. Evidence:
`tmp/probes/cold-paired-16956/results.json`.

Current worker-only Meadow diagnostics, with predecoded inputs and intrusive
method wrappers/CPU sampling, attribute 437–716 ms to 213 software-canvas-to-GPU
draws in each composition. Total native drawImage is 456–733 ms; measured compose
is 612–906 ms. This identifies the remaining native-upload cost, not headline
timing. Evidence: `tmp/performance-compose-final-16956/results.json`.
Desktop timing does not demonstrate physical 120 Hz delivery.

Prepared promotion is separate from the cold/warm recomposition measurements.
The saved low-tier controlled nine-stage run records 17.0–26.8 ms transition
waits, including wrap; its higher-tier companion records 14.0–30.4 ms. These
precede the final admission changes and control phase entry, so they establish
the prepared-path behavior rather than current natural-run latency. Evidence:
`tmp/probes/rush-companion-parallel2-16949.json` and
`tmp/probes/rush-companion-admission-shared-worker-cache.json`. The later natural
Rush run confirms eight prepared promotions without measuring physical frame
delivery. Current browser checks assert no recomposition and no incoming figure
uploads/program creation after preparation.

An attempted four-slot override initially failed to reach Vite's separate worker
pipeline; that capture is marked invalid-experiment and is not four-slot evidence.
The corrected compiled worker is verified to use four slots. Its cold median
1118.6 ms and nine above-16-ms tasks (maximum 26.431 ms) provide no reason to
integrate it; the shipped worker remains on two slots. Both experiment outputs
are under `tmp/performance-scene-four-slots{,-verified}-16956/`.

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

A separate thirty-second active-gameplay capture using the existing seeded
performance driver records Demon Mirror through wave 4 (622 samples) and
Inferno through wave 3 (629 samples). Both have zero page errors or over-budget
samples. Peaks are 493,437,632 and 502,989,576 of 536,870,912 bytes; settled
end values are 490,323,796 and 407,895,072. Demon uses the game's fixed trial
loadout; Inferno uses pan/hisshou/mystic-rock/sumi. The first probe incorrectly
required the normal equipment in Demon and was corrected after checking the
trial's owning code. Saved samples are
`tmp/probes/gameplay-mode-memory-DPR2-16956-second.json`. These 50 ms samples
do not prove every transient, complete trials or every loadout. Corresponding
`mode-memory-{demon,film-inferno}-DPR2-16956.png` captures were reviewed: attack
cues, figures and scene atmosphere remain legible and coherent.

## Verification, visuals and open work

The final source audit confirms the runtime asset manifest includes only the
shared drift colour/emissive pair for airborne drift. Preserved authoring planes
are not an alternate runtime drift path; petal-ground maps belong to scenery.
Worker execution has one required-worker factory while retaining shared
composition. Forecasting uses the exact future visit without consuming it;
scene flow waits for incoming scene, drift and figure preparation before settling.

| Requirement | Evidence and remaining limit |
| --- | --- |
| Cheap drift and representative visuals | Shared padded atlas, associated-alpha generator, mip filtering and single lit pass; off/current/new calm/gust controls and daylight/dark/fire/gust review. Native mobile GPU savings are unmeasured. |
| Required workers and recovery | Capability rejection, startup/later failure, same-seed retry, stale reply, independent disposal and nine-scene composition fixtures. Physical WebView execution remains unverified. |
| Prepared transitions and figures | Exact forecast, promotion without recomposition, native figure/weapon preparation, pressure denial and cancellation fixtures. Current natural prepared latency is not a hardware timing claim. |
| Lifecycle and accessibility | Hidden/busy work, resize/DPR/quality invalidation, actual context loss, disposal, cinematic, reduced motion/flashes and low-quality checks. |
| Bounded resource ownership | Shared decoded/canvas/GPU/worker/transferred/reserved ledger, native upload admission and retirement checks; natural nine-stage and separate preview/mode samples. Opaque native residency and every transient/loadout are not proven. |
| Composition and presentation cost | Current maxima approximately 509/504 ms; native software-to-GPU draws profiled and explained. Current eighteen post-presentation windows have no task above 16 ms; the earlier 17.257 ms result remains recorded. |
| Game feel, saves and modes | Representative visual review plus ordinary browser/production checks; Demon/Inferno active samples and deterministic visit tests. No real saves changed. |

Current change: ten focused pacing/pixel/scene-memory units, thirteen native
warming/reservation/next-scene cases and four checked production cases pass,
including strict TypeScript, startup/run, landscape and offline sprite resize.
The final 1.69.57 unit run passes all 501 cases in 3.6 seconds. The full browser
run passes 416 of 419 cases in 18.9 minutes with two workers. Its failures are a
high-tier inspection re-entry readiness timeout, the existing single-pixel leaf
alpha restoration difference, and a local low-tier preload normal-plane mismatch
at cycle 2/stage 6/900×600. The inspection case passes in isolation in 13.3 seconds;
the normal-plane mismatch reproduces with one worker. A disposable extension of
the same test captures 631 differing channels in the affected normal plane;
rendered hashes also differ. This is not the leaf's single-byte result. A
CPU-backed local colour-mask experiment gives the same hashes and was reverted.
Logs: `tmp/{unit,browser}-final-16957.log`,
`tmp/browser-final-diagnosis-16957.log`, `tmp/preload-plane-16957.log` and
`tmp/local-cpu-mask-16957.log`. No assertion was changed and the full suite is
not reported as green.

The narrower atlas-mask CPU experiment makes the local comparison pass but
fails the worker lighting comparison (stage 0 mean difference 2.755 against
the existing below-1 limit); it too was completely reverted. The preceding
painter/upload modules pass one isolated local comparison, which does not
establish the cause. Both failed backing approaches were stopped.

The subsequent ownership audit removes the unused main-thread speculative
registration from shared composition, as required by the worker-only policy.
The existing local test now asserts that worker-only notifications cannot start
local preloading; all exact plane, rendered-frame and held-resource checks
remain. Both memory tiers pass all 27 rows in 2.9 minutes. Worker failure/retry
and all nine compositions pass. Logs: `tmp/composer-worker-only-preload-16958.log`
and `tmp/shared-composer-preload-removal-16958.log`. The latter's first run stopped
at the obsolete preload-ready assertion before it was corrected; it is not
reported as a fully passing run.

Current checked production/strict TypeScript and four cases pass in 18.8 seconds.
All five Android web cases pass in 17.3 seconds, including blocked external
networking, local fonts, preferences, reload recovery and free-edition gates.
The original Android recovery fixture paused during scene loading, when
`checkpoint-flow.ts` intentionally declines to save. It now waits for a ready
encounter, requires a stored checkpoint and waits for runtime initialization
after reload, retaining the strict paused/HUD assertions. Initial failed and
focused diagnostic results remain recorded. Current logs:
`tmp/worker-only-preload-production-16958.log` and
`tmp/android-web-worker-only-preload-16958.log`. Android web tests are desktop
execution of the offline bundle, not physical WebView evidence. No broad suite
or performance matrix was repeated for the unaffected worker composition path.

The 1.69.56 integration evidence is 500 unit tests, nine performance-tool tests
and 419 browser cases in 20.2 minutes,
including original strict leaf/local restoration checks. The leaf pass does not
erase previously established intermittency. Logs are under ignored
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

Remaining work: resolve the exact leaf restoration acceptance issue, retaining
the observed cold timing variation, limits of sampled memory
and the unresolved intermittent leaf restoration result. Physical 120 Hz delivery,
Android WebView execution and native residency remain hardware evidence gaps.
Grass geometry bandwidth/maps are a possible separate opportunity and were
not changed. No push, deployment, native package build or real-save modification
has been performed for this goal checkpoint.
