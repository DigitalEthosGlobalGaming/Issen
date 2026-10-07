# Refactor decision log

- 2026-10-07 — preparation — use `pre-refactor` at `ad353b3` as the immutable restore point; work directly on `develop` — dated restore branch — requested name was available and develop matched origin — restore from that branch without rewriting history.
- 2026-10-07 — W1 audit — preserve base artwork and diffuse separately, plus all authoring PNGs — selecting just one colour plane — both have consumers and original art must survive — remove compact runtime siblings and restore URL references.
- 2026-10-07 — W1 conversion — use Python/Pillow through `scripts/assets/compact.mjs`, with `ISSEN_PYTHON` selecting the interpreter — adding sharp — existing PBR installer already requires Pillow; method-6 WebP supports exact data and alpha checks — revert the asset tool commit; original copies live under ignored `tmp/asset-compaction/originals/`.
- 2026-10-07 — W1 conversion — tune colour quality through 90, 95, 98, 100, then lossless when needed — relaxing colour tolerances — preserve mean <= 0.5, maximum <= 8 and exact alpha — re-encode from original copies with the same validation.
- 2026-10-07 — W1 audit — existing build/APK sizes are inventory only; matched projections require fresh verification web builds — comparing stale generated outputs — stale outputs cannot establish compression gains and store builds are excluded — replace estimates with final verified bundle accounting.

- 2026-10-07 — W1 loader — require prepacked surface data and omit scalar URLs from runtime catalogs and player/enemy loaders — retaining main-thread scalar packing — all 86 families have validated packed surfaces; runtime no longer needs separate scalar files — revert the loader preparation commit.
- 2026-10-07 — W1 generation — keep six-map authoring ZIPs for frame compositions and provenance; installation packs surfaces, compacts runtime maps, then refreshes the catalog — compacting raw exports before composition — existing frame recipes need individual scalar data before the final aligned surface is produced; final installed runtime set is compact — revert the installation integration commit.
- 2026-10-07 — W1 migration — stage WebP outputs while retaining generated PNGs, migrate URLs, then delete generated PNGs in a separate commit — combining conversion, migration and deletion — required concern-separated commits and recoverable originals — restore generated PNGs from ignored originals or pre-refactor.
- 2026-10-07 — W1 conversion — encode with four bounded read-only workers; retain deterministic parent-only output and manifest writes — serial encoding — images are independent and the utility can prepare them concurrently without changing any encoding setting, tolerances or runtime scheduling; intentionally stopped and resumed the verified serial task after five compaction tests and a browser readback probe passed — set ISSEN_ASSET_WORKERS=1 or revert the worker-tool commit.
- 2026-10-07 — W1 cache parity — composite a procedural zero-emission scratch plane with the original coverage and blend mode when emission is absent — clearing emission with destination-out — destination-out incorrectly removed prior additive emission; exact comparison against explicit zero maps passed across seven blend modes, preserving opaque alpha where the former map did — revert the blend-parity commit.

- 2026-10-07 — W1 generators — hash-check staged zero-emission omissions and prefer existing emitting WebP outputs — trusting stale omission records — regenerated emitting maps must not be hidden by the one-off conversion manifest — revert the generator-maintenance commit.
- 2026-10-07 — W1 regeneration — preserve initial backups and store changed later inputs under hash-addressed regenerated-originals — overwriting restore inputs or rejecting all changed exports — future material generation must remain usable without destroying the original restore evidence — revert the backup-maintenance commit; both original versions stay under ignored tmp.
- 2026-10-07 — W1 documentation — refresh installed plane links after compaction with shared-directory grouping — leaving six-map links after removal — future installs must document only the runtime planes while keeping recipes, source links and provenance — revert the documentation utility commit.

- 2026-10-07 — W1 encoding — use lossless `.compact.png` runtime siblings for eleven small colour assets whose tolerance-valid WebP increased bytes — larger WebP or relaxed colour tolerances — lossless recompression makes all eleven smaller, preserves authoring originals, colour chunks and pixel placement — restore manifest targets and remove compact siblings.
- 2026-10-07 — W1 byte baseline — build `pre-refactor` in an isolated ignored detached checkout with linked dependencies — stale dist/APK inventories or the post-loader baseline — matched original web and Android web builds establish 261,053,490 and 284,964,042 total bytes, each with 258,901,059 image bytes — discard ignored verification outputs.

