## W3 phase6 hooks green — continue workstream gates

Half-resolution checkpoint cdd7a52 is committed. Named geometry, lights and
forward-composite now follow the original seven recording layers. Painter dirty
preparation keeps auxiliary begin/flush callers and avoids duplicate G/light work.
lightingTargets exposes frozen current generation metadata only after preparation;
new submissions, lighting, quality, size, loss and disposal invalidate access.
Quality-only changes retain G and replace L. Borrowed textures remain owner-owned.

Post statements retain original order in twelve named recording stages; grade is
the film subchain. frames.drawPost exposes both insertion chains; target consumers
insert after lights in drawScene.composer. Lifecycle owns unregister callbacks and
consumer resources/sampler detachment. Minimal examples and ownership are in
rendering.md; no future rim/ray/shadow/outline effects were built.

Final npm run typecheck PASS; npm test all415PASS; exact21-file expanded affected
native/material/foliage/film/source/Options/context/checkpoint runtime suite73PASS
in2.3m exit0 (session5069 terminal). Logs tmp/lighting-refactor/phase6-hooks-final-
{typecheck,unit,browser}.log. New actual G/L call counts prove one preparation per
frame, late-submission/quality/resize invalidation and repeated pixel equality;
real runtime scene/post/film extensions preserve rules/RNG/saves/haptics. Native
named-light-passes.png inspected (opaque neutral test surface). No assertion or
existing tolerance weakened. Version1.68.0 remains aligned. No develop push.

NEXT W3 gates: full broad rendering-v2, test:production and test:android-web;
startup/error/context native suites and W2 scenarios must remain green (affected
suite covers native restore, full broad additionally covers graphics-errors).
Then all Part4 independent final checks: strict/fullunit/both broad configs/
production/Android/startup/context, requirement audit, final module/byte/behavior/
manual-phone/perf-opt-in/future-work/preexisting-failure report, status/report
commit and one final develop push verified against origin. Proven pre-existing
Android offline.spec.ts:55 immediate pause/reload failure may be accepted only
with baseline evidence and honest reporting. Goal active; full scope unchanged.
No live browser job at this checkpoint; record any subsequent handle before ending.
Do not rerun applied integration scripts or edit source during live browser runs.

## W3 phase6 half resolution green — continue named passes and extension hooks

Persistent sources11369f2 is committed. SceneLighting.lightResolution1/0.5 controls
native RGBA16F L accumulation; G stays full resolution. Session testing selector
Full/Half uses effects/quality preferredLightResolution and never saves preferences.
Reset/dispose/reload clears its override. LightTargets physicalwidth/height differ
from sceneWidth/sceneHeight; guide borrows current G0. Shared composite four-tap
normal/depth/coverage-aware upsampling serves materials/artwork/grass/leaves. Default
full lookup remains direct. All guide/L bindings detach before replacement/disposal.
Small features absent from every coarse sample use a compatible neighbour, documented.
Pixi generated native high shaders need float mod/floor (not integer remainder);
initial warning-sensitive probe caught compile failure, fixed without relaxing tests.

Final npm run typecheck PASS; npm test all415PASS; exact20-file native/runtime/
material/foliage/source/Options/context/checkpoint affected suite72PASS exit0.
Logs tmp/lighting-refactor/phase6-half-final-{typecheck,unit,browser}.log. Direct3
half tests PASS10.0s before expanded run: depth/normal guide ablation, exact full/
half constant-ambient pixels across five colour providers, unchanged G on quality
switch, odd-size rounding, independent owner/resize/restore/disposal, session-only
UI and GL0/no Pixi warnings. RGB/coverage restoration uses existing tolerance9/exact
alpha; no existing assertion weakened. Depth-edge screenshot inspected. Version
1.68.0 aligned, no live browser job or develop push. Release note names quality tools.

NEXT finish phase6: read-only G/light post hooks, named insertion points for film
and post chains, minimal examples; expose native G/light as named composer passes
without duplicate GPU work. scene-painter.flush currently trims/resizes/detaches,
draws G/light, then ordered composite; auxiliary begin/flush callers must continue
working. scene.ts owns named layer composer (seven passes) and calls flush after
recording. Add explicit pass methods and invalidation/preparation state with native
verification; maintain layer/film/clip order and target lifecycle. Post targets
remain borrowed and generation-scoped; no future rim/ray/shadow/outline effects.
Then W3 broad/native/startup/context/production/Android gates and allPart4 strict/
unit/both broad configs/production/Android/startup/context/report/one final develop
push. Proven pre-existing Android offline.spec.ts:55 reload failure may be accepted
only with original baseline evidence and honest final reporting. Goal active.
Do not rerun applied non-idempotent integration scripts.

## W3 phase6 persistent lights green — continue half-resolution quality and hooks

Event checkpoint0f407c7 is committed. scene-light-sources.ts registers five sources:
sword glints, lanterns, embers, foxfire and boss flash auras. They sample existing
visual records/poses, no rule/particle advancement or RNG. Shared figure-pose.ts
preserves original native presence/weapon-tip calculations; foxfire-pose.ts keeps
companion drawing/light coordinates identical. WeakMap IDs remain stable through
reordering without retaining dead records. Loading/cinematic visibility, lifetime,
dying figures and Reduced Flashes govern contributions. Runtime presentation owns
registration/disposal and all sources share the rig/event global16-light budget.

Strict npm run typecheck PASS; npm test all414PASS. Expanded exact11-file native/
scene/game/Options/checkpoint suite53PASS, exit0. Logs tmp/lighting-refactor/
phase6-sources-{typecheck,unit,final-browser}.log. Direct persistent/event fixtures
2PASS18.0s before expanded suite. Initial new fixture lacked boss.def; corrected
its input without changing assertions. Native five-family proof confirms visible
illumination, unchanged input, repeatability, isolated removal/disposal and GL0.
Foxfire screenshot from testInfo.outputPath('foxfire-light.png') inspected: blue
local native-material contribution. No live browser job or develop push;1.68.0
version aligned. Release note includes lantern/ember/foxfire illumination.

NEXT half-resolution lighting quality through effects/quality.ts and Options or
testing tools, with depth/normal-aware upsampling in shared composite. Targets
must distinguish physical light width/height from full scene dimensions; currently
material/grass/leaf prepareComposite use targets.width/height. artwork owner already
has geometry dimensions/guide sampler. light-buffer.ts allocates two full-resolution
RGBA16F textures; scene-painter owns replacement/restore/disposal. Then read-only
G/light post hooks, named film/post insertion points and minimal examples. Expose
native G/light passes as named composer passes without duplicate GPU work while
preserving auxiliary begin/flush callers (currently flush owns all three passes).
W3 full gates and every Part4 final verification/report/one final develop push
remain. Goal active, full scope unchanged. Do not rerun applied integration scripts.

## W3 phase6 event lights green — continue persistent sources, half-res and hooks

Leaf checkpoint37a9cda is committed. Presentation now owns a shared light-source
registry across reactions and scene. event-lights.ts listens to kill/parry/block,
uses immutable positions/effects-clock births, quadratic0.14–0.24-second decay,
no RNG, and read-only sampling. Reduced Flashes suppresses creation/current lights;
run entry resets flashes; lifecycle detaches listeners/source. Scene supplies
camera/zoom/DPR transform before ranking; rig remains physical pixels. No per-source
cap: all live contributions enter the global16 budget. Stronger earlier parry
survives1000 weaker cuts in new unit proof.

Final npm run typecheck PASS; npm test all410PASS. Affected exact10-file browser
run34PASS1.4m exit0 session63174 TERMINAL (before final removal of the source cap).
Final budget correction then strict/all410units/native event fixture1PASS2.8s exit0.
Logs tmp/lighting-refactor/phase6-event-{typecheck,unit,final-browser,budget-browser}.log.
Native probe proves real HDR/colour contributions, effects-time freeze/decay,
Reduced Flashes, expiration/disposal and zero GL/Pixi errors; screenshot attaches
through testInfo.outputPath('parry-light.png'). No live browser job. Version1.68.0
aligned; release note includes cut/parry illumination. No develop push.

