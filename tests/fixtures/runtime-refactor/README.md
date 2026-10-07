# Pre-extraction run checkpoints

These version-1 records were captured from the real runtime at W1 checkpoint
`5406e90`, before moving any runtime code. All use fixed gameplay seed 123456
and isolated browser storage, with tutorial skipped. The capture selected playing,
boss, standoff and shrine through existing runtime phase functions, stopped the
frame loop, and called the existing checkpoint writer. No player saves were used.

Capture command: `npx playwright test --config tmp/runtime-refactor/capture.config.ts`.
The ignored capture script and config are retained with the audit. Keep these
fixtures unchanged as the implementation evolves. Unit tests validate plain-record
restore and RNG continuity; browser tests restore and resume the real runtime.