- 2026-10-07 — W1 readiness — count only present weapon plane URLs in readiness — counting the undefined optional-emissive property — the latter kept startup blocked after zero-map removal; added a browser assertion for readiness and no emission request — restore the required-emission catalog and prior readiness predicate together.

- 2026-10-07 — W1 verification — add `ISSEN_ANDROID_BUILD_DIR` for Android web verification output under ignored tmp — overwriting the existing mobile build — preserve existing build inventory and satisfy disposable-output rules without changing normal Android builds — remove the optional config override.
- 2026-10-07 — W1 verification — record Android encounter-reload failure as pre-existing — changing unrelated runtime checkpoint flow during asset work — the original assertion fails on both compact develop and the untouched pre-refactor Android web build; logs in tmp/asset-compaction/android-recovery-{recheck,baseline}.log — investigate checkpoint lifecycle separately; no assertion/tolerance change.
- 2026-10-07 — W1 APK accounting — report unsigned ZIP container projections using one frozen debug native shell and matched fresh Android web builds — stale APK comparison or a store/native build — honors the no-store-build rule and isolates web-asset savings; projections are neither APK build results nor installable APKs — discard ignored projection ZIPs and JSON.

- 2026-10-07 — W1 regeneration — remove validated superseded compact emission when a later export becomes zero and accept compact PNG surface exceptions — keeping stale emitting siblings or requiring WebP for every family — later installations must preserve current omission and size policies; round-trip emitting-to-zero regression test passes — revert the regeneration cleanup commit.

- 2026-10-07 — W1 checkpoint — complete asset work with the proven pre-existing Android recovery failure recorded — changing unrelated checkpoint behaviour during asset compaction — all conversion, rendering, strict type, unit and production gates pass; the goal explicitly permits evidenced pre-existing failures — restore W1 from pre-refactor or revert the ordered W1 commits.

- 2026-10-07 — W2.0 harness — capture real version-1 checkpoints before extraction and seed current-export scenario drivers — synthetic checkpoint fixtures or exact per-tick snapshots — preserves actual restore compatibility and outcome invariants; inline input handlers must migrate to new phase/rule APIs as those appear — revert the harness checkpoint, preserving the ignored audit and source snapshot.

- 2026-10-07 — W2.1 surfaces — explicitly acquire WebGL2 and pass its context to Pixi; use graphics Retry/Reload errors with fixed canvas identity — relying on Pixi's preferred-version flag or Canvas substitution — Pixi's installed context system permits WebGL1 fallback; the user requires WebGL2 only — revert the surface lifecycle commit.
- 2026-10-07 — W2.1 blends — retain the owned blend filters in canvas-blends.ts — removing all Canvas-named code — they implement live Pixi film grading and translucent compositing, rather than an alternate rendering backend; texture-preparation Canvas also remains — restore prior blend definitions if a later rename changes output.

- 2026-10-07 — W2.1 materials — require native material sinks, explicit cached Canvas preparation contexts and prepared Armoury surfaces — implicit Canvas colour-only material branch — enforces one live renderer while retaining aligned texture baking — revert the native-material checkpoint.
- 2026-10-07 — W2.1 tests — migrate scene fixtures and comparisons to isolated native painters; anchor runtime harnesses at artworkReady assignment — injecting at the runtime return — original hooks published only after artwork readiness; early publication failed the unchanged maximum-2 repeat-draw tolerance — restore prior test hooks together with the old runtime lifecycle. No tolerance relaxed.

- 2026-10-07 — W2.1 films — remove Canvas self-copy storage and noir/glitch bodies; require native film and SVG path sinks — retaining dead alternate film code — scene films now run only on WebGL2; timing/accessibility/pixel-region tests migrated and passed — revert the native-film checkpoint.

