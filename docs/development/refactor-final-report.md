# Issen asset, runtime and lighting refactor — final report

All three workstreams are implemented and final verification is complete on
`develop`, version 1.68.0, under the goal's explicit pre-existing-failure rule.
The final Android check has four passes and one baseline-proven failure;
all other final gates passed.
The immutable previous state is `pre-refactor` at
`ad353b36f7f1bde963a776a7f383f8f06e8a639c`. Delivery is one final develop push;
the closing summary supplies its verified commit hash.

## What changed

1. **W1, 1.66.8:** 352 layout-preserving compact runtime images (341 WebP and
   11 smaller lossless PNG exceptions), 258 redundant scalar maps and 78 black
   emissive maps removed. All 86 authoring PNGs, recipes/provenance remain.
   All 180 data-plane conversions are exact; colour mean ≤0.5/channel, maximum 8,
   exact alpha. Atlas sizes/windows/anchors/pivots/nine-slices remain unchanged.
   The idempotent script and generators/catalogue produce packed surface and
   optional emission. Existing loader structure remains.
2. **W2, 1.67.0:** `src/game.ts` is a 128-line composition root. Context ports,
   ordered synchronous events, phase controllers, plain-record character state
   tables and behavior registries own the rules. Presentation/UI are isolated.
   Existing encounter checkpoints and `issen.*` keys remain compatible.
   Canvas scene fallback, replacement/recovery fallback and old adapters are
   removed. Texture-preparation Canvas/OffscreenCanvas remain.
3. **W3, 1.68.0:** painter-owned native three-attachment G-buffer, two HDR light
   attachments and one fullscreen 16-point GGX light pass feed the ordered cheap
   composite. PBR and legacy masks share one model; no old-forward runtime switch
   remains. Grass/leaves are instanced with GPU motion. Existing scene sources
   and kill/parry/block flashes share a deterministic visible-footprint budget.
   Session half-resolution lighting and named scene/post/film hooks are available.

Detailed evidence: [W1](asset-compaction-results.md),
[W2](runtime-refactor-results.md), [W3](lighting-refactor-results.md),
[decisions/reverts](refactor-decision-log.md).

## Final module map

| Owner | Modules |
| --- | --- |
| Composition and orchestration | src/game.ts; src/runtime/{foundation,gameplay,presentation,frames,controls,startup}.ts and narrower frame/scene/reaction bindings |
| Narrow context, typed events, mutable identities | src/game/session/{context,state-view,runtime-state}.ts; src/game/events.ts; src/presentation/context.ts |
| Session and phase lifecycle | src/game/session/{run-flow,run-start,checkpoint-flow,phase-router,results}.ts; src/game/phases/{waves,boss,standoff,shrine,death,between}.ts |
| Combat rules and progression reactions | src/game/combat/{kill,damage,grunt}.ts; src/game/progression/{combat-listeners,encounter-listeners,run-records}.ts |
| Plain-record behavior | src/game/state-machine.ts, behaviour-registry.ts; combat/grunt.ts; encounters/{boss-states,boss-behaviours,boss-simulation}.ts; player/{player,companions}.ts |
| Presentation and named chains | src/presentation/{scene,scene-composer,environment-host,figures-host,post,feedback,kill}.ts and phase feedback owners |
| Lighting sources and effects clocks | src/presentation/{light-sources,event-lights,scene-light-sources,foxfire-pose}.ts; src/rendering/light-budget.ts |
| Native targets, lookup and foliage | src/rendering/pixi/{scene-painter,geometry-buffer,geometry-material,light-buffer,composite-material,lighting-composite-glsl,artwork-materials,grass-material,leaf-material}.ts; scene-grass.ts, scene-leaves.ts and scene/leaf-motion.ts |
| Graphics lifecycle and errors | src/rendering/{scene-surface,graphics-error}.ts; src/presentation/graphics-lifecycle.ts; src/ui/startup-loading.ts |
| UI, admin, secrets, session feedback | src/ui/wiring/ and src/runtime/{menus,controls,ui-base}.ts |
| Asset source/compact generation | scripts/assets/compact.mjs and compact.py; scripts/pbr/update-runtime-catalog.mjs; generated src/rendering/asset-material-catalog.ts |

