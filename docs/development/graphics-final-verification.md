# Graphics final verification — 2026-10-10

Application version1.70.18, tested source commit `8588a17` on develop.
Implementation was frozen for this checkpoint. The goal remains unfinished;
this report does not certify release readiness. Assertions and tolerances were
not changed, and failed suites were not rerun without fixes.

| Check | Result |
| --- | --- |
| Application unit suite |530 passed,0 failed |
| Browser and native visual comparisons |421 passed,21 failed;442 total,26 minutes |
| Checked production build / strict TypeScript |Passed |
| Bundled production tests |3 passed,1 failed |
| Performance tooling units |9 passed,0 failed |
| Performance integration |23 scenarios passed;46 timing samples,23 separate diagnostics,0 errors |

Commands: `npm test`, `npx playwright test`, `npm run test:production`,
`npm run test:performance-tools`, and
`npm run test-performance -- --repeats=2 --warmup=500 --duration=1000`.
Browser tests include the native pixel/visual comparisons; there is no separate
visual-only suite. Performance covered every standard scenario in full mode,
with shorter integration samples rather than the default five-repeat benchmark.
Cinematic samples retain their30-second minimum. These results establish
scenario execution/invariants, not mobile FPS improvements or release timing
confidence. No APK, deployment, push or real player-save changes were performed.

## Unresolved browser failures

The observations below explain each failed assertion. Root causes have not all
been established; they must not all be classified as harmless or pre-existing.
Some expected pass/rate counts need review against the new Graphics behavior.

| Test | Observed failure |
| --- | --- |
| `armory-inspection.spec.ts:4` | Low-memory preview width419, expected558. Resolution policy/fixture expectation needs review. |
| `companion-selection.spec.ts:102` | Native context-restoration pixels differ by255, expected identical. |
| `composer-light-passes.spec.ts:3` | Lighting pass counts `[3,5]`, expected `[4,5]`; review dirty-pass reuse expectation. |
| `daily.spec.ts:3` | End-run click timed out after30 seconds. |
| `equipment-rebalance.spec.ts:3` | Startup loading remained after reload at the30-second deadline. |
| `feature-plan-06.spec.ts:142` | Saved checkpoint phase was boss, expected standoff. Save/transition failure needs investigation. |
| `geometry-buffer.spec.ts:3` | Clipped geometry coverage alpha0, expected255. |
| `geometry-buffer.spec.ts:238` | Restored geometry pixel was zero, expected white. |
| `high-refresh-rendering.spec.ts:3` | Runtime reported60 FPS/two renders, expected120/three; review display-support fixture. |
| `instanced-grass.spec.ts:3` | Nine retained draws, expected ten; review pass-reuse expectation. |
| `instanced-leaves.spec.ts:225` | One restored alpha channel differs by one byte; geometry targets match and GL error0. Existing strict native rounding failure remains. |
| `light-buffer.spec.ts:163` | Restored HDR pixel was zero, expected nonzero output. |
| `light-target-bindings.spec.ts:101` | Active geometry bindings empty, expected `[0,1]`. |
| `local-input-lifetime.spec.ts:4` | Restored scenery difference255 exceeds the1-byte limit. |
| `presentation-readiness.spec.ts:3` | Geometry/light calls2 each, expected4 each; review unchanged-frame reuse expectation. |
| `scene-image-preload.spec.ts:78` (local,2 GiB) | Incoming normal-plane hash differs at case2:6. |
| `scene-image-preload.spec.ts:78` (worker,2 GiB) | Evaluation exceeded the240-second deadline. |
| `scenery-detail.spec.ts:4` | Broken Shore High/legacy comparison differs in460 displayed channels. Prior distant-colour mismatch remains unresolved. |
| `startup-scene-ownership.spec.ts:5` (worker) | Renderer backend loading, expected layered. |
| `webgl-graphics-lifetime.spec.ts:4` | Restored pixels do not match the original. |
| `worker-recovery.spec.ts:16` | Retry backend still loading at the5-second assertion deadline. |

The bundled production failure is `tests/production/ink-renderer.spec.ts:3`:
offline-resize flow observes loading instead of layered at the5-second deadline.
Restoration failures require checking the new asynchronous shader recovery
boundary as well as actual output; the passing warmup tests alone do not dismiss
these failures. No further implementation or speculative fixes were attempted
during this requested commit-and-report checkpoint.

## Unfinished feature work

- Measured High/Medium/Low labels on each Graphics option are not implemented.
- Final preset tuning/documented final values are not completed. Starting values
  remain in use. The two-sweep Graphics comparison completed32 arms, but render
  timing varied substantially (baseline medians5.4 and2.5ms); this is insufficient
  for a confident per-option timing ranking. Nominal GPU storage was lower for
  Low/Balanced, but this does not prove mobile speed. Preserve the measurements
  rather than inventing labels or FPS claims.
- The failures above remain unfixed. Required failure-batch fixes, reruns and a
  requirement-by-requirement completion audit remain outstanding.

## Evidence

- Logs: `tmp/final-graphics-verification/{unit,browser,production,performance-tools,performance}.log`.
- Browser captures: `tmp/test-results/browser/final-graphics/`.
- Production captures: `tmp/test-results/production/`.
- Performance: `tmp/performance/2026-10-10T10-02-50.702Z-f28e8883/`.
- Graphics measurements: `tmp/performance-graphics-options-recovered/results.json`.
  Recovery reused the stopped run's exact build and six completed samples after
  correcting a bundled probe import and an incompatible leaves-required guard
  for Particles Off. Earlier failed evidence remains in the original folders.