NEXT finish phase6 persistent source registrations for sword glints, lanterns,
embers, foxfire and boss auras, sampling existing read-only presentation poses.
runtime/presentation.ts owns sources; runtime/frames.ts injects into frame bindings;
reactions.ts binds event lights. Scene-source helpers use LightFrame.transform.
Then effects/quality half-resolution light option through Options/testing tools,
normal/depth-aware upsampling in common composite across material/artwork/grass/
leaves. LightTargets must distinguish physical light dimensions from full scene
size: current prepareComposite uses targets.width/height. Add read-only G/light
post hooks, named film/post insertion examples and named composer G/light passes
without duplicate GPU work (currently internal flush). W3 full gates and allPart4
verification/report/one final develop push remain. Full goal active.

## W3 phase5 leaves green — continue phase6 light sources and hooks

Grass checkpoint b01145e is committed. Leaves now use one ordered native instanced
quad mesh per front/rear layer with four original catalogue atlas families.
Static spawn/birth attributes stay retained; GPU wind/fall/spin/flutter/gust and
two-sided normals use the shared G/light/composite pipeline. Cosmetic clock/RNG
remain separate from gameplay. CPU lifetime sweeps run every0.125 effects seconds;
quality population rules, frames/pivots/size/opacity and painter order remain.

Strict npm run typecheck PASS; npm test all407PASS. Expanded exact16-file native
suite all66PASS, exit0. Logs tmp/lighting-refactor/phase5-leaves-final-typecheck.log,
phase5-leaves-unit.log, phase5-leaves-final-browser.log. The initial expanded run
had65PASS/1FAIL because drift.spec.ts still called removed renderer.draw; migrated
that fixture to native drawLeaves with original all32/minimum50 coverage assertions
unchanged. Focused drift rerun2PASS15.4s. New direct leaf tests cover actual1000
instances/four atlases, retained buffers, motion, folded normals, clips, independent
owners and resize/restore/disposal. Exact G/HDR/alpha restore checks pass; displayed
RGB uses the existing tolerance9 after proving a one-byte variation before loss.
No production dither workaround remains. No live browser process or develop push.
Version1.68.0 stays aligned; changelog includes leaves.

NEXT phase6: event-bus kill/parry/block flashes decaying on effects clock; register
sword glints/lanterns/embers/foxfire/boss auras through presentation/light-sources.ts.
Add effects/quality half-resolution option with depth/normal-aware upsampling and
Options/testing integration. Add borrowed read-only G/light post hooks, named film/
post insertion points and minimal examples. Native painter G/light passes currently
run internally in flush: expose named composer passes without duplicate rendering,
keeping auxiliary begin/flush ownership and ordered composite. Source orientation:
presentation/scene.ts owns composer/registry, runtime/frame-bindings.ts creates it;
pixi/scene-painter.ts owns targets, pixi/light-buffer.ts owns HDR accumulation,
lighting-composite-glsl.ts lookup is shared by materials/artwork/grass/leaves.
W3 full gates and all Part4 gates/report/one final develop push remain required.
Do not rerun applied non-idempotent Playground integration scripts. Goal active.

## W3 phase5 grass green — continue instanced catalogue leaves

Phase4 whole-scene routing is committed1e585d3. Grass now submits one retained
native instanced strip per original mid/foreground layer through scene-grass.ts.
grass-material.ts uploads base/height/width/phase/colour-index/layer/density seed
once per layer-list change. Wind deformation and curved normals execute on GPU;
subsequent frames read no blade properties. Snow/demon cached variants and sorted
order stay in presentation/environment.ts; effects/quality density selects blades
in shader. Draw consumes no RNG. Old per-blade paths are removed from ambient.ts.
Palette float RGBA preserves exact authored0.5 coverage; cutoff precedes explicit
canonical eight-bit alpha encoding. Shared G/light/composite, clips/film/target
replacement and context restore/disposal are native painter owned.

Final npm run typecheck PASS; npm test all404PASS; exact13-file affected native/
scene/catalogue/film/G/light/runtime suite all50PASS1.8m exit0 session98813 TERMINAL.
Logs tmp/lighting-refactor/phase5-grass-final-typecheck.log,
phase5-grass-unit.log, phase5-grass-final-browser.log.
Two direct grass fixtures pass: actual1000-instance draws, no post-upload blade
reads, GPU wind/density/curved PBR normals, repeatability, pixel-identical restore,
authored curve mean0.154 at unchanged tolerance9, exact0.5 cutoff and thin-front
last-writer preservation. Capture uses testInfo.outputPath('instanced-grass.png');
inspected rendered blades. Initial context-restore fixture fetched the extension
while lost (null); fixed by retaining it before loss, no app workaround.
Initial midpoint test exposed byte127 storage for0.5; explicit encoding repaired
it without weakening cutoff/assertions. Changelog now names grass lighting;
changelog indicator1PASS9.1s exit0 session70100 TERMINAL. No live process remains.
Version1.68.0 stays aligned, no develop push.

NEXT phase5 leaves: ambient.ts currently CPU-updates and individually draws leaves;
presentation/environment.ts calls that update and draw path. drift-renderer.ts owns
prepared catalogue diffuse/material atlases and per-leaf draw; drift-frame.ts is a
pose adapter. Preserve catalogue frames/pivots/opacity/size and front split z1.25.
Move spawn/fall/flutter/spin/gust motion to native instanced quads where allowed,
two-sided normals/G/composite, quality density and effects-clock-only randomness.
Read current files before changes. Phase5 is incomplete until leaves green.
Then phase6 event-light listeners/half-res quality/depth-normal upsample/read-only
hooks/named composer G-light passes/docs, W3 full gates and every Part4 final gate,
report/one final develop push remain. Goal active and full scope unchanged.
Do not rerun applied non-idempotent Playground w3-grass-integration.py.

## W3 phase4 whole-scene routing green — continue phase5 grass then leaves

Ordinary image/cached-text meshes and native procedural graphics now use shared
lighting-composite-glsl.ts through per-painter artwork-materials.ts. Authored
colour art/fog/text preserve neutral lighting amount as material data. Native
positive-lookup fixture proves eight kinds read shared light buffers, independent
owners and resize/dispose. No stock scene-colour shader or old forward switch
remains. Native stencil masks and film/filter passes retain their pipeline roles.
Initial four-file22PASS/1FAIL disposal warning repaired: Pixi cached native graphic
batch bind groups outlive renderer disposal; gradients unload GPU storage as the
existing retired-gradient path does. Original warning assertion stays unchanged.

Final npm run typecheck PASS; npm test all404PASS; exact18-file native/material/
startup/context/game/reference suite all57PASS2.0m exit0 session85456 TERMINAL.
Logs tmp/lighting-refactor/phase4-routing-final-typecheck.log,
phase4-routing-unit.log, phase4-routing-final-browser.log. Earlier corrected
four-file rerun23PASS1.4m session84810 TERMINAL; positive fixture1PASS2.8s.
No live browser job. Version1.68.0 aligned; no develop push.

NEXT phase5: replace ambient.ts per-blade paths with native instanced mesh per
mid/foreground depth layer, GPU wind and curved G-buffer normals; retain cached
snow/demon variations from presentation/environment.ts and density scaling.
Then catalogue leaves with GPU spawn/fall/flutter/spin/gust and two-sided normals.
Phase6 event lights/half-res/hooks/named GPU composer passes, W3 and all Part4
gates/report and one final develop push remain. Goal active, unchanged.

