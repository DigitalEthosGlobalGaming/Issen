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

The initial integration applies preset particle density through the existing
cosmetic-density port. Frame rate is now a live control: 30/60 are always available,
120 requires a stable bounded rAF observation. An unsupported saved 120 choice
runs at 60 without overwriting the preference. Simulation remains independently
scheduled at 60 even with 30 fps rendering; unit checks compare exact update deltas
and combat time-scale/hit-stop consumption. Manual rate changes become Custom.
The remaining preset fields are validated storage contracts;
their renderer integrations and individual controls are still pending. Preset
starting values match the approved task and have not yet been tuned from new
measurements. MSAA usefulness has not yet been assessed.

Remaining work:

- Render-resolution scaling under the existing cap; Off/Half/Full lighting.
- MSAA visual assessment before exposing or dropping its control; independent
  ambient particles, grass density/cheap lit path, cosmetic weather, compose detail,
  preload and memory policies, gameplay FPS counter.
- Delivered-interval adaptive controller with hysteresis, ordered reductions,
  bounded recovery and inactive/loading/cinematic suspension.
- Portrait sheet/landscape panel, visible undimmed frozen-run or title showcase,
  live metrics, measured impact labels, 300 ms heavy-change debounce and Applying.
- Geometry/light dirtiness, static-filter baking, complete program warmup with
  parallel-compile support and context recovery; allocation profiling/fixes and
  selective shader-precision changes.
- Focused checks per chunk, then one final unit/browser/visual/performance pass,
  failure fixes as a batch and reruns of failed suites. Preserve and report any
  remaining failure instead of weakening assertions.