`src/game/` imports neither presentation nor rendering. A new enemy behavior is
one registry entry/state table; visual definitions remain data. The adding-enemy
guide and placement tables are in [overview](../architecture/overview.md).

## Byte-size results

All values are bytes. The final fresh production/Android web output is compared
with unchanged pre-refactor builds using the same dependencies/settings.

| Scope | Before | Final |
| --- | ---: | ---: |
| Runtime plane set | 266,530,086 | 120,472,123 |
| Checked texture tree, including authoring originals | 266,530,086 | 181,824,601 |
| Production verification bundle | 261,053,490 | 120,634,870 |
| Production image bytes | 258,901,059 | 118,716,745 |
| Android web verification bundle | 284,964,042 | 144,518,330 |
| Unsigned APK-container ZIP estimate | 295,487,341 | 158,585,719 |

The checked tree retains 61,352,478 authoring bytes.
Final manifest verification rechecked all 86 authoring and 352 compact hashes,
the absence of all 258 redundant scalar and 78 zero-emission maps,
and every output is smaller than its input. Evidence/method is in ignored
tmp/lighting-refactor/final-byte-evidence/byte-results.json; the W1 measurements
were preserved separately. ZIP estimates reuse one frozen existing native shell,
omit META-INF signatures and deflate matched web assets at level 6. They are not
native builds, signed/installable APKs or store output. Existing dist/native/store
outputs remain untouched. No resizing/repacking was performed; decoded dimensions
and per-texture GPU storage remain unchanged. Omitted planes avoid uploads;
no decode-speed or frame-time claim is made without opt-in measurements.

## Behavior changes and accepted approximations

- Rule/profile values commit before same-call kill/parry/boss/standoff/damage
  feedback; cosmetic ordering may differ. Gameplay RNG stays separate.
- Saved encounter adoption cancels stale title/cinematic callbacks, protecting
  restored wave/enemy configuration.
- Failed first support-reward saves restore an absent claim marker, allowing
  retry without duplicate currency. Stale replaced-result callbacks are ignored.
- Revival feedback follows encounter restart and committed lives; input windows,
  rescue deadlines and recognizable wave/boss/mode behavior remain covered.
- Unsupported WebGL2/MRT/HDR/sampler features show the graphics error with Retry.
  Context loss pauses; restore rebuilds on the original canvas and requires
  explicit resume; the eight-second deadline shows Reload.
- New lights follow existing visual poses/effects clocks. Reduced Flashes suppresses
  event flashes; the quality override is session-only and preserves save settings.
- Below-cutoff translucency samples the covered surface behind it; legacy masks
  approximate the old response through GGX. Normals/depth/materials are quantized;
  half-resolution lookup may miss subtexel features. Curved grass normals and
  analytic leaf motion/lifetime sweeps preserve catalogue/order without per-frame
  CPU pose uploads. These are documented approximations, not alternate models.
- Prepared colour artwork, text and fog retain their authored lighting response
  with neutral material amount in the same target lookup/composite; PBR materials
  and foliage use their authored normal/surface response. The shared pipeline
  preserves existing colour-art grading and ordered transparency.
- Demon mist strip bounds align to logical pixels to fix exact repeated composition.
  Prepared original-to-aligned comparison: max RGB 3, mean RGBA 0.0094498, exact alpha
  and all five G/HDR targets; repeat RGB differences fell 548→0. Original seeds,
  radial gradients, centres and motion remain.

## Final verification

All commands ran on develop's final implementation source. Logs live under
ignored tmp/lighting-refactor/. No source edits occurred during browser runs.

| Exact command | Result | Log |
| --- | --- | --- |
| npm run typecheck | PASS, exit 0 | final-typecheck.log |
| npm test | All 415 PASS, exit 0 | final-unit.log |
| npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure | All 279 PASS, exit 0 | final-rendering-v2.log |
| npx playwright test --config playwright.config.ts --trace retain-on-failure | All 279 PASS, exit 0 | final-default-browser.log |
| npm run test:production | Strict/build and all 4 PASS, exit 0 | final-production.log |
| ISSEN_ANDROID_BUILD_DIR=tmp/.verification-build-android with npm run test:android-web | Strict/build PASS; 4 PASS/1 FAIL; exit 1 | final-android.log |

