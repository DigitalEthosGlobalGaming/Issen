# Runtime and lighting refactor — current checkpoint

Branch: `develop`. Immutable local/remote restore point: `pre-refactor`,
`ad353b36f7f1bde963a776a7f383f8f06e8a639c`. Develop has not been pushed.
Current committed source includes the native mist repair (`0cc7f69`) and
architecture ownership documentation (`d6c3b5e`). Version is 1.68.0.

## Completed implementation

- W1: layout-preserving 352 compact runtime images, exact data maps, optional
  emission, retained authoring PNGs. See asset-compaction-results.md.
- W2: 128-line composition root; plain-record state machines, phase owners,
  typed events, isolated presentation, preserved checkpoints; WebGL2 only.
  See runtime-refactor-results.md for module/scenario/behavior evidence.
- W3 phases 1–6: native three-target geometry and two-target HDR light pre-pass,
  deterministic 16-light budget, unified PBR/legacy and whole-scene composite,
  instanced grass/leaves, event and persistent lights, optional half-resolution
  depth/normal-aware sampling, named composer/post/film hooks.
  Contracts/examples are in docs/architecture/rendering.md.

## Verification and open run

The repaired W3 broad gate is TERMINAL, exit 0: all 279 PASS.
Command: `npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure`.
Log: tmp/lighting-refactor/w3-gate-repaired-broad-retry.log.
No browser/build jobs remain live. W3 checkpoint is complete under the explicit
pre-existing-failure rule; see docs/development/lighting-refactor-results.md.

- `npm run typecheck`: PASS; `npm test`: all 415 PASS.
  Logs: tmp/lighting-refactor/demon-mist-fix-{typecheck,unit}.log.
- Native six-file mist/composer/scene/film command: all 11 PASS, exit 0;
  exact command in tmp/lighting-refactor/demon-mist-fix-browser.log.
- `npm run test:production`: repaired source strict/build and 4 PASS,
  30.2s, exit 0; w3-gate-repaired-production.log.
- `ISSEN_ANDROID_BUILD_DIR=tmp/.verification-build-android` with
  `npm run test:android-web`: strict/build PASS; 3 PASS/2 FAIL, 34.2s,
  exit 1; w3-gate-repaired-android.log. This is not a passing Android suite.

## Proven pre-existing Android exceptions

1. offline.spec.ts:55 immediate pause/reload expects #paused /on/ and gets
   screen. Identical unchanged assertion fails on immutable pre-refactor:
   tmp/asset-compaction/android-recovery-baseline.log.
2. premium.spec.ts expects Support hidden. All three repeats on untouched
   pre-refactor fail its first visibility assertion (#bSupport, line 34);
   repaired develop fails its second (#support, line 35). Both runtimes
   explicitly expose the placeholder Support button and keep the closed
   screen mounted with opacity zero. No product behavior/assertion changed.
   Evidence: tmp/lighting-refactor/android-premium-baseline.log; command:
   `npx playwright test tests/android/premium.spec.ts --grep 'Free native closed-testing' --repeat-each=3 --workers=1 --config tmp/asset-compaction/android-baseline.config.ts --trace retain-on-failure`.

Baseline checkout tmp/asset-compaction/restore-baseline is detached at the
restore hash and tracked-clean; preserve it and existing native/store outputs.
These failures use the goal's explicit pre-existing-failure exception.

## Next steps — all required

1. W3 checkpoint is green except the two proven baseline Android failures.
   Commit this checkpoint, then continue Part 4 without a review gate.
2. Part 4 independent final strict/full units, both complete browser configs,
   production and Android web, startup graphics-error and context-loss coverage.
   Preserve terminal results; any new failure must be fixed or baseline-proven.
3. Recompute final byte totals from fresh verification builds, preserving W1
   historical evidence; write docs/development/refactor-final-report.md with
   requirement audit, module map, behavior changes, phone checklist, exact
   verification, exceptions/reverts/approximations, opt-in captures/future work.
4. Commit final report and complete status, then ONE `git push origin develop`.
   Verify pushed hash and clean tree. No early push or completion claim.

## Prepared final helpers (not yet applied)

Ignored tmp/lighting-refactor/ contains guarded, syntax-checked helpers:

- write-w3-checkpoint.py: requires full retry279PASS and recorded production4;
  writes W3 results/current checkpoint and fixes stale rendering-doc language.
  Run only after session22478 exits0, then inspect and commit the documentation.
- run-final-gates.ps1: sequential final strict/unit/rendering-v2/default/production/
  Android commands, two workers per browser config; stops on unexpected nonzero,
  writes final-gates.json. Android output must be classified, never assumed green.
- write-final-bytes.py: checks all compact/authoring hashes and frozen shell hash,
  measures fresh final builds and separate unsigned ZIP projections without a
  native build; preserves historical W1 evidence. Run after final builds complete.
- write-final-report.py: guards all terminal final gate counts/artifacts, rule import
  boundary, versions and restore hash; writes requirement audit, final report,
  index and complete handoff. Inspect actual Android failures and all report claims
  before applying; commit/push/remote verification still follow, never automated.

Run helpers from repository root with authorized sandbox escalation. These helper
drafts are disposable; repair them rather than rerun older integration scripts.

## Execution rules

No profiling/benchmarks/native/store builds, real-save changes, history rewrites,
or lit-only worktree changes. Source stays fixed during live browser tests.
Disposable evidence stays in ignored tmp. Repository writes and TS7/browser
commands require sandbox escalation in this session and are authorized by goal.
Use narrow verification during iteration; the remaining broad runs are explicit
workstream/final gates, not repeated checks after documentation edits.
Applied integration scripts are non-idempotent; do not rerun them.