- 2026-10-08 — W2.1 comparison cleanup — physically delete Canvas-only film parity test/reference and comparison wrappers, then the dual-backend renderer runner in separate deletion commits — keeping commands that select the removed backend — the user explicitly rejects the alternate renderer and its comparison tooling; native film timing, accessibility, pixel-region and isolation coverage passed first — recover tooling from pre-refactor for an explicitly authorized profiling task. Native-only adapter controls formerly bundled with the dual-backend runner are retired with it; no profiling executed.

- 2026-10-08 — W2.1 checkpoint — finish Canvas removal before runtime extraction — moving code while alternate rendering paths remained — broad run passed 249 cases; three unmigrated/asynchronous scene fixtures were corrected without changing assertions and all six focused cases passed; strict types and all 265 unit cases green — revert the ordered W2.1 commits; pre-refactor remains immutable. This combined coverage is not an uninterrupted broad-suite pass.

- 2026-10-08 — W2 context/events — use generic GameContext composition with separate gameplay/service and presentation contracts; retain transitional getters before moving owners — copying every closure local into a universal context — gameplay imports no renderer/presentation types and module consumers can receive narrow slices; original RNG/reference ownership remains — revert the foundation commit.
- 2026-10-08 — W2 events — snapshot subscriptions per synchronous delivery; nested emissions finish immediately, and listener exceptions propagate — deferred or silently isolated listeners — deterministic order is required; duplicate subscriptions and idempotent unsubscribe are tested — revert the event-bus foundation.

- 2026-10-08 — W2 presentation boundary — settle scene-ready gameplay continuation in runtime orchestration immediately after drawing — leaving phase/spawn mutations in drawScene — direct repeated drawing must not change gameplay; live timing remains the same frame, and readiness/checkpoint/isolation cases pass — revert the boundary commit before moving scene composition.

- 2026-10-08 — W2 presentation move — move the unchanged draw body into presentation/scene.ts with explicit scene inputs and drawing ports — moving rule continuations with drawing or first changing pass order — the preceding boundary fix keeps pending gameplay outside presentation; native repeat-draw, checkpoint, context and live-scene checks pass — revert the scene-owner move independently.

- 2026-10-08 — W2 composer — name the seven actual runtime layers and preserve foreground bamboo after combat particles — rearranging drawing to match the historical prose — source order is the output contract; explicit-neighbour hooks are validated, and mid-frame insert/removal applies on the next frame — revert the named-composer commit.

- 2026-10-08 — W2 post move — move the unchanged prepared-frame drawing into presentation/post.ts, leaving clock/RNG advancement separate — combining state ownership changes with the move — repeated draws must remain isolated; native/trial films and saved encounters pass — revert the post-drawing move independently.

- 2026-10-08 — W2 figures move — extract frame-specific figure renderer and enemy/boss projection with explicit views — moving player/companion gameplay early — respects ordered ownership and preserves plain records; saved boss/wave scenes and presentation isolation pass — revert the figure-host move.

- 2026-10-08 — W2 feedback move — move cosmetic factories/popups/stamps and drawing into feedback.ts with cosmetic RNG and explicit flash/sound ports — moving score mutation with popup display — feedback has no run record, so later rule listeners can call it without owning gameplay — revert the feedback move independently.

- 2026-10-08 — W2 environment move — extract ambient factories, grass caches and weather drawing with explicit scene views — moving weather hazard simulation into presentation — hazards consume gameplay RNG and remain rule-owned; native materials, orientations, checkpoints and draw isolation pass — revert the environment drawing move.

- 2026-10-08 — W2 post preparation — move camera/post preparation and cosmetic post history into post-preparation.ts, retaining temporary shared signal ports — advancing post inside draws — repeated draw isolation includes the module-owned history and haptics; camera/post cosmetic RNG order is preserved — revert the preparation move independently.

- 2026-10-08 — W2 post artwork — move cached grain, vignette and ink-edge construction/state into post-artwork.ts — retaining texture caches in the runtime — preserves dimensions and RNG order while completing explicit post artwork ownership; native/trial films and saves pass — revert the cache move independently.