Both complete browser configurations include graphics-errors.spec.ts (failed
WebGL2/init identity/auxiliary deadline), geometry-buffer.spec.ts (missing MRT
Retry/native restore) and pixi-backend.spec.ts (active/paused main and auxiliary
loss/restore/deadline/original canvas). Thus final startup/context checks exercise
their actual routes, not just mocks or narrow substitutes. Units include all
actual seeded runtime scenarios, reachable boss states/windows, phase outcomes,
plain-record state validation and old/new checkpoint tests. Browser coverage also
includes draw/RNG/save/haptic isolation, native G/HDR/lookup/foliage/lights/hooks,
all 352 compact conversions and genuine pre-removal old-forward pixel references.

## Pre-existing failures and diagnostic retries

1. Android offline.spec.ts:55 expects #paused /on/ after immediate pause/reload;
   it fails identically on pre-refactor. Proof:
   tmp/asset-compaction/android-recovery-baseline.log, unchanged original assertion.
2. Android premium.spec.ts expects Support hidden. Three untouched-baseline repeats
   fail #bSupport at line 34; repaired develop reaches #support at line 35. Original
   and current runtimes explicitly expose placeholder Support and keep its closed
   opacity-zero panel mounted. Proof: android-premium-baseline.log, command
   `npx playwright test tests/android/premium.spec.ts --grep 'Free native closed-testing' --repeat-each=3 --workers=1 --config tmp/asset-compaction/android-baseline.config.ts --trace retain-on-failure`.

These are the goal's evidenced pre-existing-failure exceptions. Product behavior,
original assertions and timeouts were not changed to conceal them. Baseline checkout
tmp/asset-compaction/restore-baseline remains tracked-clean at the restore hash.
The final Android run passed the Premium case; its only failure was the original
offline reload-recovery assertion. The earlier W3 Premium failure remains historical
evidence of that test's startup-dependent visibility assumption.

An earlier W3 gate failed native mist equality and was repaired as above. Its first
repaired broad run had 278 PASS/1 FAIL before gameplay: Edge ERR_NO_BUFFER_SPACE
prevented src/main-game.ts loading. Unchanged focused repeats passed 3/3 (27.9s);
trace is retained under w3-modes-startup-evidence. Complete passing retries/final
runs are listed separately; the failed run is not represented as a passing suite.

## Completion audit

| Goal section | Authoritative completion evidence |
| --- | --- |
| Part 0/branches/rules | develop source/history, immutable local/remote restore hash, scoped audits/decision log, W1/W2/W3 version commits; no early develop push |
| W1.0 audit | tmp/asset-compaction/audit.md maps inputs/consumers, decoded redundancy and projections |
| W1.1–1.3 script/generation/runtime | Manifest/hash audit; six Python compaction cases plus catalogue/tool tests; optional-map loaders, generated catalogue/recipes and scalar absence; documented Pillow ≥12 dependency |
| W1.4–1.5 invariants/gates/docs/version | All 352 raw-browser comparisons, historical W1 native/Canvas checks before removal; final source hash audit; W1 results, updated AGENTS/inventory/PBR/rendering/changelog 1.66.8 |
| W2.0 harness | Function/dependency/RNG audit, runtime-scenarios/checkpoints tests, original saved phase fixtures, actual presentation isolation |
| W2.1 only WebGL2/recovery | Native-only source, removed fallback/adapters/tooling; both final broad configurations exercise actual failures/restore/deadlines |
| W2 phases 1–8 | Context/events, presentation/UI, all phase/kill/player/companion/state/registry owners; current 128-line root; complete units and live browser modes/checkpoints |
| W2 checkpoint/behavior/docs | Historical 401 unit / 254 browser / 4 production gate and baseline exception, runtime report, behavior log, phone checklist, ownership docs/version 1.67.0 |
| W3.0 audit and phases 1–4 | tmp/lighting-refactor/audit.md; native MRT/G/HDR/budget/GGX/normal/legacy/ordered lookup tests and genuine old-forward references; old shader removed with revert hash |
| W3 phases 5–6 | Native instanced grass/leaves, immutable source/event sampling, half-quality guide ablation, composer pass counts/current borrowed targets, minimal hook examples |
| W3 checkpoint/docs/version | lighting-refactor-results.md, full retry 279, production 4, evidenced Android exceptions, inspected screenshots, aligned 1.68.0 |
| Part 4 final verification | Exact terminal commands/results above, final-gates.json and final-requirement-audit.json |
| Part 4 deliverables | This report: module/byte/behavior/phone/verification/exception/revert/perf/future sections; final status/report commit and one verified develop push |

