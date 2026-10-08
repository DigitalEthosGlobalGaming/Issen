# Runtime refactor results (Workstream 2)

Version 1.67.0 replaces the old closure with explicit domain owners, plain-record
character behavior and disposable event reactions. `src/game.ts` is a 129-line
composition root. The final workstream gates below are still pending; this report
does not claim that Workstream 2, lighting or the full goal is complete.

## Requirement evidence

| Goal requirement                                                      | Actual implementation and verification                                                                                                                                                                |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Explicit narrow context; separate gameplay/cosmetic RNG               | game/session/context.ts, presentation/context.ts, runtime/foundation.ts and named state-view projections; actual enabled/absent listener tests compare run/profile/RNG                                |
| Typed synchronous bus; registration order/nesting/disposal            | game/events.ts, runtime-events.test.mjs and phase-events.test.mjs; emit-only rule capabilities, copied/frozen nested offer/result values                                                              |
| Full phase lifecycle and input routing                                | game/session/phase-router.ts, game/phases/{waves,boss,standoff,shrine,death,between}.ts and complete passive controllers; phase-router/phase unit tests and real browser inputs                       |
| Plain records and state-machine tables                                | game/state-machine.ts, combat/grunt.ts, encounters/boss-states.ts, player/player.ts; state-machine/grunt-states/boss-states/player-states tests reject undefined states and retain clocks/record keys |
| Grunt variants; base/mirror/twin/spear registry                       | game/behaviour-registry.ts and live grunt/boss behavior registries; bounded actual winning/recovery scenarios cover all reachable boss states (Mirror intentionally has no feint)                     |
| Player/companions extracted                                           | game/player/player.ts and companions.ts; death/damage/companion actual scenarios preserve rescue/revival and listener isolation                                                                       |
| Rule kill split; progression/cosmetic listeners                       | combat/kill.ts, progression/combat-listeners.ts, presentation/kill.ts; enemy-kill and rule/RNG isolation scenarios                                                                                    |
| Seven-layer ordered composer; named insertion neighbours              | presentation/scene.ts and scene-composer.ts; scene-composer unit tests and actual presentation-readiness browser test                                                                                 |
| Drawing cannot mutate rules/RNG/saves/haptics                         | presentation-readiness.spec.ts compares actual run/RNG/local storage, guards combat/direct vibration and checks repeated draws; readiness commits once in runtime after drawing                       |
| Normal/Ronin/daily/trial/rush/standoff/shrine/death/results scenarios | runtime-scenarios.test.mjs drives actual owner APIs with fixed seeds, bounded combat, mistakes and one-time settlement; focused phase/session tests deepen coverage                                   |
| Old saved encounters remain playable; new records round-trip          | fixtures/runtime-refactor/{playing,boss,standoff,shrine}.json, runtime-checkpoints.test.mjs and runtime-checkpoint-fixtures.spec.ts; v1 issen.* keys/records retained                                 |
| Actual session UI ownership                                           | ui/wiring/{checkpoint,run-flow,run-start,results,shrine,trial}-feedback.ts; listener enabled/absent tests, deep result snapshots and lifetime disposal                                                |
| UI/admin/secrets owners; current mutable identities                   | ui/wiring modules and runtime/menus.ts/controls.ts; state-view/current profile tests and browser options/profiles/secrets/admin coverage                                                              |
| Runtime orchestration remains outside rules                           | runtime/frame-simulation.ts, scene-flow.ts, frame-bindings.ts/startup.ts; exact physical-move parity and live scene/loading/cinematic tests                                                           |
| WebGL2 only; clear unsupported/recovery error                         | rendering/scene-surface.ts, pixi/scene-painter.ts and graphics-error.ts; presentation/graphics-lifecycle.ts; graphics-errors.spec.ts and native backend checks                                        |
| No Canvas scene fallback/replacement                                  | Native sinks are required; Canvas/OffscreenCanvas remain texture preparation only. Pixi color/soft-light/overlay filters implement live grading and are retained, not fallback-only emulation         |
| Remove old enemy/boss adapters after consumers migrate                | Runtime/tests call current actual APIs; old exported updateEnemies/updateBoss/spawnEnemy/bossToIdle compatibility adapters removed separately                                                         |
| Adding an enemy type documented                                       | overview.md describes ordered registry entries and state table extension without a central type branch                                                                                                |
| Minor version/lock/title/changelog aligned                            | package.json, package-lock.json, ui/screens/title.html and public/changelog/index.html are 1.67.0                                                                                                     |
| Final source verification                                             | Full units, combined broad browsers, test:production and Android-web gates below; focused checks alone do not prove this row                                                                          |