- 2026-10-08 — W2 cosmetic state — consolidate twelve cosmetic fields in presentation/state.ts, using symbol-aware reference rewriting and direct context state/camera references — copying values or maintaining closure getter bridges — preserves shared identity, clocks and visual RNG while leaving gameplay hit-stop/time scale and checkpoint records untouched; fourteen affected browser cases pass — revert the cosmetic-state ownership commit.

- 2026-10-08 — W2 feedback actions move — give feedback flash/camera/letterbox actions, effect updates and weather/cut bursts with selected effect/weather values and leaf/sound ports — passing RunState or gameplay RNG — enables rule listeners to request cosmetic reactions without changing rule ownership; actual death/shadow/scattered effects and saves pass — revert the feedback-actions move.

- 2026-10-08 — W2 cues move — move ensō and encounter glyph projection into cues.ts with readonly encounter views — retaining cue composition in rule orchestration — input/target resolution stays in gameplay; rush-shrine and Daruma flows plus all saved encounters pass — revert the cue move.

- 2026-10-08 — W2 environment state — consolidate fourteen cached scenery/cosmetic particle fields in environment-state.ts and expose it through PresentationContext — moving live WX hazard timers into presentation — live weather consumes gameplay RNG, while cinematic weather is cosmetic; thirteen native/cinematic/stage/save browser cases pass — revert the environment-state move.

- 2026-10-08 — W2 weather boundary — separate cached weather artwork construction from the live WX reset in place, retaining artwork-then-rule order — moving combatRandom into presentation — weather hazard initialization is gameplay; old checkpoints and cinematic isolation pass before the physical move — revert the weather boundary split.

- 2026-10-08 — W2 environment builders move — move background/mist/grass/drift/weather cache builders into environment-artwork.ts with cosmetic state/viewport/RNG ports — moving the live hazard reset with them — the preceding boundary split retains combat RNG outside presentation and preserves artwork/rule order; twelve scene/save/cinematic/stage cases pass — revert the builder move independently.

- 2026-10-08 — W2 cosmetic updates move — move clock/camera advancement and ambient/transition update bodies into their owned presentation modules — combining clocks or moving rule updates — original clock/ambient/rule/transition/camera order is preserved; twelve scene/save/cinematic/stage browser cases pass — revert the cosmetic-update move.

- 2026-10-08 — W2 presentation checkpoint — retain the shared-preview exact-PNG assertion and record the isolated failure — speculative renderer changes or relaxed tolerance — first broad run had 252 passes and one preview-disposal failure; unchanged 20-case repeat and uninterrupted 253-case broad retry passed, with cause unestablished and ignored pixel diagnostics ready if it recurs — investigate the original assertion with the prepared diagnostics if reproduced.

- 2026-10-08 — W2 UI screens — move the existing wiring through explicit current views and action ports — retain the monolithic closure — preserves callback ordering, save keys and current-run reads; strict, unit and focused browser checks pass — revert the UI screens move.

- 2026-10-08 — W2 UI secrets — move the existing wiring through explicit current views and action ports — retain the monolithic closure — preserves callback ordering, save keys and current-run reads; strict, unit and focused browser checks pass — revert the UI secrets move.

- 2026-10-08 — W2 UI admin — move the existing wiring through explicit current views and action ports — retain the monolithic closure — preserves callback ordering, save keys and current-run reads; strict, unit and focused browser checks pass — revert the UI admin move.

- 2026-10-08 — W2 UI panels — move the existing wiring through explicit current views and action ports — retain the monolithic closure — preserves callback ordering, save keys and current-run reads; strict, unit and focused browser checks pass — revert the UI panels move.

- 2026-10-08 — W2 UI settings — move the existing wiring through explicit current views and action ports — retain the monolithic closure — preserves callback ordering, save keys and current-run reads; strict, unit and focused browser checks pass — revert the UI settings move.

- 2026-10-08 — W2 UI setup — move the existing wiring through explicit current views and action ports — retain the monolithic closure — preserves callback ordering, save keys and current-run reads; strict, unit and focused browser checks pass — revert the UI setup move.

- 2026-10-08 — W2 UI armory — move the existing wiring through explicit current views and action ports — retain the monolithic closure — preserves callback ordering, save keys and current-run reads; strict, unit and focused browser checks pass — revert the UI armory move.