## Manual phone play checklist

These checks are for the user; automated browser results do not claim device testing.

1. Cold start/Retry on supported and unsupported graphics; rotate both orientations,
   check fitted UI/controls and intact transparency/material artwork.
2. Normal/Ronin: correct cuts, missed feints, combo/life feedback, teaching freezes,
   wave pacing, standoff win/loss and valid shrine pick/reroll/curse.
3. Base/Mirror/Twin/spear bosses: parry/block windows, expired openings, opposite
   Mirror counters, recognizable patterns and victory. Check glints/auras/flash.
4. Daily/trial/rush: mode equipment/progress isolation, seeded retry, once-only rewards.
   Fatal damage, Second Wind, results doubling/retry/title, failed-save reward retry.
5. Pause/reload waves/boss/standoff/shrine; continue the same encounter. Background
   the app, restore GPU resources, confirm explicit resume and deadline Reload.
6. Full/half lighting, low quality, Reduced Flashes/Motion, mute/volume, Large text:
   check grass/leaves, thin edges, armour/swords and lantern/ember/foxfire illumination.
7. Armoury/tutorial/support previews: original canvas/targets stay isolated; no run
   changes. Exercise touch navigation and unchanged catalogue crops/nine-slices.

## Reverted/skipped changes and future work

- Tight packing, split sprites, page stores, downscaling, dependency/lease manifests,
  KTX2 and the separate lit-only integration remain excluded; no reuse from that
  worktree was integrated. Original artwork and material provenance are retained.
- Eleven tolerance-valid WebP candidates were larger; lossless compact PNG is kept.
  No scalar mismatch family required retention; eight nonzero emissives remain.
- Temporary old-forward comparison metadata/shader were removed after verified
  captures; recoverable source: 472f60aa71787adec717adbf8f982109790925f6.
- Mist precision/dither/sampler/state experiments and leaf display-quantization
  trials were diagnostic or reverted. No tolerance workaround remains. Corrected
  stale fixtures/locators and their unchanged assertions are in the decision log.
- Rim lights, god rays, shadows and outlines were not built: only requested hooks.
  Native/store builds and physical-phone tests were not run.
- Future asset review: 1254-square character/outfit/headwear/weapon normal/surface
  atlases versus combat and largest Armoury crops;1774×887 scenery/debris sheets;
  1254 UI atlases versus CSS/DPI, 128 crests and 192 material maps. Review largest
  sampling footprint before any separately authorized dimension change.
- Maintain the stale Android Support test around completed startup/closed panel/
  locked billing state; investigate immediate reload recovery outside this refactor.
  GPU-compressed formats require preparation/composition support first.

## Opt-in performance captures

No tests/performance, benchmarks, CPU/GPU/memory profiles or device captures ran.
Suggested matched before/after captures at the goal's [perf] points:

- W2: runtime dispatch/listener overhead, frame CPU time, startup and pause/restore.
- W3 phase 3: old forward versus pre-pass at equal resolution/scene/light count,
  separating G/light/composite GPU cost and sprite-count/overdraw scaling.
- W3 phase 5: 1000+ grass/leaves CPU submission/pose/upload and GPU cost at matched
  density and catalogue/order; compare full/half lighting edge quality and cost.
- W1/final: download/APK bytes (measured above), cold decode/upload counts and
  residency, plus matched Android background/context restoration.
