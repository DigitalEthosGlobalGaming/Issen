# Graphics settings

The Graphics feature batch is in progress on develop. Settings schema 2 replaces
the old quality/debris fields with a validated `graphics` record. Schema 1 audio,
bindings, accessibility and vibration preferences survive migration; unknown
versions retain safe defaults. Runtime/adaptive values must never mutate saves.

Memory usage controls the existing main and worker loader budgets and combined
scene ledger. Changes coalesce for 300 ms; Applying waits for worker acknowledgement.
Unused cache entries and optional next scenes are released, while pinned inputs and
already-admitted required decodes survive reductions. Pinned overages become
evictable when their owners release; future admission uses the new budget. Memory
changes retain the active scene and do not rebuild its canvases or alter device
raster/decoded-image resolution limits.

Low uses the existing device budget, Normal adds 25% and High adds 50%. These are
initial values to revisit during the goal's final measurement checkpoint:

| Device policy | Low | Normal | High |
| --- | --- | --- | --- |
| Device memory at most 2 GiB | 256 MiB | 320 MiB | 384 MiB |
| Other mobile user agents | 384 MiB | 480 MiB | 576 MiB |
| Desktop | 512 MiB | 640 MiB | 768 MiB |

The combined CPU/GPU scene budget is twice the loader budget and includes the
existing browser overhead reserve. Higher budgets allow more retained artwork;
they do not promise higher FPS. Worker requests carry a separate stable device
decode-size budget so all material planes retain compatible dimensions across a
live cache-budget change.

`platform/graphics-settings.ts` owns preset records, validation, device
recommendation and manual-choice transition to Custom. Auto selects Balanced for
coarse-pointer touch devices or reported memory at most 4 GiB, and High otherwise.
The options root has a Graphics summary; presets are in Graphics and accessibility
remains in Display, linked from Graphics. Category resets stay independent.

While Graphics is open, its panel is a bottom sheet (58% maximum height) on
portrait phones and a right side panel (45% maximum width, capped at420px) on
landscape/desktop. The surrounding scene has no menu veil, including the scroll
theme. Controls scroll inside the panel and the heading remains visible.
Rendering uses the selected rate; simulation dispatch advances only presentation
clocks, ambient particles, cosmetic weather, apparel motion and presentation
camera/transition. Run time, combat, hazard weather and run randomness stay frozen.
Closing Graphics restores ordinary menu scheduling. The title-screen lantern,
embers, gust and idle-player showcase remains pending.

Ambient particles, grass density, cosmetic weather and combat cues have independent
runtime ports. Off removes ambient leaves and gusts; combat cues remain visible.
Frame rate is a live control: 30/60 are always available,
120 requires a stable bounded rAF observation. An unsupported saved 120 choice
runs at 60 without overwriting the preference. Simulation remains independently
scheduled at 60 even with 30 fps rendering; unit checks compare exact update deltas
and combat time-scale/hit-stop consumption. Manual rate changes become Custom.
Render resolution scales the memory-capped drawing ratio; rapid inputs coalesce
for 300 ms before a viewport rebuild and show Applying through scene readiness.
Off lighting forces flat material colour, Half halves HDR accumulation dimensions,
and session debug resolution still overrides the saved choice. Off currently uses
the same shader/pass infrastructure with neutral lighting; it is not a claim that
geometry and light passes have been eliminated. Unrelated audio changes no longer
request scenery preparation.

`platform/graphics-quality.ts` replaces the JS-work-gated density controller.
Two sustained one-second slow delivered-callback windows reduce rate, lighting,
resolution (10 points, minimum 50), particles, then grass. Stable cadence allows
recovery probes after ten seconds, in reverse order and within exact saved choices.
The controller reuses its effective record between changes, ignores JS work time,
resets sampling during loading/menus/cinematics/hidden state, and never saves
reductions. The Graphics menu shows active reductions. Callback intervals are
observations of scheduling, not independently verified physical presentation.

Preload next stage is a live toggle. Off suppresses the next-stage forecast before
the visit ledger is peeked, and removes pending or ready next-scene leases on the
next background sample, including busy frames. Re-enabling restores the same
forecast without advancing visits or changing seeds. Current-scene and same-scene
figure preparation remain available.

Foreground composition rechecks its requested identity after asynchronous cache
trimming, fog preparation and waiting for a prepared scene. A superseded request
is skipped before dispatch, allowing the latest scene to proceed. Composition
already executing in the worker is still allowed to finish; its obsolete result
cannot be presented. This prevents stale preflight work from creating additional
worker composition, rather than claiming an in-flight native draw can be aborted.

`platform/frame-metrics.ts` reports mean delivered-render intervals over at least
500 ms, reusing a snapshot and publishing at most twice a second. FPS is the
reciprocal of that mean, and ms is the interval per frame, not CPU/GPU work time.
Loading/hidden state and scheduler clock resets discard stale samples. Graphics
shows the readout at the top and requests continuous rendering at the selected
cap; it still freezes simulation. The optional gameplay counter is shown below
the HUD's lives, with change-only text writes and no per-frame formatting.
Its manual toggle becomes Custom and persists. The showcase and cosmetic preview
animation still remain pending.

Scenery detail changes decorative populations in all nine ordinary scenes:
meadow patches/treelines, ridge shrubs, blossom trees/petal deposits, hollow
shrubs, bamboo depths, snow strokes, courtyard shrubs, shore waves/foam, and
Moonwatch mist. Terrain, combat space and seeded landmarks remain. An explicit
detail is included in composition identity, prediction and live drawing; absent
detail retains legacy caller keys. Detail is independent of reduced motion.
Resolution and scenery changes share a 300 ms debounce, with the applied choice
read consistently during preparation and presentation. Scenery-only changes do
not resize the viewport. Next-scene leases invalidate on detail mismatch.

The native comparison shows distinct tiers in all nine scenes and exact legacy
High output in eight. Broken Shore has an unresolved strict equality failure:
460 displayed channels differ, maximum 28, isolated to its worker distant colour
plane; all eleven other plane hashes match. This is not classified as harmless
rounding. The assertion remains strict for the final failure pass. Existing
output retention is used; guaranteed previous-frame retention under memory
pressure and viewport resize remains pending.

Memory and anti-aliasing preset fields remain storage
contracts; their integrations/individual controls are still pending. Grass density
and its selector are connected. Low and Medium use a single instanced composite
draw with shared scenery lighting and scene ambient on uncovered sky, without
geometry-buffer writes. High keeps curved normals and geometry/composite passes.
All choices retain GPU wind, authored coverage and premultiplied alpha. Preset
starting values match the approved task and have not yet been tuned from new
measurements. MSAA usefulness has not yet been assessed.

Remaining work:

- MSAA visual assessment before exposing or dropping its control;
  memory policies.
- Portrait sheet/landscape panel, visible undimmed frozen-run or title showcase,
  cosmetic preview animation, measured impact labels, remaining heavy-change
  debounce and previous-frame retention.
- Geometry/light dirtiness, static-filter baking, complete program warmup with
  parallel-compile support and context recovery; allocation profiling/fixes and
  selective shader-precision changes.
- Focused checks per chunk, then one final unit/browser/visual/performance pass,
  failure fixes as a batch and reruns of failed suites. Preserve and report any
  remaining failure instead of weakening assertions.