- 2026-10-08 — W2 UI input — move the existing wiring through explicit current views and action ports — retain the monolithic closure — preserves callback ordering, save keys and current-run reads; strict, unit and focused browser checks pass — revert the UI input move.

- 2026-10-08 — W2 UI purchases — move the existing wiring through explicit current views and action ports — retain the monolithic closure — preserves callback ordering, save keys and current-run reads; strict, unit and focused browser checks pass — revert the UI purchases move.

- 2026-10-08 — W2 UI cinematic — move the existing wiring through explicit current views and action ports — retain the monolithic closure — preserves callback ordering, save keys and current-run reads; strict, unit and focused browser checks pass — revert the UI cinematic move.

- 2026-10-08 — W2 UI profile — move the existing wiring through explicit current views and action ports — retain the monolithic closure — preserves callback ordering, save keys and current-run reads; strict, unit and focused browser checks pass — revert the UI profile move.

- 2026-10-08 — W2 UI cluster — retain current getters for replaceable equipment/statistics and session flags, remove superseded root imports separately from moves — capture initial values or rewrite rule behavior during UI work — focused UI/save/isolation checks and all units pass; the pure boss direction import remains for existing trial response instrumentation until the phase API migrates — revert the UI cleanup commit or individual owner move.

- 2026-10-08 — W2 router foundation — introduce synchronous complete controller dispatch with explicit checkpoint adoption before live wiring — replay entry callbacks after restore or replace all branching at once — restores must preserve playable saved state without repeating cues/rewards; five routing/ordering/paused-input/adoption tests and all units pass; live phase migration is next — revert the router foundation commit.

- 2026-10-08 — W2 run-flow move — move title/pause/resume/quit bodies through current state getters, capability flags and narrow service/presentation ports — capture replaced profile values or replay graphics-dependent resume automatically — five actual API scenarios, all units, seventeen menu/save cases and ten real graphics/context checks pass; records and RNG consumption unchanged — revert this physical run-flow move.

- 2026-10-08 — W2 checkpoint move — move record capture/recovery through explicit persistence and current-state ports, and migrate old fixture drivers to the real APIs — rewrite records or retain inline test restore/capture — all old records play and round-trip with unchanged keys; seeded RNG resumes after stage setup, later secrets survive, and abandonment enters results once; all units and six real browser fixtures/recovery cases pass — revert the checkpoint-flow move and its fixture-driver migration together.

- 2026-10-08 — W2 run-start move — move normal/daily/trial/rush entry through current-state ports and expose the existing fresh-seed generator as a port — seed test-only copies of resetRun or move cosmetic RNG into rules — production initialization/RNG order is retained; scenario initialization now uses the real API, with four added entry/isolation/retry cases, all units and fifteen browser cases green — revert the run-start move and its scenario-driver migration.

- 2026-10-08 — W2 wave input move — preserve swipe targeting and knife record/reward order through the real wave controller, migrate scenario swipes — replace all router branching in one edit — four controller cases, all 294 units and twenty real browser cases pass; entry/update and router integration remain separate steps — revert the wave input move and scenario migration together.

- 2026-10-08 — W2 wave lifecycle move — move deferred wave entry and simulation callbacks into the wave owner with fresh readiness-time views — snapshot feedback ports before asynchronous preparation or rewrite entry timing — all 297 units, three new real API cases and thirteen live trial/save/setup cases pass; seeded scenario entry/update use the production API — revert the wave lifecycle move and driver migration.

- 2026-10-08 — W2 standoff move — retain plain challenger records and existing early/draw/wrong/late windows through explicit construction and feedback ports — import rendering models into gameplay or rewrite standoff timing — all 300 units, three actual controller cases and five real input/save cases pass; seeded standoff driver now calls the phase API — revert the standoff move and scenario migration.

- 2026-10-08 — W2 boss move — preserve duel entry, parry chains, counter/reward and raw-time dying cleanup through explicit ports; migrate seeded fights and stale browser parry hook — leave inline HP drivers or replay phase entry on restore — strict, all 303 units and twenty browser cases pass; no gameplay or tolerance changes — revert the boss move and API-driver migrations together.