## W3 phase4 neutral emission green — continue whole-scene routing

Material cleanup commit66ba4ec removed the old forward shader/flag and unified
masks; all404 units/all56 affected browsers/strict passed on that source.
Subsequent neutral binding cleanup uses shared Texture.EMPTY for absent emissive
maps in material/composite initialization and release, instead of WHITE guarded
by hasEmissive. Final strict PASS and all5 focused optional-emissive/material/
legacy/reference browsers PASS3.8s exit0. Logs tmp/lighting-refactor/
phase4-neutral-{typecheck,browser}.log. No live process remains.
NEXT: ordinary drawImage/cached-text and procedural Graphics/round-stroke/brush-ring/
ellipse/glyph-arrow stock colour routes must use the common pipeline. This is
still incomplete; do not substitute the material-only success for whole-scene
compliance. Preserve ordered fog/alpha/blends/films/clips and target lifetimes.
Then instanced grass/leaves, event sources, half-resolution quality, named GPU
composer passes/hooks/docs, W3 gates and every Part4 deliverable remain required.
No develop push until full completion. Goal active; version1.68.0 aligned.

## W3 phase4 material cleanup green — all-scene routes still need work

Old forward fragment, four-light uniforms/selection and temporary
lightingComparison flag are DELETED. material.ts owns shared geometry data and
one cheap composite shader; all BRDF evaluation lives in light-buffer.ts.
Legacy masks map gloss to fourth-root(2/(shininess+2)) roughness, specular strength
to metallic response, AO1, and own-albedo blue emission in the same composite.
G1 now flags all lit PBR/converted masks1; there is no legacy BRDF distinction.
Native legacy/explicit-PBR fixture proves identical G1 and diffuse/specular/
composite outputs, plus emission remaining local and preserving opaque alpha.

Old shader is recoverable at phase3 commit472f60aa71787adec717adbf8f982109790925f6.
Before removal, all4 genuine old-forward RGBA references were captured while the
comparison still passed. They are committed under tests/browser/fixtures/
lighting-forward with provenance; light-composite.spec.ts loads these images,
not a runtime forward switch, so it cannot silently compare lookup to itself.
References preserve the unchanged scene tolerance9 and exact alpha equality.
Final strict PASS; all404 units PASS; complete17-file affected native/material/
startup/context/game/reference suite all56PASS2.0m exit0; session76370 TERMINAL.
Logs tmp/lighting-refactor/phase4-{typecheck,unit,native-browser}.log. Earlier
11-case removal and independent legacy case also pass; final combined includes
both. Comparison differences remain0.03855/0.04166/0.04091/0, alpha mismatches0.
Exact JSON/lookup capture copied to tmp/lighting-refactor/phase4-evidence.
No browser job remains live. Version1.68.0 aligned; no develop push.

NEXT: finish the all-scene contract, not just material stamps. Audit confirms
stock paths remain for ordinary drawImage sprites/cached text and procedural
Graphics/round-stroke/brush-ring/ellipse/glyph-arrow. They currently render in
the same flush after G/light passes but bypass the material lookup shader. Do
not claim all-scene pipeline completion from the native material tests alone.
Route these through the common pipeline while preserving transforms, clips,
alpha/fog/native films and retained texture lifetimes, then verify affected tests.
Also replace the absent-emissive WHITE binding with a shared zero/neutral source
as required by W1/W3 (hasEmissive currently guards it, so no emission bug claimed).
Then required phase5 instanced grass/leaves, phase6 gameplay sources/half-res/
hooks/named G-light composer passes/docs and all W3/Part4 final gates/report/one
final develop push remain pending. Full goal stays active and unchanged.
Applied staging scripts are non-idempotent; do not rerun. Use committed repo source.

## W3 phase 3 green — phase 4 must remove the old shader

Default ordinary sprite material now uses composite-material.ts: own linear
albedo*Ldiffuse + Lspecular + own emissive, then original highlight roll-off,
sRGB encoding, material/debug coverage, fog, alpha and ordered native blends.
Old forward BRDF survives only for the required TEMPORARY comparison:
canvas.dataset.lightingComparison='forward'. Phase4 must remove this flag AND
the old fragment/point-selection uniforms/CPU code; no permanent fallback.
Composite light bindings detach before target resize/restore; owners stay isolated.
Geometry cutoff uses exact mesh/ancestor alpha rather than Pixi byte-truncated
colour alpha, fixing authored alpha0.5 being treated as below cutoff. Original
colour/backlighting assertions pass unchanged. Phase1 translucent fixture now
uses a neutral lit surface behind the below-cutoff blue, preserving every
visibility assertion while testing the required behind-surface lookup approximation.

Final strict PASS; all404 units PASS; full16-file affected native/material/film/
startup/recovery/game/real-PBR-comparison suite all55PASS1.9m exit0. Session61844
TERMINAL; no browser job live. Logs tmp/lighting-refactor/phase3-{typecheck,unit,
native-browser}.log. Real rock/cloth/steel, mirror/nonuniform/rotation, alpha/fog,
warm/cool point lights, actual noir and debug-disabled compare: mean displayed
RGB differences0.03855/0.04166/0.04091/0 (existing tolerance9), alpha mismatches0
in each case;24396 covered pixels each. Screenshots visually inspected.
Exact JSON and forward/lookup captures preserved under ignored
tmp/lighting-refactor/phase3-evidence before later runners clear test-results.

NEXT immediately: phase4 finalize mask-to-PBR mapping and delete old forward
shader/comparison flag, record this phase3 commit as its recoverable reference.
Update the comparison test when old shader is removed so it cannot silently
compare new output to itself. Audit remaining plain native draw routes against
the all-scene-pipeline policy rather than treating normal-map materials as the
entire scene. Then required phase5 instanced grass/leaves, phase6 event lights/
half-res quality/extension hooks/named G-light composer passes and documentation.
W3 full broad/production/Android gates and allPart4/default-browser/final report/
one final develop push remain pending. No early push. Version1.68.0 aligned.
W1/W2 complete with documented proven pre-existing Android recovery exception.
Applied external staging scripts are non-idempotent; do not rerun. Use repo source.

## W3 phase 2 green — continue immediately to lookup composite

Version1.68.0: painter-owned native RGBA16F diffuse/specular MRT, fullscreen GGX
light pass, fixed16 uniform arrays/count, viewport footprint/intensity budget,
presentation light-source registry and stage-rig integration are implemented.
Borrowed lightTargets have generation/size metadata, independent surface ownership,
resize/restore/disposal. Same HDR capability is required at startup/restore;
missing support shows the existing single graphics Retry error. Session-only
debug offers diffuse/specular views as well as G0/G1/G2. Actual title debug
captures were visually inspected; no startup overlay was accepted as evidence.
Strict typecheck PASS; all404 units PASS (then stronger stable-ID test3/3PASS).
Focused14-file native/material/startup/recovery/game suite all52PASS1.9m exit0,
session8275 TERMINAL. Logs tmp/lighting-refactor/phase2-{typecheck,unit,native-browser}.log.
Analytic front-facing GGX/diffuse, HDR values>1, all16 contribution, AO/metal tint,
debug-neutral outputs, exact source destruction, actual context restoration and
all existing gameplay checkpoint cases pass. No browser job remains live.
The ordinary scene still uses the old forward shader during this migration.
NEXT phase3: cheap albedo*diffuse+specular+emissive lookup composite, temporary old
comparison flag and representative tolerant browser comparisons. Then phase4
legacy unification/remove old shader, phase5 instanced grass/leaves, phase6 event
lights/half-res/hooks/named G/light composer passes/docs; all remain mandatory.
W3 full broad/production/Android gates and Part4/default-browser/final report and
one final develop push remain pending. No early push. Phase1 broad was259pass/1
stale-selector failure, explicitly repaired1/1pass; no all260 invocation claimed.
External staging scripts already applied/non-idempotent: do not rerun phase2
implementation/refinement scripts. Use actual committed sources from now on.

