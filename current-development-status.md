# Performance fixes in progress

Requested follow-up to completed refactor at 2d27986, on develop. Preserve the
existing pre-refactor restore point. Six independently committed issues are
planned: compose baking, light bindings, live views, objective DOM updates,
artwork pre-warming, and production source maps.

The standard performance runner needed its test-only anchors updated for the
modular runtime. Application code is still unchanged. The full baseline is
running under tmp/performance/2026-10-08T08-52-30.463Z-fe2d6507; logs are under
tmp/performance-fixes-baseline.log. Wait for baseline completion, then run
tests/performance/benchmarks/measure-compose.mjs for stages 0/1 before editing.
The compose benchmark retains raw planes for visual parity checks.

Baseline tooling repair: test:performance-tools passes all seven cases.
Formatting the plugin after the initial build changed its file fingerprint but
not its instrumentation; use a fresh matching-tool baseline for automated
comparison or disclose that distinction in the report. No application changes,
version bump or deployment have occurred yet.

# Refactor complete

All three workstreams and final implementation, verification and reporting are
complete on `develop`, version 1.68.0, under the goal's baseline-failure exception.
`pre-refactor` preserves the previous state at
`ad353b36f7f1bde963a776a7f383f8f06e8a639c` and must never be modified.

See [the final report](docs/development/refactor-final-report.md) for the module
map, measured bytes, behavior changes, accepted approximations, phone checklist,
exact verification, exceptions, reverts and optional future work.

- Strict TypeScript: PASS.
- Full units: all 415 PASS.
- Full rendering-v2 and default browser configurations: all 279 PASS in each.
- Production strict/build and all four cases: PASS.
- Android strict/build: PASS; four cases PASS, one reload-recovery case FAIL.
  The identical unchanged assertion fails on immutable pre-refactor. The earlier
  intermittent Premium visibility failure is also baseline-proven and passed
  the final run. Android is not described as a green suite.

All verification processes are terminal. No implementation work remains.
The report/status commit is the final delivery point: this session makes one
develop push and verifies its hash against origin/develop. The closing summary
records that hash. Future work should start from this finished refactor rather
than repeat or repush its completed checkpoints.

Historical evidence is in the workstream reports, decision log and ignored tmp.
Profiling remains opt-in. No native/store builds, real player-save changes,
history rewrites or lit-only integration were performed.