- 2026-10-08 — W2 trial session move — keep disposable trial entry/completion and profile restoration together behind explicit mutable ports — combine it with persistent run rewards or leave closure-based completion — strict, all 306 units and sixteen live trial/mastery cases pass; actual entry/session/boss composition has three focused cases — revert this trial-session physical move.

- 2026-10-08 — W2 shrine move — put offer, reroll and blessing choice rules behind one phase API while retaining menu rendering ports — leave choice mutations in UI callbacks — strict, all 309 units, three API scenarios and seventeen live blessing/mastery/save cases pass; seeded choice driver uses the production API — revert the shrine move and scenario migration.

- 2026-10-08 — W2 death move — preserve damage/intercept, lost-save boundary and raw-time revival through explicit player/camera/reason ports — import UI reason data or merge reward async flow into combat rules — strict, all 314 units, five API scenarios and eighteen real recovery/reward/intercept cases pass; seeded death uses the production API — revert the death move and scenario migration.

- 2026-10-08 — W2 between move — give the existing inter-encounter timer its own controller before wiring router dispatch — leave phase selection in the composition update — strict, all 316 units, two controller cases and ten trial/save browser cases pass; existing next-phase order is unchanged — revert this between-controller physical move.

- 2026-10-08 — W2 cinematic audit repair — expose the viewer's original scene seed through a read-only owner accessor and migrate stale response instrumentation — restore the removed closure variable or weaken stage variation assertions — broad router run found two ReferenceErrors from the prior UI extraction; strict and seven unchanged cinematic/stage checks pass; accessor changes no viewer behavior — revert the accessor/hook fix together.

- 2026-10-08 — W2 live phase router — preserve ordered same-frame cascades through updateFrame, pass raw delta and silently adopt restored checkpoints — dispatch only one phase per frame or replay entry on restore — strict, all 318 units and the full 253-case browser retry pass; no gameplay/save changes — revert the live router integration and its driver tests together.

- 2026-10-08 — W2 enemy kill move — move current kill rules first, retaining cosmetic construction behind explicit ports, and migrate seeded kills to the production API — combine event splitting with the physical move or retain inline test copies — strict, all 321 units and focused browser cases pass; score, chain and reward ordering is preserved — revert the physical kill move and driver migration.

- 2026-10-08 — W2 kill event split — commit run mutations/combat RNG before frozen flat cut snapshots, with synchronous profile/cosmetic listeners and shared scoring/combo rule events — pass mutable enemies to listeners or retain interleaved feedback — strict, all 326 units, 25 focused cases and the full 253-case browser retry pass; first run 252/253 had one unestablished pre-Options timeout, then five unchanged profile repeats passed; cosmetic reaction/RNG ordering within one input may differ, combat timing/balance/save shapes do not — revert the event-split checkpoint; d9b22c3 retains the extracted pre-split rules.

- 2026-10-08 — W2 character model move — rehome plain character types, pose/seed helpers and death timing in shared modules, keeping temporary rendering re-exports — leave gameplay rendering imports or copy model implementations — strict, all 326 units and seventeen native rendering/death cases pass; save shapes and behavior are unchanged — revert the shared-model physical move and consumer import migration.

- 2026-10-08 — W2 model adapter cleanup — remove the unused figures/model.ts re-export after consumer migration — retain a dead adapter — source/test/script/doc audit has no references, strict and all 326 units pass — restore the removed re-export file.

- 2026-10-08 — W2 state foundation — retain state/t on plain records, validate states always and let owners advance specialized clocks before table dispatch; derive registry types from existing data in stable first-match order — add serialized discriminants or increment a universal timer twice — strict and all 330 units pass, with four actual dispatcher/registry cases; character wiring is the next step — revert the unwired foundation modules/tests.

- 2026-10-08 — W2 grunt tables — derive feint/Zen/Still/base behaviours from existing fields and dispatch six states through tables, preserving clocks and shared pose finishing — add serialized type fields or change feint/foxfire frame ordering — strict, all 337 units and twenty-one live browser cases pass, with seven state/API cases; the old update export is temporarily a thin adapter — revert the grunt table integration while retaining the independent foundation/models.

