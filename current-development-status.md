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

## Final verification LIVE — poll session23280

W3 checkpoint is committed95fd1e3. Full repaired W3 retry TERMINAL exit0:
279PASS14.6m, w3-gate-repaired-broad-retry.log. Workstream source is complete
under the two baseline-proven Android exceptions below. Report:
docs/development/lighting-refactor-results.md.

Part4 final sequence is LIVE, session23280. Poll that exact handle; no source
edits/restarts while it runs. Invoked tmp/lighting-refactor/run-final-gates.ps1
from repo root. It runs sequentially: strict, full units, full rendering-v2,
full default browser config, production, Android web. Two workers per browser
config. Stops on any unexpected nonzero; Android nonzero must be inspected and
classified against the two existing baseline proofs, never assumed passing.
Logs: tmp/lighting-refactor/final-{typecheck,unit,rendering-v2,default-browser,production,android}.log.
Terminal command ledger: tmp/lighting-refactor/final-gates.json (currently2 entries).

Confirmed final strict exit0 and all415units PASS/exit0. Full rendering-v2 is
currently running. Default/production/Android have not yet run in this sequence.
No other live browser/build jobs remain. All final browser configs include the
required startup graphics errors and main/auxiliary loss/restore/deadline cases.
No develop push yet; allPart4 report/audit/bytes/delivery work remains.

Earlier W3 repaired production4PASS30.2s and Android3PASS/2FAIL34.2s are checkpoint
results, not this final sequence. An earlier repaired broad run278PASS/1FAIL15.1m
was an Edge ERR_NO_BUFFER_SPACE request for src/main-game.ts before title/gameplay;
unchanged focused repeats3PASS27.9s and complete retry279PASS above supersede it.
Trace retained in w3-modes-startup-evidence. No source/assertion/timeout change.

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

1. Poll session23280 to terminal. Inspect final-gates.json and every exact log;
   if a gate failed unexpectedly, diagnose it without restarting passed gates.
   Preserve failed trace evidence before new browser output replaces it.
2. Once all final commands are terminal/accepted, run write-final-bytes.py on
   fresh production/Android builds, preserving W1 historical evidence.
3. Review/apply write-final-report.py; its guards require all final gate scopes,
   hashes, version/restore/import-boundary/artifact proof. Inspect every report
   claim against actual output, including Android exception lines/counts.
4. Commit the final report/status then ONE git push origin develop. Verify
   clean status/local HEAD/origin hash, immutable restore; only then complete goal.

## Prepared final helpers (not yet applied)

Ignored tmp/lighting-refactor/ contains guarded, syntax-checked helpers:

- write-w3-checkpoint.py was APPLIED and committed95fd1e3; do not rerun.
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