Architecture locations are maintained in [overview](../architecture/overview.md)
and [rendering](../architecture/rendering.md). Checkpoint history and exact focused
commands remain in current-development-status.md and refactor-decision-log.md.

## Intentional behavior and ordering changes

No new content, balance changes or different input deadlines were intended.
Plain save records and separate gameplay/cosmetic randomness remain intact.

- Kill, parry/block, boss victory, standoff and damage feedback follows committed
  rule/profile values within the same input call. Cosmetic ordering/randomness
  can differ within that call; combat timing and gameplay RNG remain rules.
- Knife profile saving precedes its same-call trail/audio/HUD reactions.
- Revival HUD/pose feedback follows encounter restart; support redraw uses final
  committed lives. Hit stop, slow motion and rescue/revival deadlines remain.
- Saved encounter adoption cancels superseded title/cinematic scene work, fixing
  a pending same-scene callback that could clear restored enemies/configuration.
- Failed support-bonus persistence restores an originally absent claim marker,
  allowing retry without currency duplication; existing markers are restored.
- Replaced result-sequence callbacks are ignored and action state is bounded to
  the current sequence, preventing stale completion from enabling a newer screen.

The saved-encounter and support rollback defects were reproduced on the immutable
pre-refactor baseline before classification. Detailed implementation decisions and
reverts are in [decision log](refactor-decision-log.md). The exhaustive working
behavior log remains under ignored tmp/runtime-refactor/behaviour-changes.md.

## Final verification

Pending on final 1.67.0 source:

- `node --test tests/unit/*.test.mjs`
- `npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure`
- `npm run test:production`
- `ISSEN_ANDROID_BUILD_DIR=tmp/.verification-build-android` with `npm run test:android-web`

The known W1 Android encounter-reload failure was reproduced on pre-refactor.
It must be evaluated again for W2; it is not a blanket exemption for new failures.
Historical combined browser runs predate this source and are not the final gate.

## Manual phone play checklist

This checklist is supplied for the user; automated browser checks are not a claim
of physical-phone testing.

1. Start on a WebGL2-capable phone; rotate portrait/landscape and confirm readable
   menus, fitted controls and no scrolling across the arena.
2. Play normal and Ronin waves. Cut correct directions, deliberately miss a feint
   and check combo/life feedback, teaching freezes and wave pacing.
3. Parry and cut base/Twin/spear/Mirror duels, including an expired opening and
   Mirror's opposite-direction counter; confirm recognisable patterns.
4. Enter standoff, wait for the draw, win and deliberately lose another attempt.
5. Choose and reroll shrine offers, including an immediate blessing and a curse.
   Pause/reload at wave, boss, standoff and shrine; continue the same encounter.
6. Play a daily, a trial and rush. Check daily/trial equipment and progress stay
   separate from the normal profile, retry works and rewards settle once.
7. Take fatal damage, decline/accept Second Wind where offered, finish results,
   retry and return to title. Check support bonus and failed-save retry behavior.
8. Background/foreground the app and exercise graphics recovery where available.
   The run stays paused until explicit resume; unrecoverable graphics show Reload.
9. Check mute/volume, reduced motion, low quality, Large text and touch controls;
   inspect Armoury/tutorial/support previews without changing the live encounter.

## Future opt-in performance comparisons

No benchmarks, CPU/GPU/memory profiles, emulator captures or store builds were run.
A future authorized capture should compare pre-refactor and final runtime dispatch,
listener overhead, startup/load, frame CPU/GPU time, texture decode/upload/retention,
and Android background/context recovery under matched scenes and quality settings.
Asset byte measurements belong to [asset compaction results](asset-compaction-results.md).
Lighting measurements and the final all-workstream report remain Workstream 3/Part 4.