- 2026-10-08 — W2 grunt adapter removal — migrate runtime/scenario/checkpoint callers to advanceGrunts, then delete the unused enemy-update adapter separately — leave an unused legacy export — each step passes strict types and all 337 units; consumer audit has no adapter imports — restore the adapter and prior caller imports.

- 2026-10-08 — W2 grunt construction move — move the existing plain record/look factory into grunt-spawn.ts and retain a temporary spawnEnemy adapter — combine construction changes with table behavior or delete before caller migration — strict, all 337 units and four live checkpoint fixtures pass; record fields/RNG order unchanged — revert the construction physical move.

## Future work

- Consider GPU compressed formats only after texture-preparation consumers can support them. No profiling is authorized in this refactor.

2026-10-08 — W2/grunt construction — removed unused spawnEnemy compatibility function after migrating every import — keeping a dormant adapter considered — source/test audit and strict plus 337 units confirm no consumer remains; ordering utilities retained — revert this cleanup commit.

2026-10-08 — W2/boss tables — replace the ten-state update switch with typed handlers and a base/mirror/twin/spear machine-and-hook registry — serializing a new type or dispatching again after transitions considered — deriving identity from existing definitions preserves old saves, RNG order and one-handler-per-frame behavior; idle transitions keep their distinct random ranges and raw shadow expiry skips pose work — revert this table/registry commit; compatibility exports retained until separately migrated.

2026-10-08 — W2/boss cleanup — delete boss-update.ts and unused root toIdle/resetBossIdle after consumer migration — leaving dormant exports considered — source/test import audit, strict types and 343 passing units confirm no remaining adapter consumer; actual idle transitions use the validated table machine — revert this cleanup commit.

2026-10-08 — W2/player move — physically move unchanged player animation to game/player/player.ts before replacing pose dispatch — combining the move and table implementation considered — separate green commits distinguish ownership from behavior; retain the rest-pose re-export used by browser coverage — revert this physical move commit.

2026-10-08 — W2/player table — derive idle/swing/block/death table state from original animation fields — adding serialized state/t or inventing a hurt animation considered — createPlayerAnimation has no hurt field; transient clock/state views retain exact save shape, deadline-frame rest selection and fallen pose priority with independent lean — revert this table commit.

2026-10-08 — W2/companions — physically extract companion selection, foxfire rescue and revival under game/player — keeping revival in death controller considered — companion owner centralizes abilities while phase retains dispatch; narrow ports preserve existing mutation/checkpoint/reaction order; 346 units and five live cases pass — revert this physical move commit.

2026-10-08 — W2/results ownership — physically move finishDaily/showOver/support claim/recovery into results session — mixing settlement changes with the move considered — keep old eligibility, async disposal, identity and display order; strict types, 351 units and 12 live cases pass; separate first-claim failed-save probe reproduces retained marker on unchanged pre-refactor ad353b3 in isolated baseline and will be repaired separately — revert this ownership commit.

2026-10-08 — W2/results rollback — restore absent supportRewardClaim after a failed first grant save — leaving the retained marker considered — new actual orchestration regression and unchanged pre-refactor isolated probe prove a balance rollback could prevent the promised retry; deleting only the newly introduced marker preserves previous identities and once-only credit; 352 units and two live support cases pass — revert this isolated fix.

2026-10-08 — W2/phase events — wire every required event through emission-only rule capabilities with frozen value snapshots — passing mutable characters or adding asynchronous delivery considered — deferred wave setup emits only at actual entry, terminal events follow settlement and outcomes emit once; successful parry uses perfect=true and block=false without introducing a timing mechanic; parry/block positions enable later cosmetic light listeners; strict/357 units and 19 live cases pass — revert this emission wiring commit.

2026-10-08 — W2/player figures — physically move the three remaining player/pet/foxfire draw functions to a presentation owner — retaining visual ownership in root considered — explicit read-only views keep drawing out of gameplay and retain existing composer order/output; strict/357 units and 17 live cases pass — revert this physical move commit.