## W3 phase 1 checkpoint — continue to phase 2

Source 4d4ed49, version 1.68.0: strict/all401 units and all47 affected
native/startup/restore/game browsers PASS. Full broad session14622 is TERMINAL
exit1: 259 passed, one material-preview failure, 14.3m; log
tmp/lighting-refactor/phase1-broad-browser.log. The preview test used the first
select after the buffer-view select was added. It now explicitly queries
select[aria-label="Material preview"]; all original assertions are unchanged.
Exact affected rerun passed 1/1 in4.2s exit0, phase1-preview-selector.log.
Do not claim a single all260-pass invocation. Application source is unchanged
between broad and the selector rerun. No browser process remains live.
The next full broad invocation is required at the W3 checkpoint; repeating all
260 immediately for this selector-only repair adds no renderer coverage.
NEXT: apply prepared phase2 native HDR light pass/registry/16-light budget and
verify strict, units, focused native/restore/debug/material suites. W3 phases2–6
and Part4 remain mandatory. No develop push until full completion.

## W3 phase 1 focused checkpoint green — broad browser next

Final 1.68.0 geometry implementation has strict npm run typecheck PASS and all
401 units PASS. Exact 12-file affected browser command passed all 47 in 1.9m,
exit 0; phase1-native-browser.log under tmp/lighting-refactor. Session 72734 closed.
Files: geometry-buffer, lighting-mrt, pixi-backend/scenes/catalogue/films,
material-colour, graphics-errors, presentation-readiness, game,
runtime-checkpoint-fixtures, changelog; config playwright.rendering-v2.config.ts
and --trace retain-on-failure. Real target/depth/surface/albedo/cutoff/clip/normal
values, below-cutoff forward translucency, source/target ownership, restore
material reupload, missing-MRT error and actual debug views are covered.
Native title debug screenshots were visually inspected after waiting for startup
completion and the painter's completed lightingFrameView metadata. No assertion
or timeout was weakened; midpoint depth now has explicit 8-bit rounding.
No live process remains at this checkpoint. NEXT: run the complete combined broad
browser invocation with source fixed, save phase1-broad-browser.log and record its
exact live handle. Do not begin phase 2 until the broad check finishes green.
Then implement light accumulation/registry/16-light ranking and rig/debug, followed
by the remaining mandatory W3 phases and Part 4. No early develop push.
External generation scripts already applied/non-idempotent; do not rerun.
## W3 phase 1 implementation — focused browser verification live

