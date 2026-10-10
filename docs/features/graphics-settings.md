# Graphics settings

The Graphics feature batch is in progress on develop. Settings schema 2 replaces
the old quality/debris fields with a validated `graphics` record. Schema 1 audio,
bindings, accessibility and vibration preferences survive migration; unknown
versions retain safe defaults. Runtime/adaptive values must never mutate saves.

`platform/graphics-settings.ts` owns preset records, validation, device
recommendation and manual-choice transition to Custom. Auto selects Balanced for
coarse-pointer touch devices or reported memory at most 4 GiB, and High otherwise.
The options root has a Graphics summary; presets are in Graphics and accessibility
remains in Display, linked from Graphics. Category resets stay independent.

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

Scenery, memory, anti-aliasing and FPS-counter preset fields remain storage
contracts; their integrations/individual controls are still pending. Grass density
is connected but the cheap single-pass path and its menu selector are pending. Preset
starting values match the approved task and have not yet been tuned from new
measurements. MSAA usefulness has not yet been assessed.

Remaining work:

- MSAA visual assessment before exposing or dropping its control; independent
  grass cheap lit path, compose detail,
  memory policies, gameplay FPS counter.
- Portrait sheet/landscape panel, visible undimmed frozen-run or title showcase,
  live metrics, measured impact labels, 300 ms heavy-change debounce and Applying.
- Geometry/light dirtiness, static-filter baking, complete program warmup with
  parallel-compile support and context recovery; allocation profiling/fixes and
  selective shader-precision changes.
- Focused checks per chunk, then one final unit/browser/visual/performance pass,
  failure fixes as a batch and reruns of failed suites. Preserve and report any
  remaining failure instead of weakening assertions.