2026-10-08 — W2/active equipment — physically extract awakening eligibility and modifier composition from root — keeping equipment policy in composition considered — narrow current views retain trial isolation and title/run upgrade behavior, without rendering dependencies; strict/357 units and 12 live cases pass — revert this ownership commit.

2026-10-08 — W2/profile rules — physically extract root reward/challenge/blade-stat/unlock helpers to progression ownership — leaving profile policy in root considered — explicit current views preserve disposable daily/trial statistics, terminal-only unlock ordering and reveals; strict/357 units and 18 live cases pass — revert this physical move commit.

2026-10-08 — W2/scene flow — physically move preparation/readiness/continuation orchestration to a session owner with renderer ports — resuming encounters from drawing considered — preserve presentation acknowledgement, stale async request guards, paused adoption and clock reset; strict/357 units and ten live cases pass — revert this physical move commit.

2026-10-08 — W2/encounter progression — move parry/boss/standoff profile counter reactions behind value events — retaining profile writes in combat controllers considered — current-view listeners preserve trial/profile isolation; boss/standoff rules commit run mutations then emit before save; strict/359 units and 16 live cases pass — revert this listener split commit.

2026-10-08 — W2/duel feedback — move parry/block sparks, ring, shake, flash, audio and haptics behind value events — leaving cosmetic ports in combat considered — rule hit stop/animation and RNG are retained; score/profile now precede feedback within the same input; listener-enabled/disabled actual outcomes match; strict/361 units and full 253 browser checks pass — revert this listener split commit.

2026-10-08 — W2/native services — physically move native renderer construction and disposal to presentation/native-services.ts — retaining service setup in root considered — preserve supplied lighting ownership and construction/disposal order; strict/361 units and 17 startup/disposal/drawing browser checks pass — revert this physical move commit.

2026-10-08 — W2/equipment presentation — physically move palettes/blade styles and preview-frame construction into presentation/equipment.ts — retaining visual selection in root considered — current read-only rule views preserve awakenings and independent previews; strict/361 units, 11 rendering and six corrected outfit/mobile cases pass; initial nonexistent outfit filters supplied no coverage — revert this physical move commit.

2026-10-08 — W2/frame simulation — physically extract the original frame update sequence into a session owner — changing delta/dispatch order considered — preserve loading/trial gates, cinematic isolation, raw run/death time and sequential phase cascades through narrow ports; strict/361 units and 16 scene/trial/lifecycle browser cases pass — revert this physical move commit.

2026-10-08 — W2/checkpoint diagnostic audit — retain the broad-run missing-wave diagnostic as unresolved — labeling it pre-existing from identical source considered — isolated unchanged pre-refactor recovery had zero page errors and the expected-error probe assertion failed; no reproduction claim or unrelated repair is justified yet — remove only this audit note after a conclusive investigation.

2026-10-08 — W2/environment binding — physically consolidate scenery state/artwork/drawing setup in presentation/environment-host.ts — retaining separate root adapters considered — lazy narrow views preserve current dimensions/time/stage; fixed live weather initialization moves before host construction with no RNG or side effects; strict/361 units and 14 scenery/readiness checks pass — revert this binding move commit.

2026-10-08 — W2/root import deletion — separately remove 70 semantically unused named imports — bulk text deletion considered — corrected symbol audit retains shorthand value references and BLESS_BY test instrumentation; strict/361 units, nine startup/readiness and three blessing checks pass; no runtime statement change — revert this deletion commit.

2026-10-08 — W2/trial hook dependency — separately restore bossShownDirection removed as unused in root — weakening or removing the trial hook considered — the unchanged trial hook captures this binding; preserve it until explicit API migration; initial profile browser run stopped after ReferenceError, retry all 10 profile/daily/trial cases green with strict/362 units alongside pending profile move — revert this isolated restoration after hook migration.

2026-10-08 — W2/profile state — physically move foundation/progression/equipment loading and persistence into phased profile-state factories — one reordered initializer or captured initial statistics considered — preserve save read/write order and original identities; saveMeta resolves current statistics after trial/daily/checkpoint replacement; strict/362 units including actual persistence regression and ten profile/daily/trial cases pass after separately restoring the existing trial hook dependency — revert this physical move commit.