Version 1.68.0, lock/title/changelog aligned. Native painter-owned G0/G1/G2 targets,
geometry material shader, default/per-material alpha cutoff, last-writer data,
borrowed current texture/generation hook and session-only lighting debug views
implemented. Resize/restore/dispose own independent surfaces; MRT is required at
startup and restore. Existing forward shader remains pending W3 phases 2–4.
Strict npm run typecheck PASS; final node --test tests/unit/*.test.mjs all 401 PASS.
Logs tmp/lighting-refactor/phase1-{typecheck,unit}.log.
Focused 12-file browser invocation is LIVE in unified exec session 72734; log
 tmp/lighting-refactor/phase1-native-browser.log, latest observed 23 passing cases.
Poll exact handle; keep application/tests fixed until terminal, do not restart on
observation timeout. New five-case geometry checks cover exact channels, cutoffs,
last writer, preserved forward translucency/clips, rotation/nonuniform/normalY,
independent targets/source destruction, restored material pixels, missing MRT,
completed debug frames and session-only state. Native MRT probe is also included.
Screenshots use testInfo.outputPath and actual rendered views were inspected.

A rendering regression was fixed: Pixi clear does not bind its supplied target,
so clear after MRT had erased G data and accumulated the view alpha. Explicit view
bind+clear restores original material/film assertions. Mesh GL blend state is
restored alongside container blend mode. Restore tests now issue restoration in
another browser task after loss dispatch; timeout/assertions unchanged. Zero-depth
8-bit tie is explicitly encoded, rather than weakening byte assertions.
NEXT on focused terminal: fix failures, record exact results, run required broad
browser verification with this source fixed, finalize phase-1 docs/audit/status
and commit green checkpoint. Only then proceed to W3 phase 2 light accumulation,
16-light registry/rig/debug. All later W3 phases and Part 4 remain required.
No develop push, profiling/benchmarks, native/store builds or real-save changes.
Generation scripts in the external workspace are applied and non-idempotent;
do not rerun them. Ignored W3 audit tmp/lighting-refactor/audit.md.
## W3 audit checkpoint — native MRT verified, G-buffer next

W1/W2 complete under the explicit pre-existing Android failure exception below.
W3 audit started in tmp/lighting-refactor/audit.md: actual seven composer passes,
material/light producers, painter/surface ownership, CPU foliage and migration plan.
No application lighting implementation has changed yet; version remains 1.67.0.
Native Pixi 8.22 MRT is verified in real Edge with one RenderTarget and three GLSL
layout outputs: complete framebuffer, exact red/green/blue attachment pixels,
three attachments, adequate queried limits and zero GL error. Final test command:
 npx playwright test tests/browser/lighting-mrt.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure
PASS one case in 2.4s, exit 0; tmp/lighting-refactor/mrt-capability.log. No live process.
Test helper tests/helpers/pixi-mrt.ts lets Vite resolve installed package imports.
Use explicit #version 300 es in vertex/fragment; Pixi detects GLSL mode from the
fragment header. Non-destructive target binds require clear:false. No raw helper
or alternate backend is required. Initial probe authoring errors were corrected;
no exact pixel/assertion/error/completeness check was relaxed.
NEXT: complete W3 pre-reading/producer lifetime audit, then phase 1 painter-owned
G0/G1/G2 geometry targets and testing-tools debug views with alpha cutoff,
normal transform/depth/material flags and full resize/restore/disposal tests.
Do not jump to light budget in place of G-buffer. All W3 phases and Part 4 remain.
Keep develop unpushed until complete; no profiling/native/store/real-save work.
## W2 complete — begin W3 lighting audit

Final implementation source d87e344, version 1.67.0. No live verification process
remains. Exact final commands/results (logs under tmp/runtime-refactor):
- node --test tests/unit/*.test.mjs: all 401 PASS (w2-final-unit.log).
- npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure:
  all 254 PASS in 14.0m, exit 0 (w2-final-broad-browser.log), session 36134 closed.
- npm run test:production: strict/build and all four PASS in 21.0s, exit 0
  (w2-final-production.log), session 68148 closed.
- ISSEN_ANDROID_BUILD_DIR=tmp/.verification-build-android with npm run test:android-web:
  strict/build succeed, four PASS/one FAIL in 21.9s, exit 1 (w2-final-android.log),
  session 42466 closed. Unchanged offline.spec.ts:55 immediate pause/reload assertion
  receives screen instead of /on/, identical to the proven immutable pre-refactor
  result in tmp/asset-compaction/android-recovery-baseline.log. Record this explicit
  goal exception, do not call Android green or weaken the test.

W2 report docs/development/runtime-refactor-results.md records actual requirement
mapping, intentional behavior, verification, phone checklist and future opt-in captures.
W1 and W2 complete. NEXT: read W3 source/pre-reading, write
 tmp/lighting-refactor/audit.md with actual composer/material/light producers,
Pixi 8.22 MRT findings, foliage paths and migration plan; implement W3 phases in
strict order with focused checks/commits. W3 and Part 4 are fully pending.
No develop push until full completion; pre-refactor remains the restore point.
No profiling/benchmarks, native/store builds, real saves or lit-only worktree edits.
## W2 final gate preparation: version 1.67.0

Requirement-by-requirement audit is in tmp/runtime-refactor/w2-final-requirement-audit.md
and docs/development/runtime-refactor-results.md. Actual source/controller/table/
registry/event/composer/checkpoint/renderer evidence inspected, no new ownership
gap identified. Version/lock/title/changelog aligned to 1.67.0; current architecture/
rendering maps consolidated; behavior report/manual phone checklist/future opt-in
captures written. W3 and Part 4 remain fully required.
Explicit draw-haptics gap closed in presentation-readiness.spec.ts: actual combat
haptic and direct navigator vibration calls are counted and asserted zero through
repeated draw and readiness settlement, alongside original run/RNG/save assertions.
`npx playwright test tests/browser/presentation-readiness.spec.ts tests/browser/changelog.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all two PASS in 10.3s (w2-final-isolation-changelog.log), terminal exit 0.
Formatting-only test/html edits followed this focused run; broad final must cover them.
`node --test tests/unit/*.test.mjs`: final 1.67.0 all 401 PASS (w2-final-unit.log).
Logs under tmp/runtime-refactor. Final combined broad browser, test:production
(strict+verification build included) and Android-web gates remain pending.
Do not start W3 or push develop until W2 gates and checkpoint commit complete.
Version/docs generation script is non-idempotent and already applied.

## Latest green checkpoint: obsolete session adapter cleanup

Separately deleted 22 runtime/session.ts getters absent from the compiler-resolved
SessionBindingViews intersection after all session UI moves were committed:
$, applySeal, hud, renderHp/Lives, setScore, toast, saved buttons/screens/shrine,
apparel motion, hints, presentationState, audioInit, leaves, trial objective,
runResults, best line, renderGameOver, armory-new and pause screen. Actual UI
listeners retain their own typed capabilities. Compiler audit is
 tmp/runtime-refactor/session-capability-cleanup-audit.json.
`npm run typecheck`: PASS (session-capability-cleanup-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 401 PASS
(session-capability-cleanup-unit.log); logs under tmp/runtime-refactor.
`npx playwright test tests/browser/game.spec.ts tests/browser/runtime-checkpoint-fixtures.spec.ts tests/browser/guided-lessons.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 10 PASS in 29.6s (session-capability-cleanup-browser.log), terminal exit 0.
No live browser process remains. Actual source audit now finds no direct DOM
writes in game modules; frame/scene runtime orchestration and guided UI adapter
are relocated. This is not proof of full W2 completion.
Next: requirement-by-requirement W2 audit against main-goal.md and actual source/
scenario/checkpoint/isolation/state-machine/registry/composer/renderer evidence;
fix any gaps, clean the final architecture/rendering ownership map, finalize
behavior report/manual phone checklist and synchronize 1.67.0 version/lock/title/
changelog. Run final full units, broad browsers, test:production and Android-web
before W3 begins. Earlier combined broad runs are stale and are not a final pass.
All W3 and Part 4 remain required; develop remains unpushed.
Cleanup script applied once; do not rerun stale non-idempotent generators.

## Latest green checkpoint: guided lesson UI adapter relocation

Moved guided-lessons.ts and its CSS from game/onboarding into ui/wiring; audio
wiring and the browser fixture import the actual new owner. guided-state.ts
retains deterministic progress, freeze and input-consumption decisions. Exact
adapter source parity after relative-import normalization PASS is recorded in
 tmp/runtime-refactor/guided-ui-move-parity.log; no rules/copy/style change.
`npm run typecheck`: PASS (tmp/runtime-refactor/guided-ui-move-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 401 PASS
(tmp/runtime-refactor/guided-ui-move-unit.log).
`npx playwright test tests/browser/guided-lessons.spec.ts tests/browser/game.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all six PASS in 29.0s (tmp/runtime-refactor/guided-ui-move-browser.log), exit 0.
No live browser process remains. Results ownership and runtime frame/scene
relocation are green in the preceding checkpoints.
Next: separately delete compiler-audited stale session view/binding capabilities;
then perform requirement-by-requirement W2 audit, final scenarios/checkpoints/
units/broad browsers/production/Android-web, docs/behavior report/phone checklist
and version 1.67.0. All W3/Part 4 remain required; develop is unpushed.

## Latest green checkpoint: runtime frame/scene orchestration relocation

Physically moved frame-simulation.ts and scene-flow.ts from game/session to runtime.
Only relative imports/callers changed; normalized exact source parity PASS is
recorded in tmp/runtime-refactor/session-orchestration-move-parity.log. Rule and
cosmetic dispatch order, renderer readiness, stale requests, pending callbacks,
paused adoption and post-presentation clock reset are unchanged.
`npm run typecheck`: PASS (session-orchestration-move-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 401 PASS
(session-orchestration-move-unit.log); logs under tmp/runtime-refactor.
`npx playwright test tests/browser/game.spec.ts tests/browser/scene-readiness.spec.ts tests/browser/scene-continuation.spec.ts tests/browser/cinematic.spec.ts tests/browser/runtime-checkpoint-fixtures.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 18 PASS in 1.1m (session-orchestration-move-browser.log), terminal exit 0.
No live browser process remains.
Next: move game/onboarding/guided-lessons.ts DOM/CSS adapter to UI; keep actual
lesson progress/freezes/input state in game/onboarding/guided-state.ts. Then
separate stale session adapter cleanup and full W2 requirements/gates/docs/version
1.67.0. All W3/Part 4 remain required; develop is unpushed.

## Latest green checkpoint: results presentation ownership

Results rules emit deeply frozen display/sequence snapshots and synchronous
resultCue/resultReady values. ui/wiring/results-feedback.ts owns DOM/game-over,
letterbox/hints, screen/HUD/best/buttons and sequence presentation. UI completion
and bonus actions forward sequence IDs to the actual result rule owner; rewards,
profile/store settlement, overReady, support rollback/claims and recovery remain
rules. Sequence action storage retains only the current sequence; stale callbacks
from a replaced result screen no longer enable the newer screen (intentional
lifetime correction recorded in the behavior log). Save keys/records unchanged.
Actual normal/daily/recovery/bonus tests prove listener isolation, deep snapshots,
disposal, rollback/once-only currency and current sequence readiness.
`npm run typecheck`: PASS (tmp/runtime-refactor/results-feedback-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 401 PASS
(tmp/runtime-refactor/results-feedback-unit.log).
Initial affected browser run: 15 PASS/one daily-label encoding failure; fixed UTF-8
middle dot without changing the existing assertion.
`npx playwright test tests/browser/game.spec.ts tests/browser/daily.spec.ts tests/browser/support-rewards.spec.ts tests/browser/death-presentation.spec.ts tests/browser/feature-plan-06.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
final all 16 PASS in 1.2m (tmp/runtime-refactor/results-feedback-browser-fixed.log),
terminal exit 0 confirmed. No live browser process remains.
Next actual source audit: game/session/frame-simulation.ts combines rule/cosmetic
frame dispatch; game/session/scene-flow.ts orchestrates renderer requests/DOM
readiness and rule continuations. Move these runtime orchestration owners to
runtime in a separate physical-move commit, preserving every statement/order.
Then separate stale session capability/adapter cleanup and full W2 requirements/
gates/docs/1.67.0. All W3/Part 4 remain required; develop is unpushed.
Result generation/fix/lifetime scripts are non-idempotent and already applied.

## Latest green checkpoint: run-start presentation ownership

Run-start emits frozen runStartCue/runModeHint/runFortune values; UI-owned
run-start-feedback.ts reacts to motion/effects/letterbox resets, hints, screen/
HUD/bossbar/score/seal, audio initialization and trial leaves. Rule controller
retains player pose/timing reset, seed/combat RNG, weather generation, modifiers,
profile identity/counters, checkpoint clearing, trial eligibility and scene/
encounter entry. Cosmetic actions retain original synchronous call boundaries.
Seven actual normal/Ronin/Blade/Zen/rush/daily/trial scenarios compare run/profile/
player/weather/ledger/gameplay RNG with listeners enabled/absent and test frozen
values/disposal. No assertion or timeout was weakened.
`npm run typecheck`: PASS (tmp/runtime-refactor/run-start-feedback-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 396 PASS
(tmp/runtime-refactor/run-start-feedback-unit.log).
`npx playwright test tests/browser/game.spec.ts tests/browser/daily.spec.ts tests/browser/trials.spec.ts tests/browser/new-blessings.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 16 PASS in 1.7m (tmp/runtime-refactor/run-start-feedback-browser.log),
terminal exit 0 confirmed. No live browser process remains.
Next: results.ts UI/presentation ownership. Its direct DOM/renderGameOver,
letterbox/hints, screen/HUD/best/buttons and result sequence display must move;
retain overReady, reward settlement/profile/storage rollback and callbacks as
rules. Then separately delete stale adapter capabilities and complete W2 audit/
gates/docs/version 1.67.0. All W3 and Part 4 remain required; develop is unpushed.
The run-start generation script is non-idempotent and already applied.

## Latest green checkpoint: title/pause/resume UI ownership

Run-flow rules emit frozen runFlowCue values for seal/title/letterbox/best/pause/
trial-objective display and reuse existing sessionScreen/shrineOffers listeners.
ui/wiring/run-flow-feedback.ts owns actual display actions; runtime owns disposal.
Profile identity restoration, player animation reset, stage/title attract setup,
pause counters/secrets, teaching audio freeze, context-loss guard, clock reset,
quit checkpoint and result entry retain original synchronous boundaries.
Actual transition tests compare rules/profile/player with UI enabled/absent and
verify snapshots/disposal. Existing assertions and browser timeouts are unchanged.
`npm run typecheck`: PASS (tmp/runtime-refactor/run-flow-feedback-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 389 PASS
(tmp/runtime-refactor/run-flow-feedback-unit.log).
`npx playwright test tests/browser/game.spec.ts tests/browser/options.spec.ts tests/browser/feature-plan-06.spec.ts tests/browser/trials.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 27 PASS in 2.3m (tmp/runtime-refactor/run-flow-feedback-browser.log),
terminal exit 0 confirmed. The final runtime/session formatting-only edit
followed strict/unit verification and preceded this passing browser run.
No live browser process remains. Next: run-start and results actual UI/presentation
ownership; then separate stale adapter/capability cleanup, full W2 audit/gates/docs/
1.67.0; all W3 and Part 4 remain required. Develop remains unpushed.
The run-flow generation script is non-idempotent and already applied.

## Latest green checkpoint: saved-run UI ownership

Checkpoint restoration/capture now emits immutable display values; ui/wiring/
checkpoint-feedback.ts owns labels, boss bar, lives/score/HP, seal, HUD, saved
buttons, failure toast and continuation screen. Shrine continuation reuses the
existing shrineOffers listener with frozen filtered IDs. Rule/profile adoption,
weather-before-RNG restoration, phase adoption, clock reset, record format/save
keys and loading early returns retain their original boundaries.
New actual playing/boss/standoff/shrine tests compare run/profile/equipment/
weather/persistence/gameplay RNG with UI enabled/absent, preserve frozen snapshots
and verify disposal, failure order and silent loading exit.
`npm run typecheck`: PASS (tmp/runtime-refactor/checkpoint-feedback-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 388 PASS
(tmp/runtime-refactor/checkpoint-feedback-unit.log).
`npx playwright test tests/browser/game.spec.ts tests/browser/feature-plan-06.spec.ts tests/browser/runtime-checkpoint-fixtures.spec.ts tests/browser/scene-continuation.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 15 PASS in 1.0m (tmp/runtime-refactor/checkpoint-feedback-browser.log),
terminal exit 0 confirmed. No live browser process remains.
Next: remaining run-flow/run-start/results UI ownership, full W2 requirements
and gates, all W3 and Part 4. Develop remains unpushed; no approval is pending.
Do not rerun the non-idempotent checkpoint draft/resume scripts.

## Active implementation: domain runtime composition

Foundation/context lifetime is committed at a47566f. Strict checks, all 371 units
and all 254 combined browser cases pass in 14.1m; the unchanged eight-trial
encounter/reload case passes inside the full run. Logs: cached-views-regression-
typecheck.log, cached-views-regression-unit.log, cached-views-foundation-broad.log
under tmp/runtime-refactor. This supersedes the earlier foundation reload failure.

The domain composition is committed at f01fad7. Separate root import cleanup
removes 127 unused imports and leaves 129 lines. Strict checks, all 371 units and
all six startup/preview/disposal/scene-continuation browsers pass in 28.2s
(composition-imports-typecheck.log / composition-imports-unit.log /
composition-imports-browser.log). Root cleanup is committed at 2c03768.
Runtime owners: foundation, presentation, UI base, profile/equipment rules, combat
wiring, scene continuation, phases, sessions, menu/controls, frame/viewport and
synchronous reaction wiring. Renderer-dependent frame-bindings/startup moved
from game/session to runtime; no presentation/rendering imports remain in src/game.
Plain record shape, rule/RNG ownership and the three cached live projections are
retained. The isolated draft and semantic/reference audits remain under
tmp/runtime-refactor; original generators are non-idempotent.

Parsed probes migrate 24 hooks in 20 files (89 references); harness fields,
assertions and deadlines stay intact. Utilities needed only by injected probes
are imported into instrumented responses. The first focused invocation exposed
an eager run-flow read of refreshArmoryNew before controls existed. That run was
stopped (domain-composition-browser.log; terminal exit 1). Root menu/clock ports
now return stable forwarding callbacks, resolving later owners only when invoked.
Strict checks pass (domain-composition-deferred-typecheck.log). All 371 units
passed after the physical move (domain-composition-unit.log). Actual title/start/
pause/resume passes after the deferred callback repair
(domain-composition-startup-browser.log; terminal exit 0).

The unchanged 12-file focused browser invocation passes all 45 cases in 3.5m
(domain-composition-deferred-browser.log; exit 0). Strict checks and all 371 units
pass after the callback fix. The combined browser run completed with 253 passes
and one scene-continuation intercepted module-request ECONNRESET during reload
(domain-composition-broad.log; exit 1). The unchanged failing case passes in 13.0s
on focused recheck (domain-composition-scene-continuation-recheck.log; exit 0).
The failure trace is preserved in composition-scene-continuation-failure-trace.zip.
This is not a full passing combined-run claim or a proven pre-existing failure.
Targeted/actual scenario coverage is green for the internal composition checkpoint;
the fully passing broad W2 checkpoint remains required before lighting.

Original composition/import apply manifests are now stale; preserve current source.

Wave/knife/missed-swipe cosmetics and wave/knife profile progression now use
immutable value events in actual source. Strict and all 374 units pass
(wave-events-typecheck.log / wave-events-unit.log). The exact six-file browser
command passes all 22 cases (wave-events-browser.log): game, new-blessings,
trials, scene-readiness, scene-continuation and features, with rendering-v2
configuration and retained failure traces. Assertions/deadlines are unchanged.
Knife persistence now precedes cosmetics within the same call; wave preparation
and deferred profile settlement keep their original boundaries. Behavior changes
are recorded in tmp/runtime-refactor/behaviour-changes.md and architecture docs.

Wave event checkpoint is committed at f53dc44. Challenger entry/twitch/draw/exit
cues are now applied through presentation/standoff-cues.ts. Strict and all 375
actual units pass (standoff-cues-typecheck.log / standoff-cues-unit.log). The exact
browser command with feature-plan-06, runtime-checkpoint-fixtures and tanto,
rendering-v2 configuration and retained traces passes all 11 cases
(standoff-cues-browser.log). No source was changed during either browser run.
Actual deferred entry/cut/exit isolation proves frozen snapshots, disposal and
identical run/profile/combat RNG when cosmetic cues are absent. Entry checkpoint,
transition/wave continuation and cosmetic values retain their original order.

Standoff cue checkpoint is committed at f1d0e82. Boss entry/health/ready/trait,
draw/recovery/counter/heal/deflection/opening hint cues now use frozen events and
presentation/boss-cues.ts. Boss state table has emission instead of sound/flash
callbacks. Guided lesson actions remain rules because they freeze/gate combat.
Strict/all 379 units pass (boss-cues-typecheck.log / boss-cues-unit.log), including
four actual base/Twin/spear/Mirror deferred/recovery/Counter/Breath/afterimage/
deflection/victory fights proving listener isolation, one-time save and disposal.
Exact focused browser command: trials, feature-plan-06, scene-readiness, tanto,
game with rendering-v2 configuration and retained failure traces; all 21 pass
(boss-cues-browser.log). Original assertions/deadlines remain unchanged.

Boss cue checkpoint is committed at ed6cc8a. Grunt bell/feint/bark now emit
frozen values from the behaviour table; presentation/grunt-cues.ts owns sounds.
Strict/all 380 actual units pass (grunt-cues-typecheck.log / grunt-cues-unit.log).
Exact browser command: game, new-blessings, runtime-checkpoint-fixtures with
rendering-v2 configuration and retained traces; all 12 pass in 41.9s
(grunt-cues-browser.log). Actual seeded feint/Shiba/Still/late damage test proves
identical run/profile/combat RNG, frozen values and listener disposal.
Timers, switch-frame pose, pet state and damage remain in the grunt rules.

Grunt event checkpoint is committed at 3a389ee. Shrine/trial rule phases now emit
frozen values; profile progression and UI feedback have dedicated listeners.
Shrine rule view is narrowed; obsolete shrine HUD/screen/toast/offers adapters
were removed from runtime phase binding as required by that typed contract.
Rule RNG, modifiers, checkpoints, continuation and trial profile/RNG restoration
retain their original boundaries. Trial progression installs before UI during
runtime session construction and resolves current owners lazily.
Strict/all 383 units pass (shrine-trial-events-typecheck.log /
shrine-trial-events-unit.log). Actual seeded Crossroads/Twin/reroll and natural
Quiet Blade combat/completion/failed retry prove profile/UI isolation, frozen
snapshots, once-only settlement, original save order and listener disposal.
Exact browser command: trials, feature-plan-06, new-blessings,
runtime-checkpoint-fixtures, game with rendering-v2 config and retained traces:
all 23 pass in 2.2m (shrine-trial-events-browser.log). Assertions/timeouts unchanged.

Shrine/trial ownership checkpoint is committed at 6b66d72. Separate capability
cleanup is now applied: all prepared source hashes matched before mutation.
Compiler-symbol audit removes 209 unused captures/58 obsolete view fields;
typed runtime owners lose 35 unused adapters and 13 caller action getters.
runtime/phases no longer takes presentation; standoff cosmetics have their own
view and trial UI action ports use TrialFeedbackViews. Twelve unused imports and
one unused stage lookup are removed. No rule branch, RNG or checkpoint change.
Final strict/all 383 units pass (phase-capability-cleanup-final-typecheck.log /
phase-capability-cleanup-final-unit.log). Earlier same-stage strict/383 units and
all 10 game/scene-continuation/runtime-checkpoint-fixtures browsers pass in 33.0s
(phase-capability-cleanup-browser.log). The final change after browsers only
deletes the unused standoff stage lookup/import. No source changed during browsers.
Audits under phase-capability-cleanup: original field/capture/hash audit.json,
runtime-audit.json, caller-audit.json and import-audit.json (eleven imports there;
the last STAGES import was removed afterwards). Original prepared hashes/scripts
are now stale/non-idempotent; never reapply them.

Next: finish the remaining session/UI ownership against the full W2 requirements.
Actual inspection still finds direct DOM/screen/cosmetic orchestration in
run-start, run-flow, results and checkpoint-flow. Results directly updates DOM
fields and renders game-over; checkpoint adoption writes encounter labels/bar;
run-start directly clears effects/screens and displays mode hints; run-flow
directly controls title/resume screens. Do not claim full ownership from the
129-line root or import scan. Move their UI/presentation work into actual owning
listeners/adapters while preserving transactions, guided input freezes, player
animation mutation, scene continuation, RNG, profile settlement and checkpoints.
Then do the requirement audit and final W2 gates: scenario/checkpoint/full units/
broad browser/production/Android-web, 1.67.0 version/changelog, architecture/
behavior log/phone checklist. All W3 and Part 4 remain required.
Develop is unpushed; push once only after full completion. No profiling/benchmarks,
store builds, real-save edits or lit-only changes. No live browser process remains.

## Latest green checkpoint: Damage and companion event reactions

Damage/death, Tanto/foxfire saves and Daruma/Phoenix/support revival feedback
now react to immutable value events in presentation/damage-feedback.ts. Rules
retain lives/combo/attacker mutations, hit stop, slow motion, trial failure,
checkpoint boundaries and encounter restart. Same-call presentation ordering is
recorded in tmp/runtime-refactor/behaviour-changes.md and architecture/decision docs.
Actual enabled/disabled listener scenarios prove run/profile/combat RNG isolation.
`npm run typecheck`: pass (damage-feedback-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 370 pass (damage-feedback-unit.log).
`npx playwright test tests/browser/death-presentation.spec.ts tests/browser/support-rewards.spec.ts tests/browser/game.spec.ts tests/browser/feature-plan-06.spec.ts tests/browser/scene-readiness.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 17 pass in 1.4m (damage-feedback-browser.log; terminal exit 0 confirmed).
Combined broad completed: 250 pass, four stale edition-fixture failures in 14.8m
(damage-feedback-broad.log; terminal exit 1). Both fixtures still replaced the
removed local edition declaration, so their override silently left Web access.
The route hooks now assert and replace the actual constructor edition input.
`npm run typecheck`: pass (edition-hook-typecheck.log).
`npx playwright test tests/browser/editions-mastery.spec.ts tests/browser/premium.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 11 pass in 1.2m (edition-hook-browser.log; terminal exit 0).
Original access/purchase/revocation/viewport assertions and timeouts remain.
Full combined verification must be rerun after the upcoming context move.

## Previous green checkpoint: Session state and browser service owners

game/session/runtime-state.ts owns eleven plain mutable lifetime fields: template,
ledger, milestones/reveals, checkpoint/offers, clocks, knocks, reward flow and crest
reveal flag. game/session/state-view.ts forwards only explicit named fields into
nine binding providers, preserving replacement identities and lazy service getters.
platform/runtime-preferences.ts owns settings/access/haptic capabilities and browser
access flags. ui/wiring/audio.ts owns audio/guided/mute wiring. Construction calls,
save keys, checkpoint records, gameplay RNG and settings application remain intact.
Semantic reference audits are in tmp/runtime-refactor; source moves use actual
records rather than global text substitution. New units exercise actual run entry
against the session owner, deferred service reads and capability isolation.
`npm run typecheck`: pass (state-services-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 368 pass (state-services-unit.log).
`npx playwright test tests/browser/options.spec.ts tests/browser/daily.spec.ts tests/browser/trials.spec.ts tests/browser/feature-plan-06.spec.ts tests/browser/scene-continuation.spec.ts tests/browser/secrets.spec.ts tests/browser/cinematic.spec.ts tests/browser/support-rewards.spec.ts tests/browser/death-presentation.spec.ts tests/browser/class-lifecycle.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 44 pass in 3.7m (state-services-browser.log; terminal exit 0 confirmed).

Separate import cleanup: twelve unused browser/state constructor imports removed.
Compiler-symbol audit retained live browser instrumentation. Strict check and all
368 units pass (state-services-imports-typecheck.log and state-services-imports-unit.log).

Latest passing combined broad:
`npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 254 pass in 14.0m (frame-startup-broad.log; terminal exit 0 confirmed).
That invocation covers frame/startup moves, unused import cleanup and corrected
Options fixture, and predates the latest state/service ownership batch.

## Completed ownership and important evidence

W1 is complete and committed (5406e90), with layout-preserving compact planes,
optional emissive and exact data maps. Tight repacking stays cancelled. See
docs/development/asset-compaction-results.md and preserved verification below.

W2 WebGL2-only startup/recovery, typed context/events, ordered seven-layer composer,
UI/session/phase owners, actual grunt/boss/player tables and behaviour registries,
companions, profile policy/equipment/progress, frame scheduling and artwork startup
are implemented. Damage/companion/kill/combo/score/parry/block and successful boss/standoff feedback
react to immutable event values. Rules own outcomes and gameplay RNG. Runtime
dimensions, mutable profile identity and remaining service/action projections still
need genuine composition reduction. See overview.md and refactor-decision-log.md.

Actual-API scenarios drive daily/trial entry/completion and wrong swipe damage,
normal/Ronin waves, rush/boss fights, standoff/shrine/death/results. Bounded winning
and missed-parry/recovery paths visit every reachable boss state; mirror has no
feint. Fixed-date daily/repeated trial seed assert profile isolation and once-only
settlement. Fixtures resolve current RNG/profile ports (c55acea; 365 units before
new state-view tests). Checkpoint compatibility fixtures and round trips remain.

Controlled unchanged pre-refactor proofs document first support failed-save retry,
the intentional Twin three-badge fixture, and stale scene continuation on checkpoint
adoption. Fixes and real browser/headless regressions are committed. The previous
combined run had 253 pass/one paused Options snapshot race in 14.0m. Held actual
renderer completion on pre-refactor reproduces checkpoint/RNG mutation while state
stays paused (paused-options-baseline.log; original equality assertion fails).
The fixture now waits for ready scene and actual wave configuration before freezing
an encounter; original equality/timeouts remain, intentional paused scene adoption
remains separately tested. Corrected full254 run above proves combined coverage.

## Resume here; all remaining work is required

Finish genuine composition reduction: root is 1606 lines, far from the approximately
200-line target. Consolidate remaining profile identity, geometry/equipment colour,
scene loading state and explicit context/service/action projections into their true
owners. Remaining enemy/player helpers, secret/shrine/result view callbacks and
wave/boss reactions need owning orchestration/presentation modules. Do not
rename the remaining monolith. Preserve plain records and both random streams.
Keep root BLESS_BY/bossShownDirection and artworkReady instrumentation until actual
browser hooks migrate. Applied drafts are non-idempotent; regenerate isolated
previews from current source rather than overwriting with old copies.

After complete W2 implementation: scenario/checkpoint/full unit/broad browser,
test:production and Android web gates; docs/behaviour report and phone checklist;
minor 1.67.0 with lock/title/changelog synchronized and committed.
W3 is entirely pending: audit/read APIs, MRT G-buffer/light pre-pass/composite,
16 lights/PBR/masks/old shader removal, instanced grass/leaves, event lights,
half-resolution/extension hooks; all ordered gates/docs and minor 1.68.0.
Do not implement W3 before W2 finishes. Part 4: final exact checks/report, byte
results/future opt-in captures, completion status/report commit, ONE develop push
and verified pushed hash. No partial completion claim or early develop push.

## Execution rules

Preserve source while browser verification runs. Keep physical moves, behavior
changes and deletions in separate commits. Assertions/tolerances/timeouts are not
loosened. Named-pipe TS7 and repository writes require elevated execution in this
session; the goal authorizes them. Disposable files live under ignored tmp.
Existing baseline has a node_modules junction; do not recursively delete through
it. Prepared lighting is borrowed. No profiles or performance suites; ordinary
browser performance.spec.ts exercises functional lifecycle and is permitted.

## W1 verification commands and results

Commands run from the repository; Python uses the Pillow-enabled ISSEN_PYTHON.
All logs below are in ignored `tmp/asset-compaction/`.

- `& $env:ISSEN_PYTHON scripts/assets/tests/compact.test.py`: six passed,
  w1-final-python.log. `node scripts/assets/compact.mjs --apply`: zero changes,
  w1-final-noop.log. Node utility/export checks:
  `node --test tests/unit/asset-compaction.test.mjs tests/unit/asset-pack-docs.test.mjs scripts/pbr/tests/cli.test.mjs`:
  ten passed, w1-final-tools.log.
- `npm test`: all 252 passed, w1-final-unit.log.
- `npm run typecheck`: passed, migrated-typecheck.log; strict checking also passed
  in the final production and Android web builds.
- `npx playwright test tests/browser/compacted-planes.spec.ts --config playwright.rendering-v2.config.ts`:
  all 352 conversions passed (180 exact data), every-plane-browser.log; the same
  test passed again after cleanup in the broad suite.
- `npx playwright test tests/browser/pixi-backend.spec.ts tests/browser/pixi-scenes.spec.ts tests/browser/pixi-catalogue.spec.ts tests/browser/material-colour.spec.ts tests/browser/asset-materials.spec.ts tests/browser/environment-materials.spec.ts tests/browser/artwork-loading.spec.ts tests/browser/enemy-art-cache.spec.ts tests/browser/optional-emissive.spec.ts tests/browser/zero-emission-parity.spec.ts --config playwright.rendering-v2.config.ts`:
  all 34 passed, migrated-focused-browser.log. Includes Canvas comparisons and
  context-loss/restore cases. Weapon optional-emission readiness regression fixed.
- `npx playwright test --config playwright.rendering-v2.config.ts`: all 245 passed
  in one uninterrupted 11.5m run, w1-broad-browser.log (terminal exit confirmed).
- `npm run test:production`: final version all four passed,
  w1-version-production.log (terminal exit confirmed).
- `$env:ISSEN_ANDROID_BUILD_DIR='tmp/.verification-build-android'; npm run test:android-web`:
  final version four passed and encounter reload failed, w1-version-android.log.
  The same original assertion fails on unchanged pre-refactor Android web build:
  `npx playwright test tests/android/offline.spec.ts -g 'encounter recovery' --config tmp/asset-compaction/android-baseline.config.ts`,
  android-recovery-baseline.log; focused compact recheck also fails. This is a
  proven pre-existing exception under the goal decision rules; no assertion or
  tolerance was skipped/changed. A first baseline attempt had wrong server cwd;
  the corrected run is the evidence.
- `npx playwright test tests/browser/changelog.spec.ts --config playwright.rendering-v2.config.ts`:
  passed, w1-changelog-browser.log. `node scripts/pbr/refresh-pack-docs.mjs`:
  second refresh zero changes, all 266 plane links independently checked.

Matched byte results are in `tmp/asset-compaction/byte-results.json`. Web bundle
261,053,490 to 120,506,570 bytes; Android web 284,964,042 to 144,390,034. Runtime
planes 266,530,086 to 120,472,123; checked texture tree includes authoring originals
and totals 181,824,601. Unsigned ZIP projection 295,487,341 to 158,550,091 using
one frozen native shell. Projections are neither native builds nor installable
APKs. Existing dist/store/APK outputs remain untouched. Baseline checkout under
`tmp/asset-compaction/restore-baseline` is detached at pre-refactor, clean, with
linked dependencies; preserve it while pre-existing failure evidence is needed.
Future oversized normal/surface review and opt-in captures are listed in W1 report.

