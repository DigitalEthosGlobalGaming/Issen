# Performance fixes

Follow-up to the completed rendering/runtime refactor at 2d27986.

## Baseline

The standard runner initially failed because its instrumentation referenced the
pre-refactor game.ts frame loop. The test-only transform now instruments
runtime/frame-bindings.ts and reads the modular owners through game.ts. The
application is unchanged for the baseline. Tool regression checks: seven pass.

Full measurements and per-issue results will be recorded here after collection.
Worker compose comparisons use five fresh workers for each of stages 0 and 1,
900 x 600 at DPR 1, fixed seed 424242, High density; preparation is outside the
compose timing. Raw colour, normal, surface and emissive planes are retained in
ignored tmp for before/after pixel checks.

## Planned issues

1. Bounded material-cutout reuse, scratch reuse, worker methods and bitmap copies.
2. Idempotent light bindings and investigation of geometry-pass detachment.
3. Cached live presentation views without mutable snapshots.
4. Change-only trial-objective DOM writes.
5. Readback contexts and loading-time artwork preparation/uploads.
6. Production source maps and Pages publication verification.
