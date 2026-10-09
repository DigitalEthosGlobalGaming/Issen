# Current development status

## Current handoff — selected companion warming

App 1.69.43 includes the visible companion in scene figure readiness and optional
incoming warming. Companion `prepareUploads` selects only the required kit,
awaits its existing image/material leases and lists the colour/normal/surface/
optional emissive sources used by ordinary drawing. No extra canvases, pose
simulation, tint caches, gameplay RNG or visual changes. Unsupported/procedural
pets return no uploads; the runtime uses `petOf()` so scarecrow's implicit crow
is covered. Changed kit, abort and renderer disposal reject stale results.
Native services retain/warm the companion in the existing union; pet changes
invalidate pending background artwork.

Four focused browser checks PASS6.0s/default2workers: all four atlas-backed pets'
first idle/active draws upload0 after warming, only the selected kit is pinned,
no-pet loads nothing, final GPU0; existing hidden decode/pixel-identical context
restoration; native figure cancellation/restoration/disposal now includes cat;
background reservation/cancellation/upload-free promotion now includes cat.
Results `tmp/test-results/browser/companion-warming/`. Checked production build/
strict TypeScript plus startup/Armoury/run/landscape and offline-resize smokes
PASS9.9s/default2workers; `tmp/test-results/production/companion-warming/`.
No new performance matrix: no atlas or shader change, and first-use upload counts
are the specific behavior being checked. Whole-run special-loadout memory remains
unproven; adding earlier warming does not establish a lower memory bound.

Next: verify actual normal/fixed-trial boss readiness and same-stage gaps, then
natural progression/viewport/special-loadout/transient/native memory coverage,
native colour mismatch, final stable cold/warm/frame/compose matrix and suites.
Goal active. All processes terminal; no push/deploy/native build/real-save changes.
Cancelled packing/lit-only stays cancelled.

## Previous handoff — background incoming boss artwork

App 1.69.42 connects figure warming to the existing quiet-frame preload controller
once the next environment is ready. Incoming boss identity tones use the existing
enemy renderer; selected weapons/player/charm reuse prepared equipment. Native
services keep the current GPU lease while holding the optional incoming lease.
A conservative 64 MiB reservation remains counted alongside actual allocations
until completion; pressure denies admission/cancels pending work. Foreground,
hidden/busy pending frames, scene identity, equipment/count changes and disposal
cancel optional preparation. Ready work survives busy frames. No seeded gameplay,
visit entry or combat RNG changes. Memory polling is throttled to 250 ms.

Focused corrected rush-entry probe: prepared environment plus incoming figures
reduces transition 221.7→21.1 ms, boss2/helm enters stage1. Incoming preparation
finishes during the controlled quiet window; sampled committed peak511.54 MiB
(536,388,532 bytes) including reservations, below512 MiB but narrow headroom.
Evidence `tmp/probes/rush-entry-prepared-figures.{mjs,json}`. This uses actual frame
samples and `nextStep`, but sets the pause/between fixture explicitly; it is not
natural combat, all-transient residency or physical120Hz proof. Its old textual
`warmed` instrumentation no longer matches the native branch layout; readiness
is instead proven by the exposed figure-preload ready state and promotion.

Two focused browser checks PASS5.6s: existing cancellation/context restore/final
release plus new background reservation, cancellation, current retention,
zero-upload foreground promotion, pressure denial and final GPU0. Results
`tmp/test-results/browser/background-figures/`. Seven preload/prediction/occlusion
units PASS. Checked production build/strict TypeScript plus startup/Armoury/run/
landscape and offline-resize smokes PASS11.5s/default2workers, results
`tmp/test-results/production/background-figures/`. No unchanged full-suite reruns.

Next: companion first-use and same-stage/fixed-trial incoming preparation; natural
progression, viewport/special-loadout and transient/native memory coverage; native
colour mismatch diagnosis; final stable cold/warm/frame/compose matrix and suites.
Goal active. All processes terminal. No push/deploy/native build/real-save changes;
cancelled packing/lit-only stays cancelled.

## Previous handoff — rush entry delay confirmed

App remains 1.69.41; this checkpoint changes evidence/documentation only. A focused
low-tier 390×844/DPR 2 Edge probe corrected the controlled pause by preserving
`pausedFrom`. Keeping boss 1 alive while promoting stage 1 then takes 13.6 ms;
figure preparation reuses 213 uploads in 0.4 ms and warming finishes 1.9 ms after start.
That control is not a valid next-duel transition: it retains the old boss.

A second probe uses the runtime `nextStep()` from controlled `between` state
instead of directly calling `setStage`. It enters boss 2/helm on stage 1 and takes
221.7 ms despite a prepared environment. Enemy preparation finishes 130.0 ms after
start with 252 uploads; union warming finishes 198.3 ms after start. This confirms
incoming figure preparation, rather than environment composition, remains on
the transition path. Initial preparation timings vary; these are focused single
samples, not frame-delivery or physical-device performance claims. Evidence:
`tmp/probes/rush-pause-preparation.json` and
`tmp/probes/rush-entry-preparation.json`; scripts of the same names reproduce
them. Both isolate Edge/Vite and terminate in `finally`.

Source inspection: boss defeat retains `G.boss` but sets state `between`;
`startRushDuel` changes scenery before calling `startBoss`, which defers until
scene readiness. Scene preparation selects upcoming identity tones in `between`
and the current boss palette only in `boss`/paused-from-boss. Thus the selection
is correct for the real next-duel path; do not fix the delay by retaining the
outgoing palette or treating a paused control as natural combat progression.
Next: prepare the incoming figure set ahead of promotion within the existing
quiet-frame/memory/cancellation policy. Companion first-use, natural progression,
transient/native bounds and final verification remain open as listed below.
No runtime edits or routine suite reruns at this diagnostic checkpoint.

## Previous handoff — compact low-memory accessories

App1.69.41 reuses prepared-figure atlas copying for the256MiB tier: outfit families
have four aligned parts capped256px; charms have12parts capped128px. Copies preserve
original colour sources and logical attachment geometry; colour/normal/surface/
optional emissive align. Shared main-image leases unpin inputs after copies finish;
pressure can close raw planes without invalidating parts. Primary/preview outfit
borrowers share one family; final release retires parts/tints. Higher tiers retain
original sampling. Existing enemy helper policy unchanged. Snapshots expose part
pixels. Headwear backing2,178,048bytes replaces18,870,192raw; charm1,634,304replaces
18,874,368, excluding additional existing tint/sprite canvases.

Outfit-only daily first next scene changed denied→ready,23.2ms presentation/sample
peak506.8MiB, but full loop still denied8→0. Adding finite charm maps completes all
nine controlled daily next-stage preparations/promotions:21.3–33.8ms waits, sampled
peak509.2MiB. Rush also completes all nine, including formerly denied8→0: first
211ms (changed enemy-palette preparation unresolved), later9.7–19.1ms; peak511.6MiB.
These run actual frame-loop samples with no injected quiet samples, but control
paused state/ordinals/stage entry; not natural combat progression, all transients
or physical residency proof. Evidence `tmp/probes/daily-compact-outfit.json`,
`automatic-next-scene-daily-compact-outfit.json`, and
`automatic-next-scene-{daily,rush}-compact-accessories.json`.

Fixed-pose monk/yoroi/mino plus omikuji screenshots at gameplay/preview sizes reviewed
before/after; coherent silhouettes/colours/lighting retained, subtle softening
accepted. Same low-tier control disables only accessory compaction. Three-player
fixture managed GPU119,591,528→57,187,376bytes; raw inputs remain evictable in the
main pool, not automatically gone at screenshot time. Main pinned bytes
100,645,200→25,160,256. This fixture is not a whole-game memory cap.
Evidence `tmp/probes/accessory-visual-{before,after}.{json,png}`.

Strict TypeScript PASS; four PBR lifetime and scene-occlusion units PASS. Five
focused browser checks PASS5.5s/default2workers: low/high selected artwork warming,
forced raw eviction with unchanged repeated pixels/zero first-use uploads, high
primary/preview selection, cancellation, low hidden/context recovery/final GPU0.
Results `tmp/test-results/browser/compact-accessories/`. New compact preview test
PASS2.7s: one shared backing across primary/two borrowers, all raw inputs close,
exact drawable pixels, last borrower releases native sources0. Additional part
pixel bound PASS3.2s (`compact-accessory-preview/`, `compact-accessory-bounds/`).
Checked production build/strict TypeScript plus startup/Armoury/run/landscape and
offline-resize smoke cases PASS10.1s/default2workers. Results
`tmp/test-results/production/compact-accessories/`.

Goal active: future boss palette scheduling and companion first-use, natural run
progression/viewport/special-loadout coverage, mandatory/transient/native bounds,
historical native colour mismatch, final cold/warm/frame/compose matrix and
applicable suites remain. Physical Android/120Hz evidence unavailable. First
rush palette wait remains actionable; avoid repeating unchanged whole matrices.
All sessions terminal; no push/deploy/native build/real-save changes. Cancelled
packing/lit-only stays cancelled.

## Previous handoff — selected player and charm warming

App1.69.40 includes the selected robe/charm and actual charm colour in scene figure
readiness. Player preparation captures existing body/arms/head material stamps in
paced batches with a disposable1×1CPU sink; existing outfit tints/attachments are
reused, with one last-selection upload list and cancellation/selection/disposal
checks. Charm preparation shares its normal draw recipe/cache; sprite canvases are
now tracked and retire GPU consumers before eviction/final disposal. Native figure
services retain/warm the union through the existing painter. No alternate renderer,
pose/RNG/simulation advancement, authored asset or texture-detail changes.

Focused daily probe confirms monk robe/omikuji charm. Selected player preparation
alone did not remove42.5ms first frame. Native call instrumentation identified charm
sprite21.2ms and normal/surface7.6/10.9ms uploads after figure warming. With selected
charm preparation, no GPU call above1ms after warming;121automatic quiet samples,
max2.1ms/median1.3ms, zero over-budget samples (before max42.3ms/one over budget).
Evidence `tmp/probes/daily-first-uploads{,-prepared}.json`. This isolates first-use
uploads in one controlled quiet state; not physical120Hz or full gameplay timing.
Daily next scene now remains denied before starting; sampled peak457.6MiB including
current resources/reservations. It still lacks current+next headroom; not a passing
all-mode transition result. Future compact selected outfit/material ownership is
an actionable candidate rather than raising the512MiB budget.

Rush narrow instrumentation reports changed enemy palette preparation~223ms plus
~70ms warming in312ms first prepared transition. Probe manually controls paused
state/ordinals and is not natural boss progression; verify actual boss palette
selection and future scheduling before changing it. Evidence
`tmp/probes/mode-preparation-{daily,rush}.json` and
`mode-preparation-daily-player-warm.json`. Player outfit readiness previously did
not await the new selected headwear; selection/decoding/warming now participates.
Companion first-use and future boss palette scheduling still need audit.

Strict TypeScript PASS and scene-occlusion unit PASS. Two native preparation checks
PASS4.3s/default2workers: monk/yoroi/mino plus omikuji have zero first-use uploads,
exact repeated pixels and cached player upload reuse; integrated selected artwork
survives hidden cancellation/context restoration and final native disposal0.
Results `tmp/test-results/browser/player-charm-warming/`. Three focused integration
checks PASS7.9s/default2workers: shared player ownership, outfit primary/preview pin
union and boss readiness while figure preparation is held. Results
`tmp/test-results/browser/selected-artwork-integration/`. Checked production build/
strict TypeScript and all four production smoke cases PASS18.7s/default2workers,
including startup/Armoury/run/landscape, editions and offline resize. Results
`tmp/test-results/production/selected-player-charm/`.

Goal active: mode/viewport/loadout current+next memory headroom, incoming variants/
whole transient bounds, historical native colour mismatch, final cold/warm/frame/
compose measurement matrix and applicable suites remain. Physical Android/120Hz
evidence unavailable. All probe sessions terminal; no push/deploy/native build/
real-save changes. Cancelled packing/lit-only stays cancelled.

## Previous handoff — meadow wrap preparation

App1.69.39 omits meadow live-fog inputs from static worker composition/preload and
its admission estimate. Main renderer fog/lighting stays intact; Moonwatch keeps
baked fog. Avoids four unused worker planes:6,301,344nominal bytes on256MiB tier,
25,176,608at original resolution. Initial omission alone still cancelled return
preparation: decoded fog was counted both as real backing and future reservation.
PBR owners now expose partial decoded bytes; next-slot allowance subtracts actual
fog decode backing while preserving future GPU backing. Response handoff leaves
pending GPU upload accounting with the painter. No asset, layout or seed changes.

Actual frame-loop probe observes background samples without injecting them, in a
controlled paused state with rendering active. Before: ordinary1–8 promote,8→0
admission denied. After: all nine prepare/promote, waits11.7–20.2ms, sampled combined
peak511.15MiB within512MiB; wrap prepares1083.6ms including downloads/decodes/warmup.
This is controlled quiet cadence, not natural complete combat progression or all
transients/native residency. Evidence `tmp/probes/automatic-next-scene-low.json`,
`automatic-next-scene-static-fog.json` and `automatic-next-scene-fog-accounted.json`.

Mode probes start actual rush/daily through setup, then control ordinal/stage
progression. Rush first transition282.8ms, later10.2–16.2ms; eight promote, return
admission denied. First rush attempt had a locked fresh profile; disposable
unlocked profile corrects that fixture. Daily confirmed active: first preparation
starts then cancels; nine observed samples/two over budget, max frame work41.9ms,
accounted reservation snapshot529.6MiB with cancelled work still settling. These
are unresolved mode/figure pressure and first-use concerns, not passing cap proof.
Evidence `tmp/probes/automatic-next-scene-{rush,daily}.json`. Next investigate first
rush figure preparation and daily overlap, then tighten headroom/viewport/loadout
coverage without raising budget or repeatedly running unchanged full matrices.

Strict TypeScript PASS; three admission, six worker composition and four PBR
lifetime units PASS. Five focused browser cases PASS16.8s/default2workers:
meadow worker-phase decode/export accounting, two-cycle low-memory all-stage
lifetime/reacquisition, promotion, pressure and busy cancellation. Results
`tmp/test-results/browser/static-worker-fog/`. Four final next-scene cases PASS9.4s
(default single-file worker), including new8→0 promotion with unchanged outgoing
pixels and zero first-use uploads/programs; pressure/cancellation retained.
Results `tmp/test-results/browser/fog-reservations/`. Checked production build/
strict TypeScript plus startup/Armoury/run/landscape and offline-resize smoke cases
PASS10.9s/default2workers (`tmp/test-results/production/static-worker-fog/`).

Goal active: incoming variants/whole transient bounds, mode/viewport/loadout
coverage, historical native colour mismatch, final timing/memory matrix and
applicable suites remain. Physical Android/120Hz evidence unavailable. All probe
sessions terminal; no push/deploy/native build/real-save changes. Cancelled
packing/lit-only stays cancelled.

## Previous handoff — low-memory scenery backing

App1.69.38 shares scenery raster policy between actual allocation and next-stage
admission. The256MiB decoded tier caps scenery at1logical density/600,000pixels
per plane, bamboo foreground at1density/240,000combined pixels. Worker documents
expose their explicit loader budget. Higher tiers retain prior limits; layouts,
recipes and seeds stay intact. Fine scenery detail intentionally softens.

Actual low-memory runtime probe previously denied the first next scene. With this
policy all eight ordinary next stages prepare and promote without recomposition;
presentation waits9.9–18.2ms. Sampled combined peak509.9MiB within512MiB, with narrow
first-stage headroom. Probe explicitly supplies quiet samples: it proves real
owners/assets/promotion, not automatic gameplay pacing or every transient.
Evidence `tmp/probes/real-next-scene-{before,raster}.json`.
Representative same-seed daylight/bamboo/fire/coast screenshots reviewed; coherent
layout, silhouettes and lighting retained. Ordinary transferred backing
28,837,440→15,799,680bytes; bamboo33,577,344→17,906,304bytes. Control disables only
compact raster policy. Evidence `tmp/probes/raster-visual-{before,after}.json`
and associated stage0/4/6/7 screenshots; intentional detail changes accepted.

Strict TypeScript, two admission units and seven prediction/variation units PASS.
Five focused browser lifecycle checks PASS7.7s/default2workers, including actual
390×844 output atDPR3, phase accounting, next promotion/admission, busy cancellation
and inactive-owner suspension. Results `tmp/test-results/browser/low-memory-raster/`.
Checked production build/strict TypeScript and all four production smoke cases
PASS18.6s/default2workers, including startup/Armoury/run/landscape, editions and
offline resize. Results `tmp/test-results/production/low-memory-raster/`.

Still required: automatic quiet-frame cadence across normal/daily/rush modes,
return8→0, incoming figure variants, viewport/special-loadout memory coverage,
whole transient/native bounds, historical native colour mismatch and final
cold/warm/frame/compose matrix/applicable suites. Physical Android/120Hz evidence
remains unavailable. Goal active; no push/deploy/native build/real-save changes.
Cancelled packing/lit-only stays cancelled.

## Previous handoff — worker bitmap export reservations

App1.69.37 reserves independent bitmap copies before worker export, alongside its
composed canvases. Counts every plane/foreground copy even with shared sources.
Decode-progress preserves export reservation; final response replaces it with
main transferred ownership in the receive handler, before callers resume. Optional
next-slot estimates subtract reported worker backing for the matching request;
response handoff then replaces temporary incoming ownership without duplication.
Failure/suspension clear counters/resources. No compose, sampling or seed changes.

Strict TypeScript and6worker composition units PASS. Seven focused browser checks
PASS8.4s/default2workers: worker phase reservation/settlement, next promotion,
admission pressure, busy cancellation, worker suspension and required transition
pressure/full-map recovery. Evidence `tmp/test-results/browser/export-reservations/`.
Additional synchronous receive-handoff assertion PASS1.1s: transferred bytes are
visible before awaiting callers resume (`tmp/test-results/browser/export-handoff/`).
Checked production build/strict TypeScript and all4production smoke cases PASS18.8s,
including startup/Armoury/run/landscape, editions and offline resize. Log
`tmp/probes/export-reservations-production.log`; results
`tmp/test-results/production/export-reservations/`. Formatting/diff checks PASS.
All-stage low-memory ordinary run0–8→0 completes. Corrected phase observer uses
message worker counters directly instead of queueMicrotask's previous-phase values.
With export reservations, peak486,218,372bytes/463.7MiB, final443,382,644bytes/422.8MiB.
Export copy reservations28,837,440bytes ordinary,33,577,344bytes bamboo. Evidence
`tmp/probes/all-stage-memory-export-reserved.json`; pre-change corrected capture
`all-stage-memory-phase-corrected.json` omitted these copies and is not full proof.

These phase-boundary plus50ms observations cover this portrait regular-loadout
cycle, not every transient/native scratch, viewport or mode. Final measurement
matrix, historical native colour mismatch, applicable suites and physical
Android/120Hz evidence remain required. Goal active; no push/deploy/native build/
real-save changes. Cancelled packing/lit-only stays cancelled.

## Previous handoff — Demon mist upload churn removed

## Current handoff — Demon mist upload churn removed

App1.69.36 Demon mist samples one bounded radial field with fractional crops;
five strips retain original continuous sinusoidal shift and rounded clipping edges.
Field max512×512, size-keyed, explicitly warmed/retained, tracked as canvas backing;
resize retires old field and release/disposal clears it. Reduced motion keeps t0.
Sky/halo/props/embers unchanged. Procedural mist interpolation is an intentional
visual approximation; representative same-seed before/after appearance accepted.

Targeted isolated native527×1140/40frames: texImage2D200→0, radial gradient objects
240→40 (static halo remains), CPU render-call median1.4→0.9ms,p952.8→1.9ms.
Nominal managed GPU bytes95,413,456→94,334,160; field57,856pixels. These are render
calls/nominal bytes, not120Hz frame delivery or physical residency. Evidence
`tmp/probes/demon-mist-{before,after}.{json,png}`; original source saved with probe.

Strict TypeScript PASS, Demon lifetime unit PASS,3focused native browser cases
PASS5.0s: zero moving-frame uploads, exact reduced-motion replay, closed resize/exit
fields, native source count0 on release; existing preparation/first-use/context
restoration/re-entry and obsolete/disposed preparation checks pass. Evidence
`tmp/test-results/browser/demon-mist-lifecycle/`. Actual beam low-memory Demon/
inspection/title integration succeeds, sampled peak501,811,064bytes/478.6MiB;
Demon field57,856pixels. Screenshot reviewed; no missing lighting/mist/artwork.
Evidence `tmp/probes/realm-preview-memory-mist.json` and associated screenshots.
No broad suites repeated for this local chunk.

Goal active: whole transient/admission bounds, historical native colour mismatch,
all-stage/viewport/mode and final cold/warm/frame/compose measurement matrix,
final applicable suites and physical Android/120Hz evidence remain outstanding.
No push/deploy/native build/save changes; cancelled packing/lit-only stays cancelled.

## Previous handoff — compact special weapons

## Current handoff — compact special weapons

App1.69.35 low-memory special preparation retains finite pan/beam/gold-pan colour
cutouts plus aligned normal/surface planes, max512px width. Seven canvases total
467,456pixels/1,869,824bytes replace three decoded inputs18,882,456bytes; net
17,012,632byte backing reduction. Higher tiers keep original material sampling.
Finite parts live outside tint LRU; queued native frames survive raw retirement.
Base-only preparation cannot reopen maps. Disposal closes owned canvases/inputs.

Strict TypeScript PASS;4PBR lifetime units PASS. Three existing weapon browser
checks PASS (lazy selection, exact native output/readback avoidance, hidden/disposal).
New compact lifecycle check PASS: exact settled replay and context-restored pixels,
all variants visible, decoded saving18,882,456bytes, final owned bytes/source textures0.
Painter canvas remains accounted separately. First cold readback comparison max1;
settle/readback before exact replay, no tolerance relaxation. Evidence
`tmp/test-results/browser/compact-special-recovery/`; earlier checks in
`tmp/test-results/browser/compact-special/`. No broad suite repeated for this chunk.

Special-loadout integration/visual review completed using the existing isolated
Demon→Armoury inspection→title probe,390×844 and844×390 CSSpx,DPR2,deviceMemory2.
Pan compact portrait peak514,243,448bytes/490.4MiB; same flow with only special
compaction disabled549,490,000bytes/524.0MiB. Beam compact portrait506,741,560bytes/
483.3MiB, landscape498,124,232bytes/475.0MiB. Beam/raw-pan rows verify saved selection
and compact/raw renderer state. Pan compact initial probe predates state columns,
but actual gold pan is visible and prior lifetime check proves compaction.
Representative inspection comparison accepts softened pan surface detail while
preserving shape/gold highlights; beam remains clear with blue-white glow. No
fringes/missing artwork observed. Evidence `tmp/probes/realm-preview-memory-`
`{pan-compact,pan-raw,koken-compact,koken-landscape}.json` and corresponding
`realm-preview-inspection-{pan,koken}-*.png` captures. Probe optional loadout/raw
control/landscape arguments remain ignored; fresh browser profiles only.

These50ms samples include pending decode/GPU estimates and native target descriptors,
not physical residency or every transient. Two viewport shapes/special loadouts
are not a universal cap. Prior regular flow511.5MiB is likewise one viewport. Native scratch/
renderbuffer headroom, historical software/GPU mismatch, final measurement matrix,
applicable suites and physical Android/120Hz evidence remain outstanding. Goal active.
No push/deploy/native build/save changes; cancelled work stays cancelled.

## Previous handoff — selected weapon inputs

# Mobile performance — Selected special-weapon inputs

App1.69.34 ordinary runtime/startup/preview weapon requests omit special inputs.
prepare(ids) coalesces base/all requests and raw source promises; default no-argument
full-catalogue preparation stays compatible. Selected cutouts check required-family
readiness. Pan/beam requests lazily load special colour/normal/surface3planes,
18,882,456nominal decoded bytes. Preview selection prepares cutouts, repaints
without advancing effects, and suppresses stale repaint after suspension/disposal.
Draw avoids repeated preparation once its raw family is ready. Art/materials unchanged.

Four focused browser cases PASS4.5s: ordinary preparation makes0special requests,
pan/beam share1family preparation (3requests), exact cold/prepared cutout pixels,
hidden/disposal and preview repaint timing. Evidence
`tmp/test-results/browser/selected-weapon-inputs/`. Existing catalogue tests retain
full preparation and exact pixel gates. Full4case production suite PASS19.5s,
including checked build/strict TypeScript, startup/Armoury/run, edition gates and
offline resize. Log `tmp/probes/selected-weapon-production.log`; results
`tmp/test-results/production/selected-weapon-inputs/`.

Same low-memory regular-loadout Demon/inspection capture maximum536,325,656bytes
(511.5MiB), inspection334MiB/restored title402MiB. Evidence
`tmp/probes/realm-preview-memory-selected-weapons.json`. Narrow margin, one viewport;
no all-scenario/physical cap claim. After first special selection, its inputs remain
resident until disposal; selected-family lifetime/compact prepared planes still
needed for special loadouts and long-run admission. Native scratch/renderbuffer
headroom and final matrix remain.

Two room experiments rejected/reverted: shrinking baked room only within its layout
class did not address portrait inspection→landscape-style normal preview; retiring
old room material planes did not reduce the observed peak. Evidence
`tmp/probes/realm-preview-memory-{room-shrink,room-material-retired}.json`; no source
changes retained. Do not repeat those unchanged probes. Goal remains active;
historical software/GPU copy mismatch, broader final tests/matrix and physical
Android/120Hz evidence outstanding. Synchronized metadata/title/changelog1.69.34;
format/diff checks PASS. No push/deploy/native build/save changes; cancelled packing/lit-only stays
cancelled.

## Previous handoff — GPU upload reservations and resident trimming

App1.69.33 reserves uninitialized source/target texture bytes in the painter's
combined ledger. Concurrent jobs deduplicate source identities; formats/mips
match GPU estimates. Native init replaces pending storage with residency.
Context generation/resize refresh targets; abort/disposal clears reservations.
Cache reclamation precedes paced uploads. Native next-slot GPU estimates hand off
to the painter rather than double counting; custom warmers retain old estimates.

Main decode changes also trigger combined reclamation via a document policy
callback. New pressure test found trimMainImages subtracting requested release
from resident+reserved total: loader.trim compares only resident bytes, so pending
reservation could suppress eviction. Fixed target excludes reservedBytes. Test
observes actual decode boundary; initial immediate-queue check was premature.

6focused GPU/pixel/ledger units PASS; concurrent/resize2browser PASS4.0s;
context restoration/disposal2PASS3.1s; main queue/promotion/admission/busy4PASS;
corrected pre-decode pressure case PASS2.2s. Exact owned/shared preview peer cases
PASS10.4s. Art/pixels unchanged.
Evidence `tmp/test-results/browser/{gpu-reservations,gpu-reservation-recovery,
allocation-reclaim,allocation-reclaim-fixed,gpu-reclaim-preview-peers}/`.

Actual low-memory Demon/inspection capture still over512MiB: latest550,534,704
bytes (525.0MiB), including6,291,456pending main decode bytes; main decoded
154,800,984/GPU239,543,204bytes. Evidence
`tmp/probes/realm-preview-memory-resident-trim.json`. Prior GPU-only/allocation
captures~523MiB. No repeatable peak reduction claim; reclamation did not remove
the later live-input overlap. Next change must reduce/schedule live room/
figure resources or native target overlap, rather than repeat reclamation probes.
Native scratch/renderbuffer admission and final mode/viewport matrix remain.

Strict checked build PASS (`tmp/probes/gpu-reservation-build.log`); synchronized
metadata/title/changelog1.69.33. Goal active; historical
copy mismatch, broader integration/final suites, performance matrix and physical
Android/120Hz evidence remain. No push/deploy/native build/player-save changes;
cancelled work stays cancelled.

## Previous handoff — Pending decode accounting

App1.69.32 exposes loader reservedBytes separately and includes pending main-pool
decodes in combined committed memory. Worker loaders notify byte changes before
decode and after completion/failure/trim. Per-request decode-progress messages
update main counters and reclaim unpinned cache without settling readiness.
Equal-byte notifications coalesce. Assets-ready/composed/final behavior unchanged;
observers stop at request completion, including preload completion/cancellation.

15loader/ledger units PASS;5focused main/worker/progression/promotion/admission/
busy-cancellation browser cases PASS7.3s. New checks cover pre-allocation
reservations, success/failure/trim cleanup, partial worker progress and no early
readiness. Evidence `tmp/test-results/browser/decode-progress/`.

Same low-memory Demon/inspection flow now observes555,208,336bytes (529.5MiB),
including6,291,456bytes of pending decode reservation at peak. Prior511.4MiB
sample omitted pending main reservations and is not cap proof. Evidence
`tmp/probes/realm-preview-memory-decode-progress.json`; restored title420MiB.
Ordinary stage0–8→0 maximum471,082,540bytes (449.3MiB) in samples/phase capture;
settled return443,195,388bytes. Evidence
`tmp/probes/all-stage-memory-decode-progress.json`. Phase-observer listener order
can lag; sampled counters plus browser progress tests verify reporting, not every
physical transient. Do not equate improved counters with a performance win.

Next: required GPU/compose preparation reservations and transient/native scratch
headroom, especially preview restoration; current529.5MiB remains over512MiB.
Broader integration/final matrix, historical software/GPU copy mismatch and
physical Android/120Hz remain. Synchronized metadata/title/changelog1.69.32;
strict checked build PASS (`tmp/probes/decode-progress-build.log`).
Goal active; no push/deploy/native build/save changes; cancelled
work stays cancelled.

## Previous handoff — Preview baked-input lifetime

App1.69.31 releases shared room colour/material input leases after baking its
independent room planes. Source bindings/cutouts retire while cached room planes
stay intact. Stored source dimensions preserve window animation. Resize reacquires
inputs while scaling the previous room; pending/disposal generation checks remain.
Post-bake main-cache reclamation targets32MiB of preparation headroom, once per
bake rather than every preview frame. Assets and quality policy unchanged.

Same low-memory Demon/inspection flow: peak560,699,176→536,215,040bytes
(535→511.4MiB), restored title420MiB. Evidence
`tmp/probes/realm-preview-memory-room-reclaimed.json`; unpin-only control
`realm-preview-memory-room-unpinned.json` still533MiB. This sample is barely
below512MiB, not a whole-app/transient/physical cap proof. Final viewport/mode
matrix and required preparation reservations/native scratch accounting remain.

Two owned/shared native preview cases PASS10.5s: all4room inputs close under
forced eviction; cached and peer pixels remain exact. Initial dimension-only
instrumentation counted26figure/room inputs; URL-specific marker fixed it, then
Vite quoting matcher fixed. Assertions unchanged. Results
`tmp/test-results/browser/preview-input-verified/`. Original peer lease case and
two inspection resize/reopen cases PASS; their captures/results preserved under
`preview-input-retirement/`. Reviewed low-memory portrait: coherent room lighting
and readable figure. Strict checked build PASS
(`tmp/probes/preview-input-retirement-build.log`); synchronized metadata/title/
changelog1.69.31.

Next: complete combined required-work admission/progress/native scratch accounting,
then broader integration/final tests and the measurement matrix. Historical
software/GPU copy mismatch remains for focused diagnosis. Physical Android/120Hz
unproven. Goal active; no push/deploy/native build/save changes; cancelled work stays
cancelled.

## Previous handoff — Worker output retirement

App1.69.30 retires composition/material/foreground canvases after all bitmap
copies settle, before the worker posts them for GPU warming. Completed-scene
response metadata remains intact; canvas accounting now reflects actual0bytes.
Main current/next slots reuse their independent bitmaps. Direct repeated worker
requests rebuild; exported bitmaps remain alive and exact across rebuilds.

Actual low-memory Demon/inspection flow peak585,356,488→560,699,176bytes
(558→535MiB); restored title448MiB. Evidence
`tmp/probes/realm-preview-memory-worker-retired.json`. Still over512MiB at
restoration; main decoded161,092,440/GPU246,141,836/canvas47,552,128bytes and
transferred28,837,440bytes contribute. Worker canvases0 at this peak. Counters
are nominal, not physical residency proof; whole-app cap remains incomplete.
Next investigate concurrent room/main inputs and GPU preparation headroom.

27native stage/quality/viewport cases preserve exact held and rebuilt planes.
Initial failure expected retained worker dimensions; updated lifetime expectations
keep exact pixel gates. Final2phase/lifetime cases PASS47.2s; low-tier18stage
reacquisition case PASS15.2s;5promotion/pressure/cancellation cases PASS7.8s;
5copy/proxy units PASS. Browser evidence
`tmp/test-results/browser/worker-output-{final,integration}/` and prior
`worker-output-retirement/`. No unrelated suites repeated. Strict checked build
PASS (`tmp/probes/worker-output-retirement-build.log`); synchronized
metadata/title/changelog1.69.30.
Goal active; broader integration/final suites, copy mismatch, measurements and
physical Android/120Hz evidence remain. No push/deploy/native build/save changes.
Cancelled work stays cancelled.

## Previous handoff — Inspection occlusion

App1.69.29 suspends the main scene while expanded equipment inspection covers it.
Scene flow aborts figure preparation, invalidates pending requests, suspends the
ordinary worker and releases Demon resources. Main painter targets/textures retire
to1x1. Closing restores current geometry and prepares the same identity/seed;
continuations survive and stale failures cannot open recovery. Resize while covered
does not restart preparation. Preview remains independently animated.

Actual390x844/DPR2/deviceMemory2 title→Demon cinematic→title→inspection→title
capture: settled inspection614→360MiB; restored title472MiB after waiting for ready.
Demon477MiB; exit458MiB. Evidence `tmp/probes/realm-preview-memory-restored.json`.
Nominal combined counters, not physical residency. A558MiB transient after closing
inspection remains over512MiB; peak includes worker canvases/transferred planes,
main decoded inputs and GPU allocations. Retiring preview before restoration did
not help (`realm-preview-memory-retired.json`); experiment removed. Investigate
required preparation headroom/concurrent room inputs and worker output residency,
rather than repeating this unchanged capture. No whole-app cap claim.

Two low/high-memory browser inspection cases PASS21.5s: resize, keyboard/back,
main canvas suspension and restoration; output `tmp/test-results/browser/inspection-occlusion/`.
New unit verifies aborted/stale failure suppression, idempotent suspension and
resized same-seed continuation restoration. Checked production build/strict
TypeScript PASS; metadata/title/changelog1.69.29. Broader integration/final suites,
copy mismatch and remaining goal measurements still required. Goal active;
no push/deploy/native build/real save changes. Cancelled work stays cancelled.

## Previous handoff — Preview room ownership and suspension

App1.69.28 loads shared preview room inputs on demand using main-image leases.
Canonical asset URL fixes previous relative-URL material lookup mismatch; room
PBR maps previously were not loading, despite eager prepare calls. The prior
assumption of duplicate room maps was incorrect; eager plain-room images were
untracked. New room/canvas ownership is tracked; shared room pack4planes25,165,824
nominal bytes. Scoped cached-material bindings keep peer previews independent.

Preview suspension unpins room inputs, clears owner cutouts/baked planes and
uploaded GPU sources, and reduces drawing targets/buffer to1x1. Construction
starts suspended. Drawing explicitly restores dimensions from visible bounds
(or saved detached fixture size); ResizeObserver alone failed real panel reopen.
Inspection uses the existing low-memory drawing cap. Context/shaders reusable;
closing preserves live peers/shared runtime artwork and evictable warm images.

Five focused room/peer/inspection cases pass across targeted runs. Tracked
auxiliary GPU allocation drops >75% on suspend. Owned-peer exact pixel check
failed once in concurrent graphics run, then passed isolated rerun; assertions
unchanged. Results: `tmp/test-results/browser/preview-{restored,owned-isolated}/`.
Earlier successful inspection captures in `preview-suspension/`; reviewed
low-memory portrait room/material lighting and figure readability.

Same ordinary all-stage sample with hidden previews: peak491,109,740bytes (468MiB)
under512MiB; first481,142,076/last476,689,996. Evidence
`tmp/probes/all-stage-memory-preview-retired.json`. Nominal samples do not cover
active inspection/Demon combined peaks or physical residency. Room cache now
initializes0x0 after that sample. Checked build log
`tmp/probes/preview-retirement-build.log`; metadata/changelog1.69.28.

Next: measure actual Demon/cinematic entry/exit and active preview combined
ownership; required reservations/progress/native scratch accounting remain.
Strict software-vs-GPU later-cycle colour mismatch still unresolved (notes
`tmp/probes/compact-worker-copy-failures.md`); use focused native pixel/baseline
diagnostic. Integration checkpoint/final suites and measurement matrix remain.
Physical Android/120Hz unproven. Goal active. No push/deploy/native builds/real
save changes; cancelled packing/lit-only work remains cancelled.

## Previous handoff — Required transition headroom

App1.69.27 compares required prepare/upload estimates against the combined
document budget after main-cache reclamation. When they do not fit, outgoing
normal/surface/emissive planes and GPU sources retire; outgoing colour remains
drawable while loading. Full incoming material planes warm before readiness.
Retirement clears the outgoing completed key, so cancellation/return recomposes
its full materials. Already prepared promotions keep their admitted resources.

Same390x844/DPR2/deviceMemory2 all-stage0–8→0 sample: maximum observed committed
540,926,164→494,093,948bytes (516→471MiB), ~41MiB below512MiB; final419–471MiB.
Return-to-meadow preparation peaks469MiB. Upload-only retirement initially peaked
536,694,428bytes; moving retirement before compose adds practical headroom.
Evidence: `tmp/probes/all-stage-memory-{upload,preparation}-headroom.json`.
These remain nominal sampled/phase observations for one viewport, not an absolute
physical/all-scenario cap. Worker decode progress/native scratch and preview/
Demon/concurrent ownership remain to audit.

Five focused pressure/promotion cases pass; final2pressure tests pass7.1s with
early retirement, retained outgoing colour, full incoming materials and
cancellation recomposition. No WebGL feedback/invalid-operation/destroyed-bound
warnings. Checked production build/strict TypeScript log:
`tmp/probes/transition-headroom-build.log`. Version metadata/changelog1.69.27.
All handles terminal; no push/deploy/native builds/real-save changes.

Next: preview/Demon resource audit and combined pressure with those owners;
required-work reservations/whole transient accounting remain. Diagnose the strict
software-vs-GPU later-cycle colour mismatch with a focused pixel/baseline sample
(failure notes `tmp/probes/compact-worker-copy-failures.md`), without rerunning the
large matrix blindly or weakening assertions. Transition/resource checkpoint and
final suites/measurement matrix remain. Physical Android/120Hz unproven. Goal
active; cancelled general packing/lit-only integration remain cancelled.

## Previous handoff — Compact low-memory worker inputs

App1.69.26 decodes aligned catalogue scenery colour/material planes at half
width/height on the256MiB decoded tier using native high-quality bitmap resize.
Logical dimensions/crop geometry remain original via worker source adaptation;
landmark size validation and stage layouts stay intact. Higher tiers retain the
original decode path. Required compose reclaims unpinned main cache against its
incoming estimate; next-slot admission now estimates compact decoded dimensions.

Same390x844/DPR2/deviceMemory2 all-stage0–8→0 diagnostic: worker input ownership
108–204MiB→27–51MiB (~75% reduction). Observed combined peak654→522MiB with
compaction; required pre-compose reclamation further lowers it to516MiB
(540,926,164bytes). Final samples fit512MiB, but return-to-meadow warming remains
over budget. Peak has old+incoming transferred planes57,674,880bytes and GPU
188,651,348bytes; worker inputs already released. No absolute/physical cap proof.
Evidence: `tmp/probes/all-stage-memory-compact{,-reclaimed}.json`.

Reviewed actual element screenshots
`tmp/probes/compact-worker-visuals-stage-{0,4,6,7}.png`: meadow/bamboo/temple/coast
look coherent. Direct toDataURL captures were black due discarded drawing buffer
and are unusable evidence. Visual-capture probe includes explicit extra rendering;
use the earlier no-capture reports for comparable memory observations.

Thirteen unique focused browser cases pass (three-tier all-stage input lifetime,
compact phase bytes, next promotion, recovery and suspension);19units pass.
Checked production verification build/strict TypeScript passes; log
`tmp/probes/compact-worker-build.log`. Strict software-vs-GPU full copy matrix
fails2/2 tiers on later-cycle colour hashes; low-tier inspection finds only
stage0/7 colour differences with material hashes matching throughout.
The8GiB original decode path also fails; baseline cause remains unverified.
Assertions unchanged. Later browser checks overwrote the default results directory;
observed failure/inspection notes retained in `tmp/probes/compact-worker-copy-failures.md`.

Next: enforce combined required work/texture-warming budget including current+
incoming resources; cover decode progress/intermediate native scratch properly.
Fix copy mismatch with a focused native pixel diagnostic/baseline before final
verification. Preview/Demon ownership/peaks, integration checkpoint and final
suites/matrix remain. Do not revive cancelled packing/lit-only work. Physical
Android/120Hz unproven. Goal active; no push/deploy/native builds/real-save changes.
Version metadata/changelog1.69.26; all processes terminal.

## Previous handoff — Worker transient accounting

App1.69.25 publishes decoded-loader/canvas ownership at assets-ready and composed
phases before releasing inputs. Main worker owners update memory counters without
resolving compose/readiness; final and error responses carry resource counters.

Real runtime390x844/DPR2/deviceMemory2 stage0–8→0 diagnostic uses game.setStage
and real scene readiness with paused combat. Settled estimates fit512MiB, but
phase accounting exposes556–654MiB observed preparation peaks, including incoming
pinned kits108–204MiB. The old sampled counter understated these peaks (max516MiB).
Evidence: `tmp/probes/all-stage-memory-before.json`,
`tmp/probes/all-stage-memory-phases.json`; reusable ignored probe
`tmp/probes/all-stage-memory.mjs`. Samples every50ms plus worker-event snapshots.
These are nominal phase-boundary observations, not physical/scratch peak proof.

Five focused browser checks pass7.9s (phase readiness, worker failures/retry,
suspension, pending requests);5related units pass. Checked verification build
with strict TypeScript passes; log `tmp/probes/worker-phase-build.log`.
Version/package/lock/title/changelog agree1.69.25. All processes terminal.

Next concrete fix: reduce required worker decoded-kit pressure on low-memory
devices while preserving logical atlas layout and scene composition. Consider
layout-preserving decode resizing with explicit nominal-to-bitmap coordinate
adaptation; validate aligned maps/landmarks and representative scene feel.
Do not revive tight packing. Required transient budget enforcement, preview/
Demon accounting, transition checkpoint and final suites/matrix remain. Current
accounting still lacks reservations covering decode progress between phases and
intermediate native scratch; do not claim a cap. Physical Android/120Hz remains
unproven. Goal active; no push/deploy/native builds/real-save mutation.

## Previous handoff — Reclaimed cache and bounded low-memory drawing

App1.69.24 bounds main drawing on the256MiB decode tier to approximately600k
pixels/DPR1.5 without changing logical layout/input coordinates. Scene preparation
reclaims only unpinned main-image cache at entry and before readiness, targeting
32MiB free within the existing combined budget. Next-scene admission reclaims
against its own estimate. Ordinary fog closes when current/requested/next scenes
do not need it; return reloads through generation-guarded preparation.

Low-memory390x844/DPR2 first-game: canvas527x1140; committed591,861,324→
500,847,196bytes (478MiB),35MB below512MiB including81,501,808reserved overhead.
Main decoded142,777,176/canvas43,594,168/GPU175,299,164;
worker canvases/transferred28,837,440each. New buffer policy without the32MiB
reclaim target measured526,008,924; the final threshold trims25MB more decode.
These are nominal ownership estimates, not physical or all-stage peak proof.
Reviewed the low-memory gameplay screenshot; atmosphere/text remain readable.

Pinned native peer pixels survive pressure exactly; cached pixels evict/reload.
Fog0→1→0 releases decoded inputs while away and returns identical native pixels.
Twelve related browser checks pass20.4s; low-memory responsive Armoury case
passes7.0s. Eighteen focused units pass; checked build includes strict TypeScript.
Version/package/lock/title/changelog agree1.69.24. Evidence:
`tmp/probes/scene-low-memory-reclaimed{,-headroom}.json`, gameplay PNG under
`tmp/probes/`, browser results and `tmp/probes/memory-reclamation-build.log`.
All check handles terminal.

Next: measure all-stage mandatory/transient peaks and preview ownership, then
enforce remaining combined pressure. First-game now fits, but optional admission
and reclaim do not prove a whole-app cap; incoming worker raw kits/copies can
temporarily exceed it. Finish transition integration checkpoint, final matrix/
suites and cold/warm compose explanation. Demon mobile-size CPU capture, gradient
churn and later boss palette misses remain possible costs. Physical Android/120Hz
unproven; full goal active. Cancelled general packing/lit-only work stays cancelled.
No push/deploy/native builds/real-save mutation.

## Previous handoff — Low-memory enemy part planes

App1.69.23 uses bounded aligned colour/normal/surface planes for25enemy part
frames on the256MiB decode-budget tier. Maximum edge256px matches existing colour
cutouts. Each family prepares sequentially, yields between part copies and closes
raw atlases; higher tiers retain original sampling. No asset files/packing change.

Representative390x844/DPR2 low-memory first-game sample: committed691,635,020→
591,861,324bytes (-99,773,696/14.4%). Main decoded243,432,120→167,943,000;
canvas27,940,280→43,491,768; GPU259,071,932→219,235,868. These are nominal
ownership estimates including existing reserves, not physical residency proof.
The compact sample preceded the final serial-family scheduling change; prepared
plane content/lifetimes are unchanged.512MiB cap remains exceeded55MB.

Native36appearance comparison covers regular/authored bosses, palette/fog,
day/dark directional lighting and mirroring. Reviewed original/compact montages:
feel/lighting/readability retained; mean channel difference0.020/255. Compact
inputs close after preparation; hidden disposal settlesfalse with decoded/canvas0.
Actual context restoration matches pixels exactly; final GPU sources0. Ten unique
focused browser checks pass9.9s, final compact/recovery2pass4.4s;10related units
pass. Checked production build includes strict TypeScript. Version metadata and
changelog agree1.69.23. Evidence: `tmp/probes/scene-low-memory-*.json`,
`tmp/test-results/browser/compact-enemy-*/` and `tmp/probes/compact-enemy-build.log`.
All verification handles terminal.

Next: reclaim unpinned main-image cache and unused fog/preview ownership, then
enforce combined required-resource limits with appropriate render-target headroom.
Do not claim whole-app limits from optional next-scene admission. Transition
integration/all-stage peaks/final suites and matrix remain. Demon CPU capture
needs mobile-size timing; gradient churn/later boss palette misses remain possible.
Physical Android/120Hz unproven; full goal active. Cancelled general packing/
lit-only work stays cancelled. No push/deploy/native builds/real-save mutation.

## Previous handoff — Ordinary worker suspension in Demon

App1.69.22 suspends ordinary scenery on Demon entry: terminate the worker,
abort current/next warming, settle callers without failure notification and
release current/next transferred planes plus main-thread fog inputs/cutouts.
Generation guards suppress obsolete publication and background completion.
Ordinary prepare/compose/draw or explicit retry starts a fresh required worker.
Hidden state/background sampling alone cannot restart it. Disposal shares cleanup.

Native160x100 stage0 plus a retained next scene releases worker canvases768,000,
transferred1,536,000 and main fog decoded25,176,608bytes to0; artwork GPU sources
and reservations also0. Re-entry matches exact pixels and next preparation works
again. Pending request cancellation settlesfalse with no recovery notification.
Two new cases pass5.8s;16related browser checks pass35.3s, covering all9ordinary
compositions, worker recovery, promotion, cinematic switching and Demon modes.
Nine related units pass; checked production build includes strict TypeScript.
Version/package/lock/title/changelog agree1.69.22. Evidence:
`tmp/test-results/browser/worker-suspension-*/worker-suspension.json` and
`tmp/probes/worker-suspension-build.log`. All verification handles terminal.

Next: enforce combined required-resource limits and reduce resident ownership
as needed, then transition integration and final all-stage/startup/cold-warm
measurements/suites. Existing first-game desktop commitment691,569,580bytes still
exceeds the512MiB low-memory ceiling; next-scene admission does not enforce the
whole app. Ordinary-to-ordinary fog lifetime may retain unused inputs. Demon
CPU capture needs mobile-size timing; animated gradients/later boss palettes
remain possible costs. Physical Android/120Hz targets unproven, full goal active.
Cancelled packing/lit-only work stays cancelled. No push/deploy/native builds/saves.

## Previous handoff — Demon preparation and realm exit

App1.69.21 builds existing Demon mountain/prop caches before readiness, captures
their actual material sources without a GPU draw, and warms/retains them through
the gameplay painter. Demon-only blur/grayscale shader warming avoids first-draw
compilation without adding ordinary startup work. Realm exit cancels preparation
and retires nine decoded inputs, cutouts and layer maps; stale generations cannot
publish after re-entry/disposal. Timing now reports Demon prewarming accurately.

Native240x320 comparisons are exact on first presentation, re-entry and actual
context restoration. First-draw artwork uploads/program links0, including after
restoration. Exit reduces artwork textures16 to0, decoded56,622,840bytes to0 and
tracked canvases18,627,800 to360,000bytes (remaining painter defaults). A solo
desktop CPU capture took4.2ms; this is not mobile-scale responsiveness proof.
Cancellation/re-entry/disposal passes. Ten focused browser checks pass18.2s,
including Demon Mirror, Inferno, cinematic switching, mist and material caches;
eight related units pass. Checked production build includes strict TypeScript.
Version/package/lock/title/changelog agree1.69.21. Evidence:
`tmp/test-results/browser/demon-preparation-*/demon-preparation.json` and
`tmp/probes/demon-preparation-build.log`. All check handles terminal.

Next: release/park ordinary worker output during Demon activity and enforce
required-resource combined limits, then the transition integration checkpoint
and final measurements/suites. Demon CPU cache capture is currently synchronous;
measure representative mobile dimensions before deciding on further pacing.
Animated Demon gradients and later same-stage boss palette misses remain possible
costs. Existing desktop first-game committed estimate691,569,580bytes exceeds
the512MiB low-memory admission ceiling; optional admission is not whole-app
enforcement. Full goal incomplete; physical Android/120Hz targets unproven.
Cancelled packing/lit-only work stays cancelled. No push/deploy/native builds/saves.

## Previous handoff — Incoming figure preparation

App1.69.20 prepares regular enemy cutouts, incoming boss palette alternatives
and selected enemy/player weapons before stage readiness. The same gameplay
painter warms colour/data sources and holds one current figure lease. Cache hits
reuse preparation without a new paced CPU pass; replacement/disposal cancels
obsolete jobs. Shared white/empty and current geometry/light/back-buffer textures
also warm before readiness. Viewport, quality, target and context changes restart
preparation, including resize during shader work. The guarded Pixi8.22 adapter
borrows the existing back-buffer texture; no alternate rendering cache or draws.

Native38regular/boss comparisons covering every weapon recipe match pixels
exactly, with drawing readbacks/uploads/program creation0 after160collection
frames. Hidden cancellation preserves86sources; actual context restore yields
first-draw uploads0, and final disposal releases all86. Resize warming passes.
Fourteen unique related browser checks and11units pass; final checked production
verification build includes strict TypeScript. Version/package/lock/title/changelog
agree1.69.20. Evidence: [progress](docs/development/mobile-performance-progress.md)
and `tmp/probes/figure-gpu-*.log`. All verification handles terminal.

Representative390x844/DPR2 first-game nominal accounting601,477,452bytes plus
90,092,128native/browser reserve =691,569,580 committed. All9next-scene estimates
fit desktop1GiB at this point. Required preparation costs39,546,968more nominal
bytes than the previous corrected snapshot; not a low-memory or physical proof.

Next: required-resource ownership/combined limits and Demon GPU preparation/
mode-exit lifetime, then all-stage transition/memory verification and final
measurement matrix/suites. Same-stage later boss palette misses remain possible.
Framebuffer/MSAA/geometry costs remain outside the zero-texture-upload claim.
Large corrected preload matrix still waits for the transition integration gate.
Physical Android/120Hz targets remain unproven; full goal incomplete. Cancelled
general packing/lit-only work stays cancelled. No push/deploy/native builds/saves.

## Previous handoff — Budget-aware next scenery

App1.69.19 composes, retains and warms one predicted next scene through the
existing worker/painter, then promotes matching identities without recomposition.
Busy frames cancel pending work and retain completed slots. Hidden state,
geometry/DPR/quality/seed changes, context loss and disposal invalidate the slot.
Combined nominal admission includes peer owners and transient reservations with
512/768/1024MiB ceilings,64MiB native reserve and browser buffer headroom. These
limits govern optional preparation, not all required app resources.

Three native next-scene tests pass: held pixels after160draws, no promoted first
draw uploads/program creation, denied pressure and invalidation, pending warming
cancellation/resource closure. Explicit preparation lifecycle passes. Worker
regression9cases pass22.4s, including all-stage output and active worker-crash
recovery holding combat/RNG/checkpoint while retry restores the same seed.
Focused units16pass; checked verification build/strict TypeScript and changed
formatting pass. Version/package/lock/title/changelog agree1.69.19. Evidence:
[progress](docs/development/mobile-performance-progress.md), logs under
`tmp/probes/next-scene-*.log`. All check handles terminal.

Next: incoming enemy/weapon GPU warming, required-resource ownership and combined
memory enforcement, then representative runtime admission/cold-warm measurements.
The larger preload matrix fixtures were corrected but not rerun yet; reserve it
for the transition integration gate. Full final suites/measurement matrix and
physical Android/120Hz targets remain outstanding. Do not claim the full goal
complete. General packing/lit-only work stays cancelled. No push/deploy/native
build or real-save changes.

## Previous handoff — Reclaimed scenery headroom

App1.69.18 releases unpinned worker decoded inputs after independent plane copies
finish; completed canvases/bitmaps survive and changed keys reacquire normally.
Demon's nine decoded inputs now load only on preparation, with shared pending
work and failed-decode retry. Main decoded300,054,960→243,432,120bytes; worker
decoded213,952,112→0 at the same390×844/DPR2 first-game snapshot. Combined decoded
saving270,574,952bytes/52.6%; this is not an all-stage peak or physical measurement.

GPU accounting includes managed HDR/filter/history/back-buffer textures and
format-aware stencil/MSAA renderbuffers via a guarded Pixi8.22 descriptor adapter.
Foundation exposes `browser.memorySnapshot()`. Default browser drawing buffers,
driver overhead and auxiliary unregistered canvases remain outside estimates.
The initial conservative counter gives900,962,068→629,315,324 nominal total;
separate corrected-format snapshot must not be counted as an optimization.
The corrected current sum is561,930,484bytes, including234,168,260 nominal GPU
bytes across painters. Combined admission still needs explicit headroom limits.

Focused units18 unique cases pass. Native nine-stage warming, Demon cinematic
entry/resize/reload and mist repetition pass3 cases. Retained-plane fixture passes
all27 compositions: exact held/repeated copies after raw input eviction, unchanged
keys avoid rebuilding. Source ready-path pixels/rules unchanged; fixtures now
explicitly prepare Demon art. All browser/probe handles terminal.
Checked verification build/strict TypeScript and changed formatting/diff checks
pass. Package/lock/title/changelog agree1.69.18. Build log:
`tmp/probes/scene-headroom-build.log`.
See [evidence](docs/development/mobile-performance-progress.md) for numbers/logs.

Next: enforce combined admission with browser/driver reserves, then next-scene
compose/warm/promote and incoming figure GPU warming. Do not treat decode-pool
limits as a whole-app cap. Full goal remains incomplete; physical Android/120Hz
targets unproven. General packing/lit-only integration stay cancelled. No push,
deployment, native build or real-save changes. Previous accounting commit899f400.

## Previous handoff — Combined resource accounting groundwork

App1.69.17 adds weak, identity-deduplicated decoded-image/canvas observation,
worker canvas backing counters, actual transferred-plane bytes and painter source
GPU estimates including mipmaps. Main shared pools, direct PBR/weapon/Demon
inputs, startup images and figure/material caches participate. Native services
expose component counts and `accountedBytes`; all document source stores count,
including registered previews. Weak observation adds no pins or strong lifetime
references. Worker-required/retry integration is committed as `fba4d9b`.

Ten focused unit cases pass. Native nine-stage warming verifies transferred-byte
equality, worker/source estimates, unchanged pixels/no first-draw uploads or links,
and zero transferred/source bytes after disposal. All sessions terminal.
Checked production verification build passes, including strict TypeScript;
changed formatting/diff checks pass. Package/lock/title/changelog agree1.69.17.
See [evidence](docs/development/mobile-performance-progress.md) for scope and logs.
This does not enforce a whole-app budget: render targets, driver overhead and
some auxiliary canvases remain uncounted; worker numbers are last-response values.

Next: finish those estimates and reserve combined headroom for next-scene
composition/warming/promotion; complete incoming figure GPU warming and remaining
ownership. Do not mistake per-pool decode limits for a whole-app cap. Full goal
remains incomplete; physical Android/120Hz targets remain unproven. Cancelled
packing/lit-only work stays cancelled. No push/deploy/native build/save changes.

## Previous handoff — Required workers and retry integrated

App1.69.16 requires worker scenery and removes automatic main-thread fallback.
Shared composition remains inside the worker and diagnostic comparisons.
Constructor, runtime, message, post, composition, upload and timeout failures
settle callers, abort warming, terminate the worker and release scene planes.
Explicit retry starts a new generation; stale work cannot publish a scene.
Startup offers reload retry; later-scene retry keeps combat held and preserves
the visit seed and continuation. Missing required APIs report unavailability.
Capacitor declares WebView111 to match the installed build baseline and uses a
bundled static error page for native startup errors, readable without JavaScript.
Physical Android WebView behavior remains unverified; no native build was run.

Strict TypeScript and16 focused unit/tool cases pass. Browser selection passes18
of21 initially; missing startup diagnostics and a setup-only fixture explain the
three failures. Corrections pass all3 focused reruns. Extended worker failure/
timeout/retry passes, and the static error page passes without JavaScript.
Checked production verification build passes and includes the static error page.
Changed formatting and diff checks pass. All verification sessions are terminal.
No unchanged full suite repeated.
See [evidence](docs/development/mobile-performance-progress.md) for logs and gaps.
Drift checkpoint is committed as `c392fef`; its original full-run restoration
alpha mismatch remains unexplained despite passing focused restoration checks.

Next: budget-aware next-scene composition/warming/promotion, incoming figure GPU
warming and combined memory ownership/admission. The full goal stays incomplete.
General packing and separate lit-only integration remain cancelled. No push,
deployment, native build or real-save changes. Package/lock/title/changelog1.69.16.

## Previous handoff — Drift checkpoint verified

Worktree app1.69.15 installs the merged128px-cell colour/emissive WebPs and
single-pass lit drift. No geometry-buffer writes or normal/surface sampling;
drift-only mipmaps/trilinear filtering, scene light with ambient sky fallback,
fire emission, instancing/motion/order retained. All four logical families share
two leases/4,194,304nominal decoded bytes. Full historical set81,823,976bytes:
94.87% reduction; encoded4,378,340→155,694bytes. GPU mip estimate5,592,405bytes
is not physical residency. Original PNG/PBR sources retained; four unused base
WebPs removed and old drift packs excluded from runtime catalog.

Focused14 browser checks and476 full unit cases pass. Production checkpoint
passes all4 cases including strict TypeScript/build/offline resize. Full browser
checkpoint ends371 pass/3 fail (374 cases,18.7m,two workers). Historical compaction
checks requested four retired WebPs and preview expected86 rather than82 packs;
those expectations are corrected, retaining PNG-source and180 exact data checks.
Native leaf restoration reports one alpha mismatch while geometry/HDR targets
remain exact; cause unresolved. All5 cases in the three affected files pass the
focused rerun, including unchanged strict alpha parity and added diagnostics.
No unchanged full suite repeated after test-only fixes. All handles terminal.
Logs: `tmp/probes/drift-{units,production,browser-full,focus-final}.log`;
original failures preserved in `tmp/probes/drift-full-failures/`.
Package/lock/title/changelog agree at1.69.15; changed formatting/diff checks pass.

All24 replacement timing samples and eight before/after DPR3 captures pass and
their processes are terminal. Largest-gust controlled review supports128px;
all quality levels use the cheap path. Captures/evidence are under
`tmp/probes/drift-scenes/`; controlled lantern/sky/fire/gust PNGs preserved under
`tmp/probes/drift-new/`. CPU-rate4 current→new render median10.5→9.6ms calm and
10.9→10.4ms gust; frame-p95 stays17–18ms. No physical mobile GPU/120Hz proof or
substantial isolated drift-cost claim. See the updated
[evidence](docs/development/mobile-performance-progress.md) for raw runs,
populations, caveats, visual decision and out-of-scope grass opportunity.

Next: commit the coherent drift change. Then require workers with
clear error/retry recovery and finish next-scene/figure warming, ownership and
combined memory admission. Those remain incomplete. General packing and separate
lit-only integration stay cancelled. No push/deployment/native build/save changes.

During the live run, a worker-owner candidate was prepared under ignored
`tmp/probes/worker-required/worker-renderer.ts` by
`tmp/probes/prepare-worker-required.py`. It removes owner fallback branches and
adds explicit restart/generation guards, including messageerror. Node syntax
check passes; it is not applied, type-checked or browser-verified. Review stale
warm/prepare handling before applying after the drift commit. Factory, startup
and later-scene error/retry UI still need integration. Shared worker composition
logic remains required. Capacitor's default WebView floor60 conflicts with
required module workers80; installed Vite's baseline targets Chrome111. Align
the declared native floor with that build, retain runtime capability/error checks,
and distinguish desktop/offline-asset verification from physical WebView proof.

## Previous handoff — Drift baseline and atlas preparation

The new [active goal](goal-objective.md) supersedes the earlier exact-pixel
performance objective. Visual simplification is authorized when the game's feel
and readability remain good. Worker scenery becomes required; automatic local
fallback will be replaced with clear error/retry recovery. Existing checkpoint64
implementation remains intact; tooling checkpoint bumps metadata to app1.69.14. No push/deployment/native build/save
changes. General packing and the separate lit-only integration remain cancelled;
the requested merged drift atlas is a scoped exception.

The performance runner now provides test-build-only off/current drift modes,
calm/gust fixtures, CPU throttling and p99/8.3/16.7ms statistics. New mode fails
explicitly until implemented. Calm must remove combat-generated gusts after
simulation; initial contaminated captures are retained but excluded. Runtime
application code is unchanged. Seven performance-tool checks pass.

The reproducible generator produces a trial1024×512 colour/emissive atlas with
128px cells,120px content and4px gutters. Full-set nominal decoded memory falls
81,823,976→4,194,304bytes (94.87%); encoded4,378,340→155,694bytes. Two generator
checks pass for alpha-safe resizing, odd source boundaries, frames and gutters.
Trial sheets reviewed; actual daylight/dark/fire/gust and DPR3 checks remain.

Corrected baseline passes all24 samples: off/current × calm/gust × CPU rate1/4
× three repetitions. The evidence document records run paths, timing and caveats.
Desktop off/current CPU deltas are noisy; no isolated GPU-cost or120Hz claim.
All measurement handles are terminal. No full application suite was rerun for
this test-tool/generator-only chunk; baseline builds include strict TypeScript.

See [continuation evidence and decisions](docs/development/mobile-performance-progress.md).
Next: integrate merged atlas, drift-only mipmaps and one-pass lit rendering;
compare saved controls before completing drift checkpoint. Then worker recovery
and transition/resource integration. Full suites are reserved for substantial
checkpoints and final verification. Package/lock/title/changelog agree at1.69.14;
baseline controls were captured at1.69.13 before this metadata-only bump.

## Previous handoff — Selected weapon preparation

Checkpoint64 completes selected weapon cutout preparation and fixes repeated worker
preparation invalidating completed scenes, app1.69.13. Goal remains active at full
scope. Work is local on develop; no push, deployment, native build or real-save
changes. Packing, tight repacking and the separate lit-only integration stay cancelled.

Weapon `prepareParts()` uses the existing draw cache and visible-frame batches
with a4ms target. A native readback cannot be interrupted. Startup and scene
readiness await the equipped blade plus the six deterministic enemy styles;
matching sets share a promise, hidden waits resume on visibility, disposal cancels
and unknown IDs return false. Startup also checks the preparation result. The
enemy style list is derived from its existing tuple; no choices, RNG, pixels or
save formats change. Both pan finishes are prepared. Direct raw weapon atlas
ownership and GPU warming remain open; this prepares cached colour pixels only.

Full20-style diagnostic preparation moves31 readbacks from draw to preparation;
all80 saved original/candidate native SHA256 captures match, including both mirror
and gold states. A single diagnostic prepare takes49.7→161.9ms: work moves earlier,
not free. Full preparation retains31cutouts/2,567,054pixels (10,268,216nominal RGBA
bytes). Runtime selects fewer: steel12/1,036,478 (4,145,912bytes), pan14/1,200,318
(4,801,272bytes), beam13/1,083,070 (4,332,280bytes). These selected peer tests make
80 exact native comparisons with0 draw readbacks; disposal returns both painters
to0 source textures. Existing80-entry weapon eviction/replay assertions still pass.

Worker `prepare` now preserves an already completed layered stage instead of
clearing its key merely because exported inputs were released. Original same-key
first/repeat build count1→2 becomes1→1 across27 lifetime cases; copied and held
planes remain exact, with0 input pins/bytes. Changed keys reacquire normally.
The old budget tests now require0 exported pins/bytes, retaining budget, eviction,
cutout and exact-pixel assertions. This does not prove a combined memory bound.

Verification:final476 unit tests pass; checked production/strict TypeScript passes
all4 cases, including offline gameplay resize. Final complete browser suite passes
all373 cases with two workers (19.0m), including worker/local preload native
comparisons, context restoration, cancellation, cinematic and saved-run isolation.
A held-weapon boss test proves readiness gates spawning and preserves pause.
All process handles are terminal. Package/lock/title/changelog agree at1.69.13;
changed-file formatting and diff checks pass.

First full browser run:362 pass/11 fail. Saved previous-commit control reproduces
10:lit CSS changes after the hover test captures its original URL, six manual-clock
cases never drive paced startup, two old budget pin assertions and repeated worker
key invalidation. Await published lit CSS; drive manual startup and readiness at
its existing50ms virtual step without increasing deadlines; keep exact native
comparisons. Three further manual cases need50ms readiness polling rather than
one-second backoff and then pass. The perfect-cut trial's initial timeout passes
on the original, focused candidate and final full suite; its cause remains unresolved.
Global format:check still reports421 pre-existing warnings; line-ending normalization
leaves253, all independently confirmed in HEAD and none in changed files. Do not
mass-format unrelated source to hide these warnings.

Five matched title samples per arm compare startup median2144.1→2159.5ms (+0.7%),
render median1.5→1.5ms and frame-p95 median17.0→17.0ms. Compatible reports pass;
builds retain their pre-bump1.69.11/1.69.12 metadata. No actual120Hz, physical-memory
or first-two-second-long-task claim. Timing compares
`tmp/performance/2026-10-09T06-02-12.492Z-b9871a84/` with
`tmp/performance/2026-10-09T06-27-12.931Z-76242e95/`.

Evidence:`tmp/probes/sword64/` retains original and restored candidate source,
80-case baseline/final native oracles, selected pixel counts, initial/control/final
full and focused logs, original worker lifetime rows, unit/production and formatting
proof. Final worker/native details remain under `tmp/test-results/browser/`.

Remaining:enemy/weapon selected decoded ownership, incoming enemy variants and
same-painter figure texture warming; demon/live-fog cutout-aware ownership;
combined decoded/canvas/GPU/copy admission; quiet cancelable worker/local next
slots with texture leases through promotion; full120Hz/cold-warm/first-two-second
and Phase5 reporting. Current GPU leases protect collection, but source retirement
still destroys retained textures; releasing CPU pixels requires an explicit
residency and context-restoration contract, not blind all-family pooling or a
budget increase. Local yielded composition still differs in four exact cases;
retain the synchronous passing control. No goal completion claim.

## Previous handoff — Worker input lifetime

Checkpoint63 aligns worker image policy and releases completed composition inputs,
app1.69.12. Actual low-memory startup audit succeeds both with worker and forced
local fallback. Before the change the page's pool reports256MiB but the worker
reports512MiB; requests now carry the owning document's256/384/512MiB policy and
the worker creates its loader on the first request. This is a per-pool policy,
not a combined whole-application allowance.

Before, completed Meadow pins34 worker planes/213,952,112nominal RGBA bytes.
Worker composition now clears cutouts and releases all input pins before copying
its independently owned output planes. All stages finish with0 worker input pins.
Warm decodes remain LRU-cacheable; this does not claim213.95MB of physical memory
was freed. Exact-key exports retain their completed planes; changed stage, size,
DPR, quality or seed reacquires inputs. The local drawing path still retains its
live fog4planes/25,176,608bytes or bamboo3/18,870,192. Main-thread live motion uses
its own inputs and transferred planes. Decode interpretation, assets, RNG and
save formats unchanged.

Enemy audit confirms regular figures can use all four families during a run.
Blindly pooling all of them is still inappropriate before combined admission:
the initial audit already measures main/worker decoded caches119,714,160 plus
213,952,112bytes (333,666,272 combined), before direct enemy/weapon/demon inputs,
canvases, copies and GPU resources. Independent pool caps do not prove the goal's
whole-memory bound. Worker unpinning is a prerequisite, not its completion.

All27 saved original/candidate native worker captures match exact SHA256 output
across nine stages, two orientations and DPR1/2. New256/384/512MiB tests cycle
every stage twice, assert0 exported input pins, bounded pool peaks, low-budget
LRU evictions and key-change reacquisition. Their initial first-versus-rebuilt
native assertion fails (501/501/822channels); the saved original's matching512MiB
sequence also differs822channels. Do not relax tolerance: compare settled repeated
submissions of one completed key, and retain separate original/candidate oracles.
This does not resolve the existing native sampling/rebuild variation.

Preliminary live-input-only trial passes all eight preload/lifetime cases,
including216 exact original/candidate native preload comparisons across worker/
local and memory2/8. Final export-only worker run passes14 cases, including108
worker preload comparisons, fallback, coalescing, hidden/disposed upload waits
and actual context restoration. Final476 unit tests and14 runtime cases pass,
including scene-load gameplay/RNG isolation, cinematic restoration and drift
readiness. Checked production/strict TypeScript passes all four cases, including
offline gameplay resize. Final actual low-memory worker/local startup both pass;
worker readiness reports256MiB and0 input pins. Formatting and diff checks pass;
package/lock/title/changelog agree. All process handles are terminal. Local
develop commit only.

Five matched title samples per arm:startup median2106.3→2144.1ms (+1.8%, roughly
unchanged), render median1.6→1.5ms and frame-p95 median16.9→17.0ms. Reports pass
compatibility/workload checks; builds use1.69.10/1.69.11 metadata before their
patch bumps. No physical-memory, actual120Hz or first-two-second-long-task claim.

Evidence:tmp/probes/owners63/ retains saved original/rebased control and candidate
sources, actual worker/local startup reports,27-case baseline/live-only/export
native oracles, failed/control/repaired lifetime logs, preload and unit logs.
Matched title timing compares tmp/performance/2026-10-09T05-30-15.101Z-01e6d230/
with tmp/performance/2026-10-09T06-02-12.492Z-b9871a84/.

Remaining:enemy/weapon selected ownership, incoming figure/weapon variants and
warming, demon/live-fog cutout-aware ownership, combined decoded/canvas/GPU/copy
admission, quiet cancelable worker/local next slots and persistent texture leases
through their promotion. Full120Hz/cold-warm/first-two-second and Phase5 checks
remain open. Local yielded composition still differs in four exact cases; retain
the passing synchronous control. Goal active at full scope; no push/deployment,
native build or real player-save changes. Cancelled packing, tight repacking and
separate lit-only integration remain cancelled.

## Previous handoff — Drift texture warming

Checkpoint62 warms runtime drift before publication, app1.69.11. Colour/emissive
and normal/surface data sources use the existing painter texture store and paced
uploads. Ordinary scene-program preparation now includes both leaf programs.
The drift owner holds that painter's source lease from warming through active use
until family replacement/disposal. This is not a parallel GPU cache. Decode-only
standalone owners retain their existing contract. Hidden/superseded/disposed
requests abort warming; failure releases incoming pins and allows retry while the
old drawable set survives. Spawn/RNG, artwork, save formats and budgets unchanged.

Saved native baseline:prepare has0 uploads/0 links/0 textures; first draw has
6 image uploads/5 shader links/6 textures;150 unused frames collect all6.
Candidate:prepare has6 uploads/13 links/6 textures; first draw has0 uploads/0
links;150 unused frames retain6, and disposal retires them to0. The13 preparation
links include ordinary environment/presentation programs as well as leaves.
This single cold owner probe moves work into preparation (90.9→466.4ms), not a
claim that the work is free or every task is below16ms. Runtime environment
composition and drift preparation proceed together. All204 scene-selected native
captures remain exact against the saved original, including embers, all mixtures,
both orientations and DPR1/2. No tolerance changes.

Matched title timing:five samples per arm,3s warmup/5s measurement,390×844/DPR2,
high/fixed seed. Startup median2155.8→2106.3ms; render median1.5→1.6ms with
overlapping ranges (1.4–1.6 versus1.5–1.6); frame-p95 median16.9ms in both.
No gameplay-speedup, actual120Hz, whole-resident-memory or first-two-second
long-task claim. Baseline/candidate reports pass compatibility/workload checks;
metadata versions1.69.9/1.69.10 precede their respective patch bumps. The timing
build precedes the subsequent failure-cleanup/retry addition; its normal successful
preparation path is unchanged.

Evidence:tmp/probes/drift62/ contains saved before/after source, native baseline/
candidate counts, the204-case oracle, warming/cancellation/retry tests and logs.
Matched reports:tmp/performance/2026-10-09T05-14-37.332Z-ef039ed4/ and
tmp/performance/2026-10-09T05-30-15.101Z-01e6d230/. Initial focused12 pass;
final476 unit tests pass. Broad native run37PASS/1FAIL:auxiliary WebGL initialization
fails before any warming invocation. Isolated unchanged six-case repeat passes;
the final broad repeat passes all38 with default two workers. Failure cause is
not established; retain the failed log. Checked production/strict TypeScript
verification passes all four cases, including offline gameplay resize. Formatting
and diff checks pass; package/lock/title/changelog agree. All process handles are
terminal. Local develop commit only.

Remaining:incoming enemy/weapon variants and warming, demon/live-fog cutout-aware
ownership, whole decoded/canvas/GPU/copy admission, quiet cancelable worker/local
next slots and their own persistent warming-to-promotion leases. Drift's active
lease does not solve the existing environment/next-slot lifetime. Local yielded
composition still differs in four exact cases; retain the passing synchronous
control. Full120Hz/cold-warm/first-two-second and Phase5 verification remain open.
Goal active at full scope; budgets256/384/512MiB unchanged; local develop only,
no push/deployment/native build or real player-save changes. Packing, tight
repacking and separate lit-only integration remain cancelled.

## Previous handoff — Selected drift families

Checkpoint 61 selects drift families for the restored/current scene, app 1.69.10.
Meadow now requires six planes / 37,764,912 nominal RGBA bytes, down from
13 / 81,823,976 (44,059,064 fewer required bytes). Normal scenes require at most
nine planes; Demon requires four / 25,176,608. These are required-input counts,
not physical resident-memory measurements. Shared-pool snapshots include every
document owner. Unpinned cached inputs may remain until ordinary LRU pressure.

Startup selects after restoration. Scene flow awaits incoming drift alongside
environment composition. Old submitted leaves remain drawable and continue
analytic cosmetic motion while decoding; generations reject superseded results.
Departing families retire consumer-local uploads before unpinning. Standalone
prepare without a stage retains the full-catalog contract. No spawn/RNG, artwork,
save, density or budget changes. Incoming GPU uploads are not yet explicitly
warmed by this owner; first-appearance warming and a persistent painter lease
through promotion remain required before the overall hitch target can be claimed.

Verification passes:476 units,34 related native cases, four checked production
cases (including offline gameplay resize),140 exact full-catalog comparisons and
204 exact scene-selected comparisons across all ten mixtures, ember variants,
two orientations and DPR1/2. New tests hold a required family, verify moving old
pixels, supersede the request, cycle scenes, preserve peers and verify actual
runtime readiness. No tolerance changes. A route initially held Vite imports;
restricting it to fetch requests fixes that fixture. Editing imports during a
native run caused a reload; the final stable-source34-case run passes.

Five matched title samples per arm:startup median2179.6→2155.8ms, render median
1.5→1.5ms and frame-p95 median16.9→16.9ms. Startup is essentially unchanged;
this sampled60Hz run proves neither actual120Hz nor the first-two-second
long-task target. Timing instrumentation is unchanged. Its injected STAGES
import collided with the new root import; aliasing the root import fixes the
candidate build. Both successful timing builds use1.69.9 metadata before bump.

Evidence:tmp/probes/drift61/ holds the saved original, full/selected native
oracles and baseline/current JSON plus unit, browser, production and timing logs.
Matched reports:tmp/performance/2026-10-09T05-00-49.517Z-24084fc4/ and
tmp/performance/2026-10-09T05-14-37.332Z-ef039ed4/. Failed import-collision build
is retained at tmp/performance/2026-10-09T05-13-50.100Z-a1b313e7/ (no samples).
All verification handles are terminal. Local develop commit only; version,
package-lock, title and changelog agree.

Next:incoming drift/figure/weapon warming, remaining demon/live-fog cutout-aware
and selected enemy/weapon ownership, combined decoded/canvas/GPU/copy admission,
then quiet cancelable worker/local next slots with retained texture leases.
Local yielded composition still differs in four exact cases; keep its passing
synchronous control. Full120Hz/cold-warm/first-two-second and Phase5 verification
remain open. Budgets256/384/512MiB unchanged. Goal active at full scope; no push,
deployment, native build or real player-save changes. Packing, tight repacking
and separate lit-only integration stay cancelled.

## Previous handoff — Shared drift ownership

Checkpoint 60 routes drift colour and material maps through the main-image pool,
app 1.69.9. Four colour atlases plus nine normal/surface/emissive maps become
13 shared/accounted planes, 81,823,976 nominal RGBA bytes. This does not imply
a resident-memory saving: one renderer still prepares all four families.
Independent renderers share decodes and pins. Pending cancellation cannot clear
a peer. Consuming painters release their own raw/map GPU uploads before final
unpinning; ready/disposed guards prevent further drawing and cold resurrection.
The pool keeps unpinned inputs cacheable while another owner survives.

A saved original/current native oracle matches all 140 captures exactly:
32 sprites plus three ember variants, two orientations and DPR 1/2. The peer
fixture initially expected four simultaneous requests; the loader intentionally
has one in flight. Its pinned diagnostic counts decoded entries, so pending
inputs are four queued / zero decoded pins. The fixture now asserts those
actual states and all 13 decoded pins after readiness. A two-channel first-to-
second-frame difference also occurs in the saved original, then repeats exactly;
prime that initial native frame before requiring zero peer-disposal differences.
No tolerance changes. Independent consuming painters go 13→0 and 13→13 on
one owner's disposal; the surviving peer renders exact settled pixels. The saved
original retires nine map uploads but leaves four colour uploads (13→4); the
pooled owner's consuming painter goes13→0. This is nominal upload-count evidence.

Runtime startup succeeds with all direct drift image URLs blocked, using shared
fetch/blob decoding. Direct environment inventory now requests 13 URLs /
81,799,448 nominal bytes with the worker, or nine / 56,622,840 locally; those
remaining sources belong to demon and live fog. They are requested-source
accounting, not resident memory or one-owner attribution. Selected drift sets,
demon/fog cutout-aware lifetime and selected enemy/weapon owners remain next.
Do not migrate demon images by clearing globally shared scenery cutouts while
a peer still holds a pooled raw source; handle cutout and consumer lifetimes.

Matched existing title harness: five samples per arm, 3s warmup / 5s measurement,
390×844 / DPR 2 / high / fixed seed. Startup median 2235.9→2203.5 ms; title
render median 1.5 ms in both, frame-p95 median 16.9→17.0 ms. Startup is roughly
unchanged in this sampled environment; no speedup, actual 120Hz, physical-memory
or first-two-second-long-task claim. Both timing reports pass compatibility and
workload guards; builds use 1.69.8 metadata before the patch bump.

Evidence: tmp/probes/drift60/ contains saved original/before/after renderer,
native oracle/config and baseline/current JSON, original repeat control,
worker/local inventories, and timing/unit/production/ownership logs. Timing
builds/results: tmp/performance/2026-10-09T04-51-33.977Z-a8f6392f/ and
tmp/performance/2026-10-09T04-52-51.732Z-75ddace3/. Verification:475 units,
eight unique related native cases, four checked production cases,140 exact native
captures and changed-file formatting/diff checks pass. All process handles are
terminal; version/package/lock/title/changelog agree. Local develop commit only.
Remaining whole decoded /
canvas / GPU / copy admission must cover drift and the other owners before
retained worker/local next scenes. Preserve the same texture lease through
warming/promotion. Quiet gating, cancellation, next-slot invalidation and full
Phase 5 remain open. Local yielded composition still has four unresolved exact
pixel differences; retain its passing synchronous control. Budgets remain
256/384/512 MiB. Goal active; no seed/save/asset changes, push/deploy/native build.
Cancelled packing, tight repacking and lit-only stay cancelled.

## Previous handoff — Scene-owned startup inputs

Checkpoint59 removes36 plain environment sources from broad startup decoding,
app1.69.8. Scene composition, demon and drift already prepare their own inputs.
The removed sources total226,501,456nominal RGBA bytes; this describes avoided
startup decode inputs, not measured resident savings. The preloader releases
its retained images after mounting (since1.68.13), so earlier references to
second lifetime startup owners were inaccurate. Compressed prefetch remains.

Actual startup succeeds with future bamboo/temple/snow/cherry/shore direct
image requests blocked, both with the worker and constructor-failure local
fallback. Demon/drift preparation succeeds independently. Direct environment
resource inventory falls54→26 URLs/339,779,840→163,623,424nominal bytes with
the worker; local fallback requests22/138,446,816. These are unique requested
sources, not resident memory or one-owner accounting. Direct demon/drift/live
fog images and enemy/weapon selection still need pooled ownership.

The fixture initially also blocked the Temple UI symbol, preventing startup;
restricting its URL filter to environment assets corrects it. Production's old
>=10 page-resource count depended on eager loading and missed worker requests.
The corrected test observes context requests, verifies all11 stage0 source
atlases, starts gameplay, goes offline, resizes and awaits a new preparation
mark plus ready state. A title-only readiness assertion was invalid; title
startup does not expose runtime scene-flow's readiness marker. No pixel or
rendering tolerance changes. Native all-nine-scene/mist/drift checks remain.

Matched existing title timing harness: five samples per arm,3s warmup/5s measure,
390x844/DPR2/high/fixed seed. Startup-ready median2638.4→2219.1ms (-15.9%);
five-sample maximum3162.0→2707.4ms. Title render median1.5ms in both and frame
p95median16.9ms in both. This proves an improvement in this sampled environment,
not actual120Hz delivery or the remaining first-two-second long-task target.
The candidate run completed five guarded samples but its comparison option was
mistakenly a results filename instead of a directory. Raw failure is retained;
compare.mjs validates that sole error and invokes the unchanged report function
on completed samples, including compatibility checks. No workload retry/claim
of a passing raw candidate report. Both builds used1.69.7 metadata before bump.

Evidence: tmp/probes/startup-scene59/ holds before/after main-game source,
baseline/worker/local source inventories, comparison script/JSON and logs.
Performance builds/results: tmp/performance/2026-10-09T04-35-06.731Z-0b65c5ea/
and tmp/performance/2026-10-09T04-36-16.649Z-c9e997ac/. Next finish remaining
selected main-image owners and combined decoded/canvas/GPU/copy admission before
quiet cancelable worker/local next slots and persistent texture leases. Local
yielded composition still has four unresolved exact-pixel differences; retain
its passing synchronous control. Budgets256/384/512MiB remain unchanged.
Verification:475 units,9 related native cases,4 production cases and the checked
strict TypeScript/source-map build pass. Changed-file formatting/diff checks pass;
all process handles are terminal. Local develop commit only; versions agree.
Full Phase5 metrics/traces/suites remain open; goal stays active. No seed/save/
asset edits, push/deploy/native build. Packing/tight repack/lit-only stay cancelled.

## Previous handoff — Shared player base ownership

# Performance, assets and seamless transitions — Shared player base ownership

Checkpoint58 routes four player base planes through the main-image pool,
app1.69.7. Plain colour is needed for tone generation; untinted stamps use PBR
diffuse. Preserve both plus normal/surface (25,160,256nominal RGBA bytes).
Independent players share the four images/pins; cancelling a pending owner
preserves peers. These bytes become accounted/shared, not a guaranteed physical
memory saving. Consuming painters release only their own raw/tone GPU sources
on preview suspension/disposal and unregister; final disposal releases consumers
before unpinning images and clearing tones. Startup excludes plain player/charm/
world UI sources already owned by the pool, avoiding second startup owners.

The original/current oracle passes40 exact visible outfit/mirror captures. The
first copied harness missed kasa because it prepared only the candidate's new
selection; correct preparation for both gives an exact baseline before edits
and candidate after edits. Existing companion suspension assertion also assumed
all retired sources were companion-owned. It now separately proves10 player
sources (3 base +7 hai tones) and3 companion sources. No tolerance was weakened.
New player-image-ownership tests cover pending peers,4 unique planes/bytes,
final zero pins/bytes, no resurrection, and actual startup with direct player/
charm/world UI requests blocked while shared fetch/blob decoding succeeds.

Passive startup inventory finds54 distinct environment URLs requested directly
as images,339,779,840nominal bytes, including demon/drift/fog/mountain maps.
A4000-entry resource buffer is required; default250 was truncated and gave0.
This is requested-source accounting, not resident memory or one-owner attribution.
Audit the full remaining eager startup set and direct environment owners next;
these are larger admission obstacles than the player alone. Preserve selected
scene/demon/drift readiness, worker fallback and offline paths when removing
eager sources. Enemy/weapon ownership still remains too.

Evidence: tmp/probes/player-ownership58/ has saved original kit/player, maker,
oracle/config, baseline.json/shared.json, startup.json and unit/production/
related logs; native outputs under tmp/test-results/player-ownership58/.
Verification:475 units,28 unique related native cases,4 checked production tests,
strict TypeScript/source-map build,40-capture oracle, changed-file formatting
and diff checks pass. All handles terminal. Package/lock/title/changelog agree;
local develop commit only. Whole decoded/canvas/GPU/copy admission, persistent
leases, quiet cancelable next slots, promotion/invalidation and Phase5 remain
open. Budgets256/384/512MiB unchanged; goal active. No seed/save/asset changes,
push/deploy/native build. Cancelled packing/tight repacking and lit-only remain.

## Previous handoff — Selected outfit ownership

Checkpoint57 integrates selected outfit families, app1.69.6. Runtime startup and
figure presentation select the equipped robe; startup checks that robe rather
than requiring all20 recipes. Armory/support previews borrow their own families,
prepare/repaint asynchronously with a stale-generation guard, and release them
on suspension/disposal. The global startup preloader now excludes the five plain
outfit atlases; a runtime test with every outfit URL blocked exposed that second
eager owner. Background compressed fetching still covers runtime assets.

Outfit plain/normal/surface sources use the shared main-image pool. One family
pins3planes/18,870,192nominal RGBA bytes. Default sumi requires none. Browser
baseline player preparation creates19 images/119,511,216nominal bytes; selected
sumi creates4 base-player images/25,160,256, avoiding15 unused outfit planes and
94,350,960bytes (about90MiB). The excluded preloader also stops retaining five
plain1254²image objects. Do not add those objects as a separate physical saving:
browser URL decode sharing is not measured. Unpinned raw images remain LRU cache
entries; this is selected pin/source accounting, not whole-game resident proof.

Every20 outfit under both mirrored transforms matches the saved original native
renderer exactly (40 visible captures, max channel difference0). The original/
original baseline passed before edits. Evidence: tmp/probes/outfit-ownership57/
{make-original.mjs,original-ink-player.ts,original-outfit-kit.ts,oracle.spec.ts,
playwright.config.ts,baseline.json,selected.json}, plus native reports under
tmp/test-results/outfit-ownership57/. Player base/PBR/tone painting is unchanged.

Outfit owners record consuming painters and retire only their unused raw GPU
sources. The existing texture store accepts optional frame-preserving release;
selection changes retain queued/replayed textures through the next beginFrame,
while final disposal remains immediate. Other painters sharing decoded images
survive. Preview suspension/disposal unregisters its consumer, avoiding a strong
reference to closed preview painters. Owned family tint canvases retire too.
Standalone catalogue prepare still selects all families through the same loader.
Repeated selection/prepare reuses promises rather than rebuilding work per draw.

New outfit-selection.spec.ts covers selected/borrowed pins, sharing, cancellation,
stale completion, queued/replayed native equality, peer survival and actual
startup with unused sources blocked, plus panel-close borrower release. Its first
runtime case exposed the global preloader; another test setup assumed preview
uses armory.selected, but it actually shows equipped equipment. The corrected
case passes a distinct appearance through the existing preview API. No gameplay
behavior or tolerance was changed to satisfy either test.

Verification:475 units,63 unique related native browser cases (45 broader cases
and21 lifetime/selection cases with3 overlapping), the final40-capture original
oracle and4 checked production tests pass. Strict TypeScript/source-map build,
changed-file formatting and diff whitespace checks pass. All handles terminal.
Package/lock/title/changelog agree; this checkpoint is a local develop commit.
Next route player-base/weapon/enemy ownership and select their required families,
then admit retained scenes using total decoded/canvas/GPU/copy overlap. Worker
pacing and unresolved local differences remain in earlier handoffs. Persistent
texture-store leases, quiet grants, cancellation, promotion/invalidation and all
Phase5 metrics/traces/full suites are still required. Budgets remain256/384/512MiB;
no seed/save/assets changes, push, deployment or native build. Cancelled packing/
tight repacking and separate lit-only work stay cancelled. Full goal active.

## Previous handoff — World UI ownership

Checkpoint56 integrates world UI artwork into the shared main-image loader;
app1.69.5. The three768×640 plain/normal/surface planes total5,898,240nominal
RGBA bytes (5.625MiB). They were directly decoded outside loader accounting;
they now share promises/images with UI material exporters, acquire pins and
unpin on disposal. Peer images remain usable; the pool evicts/retire-closes
sources. The document-level UI state remains one owner, without acquiring
additional pins from snapshot inspection or repeated drawing.

Seal tint canvases now retire on cache eviction and disposal. Eviction preserves
queued frame replay until the next frame boundary. Baseline native painter
sources after26 UI draws were8→6 on disposal. New UI disposal with an independent
pool owner gives8→3: five owned tints release while the three unpinned raw planes
remain cacheable. Final pool-owner disposal releases the remaining sources.
This is improved ownership/accounting, not5.625MiB less resident memory or a
whole-game memory bound. Budgets remain256/384/512MiB.

Original/current strict native oracle passes all26 visible captures: five seal
materials and eight crests under two lighting states, max channel difference0.
Initial probe setup used a nonexistent lighting API; then a reused painter's
first-frame initialization differed by1 channel value before any code changes.
Separate fresh canvas/painter lifetimes make the original/original baseline
exact, and the same corrected setup verifies the pooled candidate. No tolerance
was relaxed. Cache eviction similarly uses a warmed control before comparison.
Evidence: tmp/probes/ui-ownership56/{original-ui-art.ts,oracle.spec.ts,
playwright.config.ts,baseline.json,pooled.json}; native outputs under
tmp/test-results/ui-ownership56/. Production sources and assets are unchanged
apart from UI lifetime handling. No seed/save/gameplay changes.

New ui-art-ownership.spec.ts covers pin/byte accounting, non-initialising
snapshots, shared-peer survival, pending disposal/restart, owned tint disposal,
40-entry cache eviction and exact queued/replayed pixels. All475 units,
14 related native browser tests and4 checked production tests pass, including
strict TypeScript and production source-map build. Changed-file formatting and
git diff whitespace checks pass. All browser/build handles are terminal.
Package/lock/title/changelog versions agree; this checkpoint is a local commit.

Audit also confirms figures presentation eagerly prepares all enemy/player/
weapon packs on first figure draw. Charms and selected companions already use
the pool; enemy, player, outfit and weapon direct images remain outside it.
Outfit preparation eagerly loads all five colour/material families. Do not
blindly pin all of these alongside current/next scenery: stage0 raw images alone
are213,952,112bytes and enemy maps add75,489,120. Next implement selected family
lifetimes and account for canvas/GPU/copy overlap before retained next scenes.
Worker pacing evidence remains in checkpoint55 below. Persistent texture-store
leases, quiet grants, cancellation, next-slot promotion/invalidation, unresolved
local yielding differences and allPhase5 metrics/traces/suites remain open.
Full goal active. No push/deploy/native build; cancelled packing/tight repacking
and separate lit-only work remain cancelled.

## Previous handoff — Worker interference measured

Checkpoint55 is diagnostic only; app remains1.69.4 at checkpoint53. The repaired
atomic worker now has direct main-gameplay interference measurements, rather
than inferring frame cost from worker chunk wall time. Five fresh-context samples
per arm alternate idle-prepared, synchronous-compose and atomic-yielded-compose
workers against the exact same saved production gameplay bundle. Inferno is active;
background stage0 inputs are prepared before the standard3s warmup/5s window.
Both high portrait390x844/DPR2 and landscape900x600/DPR2 complete all workload
checks. This intentionally forced concurrent diagnostic is not production quiet
scheduling, memory admission or next-slot integration.

For each repetition, compare the same window in all arms: the larger synchronous/
yielded compose elapsed time plus100ms. Matched CPU render median/p95/p99, ms:
- portrait idle4.7/5.8/6.6; synchronous5.2/7.1/18.6; yielded4.7/5.7/7.2.
  Over16.7ms1/291,3/288,1/289; matched callback interval p99 24.9/27.3/20.5ms.
- landscape idle4.5/5.6/15.8; synchronous5.0/6.3/18.5; yielded4.7/6.1/17.1.
  Over16.7ms2/415,5/415,5/414; matched callback interval p99 23.7/26.8/25.8ms.
Full five-second render p95: portrait5.7/6.1/5.7ms, landscape5.5/6.0/5.9ms.
Yielding supports portrait responsiveness; landscape tail cost remains. No claim
of zero interference or actual120Hz delivery (callbacks remain near16.7ms).

Compose elapsed median: portrait synchronous678.5ms vs yielded852.3ms;
landscape1070.4ms vs1295.1ms. Yielded ranges825.4–928.8ms and1181.4–1351.1ms.
Portrait records12 GPU bakes/39 task yields; landscape0 GPU bakes/52 yields,
taking the original software-bake path. The first landscape run's GPU-only guard
was wrong and is excluded; it was corrected to require a completed layered
composition, while retaining actual route counters. A preflight synchronous
worker has a75.4ms callback interval184ms into composition. The five-sample run's
94.8ms maximum occurs1170ms after worker completion, so it is not attributed
to that compose interval. Timeline audits retain timestamps and raw timings.

The measured source's protocol adapter passes the strict27-visit worker oracle:
348 incoming/held planes and both native draws per visit are exact, including
low portrait and landscape. Positive worker/no-fallback path,264,275,504-byte
decoded pool peak within268,435,456-byte budget, and no GL/binding warnings.
That pool bound excludes main images, figures/UI, canvases/copies and GPU storage.
The timing experiment closes transferred bitmaps; it does not retain/upload a
next scene. It includes no CPU sampling, traces or allocation-heavy wrappers.
Timestamped callback pushes add equal overhead to all arms; these numbers are
an interference diagnostic, not a replacement for unchanged headline baselines.

Evidence: tmp/performance-scene-image-preload/checkpoint55/ contains results.json,
results-summary.json, results-timeline-audit.json, preflight results/audit,
landscape/results.json and summary, logs, worker-atomic55.json and oracle-source/.
portrait-source/ preserves the measured first driver/worker/generator; run.mjs,
collect.mjs, make-collect.mjs, summarize.mjs and audit.mjs reproduce the experiment.
The saved gameplay build remains tmp/performance/2026-10-09T02-56-52.936Z-dea9bb1e.
Worker code is in tmp/probes/scene-image-preload/cooperative55-worker.ts and
cooperative55-oracle-worker.ts, using repaired cooperative54/. All timing/oracle
handles are terminal. No production code/version, assets, saves or broad checks
changed; no source/visual tolerance was relaxed.

Next address whole-memory admission and selected figure/UI ownership before
adding retained next scenes. Preserve quiet/busy gating, generator cancellation
and the same SceneTextureStore lease through promotion/invalidation/context
generation; current warmScene releases it in finally. Then integrate worker/local
slots and paced uploads. Local four-visit yielding differences remain unresolved;
keep checkpoint54's passing synchronous control when isolating command/source
lifetime. AllPhase5 metrics/traces/suites and actual120Hz delivery remain required.
Full goal active; no push/deploy/native build. Cancelled packing/tight repacking
and separate lit-only work remain cancelled.

## Previous handoff — Local yielding isolated

Checkpoint54 is diagnostic only; app remains1.69.4 at checkpoint53. Repaired
local generator controls now distinguish transformation correctness from task
yielding. The final synchronous original/generator control passes all27 visits:
348 incoming planes, held planes and both native draws per visit are exact.
Portrait high/low and landscape use the same seeds and matched capture ordinals.
No production renderer, asset, seed, save, version or tolerance changed.

Two ignored-probe mistakes initially changed stage0's native fog despite exact
composed planes. The archived generator's live motion imported the production
material-binding module; after moving motion to the probe, its live fog called
a shared tile helper that had become a generator without draining it. The final
probe uses its own motion/material bindings and a synchronous tile wrapper;
composition delegates to tileSteps. Positive final27-visit native equality
verifies both repairs. Earlier failed sync captures are retained as diagnostics,
not evidence of an application regression or successful equivalence.

With that repaired source, unrestricted statement-level yielding changes23/27
visits (1,483 recorded yields). Restricting yields to completed stamps, restores
and temporary-source cleanup reproduces the four known differences:
- high portrait Hollow: colour/surface planes and both native draws;
- high portrait Shore: colour plane and both native draws;
- landscape Hollow: colour plane, native draws remain exact;
- landscape Shore: colour plane and both native draws.
The final atomic comparison captures all27 visits/348 planes and399 yields;
held planes match incoming in every visit. Low portrait remains exact. This
isolates yielding against the same generator drained synchronously; it does not
prove a browser raster mechanism or safe pacing. Keep the yielded route rejected.

Evidence: tmp/performance-scene-image-preload/checkpoint54/:
local-generator-sync54-final.json, sync-final-summary.json (passing),
local-generator-atomic54.json, atomic-summary.json (four failures),
local-generator-paused54.json, paused-summary.json (statement-level failures),
final-controls.log and earlier-control logs/results. Reliable final source,
maker and tests are archived under reliable-source/. Live ignored modules are
tmp/probes/scene-image-preload/cooperative54/, with make-local-control54.mjs,
local-generator-sync54.spec.ts and local-generator-atomic54.spec.ts. The maker
starts from checkpoint49's archived source, disables async map copies, repairs
motion/tile sharing and restricts task grants to atomic boundaries. Do not use
the rejected software-mask/current cooperative directory or old incomplete makers.

All three native-control processes are terminal. No broad unit/production or
headline performance rerun was needed for this diagnostic-only work. Next isolate
the first differing Hollow/Shore command/source lifetime, preserving the passing
synchronous control and exact assertions. Measure actual main-gameplay interference
from the worker prototype rather than equating worker chunk wall times with
main-thread frame cost. Admission still needs current/next planes, raw images,
copy/scratch overlap, figures/UI and GPU storage; a decoded-pool bound is insufficient.
Then integrate admitted next slots, cancellation, persistent texture-store leases,
promotion/invalidation and quiet uploads. AllPhase5 metrics/traces/suites and
actual120Hz delivery remain required. Goal active; no push/deploy/native build.
Cancelled packing, tight repacking and separate lit-only work remain cancelled.

## Previous handoff — WebGL graphics lifetime fixed

Checkpoint53: app1.69.4 installs the instance-local WebGL graphics-data adapter
in src/rendering/pixi/webgl-graphics-data.ts. Pixi8.22's original builder creates
globally cached WebGPU batch bind groups even for GL; its GL adaptor never uses
them. The adapter preserves BigPool, batcher, transforms, geometry, instructions
and uploads while omitting only unused groups. No dependency/global mutation,
shader, gradient/source sampling, draw-order, simulation or seed changes.
Recheck the version-specific adapter when upgrading Pixi.

Integrated/original native comparison passes40 lit animated changing-order
Inferno frames exactly. The permanent webgl-graphics-lifetime regression covers
two painters,120 animated frames, two resizes, restoration,40 more restored
frames, peer disposal and40 surviving-peer frames. EMPTY source/style/WHITE
listeners stay16/3/2 with both painters,8/2/1 with one and return to baseline
0/1/0 on final disposal. Restored and surviving-peer pixels match exactly; GL
errors absent. Original single-painter120-frame disposal left31,704 EMPTY source
listeners. This fixes that reproduced listener leak, not whole-game GPU residency.

Matched standard five-sample render median/p95/p99 in ms:
- Demon5.4/6.8/8.6 ->4.55/5.9/7.6; over8.3ms20/1503 ->6/1504; over16.7ms0.
- Inferno8.25/11.1/15.2 ->4.4/5.4/6.4; over8.3ms743/1498 ->5/1489;
  over16.7ms14 ->2.
Both measured CPU render p95s now fit8.3ms. Headless callbacks remain near16.7ms
and do not prove120Hz display delivery. Two Inferno timing outliers remain;
separate diagnostic windows do not explain individual timing outliers.
Source-mapped profiles record no sampled removeListener self time versus
checkpoint52's69.5/303.5ms. Zero samples do not prove zero cost.
Five alternating normal-combat saved-build samples per arm pass:2.3/3.2/4.1
->2.2/3.1/3.8ms; over8.3ms remains5/1502, over16.7ms1/1502. Updates remain
0.1/0.2/0.3ms. This close comparison is not a major combat gain claim.

Evidence: tmp/performance-gameplay-checkpoint53/ (original source, exact oracle,
graphics-lifetime.json, combat-control/, verification logs and makers).
Before standard build: tmp/performance/2026-10-09T02-38-40.787Z-fd9dd49b;
after: tmp/performance/2026-10-09T02-56-52.936Z-dea9bb1e, with raw samples,
frame-budgets.json, source-cpu-summary.json, source maps, CPU/heap/traces/build.
Same instrumentation fingerprint85311fdbddd17a504d77f5474a770d9af0087012c1e42ecad042462149244843,
390x844/DPR2, seed424242, three-second warmup/five-second windows. Timing build
preceded only release-version/comment synchronization; no overlapping tests.

All475 units,36 related native browser tests, checked production build/strict
TypeScript and four bundled production tests pass. Version/package/lock/title/
changelog and rendering ownership notes are synchronized. All capture and
verification handles are terminal; changed-file format/diff checks pass.
Whole-repository format:check flags431 unchanged files:178 pass after checkout
CRLF normalization,253 also fail on committed HEAD. All431 are unchanged versus
HEAD after line-ending normalization; format-baseline.json/log records this.
No unrelated formatting edits are included.

Next resume deterministic next-scene slots, quiet composition/uploads, local
paused differences, generator cancellation, whole-memory admission and selected
figure/startup ownership. Preserve the same SceneTextureStore lease through
next-slot promotion/invalidation: current warmScene releases it in finally,
and unused sources expire after120 rendered frames. Existing decoded pool bounds
are not whole-game bounds. AllPhase5 workloads/transition metrics/traces/suites
remain required. Full goal active; no push/deploy/native build or player saves.
Cancelled packing, tight repacking and separate lit-only work stay cancelled.

## Previous handoff — Geometry bindings retained

Checkpoint 52: app 1.69.3 retains the light pass's unchanged geometry sampler
bindings across ordinary frames. Light outputs still detach before accumulation;
geometry inputs detach before resize/restore replaces their generation and on
disposal. No shaders, source sampling, draw order, simulation or seed changes.
The new native regression verifies zero steady-frame geometry detach calls,
one before resize, replacement/retirement of the old source and final disposal.
Original/current comparison passes40 lit changing-order frames exactly.

The existing standard five-sample matched Demon/Inferno harness passes, with
the same instrumentation, geometry, seed, warmup and duration as checkpoint51.
Pooled render median/p95/p99, ms:
- Demon5.8/7.2/10.1 ->5.4/6.8/8.6; over8.3ms36/1503 ->20/1503;
  over16.7ms remains0.
- Inferno9.4/14.0/21.4 ->8.25/11.1/15.2; over8.3ms1121/1495 ->743/1498;
  over16.7ms32 ->14.
Separate sampled removeListener self time is69.5ms Demon and303.5ms Inferno
(checkpoint51 64.5/412.9ms). CPU samples are not headline timing. Inferno still
misses8.3ms; headless desktop callbacks do not prove120Hz display delivery.
All475 units,35 related native browsers, checked production build/strict
TypeScript and four production browsers pass. Version/package/lock/title/
changelog and rendering notes are synchronized. Five alternating normal-combat
samples per arm pass from the exact saved bundles: render median/p95/p99
2.2/3.1/4.0 ->2.3/3.2/4.3ms; over8.3ms remains5, over16.7ms2 ->1.
Update median/p95/p99 remains0.1/0.2/0.3ms. This close comparison is not a combat
gain claim. All measurement/verification handles are terminal; format/diff pass.

A120-frame Inferno lifetime diagnostic finds a separate leak: EMPTY source
listeners grow296 ->31,712, style290 ->31,706, adding264 per frame; disposal
leaves31,704/31,705. Slot count60 and active gradient count23 remain bounded.
Installed Pixi8.22 GraphicsContextSystem._initContextRenderData unconditionally
calls globally cached getTextureBatchBindGroup, including on WebGL. Its installed
GlGraphicsAdaptor executes the same batch textures/geometry directly and never
reads those WebGPU bind groups. This is executable-code evidence plus listener
measurement, not an estimate of whole-game resident GPU memory.

An ignored instance-local WebGL graphics-data prototype keeps the original
BigPool data/batcher, transforms, buffer uploads and instructions, skipping only
unused WebGPU group construction. It holds EMPTY source/style listeners8/2
through120 frames and returns0/1 baseline on disposal (WHITE0). Original/current
40 lit Inferno frames are exact, positive72-slot path. It is not integrated:
strict production typing, peer/resize/restore tests and app timing remain required.

Evidence is under tmp/performance-gameplay-checkpoint52/: original painter,
geometry-bindings.json, empty-bindings.json, webgl-empty-bindings.json,
webgl-geometry-bindings.json, verification logs and combat-control/.
Before standard build is checkpoint51's
tmp/performance/2026-10-09T02-26-12.404Z-7c5cceab; after is
tmp/performance/2026-10-09T02-38-40.787Z-fd9dd49b, with frame-budgets.json,
source-cpu-summary.json and saved source-mapped CPU/heap/traces/build.
Prototype and reproduction makers are in tmp/probes/scene-image-preload/:
webgl-graphics-data.ts, webgl-empty-bindings.spec.ts and
webgl-geometry-bindings.spec.ts. Preserve the exact original gradients; checkpoint51
ramp sharing remains rejected. No tolerance is relaxed.

Next integrate and verify the WebGL-only graphics-data allocation fix. Recheck
bounded source/style listeners across peers, disposal and context generations,
native output and matched gameplay timing. Then resume next-scene slots, quiet
composition/uploads, local paused differences, generator cancellation, whole-memory
admission and figure/startup ownership. AllPhase5 metrics/traces/suites remain
required. Full goal active; no push/deploy/native build or player saves.

## Previous handoff — Bounded draw-slot reuse verified

Checkpoint 51: app 1.69.2 reuses an unsubmitted draw slot of the requested kind
before destroying/replacing a mismatched mesh. A swap within the existing slot
array preserves its size bound and submission order; already-submitted slots
are excluded. Missing kinds retain the original disposal/replacement path.
No shader, source texture, gradient sampling, simulation or seed changes.

The existing standard harness measures five fresh-context samples per workload,
390x844/DPR2, seed424242, three-second warmup and five-second windows. Separate
CPU/heap/tracing captures resolve to source files. Before/after pooled render
median/p95/p99, ms:
- Demon6.8/10.0/14.5 ->5.8/7.2/10.1; over8.3ms305/1505 ->36/1503;
  over16.7ms4 ->0.
- Inferno11.2/20.8/34.3 ->9.4/14.0/21.4; over8.3ms1277/1466 ->1121/1495;
  over16.7ms202 ->32.
Both complete runs pass with the unchanged instrumentation fingerprint.
Sampled removeListener self time falls303.4 ->64.5ms in Demon and604.3 ->412.9ms
in Inferno's separate diagnostic window. These sampled costs are not headline
timing. Gameplay's configured cap is120fps with60fps simulation; headless desktop
callbacks remain near16.7ms and do not demonstrate120Hz display delivery.
Inferno still misses the8.3ms CPU target; this is not goal completion.

Original/current native pool comparison passes40 changing-order frames exactly.
The permanent regression verifies all12 original meshes are reused across40
frames, pool peak stays12, root order matches submission order, final disposal
destroys each item and no GL/binding warnings occur. All475 units,34 related
native browser cases, checked production build/strict TypeScript and four bundled
production browsers pass. Five alternating normal-combat samples per arm reuse
the exact saved before/after bundles and standard workload: render median/p95/p99
2.5/3.6/4.5 ->2.2/3.2/4.0ms, over8.3ms6/1504 ->5/1503, over16.7ms3 ->1.
Update median/p95/p99 remains0.1/0.2/0.3ms. Both arms pass all workload guards.
All capture/verification handles are terminal; format and diff checks pass.
Package/lock/title/changelog are synchronized at1.69.2.

A preceding linear-gradient ramp-sharing trial is rejected and fully reverted.
Its matrices match Pixi exactly, but34/35 animated Inferno frames change across
11,203 channels, maximum3; unchanged original/original controls change only one
frame across five channels, maximum1. Raw ramp readback maximum1 is not proof
of native parity. No tolerance relaxation, smoothing or gradient change is kept.

Evidence/source are under tmp/performance-gameplay-checkpoint51/:
scene-painter-original.ts, rejected scene-painter-gradient-trial.ts and
linear-gradient-ramps.ts, gradient-ramp-trial/control.json, slot-reuse.json,
verification logs and combat-control/. Before/after standard runs are
tmp/performance/2026-10-09T02-17-21.471Z-e941054d and
tmp/performance/2026-10-09T02-26-12.404Z-7c5cceab, including source-cpu-summary.json,
frame-budgets.json, saved instrumented builds, CPU/heap profiles and traces.
The ignored combat adapter reuses those exact builds and standard measure()
in alternating arms; it does not rebuild or alter workload rules.

Next investigate remaining Inferno resource-binding and gradient-preparation
costs with source-mapped controls. Preserve the original native sampling rejected
by ramp sharing. Then resume admitted worker/local next slots and exact quiet
promotion/upload pacing, generator cancellation, fractional terrain bakes and
local paused pixel differences. Whole-memory admission and figure/startup
ownership remain open; next-slot warming must retain the existing texture-store
lease through promotion/invalidation and context-generation readiness. Full
Phase5 metrics/traces/suites remain required. Goal active; no push/deploy/native
build or player saves.

## Previous handoff — Mask sampling costs isolated

Checkpoint 50 is diagnostic only; application remains 1.69.1 at checkpoint 48.
Software map destinations do not improve the existing worker prototype: three
stage0 native profiles record680 drawImage calls taking512.0–555.2ms, including
237 software-to-software calls taking498.9–541.6ms. No pixel verdict is claimed.
Software colour cutouts reduce instrumented drawImage time to116.5–123.6ms, but
fail every one of27 incoming-plane visits and native first draws. Reject them.
Requested context attributes label routes; they do not measure physical residency.

A separate raw software alpha mask leaves colour planes exact but changes
normal/surface/emissive planes in nine visits: stages0,6,7 at all three sizes.
Eight corresponding native first draws change; landscape stage7 remains native
exact. The positive worker/mask path is verified. Three properly configured
profiles record690 drawImage calls taking255.5–351.6ms and maximum synchronous
steps27.1–64.8ms. Reject this route; no tolerance or decode option changes.
The earlier alpha-mask-profile/ run did not apply its mask edit and is invalid
as mask evidence; use alpha-mask-profile-final/ instead.

Isolated worker alpha controls explain the mask failure. Twelve integer atlas
frames from bamboo, pine and shrubs match exactly at full source dimensions,
including the original source-atop haze. All36 downsampled comparisons differ,
with maximum alpha delta14. These sources contain80,655–248,127 partially opaque
pixels per frame, so treating their alpha as binary is incorrect. A bitmap made
from the software crop reproduces the same failures. Explicit low, medium and
high smoothing controls all fail downsampled comparisons; medium/high reach185.
This isolates source/resampling behavior, not a particular browser kernel.

Bitmap snapshots of the original GPU-requested colour canvas pass all48 isolated
alpha comparisons exactly. Their ignored per-stamp prototype is still unsuitable:
55 bitmap creations take8.0–8.4ms total synchronously (maximum2.0–2.2ms), but
680 drawImage calls take399.1–446.6ms, including213 software-to-GPU calls taking
390.5–438.3ms. Maximum synchronous steps remain24.9–68.6ms. There is no full-scene
pixel verdict for this last timing-only trial; the isolated alpha success is not
a scene-equivalence claim. Instrumented profiles are not headline compose or
gameplay frame measurements. No mask/copy prototype is integrated.

Evidence is under tmp/performance-scene-image-preload/checkpoint50/:
software-maps-profile/, software-colour-profile/, software-colour-worker.json,
alpha-mask-profile-final/, alpha-mask-worker.json, alpha-resampling.json,
bitmap-alpha-resampling.json, gpu-bitmap-alpha-resampling.json,
quality-alpha-resampling.json and gpu-colour-bitmap-profile/.
Rejected sources are preserved in software-map-source/ and
gpu-colour-bitmap-source/. Current ignored cooperative modules contain the last
GPU-colour bitmap trial. The reliable checkpoint49 passing source remains in
checkpoint49/bitmap-source/; the maker scripts omit later delegation repairs.
All diagnostic/browser processes are terminal. No application source, version,
asset, seed, save, production build or broad suite changed this checkpoint.

Next return to the outstanding gameplay frame budget with focused source-mapped
Demon/Inferno profiles using the existing opt-in harness. The Phase1 p95 baselines
remain9.7/18.2ms; no later gameplay improvement is established. Fix measured
recurring work without changing rendering. Then resume admitted worker/local
next slots and exact quiet promotion/upload pacing: the rejected mask/copy routes
do not justify an unpaced second renderer. Local paused pixel differences,
generator cancellation, fractional terrain bakes, whole-memory admission and
figure/startup ownership remain open. Next-slot warming must retain the existing
texture-store lease through promotion/invalidation and context-generation
readiness. All Phase5 measurements/traces/suites remain required; full goal active.

## Previous handoff — Cooperative copy costs isolated

Checkpoint 49 is diagnostic only; application remains 1.69.1 at checkpoint 48.
Atomic-boundary local yielding after stamps, context restores and temporary
source cleanup still fails exact output in the same four visits: portrait
Hollow colour/surface/native, portrait Shore colour/native, landscape Hollow
colour only, and landscape Shore colour/native. All27 visits were captured;
the trial remains rejected. Summed local work between those boundaries reaches
164.9ms, so those boundaries do not establish pacing.

The same atomic worker schedule passes all27 visits exactly (1.8m), with
positive GPU bakes and the actual256MiB worker path. Per-step maxima are
20.3–36.0ms in high portrait,18.3–26.7ms in low portrait and79.4–117.9ms in
landscape. The landscape maximum remains the fractional full-layer software
bake. These are diagnostic call/chunk wall times, not gameplay frame p95.

An ignored prototype delegates material stamps and awaits createImageBitmap
copies of baked maps before GPU plane draws. It preserves software atlas baking
and restores material bindings around each synchronous iterator step. All nine
protocol preflight cases pass with positive copy counts. The final27-visit
worker oracle passes exact incoming/held planes and both native draws (2.1m),
with positive worker-path coverage and no fallback; decoded peak264,275,504bytes
stays within256MiB. Initial syntax and incomplete nested-delegation failures were
repaired before this verdict. No pixel assertion or decode option was changed.

Reject that copy approach for integration: it shifts the synchronous stall.
Portrait bitmap creation still reaches31.5ms; landscape cutout baking reaches
58.4ms. Three stage0 900x600/DPR1 instrumented profiles show680 drawImage calls
now take14.7–16.0ms, but225 bitmap creations take423.4–458.5ms synchronously,
with only1.2–1.5ms total promise wait. The largest sampled creation reaches91.4ms.
CPU ImageData copying, restricted to requested-software cutouts and retaining
direct GPU copies, also fails the pacing investigation: three profiles show
213 copies taking428.6–479.7ms synchronously, getImageData420.6–471.8ms,
maximum individual copy24.7–66.5ms and total promise wait0.9–1.3ms. No pixel
verdict is claimed for this last timing-only variant. Context-mode route labels
come from requested willReadFrequently attributes, not measured physical GPU
residency. Profile overhead excludes these from headline compose timings.

Evidence is under tmp/performance-scene-image-preload/checkpoint49/:
atomic-local.json, atomic-local-chunks.json, atomic-worker.json,
bitmap-worker.json, bitmap-worker-chunks.json, bitmap-profile/ and
image-data-profile/. The passing bitmap prototype and oracle are archived in
bitmap-source/; current tmp/probes/scene-image-preload/cooperative/ has the
subsequent rejected ImageData timing variant. Regenerating either maker will
not reproduce all later nested-delegation fixes; use the archived final source.
The native profiler reuses profile-compose under an ignored adapter. All
measurement/browser processes are terminal. Two shell helpers printing huge
profile lines were interrupted only after all three profiles/results completed.

Next investigate map destination/raster ownership rather than another promise
wrapper around the same synchronous copy. Preserve original source sampling,
alpha and strict plane/native comparisons. Cancellation must close outstanding
bitmaps and unwind generator cleanup before any resumable integration. Next-slot
warming also needs an explicit source lease: current warmScene releases its
texture-store lease on return, and collect retires untouched sources after120
rendered frames. A completed next slot must retain that same store until
promotion/invalidation, including context-generation readiness; merely awaiting
warmScene is insufficient for a long quiet interval.

Then implement admitted worker/local next slots with exact promotion, quiet
pacing and whole-memory accounting. Local paused differences, figure/startup
ownership,120Hz/CPU budgets and fullPhase5 remain required. Full goal active;
no application change, version bump, push/deploy/native build or player saves.

## Previous handoff — Worker composed-map optimization verified

Checkpoint 48: app version 1.69.1 keeps aligned, full composed-layer map copies
on GPU-backed worker cutouts when source and bake pixel sizes match exactly.
Main composition, atlas downsampling and fractional landscape sizes retain
software baking. Canvas reuse and cache keys separate fixed context modes;
the shared 4M-pixel cutout budget remains unchanged. Lifetime GPU bake counters
survive completed-cutout retirement for path-use diagnostics.

All 475 units, strict TypeScript, both permanent worker 256/512 MiB exact-pixel
cases (3.3m), and 13 related material/ownership/fallback/budget browsers pass.
The permanent gate covers 54 visits across all nine stages at portrait high,
portrait low and landscape high quality, exact incoming and held planes, and
108 native draws. Candidate GPU bakes are positive; software-control bakes are
zero. The first run failed only because cleanup removed counters; owner-level
counters repaired diagnostics without weakening any pixel assertion.
Checked production build/type-check and all four production browsers pass
(21.4s). All verification and profile processes are terminal.

The existing compose harness records five fresh-worker samples per stage at
900x600/DPR1 with predecoded assets. All 116 raw plane comparisons are exact.
Median request times before/after, ms, stages 0–8:
630.5/522.9, 300.0/250.3, 352.0/330.8, 434.7/399.2, 455.0/420.6,
300.6/267.5, 364.1/345.8, 324.9/286.8, 302.4/267.8.
Stage 0 median compose improves 583.4 to 481.9ms; two of five after samples
remain above 500ms (505.4/619.5). Three instrumented stage 0 profiles explain
remaining native drawImage wall time: 680 calls total, 213 software-to-GPU calls
cost 229.1–431.2ms; 95 GPU-to-GPU calls cost 3.3–3.8ms; 32 readbacks cost
4.3–4.4ms. Source-mapped profiles retain cached-materials and worker-canvas
locations. Profile overhead is not part of headline timings. These are compose
measurements, not gameplay frame p95 or physical GPU residency measurements.
Evidence is under tmp/performance-scene-image-preload/checkpoint48/.

Expanded nested generators remain ignored, not integrated. Synchronous local
and paused software-worker all-27-visit oracles pass. GPU 1:1 trials also pass
all 27 worker visits in paused and synchronous schedules. Prototype portrait
terrain blits improve from 31–80ms to 0.7–4.3ms; fractional landscape remains
software. Expanded local profiling reaches 50.6ms and worker software chunks
124.7ms. These prototype chunk times do not establish application pacing.
Evidence and source remain under tmp/performance-scene-image-preload/cooperative/
and tmp/probes/scene-image-preload/. No tolerance, atlas or decode-option change.

Next implement admitted worker/local next slots with exact promotion, quiet
pacing and whole-memory accounting. Local paused pixel differences, remaining
material-bake chunks, figure/startup ownership, 120Hz/CPU budgets and full
Phase 5 remain required. Full goal active; no push/deploy/native build or saves.

## Previous handoff — Cooperative composition measured

Checkpoint 47 is diagnostic only; app remains 1.69.0 and checkpoint 46's quiet
decoded preload remains integrated. A generator prototype preserves the exact
original drawing order when drained synchronously: all 27 visits pass incoming
and held plane hashes and both corresponding native frames in independent
contexts with matching capture ordinals (1.7m). Restoring material bindings for
each iterator step also avoids a binding scope spanning a promise.

Pausing at operation boundaries with a nominal 2ms grant changes four of 27
visits. Quantified matched-context captures reproduce the initial failed hashes:
portrait Hollow colour max2 across3 channels; surface max255 across1,619
channels (visible max255, alpha unchanged); native max1 across109 channels.
Portrait Shore far colour max255 across21,639 channels, alpha max22; native
max13 across5,348 channels. Landscape Hollow colour max3 across3 channels,
native exact. Landscape Shore far colour max255 across29,291 channels, alpha
max23; native max11 across2,976 channels. This is not an acceptable visual pass.
No generator, task-yielding compose, next slot or pixel tolerance is integrated.

Initial timing labels aggregate declarations with the following operation, so
do not attribute the full measured chunk to its final blit. A separate
declaration-boundary profile isolates createBackground at39.5–242.6ms; terrain
blits still reach79.3ms, meadow89.9ms, midground103.5ms, individual atlas stamps
51.4ms and completion/variation chunks64.4ms. Every geometry/stage still has at
least one step over16ms. These are experimental local call/chunk wall times,
not application frame p95 or isolated GPU timings. The 27-row profile completes
in18.2s; its green process result asserts no visual equivalence.

All tracked rendering sources remain unchanged from checkpoint 46. Prototypes
and generators are under tmp/probes/scene-image-preload/cooperative/ with maker,
verifier and analysis scripts alongside them. Archived synchronous controls,
paused hashes, gzip RGBA differences, labeled chunks and declaration-separated
profile are under tmp/performance-scene-image-preload/cooperative/. All process
handles are terminal; no overlap, production build or full suite was needed for
this diagnostic-only turn.

Next split createBackground and the nested scenery/material helpers into
resumable work, preserving the synchronous drain oracle. Investigate native
source sampling across task boundaries with fresh-decode and unchanged controls
before enabling the paused path. Then implement admitted worker/local next slots
and exact promotion/invalidation. A second renderer alone cannot satisfy pacing;
current canvases/raw pins, transient copies, material scratch and GPU storage
must enter admission. Figure/startup ownership, 120Hz/CPU budgets and full
Phase 5 remain required. Full goal active; no push/deploy/native build or saves.

## Previous handoff — Quiet decoded preload integrated

Checkpoint 46: app version 1.69.0 enables admitted quiet-frame
next-stage decoded-image leases in local and worker renderers. Queue order is
separate from decoded residency age; speculative requests do not count as use.
First required use preserves cold-batch completion recency. This fixes the pine
source lifetime difference isolated in checkpoint 45 follow-up diagnostics.
No source normalization, pixel tolerance, atlas or decode option changes.

All four continuous 27-visit local/worker configurations pass exact incoming/held
planes and both corresponding native draws: 256 MiB and 512 MiB, all nine stages at
portrait, low-quality portrait and landscape. Every prediction is ready;
required local entries following a ready set do no new decodes. Peaks are
264,275,216 and 534,788,792 bytes, within their configured decoded-only budgets.
Comparisons use independent contexts with identical two disabled primer captures
before the measured third capture. Three unchanged controls proved sampling can
vary by capture ordinal; equal-ordinal disabled/enabled traces match exactly.
Across 108 visits, 1,392 incoming plane comparisons and 216 corresponding native
frames match exactly; all held planes remain unchanged. Worker 256/512 budgets
and worker backend are verified. Explicit-prepare lifecycle verification passes:
no preload before composition, ready afterward, and cancellation at the next
prepare. The worker caches its preparation promise separately from an in-flight
flag; compose-only stage changes clear an obsolete preparation promise.

All 474 units pass (2.22s), all four continuous parity cases pass (6.4m), and
all 17 related browser cases pass (53.0s): explicit preparation, worker fallback,
coalescing, visibility, peer disposal, pending cancellation, stage-cycle decoded
bounds and retained planes. Formatting and strict TypeScript pass. The final
checked production build and all four production tests pass (21.2s).
Checkpoint 46 implementation is committed; all verification handles are terminal.
Continuous exact comparisons are archived under
tmp/performance-scene-image-preload/checkpoint46/. Source lifetime and three-arm
controls remain under tmp/performance-scene-image-preload/matched-history/.

Next implement worker/local pre-composed next slots with whole-budget admission,
exact promotion/invalidation and quiet compose/upload pacing. Plan for retained
current worker canvases/raw pins and transient transfer copies; the decoded pool
budget alone cannot admit a scene slot. Figure/startup ownership, 120Hz/CPU
budgets and full Phase 5 remain required. Decoded pool bounds are not
whole-game/GPU bounds.
Full goal active; no push/deploy/native build or player saves.

## Previous handoff — Continuous map controls isolated

Latest checkpoint 45 is diagnostic only; app remains 1.68.35. An unchanged
continuous27-visit local256 MiB control reproduces19 normal/surface differences
between its two arms, including the exact first failed stage0-low hashes from
checkpoint44. The maps-first preload candidate matches one complete unchanged
control scene (all planes and both native draws together) at25 of27 visits.
Landscape stage6 and7 remain unmatched; no visual pass or preload integration
is claimed. Composed-plane snapshotting reproduces the maps-first trial exactly
and leaves those two scenes unmatched. Raw-map snapshotting instead changes132
plane hashes, starting on the first cold stage0 build; it is rejected.

Minimal mountain normal/surface sampling reproduces first-to-repeat changes on
GPU destinations for URL HTML,blob HTML and default ImageBitmap sources:
normal21,133 changed channels,max255,alpha37; surface34,158,max235,alpha0.
CPU destinations repeat exactly but differ from original cold GPU pixels.
Explicit medium/high smoothing also changes original pixels and still varies.
A fresh full-size1:1 CPU source copy per sequence preserves original cold GPU
pixels exactly in this minimal fixture. Retaining one such copy repeats the
original difference; it is not a reusable fix. No browser-internal mechanism is
claimed, and minimal source-copy parity does not prove actual renderer parity.

All eight tracked trial files restored exactly; temporary observer removed.
No implementation/version/asset/visual tolerance change. Evidence under
tmp/probes/scene-image-preload/ and
tmp/performance-scene-image-preload/matched-history/. All handles terminal.
Next isolate the decoded-source lifetime/sampling of the two remaining landscape
scenes, using unchanged controls and the fresh-decode control rather than raw-map
or composed-plane snapshotting. Worker/local next slots, whole-budget admission,
promotion/invalidation, quiet pacing, figure/startup ownership,120Hz/CPU budgets
and fullPhase5 remain required. Full goal active; no push/deploy/native build or
player saves.

## Previous handoff — Matched-history preload checks

Latest checkpoint 44 is diagnostic only; app remains 1.68.35. Actual automatic
preload trial passes matched-source-history comparisons for 27 fresh renderer
transition pairs in each of local256, worker256 and worker512 MiB configurations.
All nine stage boundaries include portrait, low-quality portrait and landscape.
Across the three configurations, 3,132 exact plane comparisons and 243 native
frame comparisons pass. Every future set reports ready; local entries perform
zero new decodes. Loader peaks are 251,692,784 bytes. Worker budgets and worker
backend are confirmed in every response; worker decode counts are not measured.
These are isolated pairs, not a continuous stage-cycle or whole-game memory proof.

Initial local test incorrectly required each second landscape draw to equal its
first. Eight cases differ in both original and candidate, with exact matching
second draws. The archived verifier compares the same draw ordinal in both arms
and still requires every held plane to remain unchanged. No pixel tolerance is
relaxed. Matching required load order (maps before colours) is insufficient for
the continuous 27-visit trial: 19 normal/surface plane hashes differ on later
visits, although every colour plane matches. The continuous visual gate fails.

All six tracked trial files restored exactly; observer removed. No automatic
preload, source normalization, next-slot implementation, version or asset change
is integrated. Sources/results under tmp/probes/scene-image-preload/ and
tmp/performance-scene-image-preload/matched-history/. All handles terminal.
Next identify the continuous-cycle map sampling/lifetime difference with matched
controls before enabling preload. Whole-budget worker/local next slots, exact
promotion/invalidation, quiet pacing, figure/startup ownership, 120Hz/CPU budgets
and full Phase5 remain required. Full goal active; no push/deploy/native build or
player saves.

## Previous handoff — Fresh-decode pixel control established

Latest checkpoint 43 is diagnostic only; app remains 1.68.35. Independently
decoding the foam atlas before each Shore build resets the native multi-size
sampling difference and reproduces the original cold pixels exactly. The final
same-encoded-blob control checks all 12 colour/normal/surface/emissive planes:
foam-only refresh and all-source refresh each pass 48 exact hashes across four
builds. Retaining the original source reproduces the original far-colour delta
on all three repeats (51,684 channels, max255, alpha23); its other 11 planes match.
Fresh destinations and unchanged map sources are used. No encoded byte copy is
needed. This establishes a useful pixel-preserving diagnostic control, not a
production preload or sampling fix.

All-CPU Shore contexts instead produce a stable different fingerprint. Making
only colour cutouts CPU-backed changes both original fingerprints and still
varies between the first and later builds. Neither is integrated. Re-decoding
has not been timed as a production operation or admitted within the whole-game
memory budget. No implementation, assets, visual gates or version changed.
Evidence remains under tmp/probes/scene-image-preload/ and
tmp/performance-scene-image-preload/isolation/. All probe handles are terminal.

Next use fresh-decode and retained-source controls with matching draw histories
to validate raw/native output in the actual worker/local preload trial across
every stage and geometry. Do not infer application parity from Shore alone or
replace retained resources with repeated required decoding without measuring
its costs. Then implement admitted worker/local next slots, exact promotion and
quiet pacing. Whole-game decoded/GPU bounds, figure/startup ownership, 120Hz/CPU
budgets and full Phase5 remain required. Full goal active; no push/deploy/native
build/player saves.

## Previous handoff — Multi-size native sampling isolated

Latest checkpoint 42 is diagnostic only; app remains 1.68.35. The rejected
Shore colour change reproduces without gameplay, prediction, preloading or material
maps: plain drawBrokenShore repeats change exactly 51,684 channel values, max255,
alpha max23. Fresh destination canvases reproduce it too. Moving cutout retirement
after the final readback does not change either cold or warm fingerprint. A
per-stamp readback probe changes the final cold fingerprint and is not a valid
unperturbed attribution control; its observations are only suggestive.

Minimal foam-only reproduction draws one unchanged atlas at the actual Shore
sizes/rotations: first versus subsequent runs change63,088 channel values, max255,
alpha max29. Varying sizes alone suffices (55,353 changes, alpha max24). Constant
size, angles-only and cells-only runs are exact. URL images, blob HTML images and
default ImageBitmaps each reproduce the same63,088 changes. A bitmap clone does
not reset this history. Fixed-size crop tests are exact across all three kinds.
This implicates native multi-size sampling, not the loader or material-mask cache;
the browser mechanism remains unproven.

CPU-backed foam-only destinations are exact across all three source kinds. However,
CPU-backed full Shore still reproduces the original51,684 change. Do not treat
willReadFrequently as a proven whole-scene fix or enable it in production without
full original/candidate parity and compose-cost evidence. No runtime source,
decode options, assets, visual gates or version changed in this checkpoint.
Diagnostic sources/results are under tmp/probes/scene-image-preload/ and
tmp/performance-scene-image-preload/isolation/. All probe handles are terminal.

Next isolate why mixed full Shore differs when its foam-only CPU sequence is
stable, and identify a sampling treatment that preserves original pixels. Validate
the treatment against cold/warm raw and native controls before restoring automatic
decoded-soon work. Then implement whole-budget admitted worker/local next slots,
exact promotion/invalidation and quiet pacing. Figure/startup ownership, whole-game
decoded/GPU bounds, 120Hz/CPU budgets and full Phase5 remain required. Full goal
active; no push/deploy/native build/player saves.

## Previous handoff — Admitted image preload API

Latest checkpoint 41: integrated 1.68.35 adds explicit decoded-image set admission,
shared future leases, cancellation and native main-owner forwarding. Known sets
must fit together with existing pins; required loads and busy/hidden/over-budget
policy cancel speculation without cancelling promoted or peer consumers. Late
cancelled resources close and cannot remove a replacement request. Environment
image enumeration matches active colour/data selections, excluding unused diffuse.
The API is not enabled in gameplay. Automatic worker/local integrations were
rejected and restored; no next-slot or transition-latency gain is claimed.

New native image API test visits all nine stages with a protected peer image:
peak 264,275,216 bytes within 256 MiB, 63 LRU evictions, zero new decodes when each
admitted set becomes required,one surviving peer pin and final bytes 0. All 470
units PASS 2.09 s; related 16 browser checks PASS 52.0 s, including original plane
lifetime/native rendering,256/512 MiB cycles,local input pressure,stale requests,
worker fallback/coalescing/hidden handling. Checked production build (strict
TypeScript) and all 4 bundle tests PASS 21.5 s, including offline resize.

Rejected preload integration compared 27 visits per path across portrait high/low
and landscape high. Local incoming raw planes/native output differ, including
Shore colour max 255 across 51,684 channel values; quantified native max 32. Separate
unchanged reload controls also vary in data maps (max 255) and native pixels (max 13),
so those cross-reload hashes alone are not a reliable attribution control. But
candidate adds colour differences not present in that control; do not accept it
or loosen gates. Worker diagnostic overwrite was fixed in the trial, then the
actual waiting preload run still failed repeated stage-zero low colour hashes.
All five tracked renderer integration files restored exactly; trial observer,
tests and source moved to ignored evidence. This resembles the earlier raw-input/
plane-retirement source-sampling history problem; root cause remains unproven.

Evidence: tmp/performance-scene-image-preload/ contains failed original/trial,
cold/warm controls, compressed raw pixel captures,quantified differences and
accepted native API/unit evidence. Probes: tmp/probes/scene-image-preload/.
Next establish a reliable original/candidate source-sampling control and resolve
repeat-visit colour changes before re-enabling quiet decoded-soon work. Then
reconcile transient compose/copy,current/next output and decoded LRU headroom for
worker/local slot admission and exact promotion/invalidation. Figure/startup
ownership,whole-game decoded/GPU bounds,120Hz/CPU budgets and full Phase 5 remain
required. Full goal active; no push/deploy/native build/player saves.

## Previous handoff — Worker cutouts retire before copy

Latest checkpoint 40: integrated 1.68.34 clears all worker stamp cutouts/scratch
before parallel bitmap copies; completed planes and raw image pins remain cached.
Main local owners retain their existing live fog/bamboo colour inputs/cutouts.
Saved-original native comparison across 27 visits is exact, including replay;
copy-entry diagnostics show zero candidate cutout pixels versus up to 33,849,316
nominal bytes in the small original fixture. Full-size 30-scene probe matches all
348 compared original raw plane hashes across nine stages and three geometries.
This reduces copy-phase overlap; whole-game memory/compose peaks remain unresolved.

Destructive plane retirement trial was rejected. Native small-frame/cleanup tests
passed, but repeated-key full-size rebuild changes Shore colour by up to 255 and
low-quality stage-zero colour by 21. Held bitmaps and data maps stay exact. Restored
all five tracked trial files, moved new trial test to ignored evidence, and verified
27 unchanged-key restored copies exact (21.2s). Rebuild colour history remains
unresolved. Do not reapply plane retirement without passing that stronger guard.

Accepted verification: strict TypeScript, all 466 units (1.94s), 21 related browser
checks (1.1m), checked production build and four bundle tests (21.6s), including
offline resize. New permanent test covers retained dimensions, no unchanged-key
rebuild, exact repeated/held planes and original pinned images through all stages
with portrait high/low and landscape high geometry. Visual tolerances are unchanged.

Evidence under tmp/performance-worker-plane-transfer/; probes under
tmp/probes/worker-plane-transfer/ and tmp/probes/next-scene-admission/.
Next reconcile transient build/copy and current/next output accounting with shared
admission/LRU headroom, then integrate quiet soon requests and exact slot promotion/
invalidation. Parallel copies can still exceed the low-memory total with pinned
images/outputs. Figure/startup ownership, whole-game decoded/GPU bounds, 120 Hz/CPU
budgets and full Phase 5 remain required. Full goal active;
no push/deploy/native build/player saves. Earlier rejected ownership trials remain
rejected; no latency or frame-budget completion is claimed.
## Previous handoff — Completed compose cutout release

Latest checkpoint 39: integrated 1.68.33 clears baked map cutouts/scratch and
non-live colour cutouts after composition. Completed planes and source bindings
remain valid; fog/bamboo retain live inputs. Worker clears after bitmap copies
settle, retaining its original raw wrappers/pins and decoder interpretation.
Baseline/candidate overlap probes each compose 30 scenes per renderer path across
all nine stages, stable portrait high/low and landscape high geometry. All 348
compared plane hashes per backend match exactly; held current planes are unchanged.
Measured retained cutout savings reach 44,968,120 bytes worker / 54,677,600 local.
These are settled nominal pixel savings; transient build/copy peaks and whole-game
memory remain unresolved. Local input/output overlap alone can exceed 256 MiB.
No next slot has been admitted or integrated.

Strict TypeScript and all 466 units pass. Related 11 browser checks pass in 34.0s;
warming/context restoration/loading readiness 11 pass in 38.8s. Checked production
build and all four bundle tests pass in 21.3s, including offline resize. Existing
native visual tolerances and determinism checks are retained. Probe round trips
remain roughly unchanged and include decoding; no statistically proven latency
improvement or frame-budget completion is claimed.

Evidence under tmp/performance-next-scene-admission/; probes under
tmp/probes/next-scene-admission/. Next reconcile transient compose/transfer
allocations and current/next output ownership with shared admission, then implement
quiet soon requests and exact worker/local slot promotion/invalidation. Selected
figure/startup ownership, whole-game memory, 120 Hz/CPU budgets and full Phase 5
remain required. Full goal active; no push/deploy/native build/player saves.
Earlier rejected ownership trials remain rejected.
## Previous handoff — Exact upcoming scene identities

Latest checkpoint38: integrated1.68.32 publishes the exact upcoming composition
identity from live stageVisits.peek and geometry/quality ports. Immutable cached
identity changes only with stage/seed/size/DPR/quality; diagnostics write only on
reference changes. Normal/daily next three-wave visit and rush next duel preserve
seed sequence; fixed trials, unknown cinematic choices and inactive/mismatched
runs skip prediction. No visit/RNG mutation, decode, composition or slot promotion.
All466unitsPASS1876.3ms; related27browsersPASS1.9m; checked production build and
all4bundle testsPASS20.9s, including offline resize. Live normal/daily seeds match
later entries; settled RNG/ledger/current seed unchanged. Initial live test RNG
sampling preceded legitimate encounter continuation; corrected settlement sampling,
assertion retained, failed evidence preserved. Evidence under
tmp/performance-next-scene-identity/; architecture/progress/version/changelog updated.
Next decoded-soon work and worker/local next slots require shared budget admission,
exact promotion/invalidation and visual parity. Enemy/startup ownership, whole-game
memory,120Hz/CPU budgets and final Phase5 remain required. Full goal active;
no push/deploy/native build/player saves. Earlier rejected ownership trials below
remain rejected; no performance latency claim or repeated benchmark for this port.

## Previous handoff — Preview admission guard rejected integration

Latest checkpoint37: shared enemy/runtime gate trial rejected and reverted exactly
to1.68.31. Strict TypeScript/all467unitsPASS; saved-original native27visitsPASS18.9s
within max1; startup/ordering/cancellation/continuation14browsersPASS47.0s. Actual
256MiB fallback runtime54visits with empty/crow selectionsPASS39.3s: peaks
268,183,176/268,245,408bytes, all scene/enemy maps ready; UI exports explain pending
shared queues. But visible Armoury preview draws8enemy parts before a held scene
load and0during it: previews share runtime artwork, so scene-wide suspension hides
another consumer. Rejected despite passing other checks. Restored preview guard
PASS6.6s/all8parts. Seven tracked files restored, four trial tests moved to ignored
evidence; no implementation/version change. Full patch/sources/tests/logs under
tmp/performance-enemy-admission/; probe under tmp/probes/enemy-admission/.
Next distinguish visible preview requirements from hidden runtime figures and
coordinate incoming admission without hiding either or raising/splitting budgets.
Settled ownership proof remains checkpoint36; indiscriminate gating is unsafe.
All handles terminal; full goal active, no push/deploy/native build/player saves.

Previous checkpoint36: test-only ordered shared enemy admission/native parity PASS.
Original/shared54visits total41.7s; shared12maps75,489,120bytes with two owners,
accounted peak264,280,976 below256MiB; all14appearance/peer/after-peer-disposal
native comparisons exact. Persistent owners release/reacquire around27high/low/high
stage visitsPASS18.6s, preserving bounded colour/tone caches; peer after one release
stays ready/pinned, final loader0/no GL warnings. Incoming stage1→0 while enemies
remain pinned deliberately reproduces admission failure (original succeeds outside
pool),2fixturesPASS4.9s. Integrating unconditional sharing remains unsafe. Existing
loading presentation suppresses combat figures; integrate explicit lease release
before composition/reacquisition before readiness, including startup's parallel
prepare and eager shared preview calls, stale requests and pending disposal.
Production unchanged1.68.31/source-test diff empty. Evidence under
tmp/performance-enemy-admission/ and tmp/probes/enemy-admission/. All handles
terminal. Player/outfit/sword/startup ownership, next slots,120Hz/CPU budgets and
full Phase5 remain required. Goal active; no push/deploy/native build/saves.

Previous checkpoint35: worker compose-input release rejected and reverted exactly
to1.68.31; main-thread local release from checkpoint34 remains integrated.
Baseline54visits/256and512MiB PASS; candidate72cases meet loader bounds/zero pins
but one revisited stage0low colour plane changes. Two unchanged worker controls
match exactly; candidate max24 exceeds max1. Final warm bitmap/unpin trial also
changes second-cycle stage7low colour by255. Preserving raw wrapper/bitmap identity
does not resolve the regression; cause unresolved. Restored36case comparisonPASS21.8s,
all planes exact. Evidence under tmp/performance-worker-input-release/ and
tmp/probes/worker-input-release/. No implementation/version change; all handles
terminal. Continue selected figure ownership/incoming admission with native parity
and coordinated headroom. Worker release needs a separate proven fix. Full goal
remains active; next slots,120Hz/CPU budgets and Phase5 remain required.

Active objective: [goal-objective.md](goal-objective.md). Work on develop.
Profiling is explicitly authorized. The old refactor is complete at 2d27986;
pre-refactor remains immutable. Do not resume packing or lit-only integration.
No performance-goal push/deployment/native build or player-save change occurred.

## Phase 0 checkpoint complete

[Measured baseline and checkpoint](docs/development/performance-goal-progress.md)
records every current metric, limitations, source-map checks and recovery.
All measurement processes are terminal:

- Original interrupted baseline: tmp/performance/2026-10-08T09-15-46.492Z-731996ff.
- Recovered full PASS: tmp/performance/2026-10-08T09-36-15.869Z-resumed-b605febf:
  105 timings, 21 diagnostics; exact saved build/identity, original untouched.
- Compose PASS: tmp/performance-compose-baseline/results.json: all 45 repetitions,
  nine stages, raw colour/material planes preserved. Stage 0 compose median678ms;
  others194–437ms at900x600 DPR1.
- Production scene probe PASS: tmp/performance-scene-baseline-v2/results.json:
  all18 cold/warm scenes,18 traces and fresh gameplay. First probe failed due to
  incorrect initial-title readiness wait; evidence preserved in the v1 folder,
  test-only wait corrected. Cold load314–894ms; warm359–875ms; tasks up to76.8ms.
- Full baseline combat intervalp95=19.3ms/renderp95=15.4ms at390x844 DPR2.
  runtime/frame-bindings.ts hard-caps every frame at60fps;120Hz needs a pacing
  change after baseline. Desktop profiling does not prove real120Hz/mobile.
- Maximum sampled heap319,292,568bytes; nominal main decoded928,462,528bytes.
  Stage worker nominal decoded151–283MB. These are estimates/samples, not resident
  GPU or continuous memory peaks. Main figure/UI residency must be budgeted.

Keep the current standard performance harness byte fingerprint unchanged for
Phase1 comparisons (including build-plugin formatting):
85311fdbddd17a504d77f5474a770d9af0087012c1e42ecad042462149244843.
Benchmarks are excluded from this fingerprint. Never overlap browser measurements.

## Verified Phase 0 implementation

Source maps, bounded scene marks, worker timings and weak decoded-image tracking
only; no hot-path behavior optimization yet. Local fallback records equivalent
asset/compose boundaries. Worker/runtime marks share scene keys; first gameplay
uses that key. Baseline texture marker says first-present submission and
prewarmed:false, not a GPU fence. Version/package lock/title/changelog1.68.1.

- npm run typecheck PASS.
- node --test --test-isolation=none tests/unit/scene-timing.test.mjs
  tests/unit/pages-deployment.test.mjs tests/unit/frame-loop.test.mjs
  tests/performance/*.test.mjs: all18 PASS. Isolation disabled solely to avoid
  the sandbox child-process restriction; browser tools require escalation.
- npx playwright test tests/browser/worker-environment.spec.ts
  tests/browser/scene-readiness.spec.ts tests/browser/scene-continuation.spec.ts
  --config playwright.rendering-v2.config.ts: all8 PASS22.8s.
- npm run build:develop -- --outDir tmp/.verification-build-performance-pages:
  strict/build PASS; emitted main/worker/painter maps resolve src modules.
- ISSEN_PREVIEW_DIR=tmp/.verification-build-performance-pages npx playwright test
  --config playwright.pages.config.ts:1 PASS6.8s.
- Pages assembly units verify maps are retained. Live publication deferred until
  final authorized push; do not claim already deployed.

## Next

Phase0 commits bc43526 and1aa563d are complete. Phase1.1 is now verified:

- Change-only setters, attachment flags and previously prepared-slot detach.
- Routine geometryPass detach removed; replacement of the borrowed guide and
  light-target writes still detach. Resize/context restore/feedback checks PASS.
- Pixi already checks identity. Actual shared light-source fan-out required one
  painter-owned BindGroup borrowed by materials, grass and leaves. Standalone
  factories own their group; atlas/uniform groups retain individual ownership.
- Strict,2unit checks,35native rendering browsers and7ownership/instancing
  browsers PASS. Checked production verification build PASS.
- Version/package lock/title/changelog1.68.2.
- All15 timings and3diagnostics PASS in
  tmp/performance/2026-10-08T10-18-38.055Z-a5186c2e (captured before metadata bump).
  Pooled render median combat6.1→2.8ms,Demon29.4→7.1ms,Inferno45.9→10.1ms.
  After renderp95=4.0/11.0/17.9ms;120Hz target is NOT reached. Cap remains60fps.
  Remaining listener self-time requires further investigation; current light
  source listener count is independent of pool size. No decoded budget yet.
- Initial smaller candidate: tmp/performance/2026-10-08T10-08-08.648Z-9b4b1032.
  Both candidates and weighted CPU self-time comparison are recorded in notes.
- Measurement session52285 and browser sessions are terminal; do not restart them.

Continue:
1. Phase1.2–1.4 are implemented at1.68.3: cached live presentation/rule/host/frame
   views with getters; change-only trial DOM owner with lifecycle reset; CPU
   readback flags on enemy/player/sword canvases. Strict,19units,22live-view/native
   browsers,14trial/artwork browsers and2enhanced enemy readback browsers PASS;
   checked production build PASS. Current evidence is recorded in progress notes.
   Browser session76210 and all check processes are terminal. The new live-view
   browser proves12readers keep identity with zero descriptor rebuilds over100reads,
   including equipment/layout/seal/clocks/scenery replacements and cinematic open.
   High-refresh pacing at1.68.4 is implemented and verified:120Hz gameplay render
   submissions, independent unchanged60Hz simulation, prepared-frame replay on
   extra draws. Poses remain60Hz without interpolation. Menus/cinematic retain60Hz.
   Eleven focused units and five corrected browser cases PASS; checked build PASS.
   Cap-transition regression found/fixed; preliminary44timings/8diagnostics in
   tmp/performance/2026-10-08T10-57-17.984Z-68f8042d are excluded. Runner stopped;
   do not resume its earlier build despite preserved running metadata.
2. Focused strict/unit/browser checks, then measured Phase1 comparison against
   frozen baselines. Record findings and commit before Phase2 compose.
   Pacing commit c625ce8 and architecture follow-up b82c05c are complete.
   Fresh FULL comparison PASS: terminal exec session56608, log
   tmp/performance-phase1-corrected-measured.log, results
   tmp/performance/2026-10-08T11-13-56.661Z-6cf5fb13:105timings/21diagnostics,
   no errors, clean c625ce8, version1.68.4 and unchanged harness fingerprint.
   Derived frame-budgets.json uses120cap; listener-profile.json compares Phase0.
   Combat renderp9515.4→3.4ms, Demon39.7→9.7ms, Inferno81.4→18.2ms. Actual
   measurement callbacks remain60Hz; physical120Hz/mobile remains unproven.
   Remaining Demon/Inferno/stress CPU budget violations need further work.
   Compose tmp/performance-compose-phase1 PASS45repetitions,116planes byte-identical
   to Phase0, worker decoded unchanged151–283MB; stage0median574ms remains>500.
   Production tmp/performance-scene-phase1 PASS18cold/warm traces plus gameplay.
   Loading286–809ms;7captures retain tasks>16ms (maximum59.1ms), atlas requests
   remain0–28per transition. Main decoded budget still absent; nominal878–928MB.
   Compose session23676 and scene session72683 are TERMINAL exit0. No live captures.
   Full Phase1measured checkpoint is recorded in progress notes at1dc25ce.
   Phase2worker binding/parallel transfer step is verified at1.68.5:4new units,
   6browsers and checked production build PASS. Compose evidence
   tmp/performance-compose-phase2-transfer PASS45repetitions/116byte-identical
   baseline planes; session78210 TERMINAL exit0. Transfer medians are mixed;
   no uniform speedup claim. Stage0compose median587.2ms remains>500.
   Phase2cutouts are verified at1.68.6:4Mpixel/16MB per-document LRU with direct
   software baking, recycled evicted canvases and oversized reusable scratch.
   Two-degree normal rotation preserves reflection/shear/anisotropy. GPU scratch
   was reverted because raw map/mask alpha differed by76–104levels; retain CPU
   rasterization even on maps without readback. Intermediate copy/sharing/second-
   use admission experiments were rejected; reasons and evidence are recorded.
   tmp/performance-compose-phase2-direct-cache PASS45/116planes: colour/surface/
   emissive and all alpha exact, opaque normal RGBmax1. Native lit fixturemax2.
   Stage0compose median643.8ms vs678.2original/703.2contemporaneous control;
   other stage medians279–477ms. Results mixed, no uniform speedup claim.
   tmp/performance-compose-phase2-direct-cache-profile PASS6: remaining native
   software→GPU transfers dominate draw wall time; mostly unique stamp keys
   limit cache reuse. Cache maximum3,964,896pixels stays bounded. Shared decoded
   image budget remains absent. Seven units,13focused browsers and checked build
   PASS. Quantisation checkpoint is recorded before Phase3.
   All measurement/check processes are terminal:94785direct cache,78378software
   copy trial,86236contemporary control,16116and81757browsers. Failed first control
   27088was stopped (old snapshot diagnostics incompatible); use only corrected
   v2control. No active captures. Current version/package/lock/title/changelog1.68.6.
   High-refresh submissions alone do not prove smooth120Hz visual motion; prepared
   poses remain60Hz. Address that fidelity/per-frame waste concern while retaining
   run determinism before final completion, alongside remaining CPU budget costs.
3. Phase3.1verified at1.68.7: generated scripts/assets/runtime-inventory.json and
   generator record361source/catalog/startup-glob assets, dimensions/bytes,
   consumers and stage mappings. Shared environment/asset-sources.ts retains
   original selections. Generic material and UI owners now request colour:false,
   skipping unused diffuse maps; explicit player/enemy diffuse colour unchanged.
   Duplicate checkpoint records80material-only diffuse families (341MB nominal
   across entire set); stage kits fall151–283MB→113–214MB. Generated files remain
   inputs to conversion validation; no extra encoded-size/deletion gain claimed.
   tmp/performance-compose-phase3-material-only PASS45/116planes byte-identical
   toPhase2, stage0compose median630.2ms still>500. Six units,12focused browsers,
   plus3request/compact validation checks and checked build PASS. Inventory flags
   startup-only vectors for removal from the new runtime loader/prefetch manifest.
   Phase3.2existing WebP checkpoint recorded:352hashes+browser comparisons PASS,
   exact alpha/all180data planes,324lossless WebP/11compactPNG/17lossyWebP. Do not
   repeat asset compaction or resume packing. Current version/lock/title/changelog1.68.7.
   All processes terminal:66010compose;89376/71874/11881browsers; build terminal.
   No live capture at that checkpoint. Next implement3.3compressed prefetch and3.4shared per-thread
   priority/pin/LRU decoded loader. Proposed256/384MB mobile,512MB desktop defaults
   must be validated for current+next scenes plus figures/UI; not yet implemented.
   Phase4next-seed/scene slots, upload warming/cosmetic loading andPhase5full
   verification remain. Seed determinism risk is the only user-decision gate.

4. Shared loader core and worker integration verified at1.68.8. New
   platform/decoded-images.ts provides serial priorities, shared promises,
   priority bump, task yields, reference-counted pins, warm unpin, bounded LRU,
   pre-decode reservations from catalog dimensions and close-on-disposal/late
   failure handling. Worker wrappers share bitmap resources, release pins on
   clear, and expose decodedLoader snapshot diagnostics. Six new units+four
   worker units PASS; four existing worker browsers PASS; checked build PASS.
   Two actual worker retention cycles PASS (9stages×3,390x844 DPR2): desktop512MiB
   peak534,788,792bytes/76evictions; low-memory256MiB peak264,275,504/246evictions.
   Saved27samples each in tmp/test-results/rendering-v2/worker-decoded-budget-work-*/
   worker-budget-cycle.json. Browser navigator fixtures simulate device class;
   this does not prove physical phone performance or resident GPU memory.
   tmp/performance-compose-phase3-worker-loader PASS45/116byte-identical planes;
   stage0median715.2ms remains>500, others286–460ms. No speedup claim; preparation
   is excluded by this predecoded fixture and must be remeasured after prefetch.
   All handles15353/99259/58196/15995/96977terminal; no live capture.
   Version/package/lock/title/changelog1.68.8. Main figure/UI/startup image owners
   remain outside this loader; whole-app memory remains unbounded. Worker uses
   navigator device class only; runtime quality/density budget changes are pending.
   Next: main-thread managed image ownership (preserve independent previews and
   cached-material bindings), remove lifetime startup retention/startup-only
   sources, compressed prefetch, background policy wiring and quiet next-stage
   decode. Current worker decode interpretation is intentionally unchanged;
   any bitmap premultiplication/colour-space changes require raw-plane parity.

Goal remains active; final full suites, final traces, budgets, new loader/seed/
next-slot/loading-state tests, final report and any final push are outstanding.

5. Compressed prefetch verified at1.68.9: generated275-file runtime manifest
   excludes80unused diffuse maps and6startup-only vectors; existing startup glob
   filtered through it. Runtime source artwork lifetime retention remains.
   Base-path-scoped CacheStorage with HTTP fallback feeds worker decode unchanged.
   MainGame starts after loading overlay removal; at most2low-priority fetches,
   task yields, current/adjacent stage ordering then figures/UI/rest. Frame sampling
   grants settled quiet title/over/between/shrine/paused time under75%frame budget;
   combat/loading/panels/hidden/saveData/native gates pause new dispatch.
   Required worker reads remain available; root disposal aborts/removes observers.
   Strict,16focused units, changed-file formatting, checked production build PASS.
   Strong browser PASS4: all275files prefetch, fresh workers prepare all9stages
   with atlas network blocked; native/saveData storage untouched and dispatch
   policy pause/resume verified. Existing4worker and3scene-readiness cases PASS.
   tmp/performance-compose-phase3-prefetch PASS45/116byte-identical raw planes;
   stage0compose median651.7ms remains>500, others268–406ms. No speedup or startup
   no-regression claim; prepare/cache-write interval is excluded by this fixture.
   All processes terminal including98178compose; no active captures. Details/logs
   in progress notes. Version/package/lock/title/changelog1.68.9.
   Next: managed main decoded ownership, independent material/preview bindings,
   remove lifetime startup retention; wire quality/density budget and quiet decode.
   Then deterministic seed/next slots, paced GPU/variant warming and cosmetic
   loading; finish120Hz fidelity/CPU budget and full Phase5comparisons/suites/report.

6. Main native-image pool/local-map integration verified at1.68.10. Explicit
   per-Document shared leases use the serial priority/pin/LRU core, manifest-sized
   reservations, compressed-response native HTML decode and pool-owned URL cleanup.
   Local fallback PBR maps use it; stage changes release old pins, peer previews
   keep shared images, last owner disposes resources. Colour source bindings stay
   independent. Worker documents keep their existing wrappers/options.
   Strict,9units, formatting, checked build PASS;4worker fallback/all-nine/hidden/
   disposal cases and3main lease/pixel/budget browsers PASS. Native normal pixels
   exact against original image. Actual local prepares9stages×3at256MiB: nominal
   managed-map peak264,266,176bytes,134evictions, final17pinned maps; disposal0bytes.
   Saved27samples at tmp/test-results/rendering-v2/main-image-budget-local-fa-5fc56-in-the-low-memory-main-pool/main-map-budget-cycle.json.
   All handles terminal including76631; no live capture. Version/lock/title/
   changelog1.68.10. Main source/figure/UI/startup owners remain outside the pool;
   whole-app memory/GPU retirement remain unproven. Source identity binds cached
   material owners, so sharing colour requires explicit owner binding first.
   Next migrate those owners/lazy active selections, release startup retention,
   wire runtime quality/density/policy and validate combined low-memory pins.
   Then quiet next decode, deterministic seeds/next slots, paced GPU/variant
   warming/cosmetic loading,120Hz fidelity/CPU budgets and full Phase5verification.

7. Local colour sources share the map pool at1.68.11. Current sources/maps pin
   with manifest reservations; departed source leases unpin. Bindings are per
   image+owner; synchronous withBindings scopes restore nested ownership and
   disposal removes only its own bindings/layers. Strict,12units, formatting,
   checked build PASS;4worker and4main browsers PASS. Concurrent previews have
   exact colour/data planes and surviving layers rebuild after disposal; native
   colour/data decode matches original exactly. Main local9stages×3at256MiB:
   peak264,275,504bytes,245evictions,25current pins, disposal0bytes. Stable27samples:
   tmp/performance-main-source-budget/results.json. Compose
   tmp/performance-compose-phase3-main-sources PASS45/116byte-identical raw planes,
   stage0median709.7ms remains>500; others293–465ms. No speedup/startup claim.
   Processes90873/31945/86121and4516terminal; no active capture. Version/package/
   lock/title/changelog1.68.11. Figure/UI/startup, demon realm/live fog/Armoury room
   owners remain outside the pool. Next migrate lazy active selections, remove
   startup retention, wire runtime budget/policy and validate combined low-memory
   pins before Phase4and final checks. Whole-app memory/GPU retirement unproven.

8. UI input leases verified at1.68.12. Jobs retain metadata/CSS exports; one pack
   leases shared native colour/data inputs per export, then unpins and retires
   uploaded sources through the existing texture store. Initial bound-source
   warnings were fixed by detaching prepared shader bindings before destruction;
   no warning-bearing version committed. Background exports await quiet visible
   frames before decode and upload; explicit prepare/custom requests bypass the
   wait. Multi-subscriber frame policy coexists with prefetch; disposal wakes waits.
   Strict,14units, formatting, checked build PASS;6final UI/scene-readiness browsers
   PASS plus earlier native-material/prefetch checks. All31packs retain expected
   colour/alpha/slices/light changes/custom seal/restoration, with no cleanup warnings.
   Stage0's34pins +31UIpacks twice at256MiB: peak268,422,128bytes,142evictions;
   UI completion returns to34pins and0uploaded source textures, stage remains valid,
   last disposal0bytes. Stable tmp/performance-ui-stage-budget/results.json.
   Processes22280/46291/21974/52816terminal; no active capture. Version/package/
   lock/title/changelog1.68.12. Decoded UI inputs are bounded, while exported
   browser-owned DOM/CSS images and all remaining figure/startup/environment owners
   remain outside this estimate. Whole-app memory/GPU and startup speed unproven.
   Next migrate active figure/remaining sources, remove startup retention and wire
   runtime budget/policy; finish combined memory, Phase4and full Phase5requirements.

9. Startup ownership retired at1.68.13: successful mount/overlay removal disposes
   preloader and clears every retained src; failed startup preserves successes for
   retry, pending disposal remains safe. Startup's initial broad decode is still
   outside the budget and must be replaced during active figure/source migration.
   Existing startup browsers exposed a prior manifest filter bug: relative Vite
   glob URLs never matched absolute manifest URLs. Canonical document-base matching
   restores intended filtering/load/decode/retry gate. Initial2failures preserved;
   corrected6startup/scene browsers PASS34.3s,4units, formatting and checked build
   PASS. No test loosening; prior scene-readiness passes did not prove this gate.
   Logs tmp/performance-startup-retention-corrected-browser.log/build.log; sessions
   12724/72369terminal, no active captures. Version/package/lock/title/changelog1.68.13.
   Final startup measurements must use corrected filtering; no whole-app memory
   or speed claim yet. Continue active figure/remaining sources and narrow startup
   required assets, then combined budgets/Phase4/full Phase5verification.

10. Charm colour/data kit shares main-pool leases at1.68.14 (18,874,368bytes).
    Independent tint caches/pins survive peer disposal and late attachment is
    ignored. Strict,9units, checked build and4UI/material browsers PASS. Local
    stage0 +charm peer +31UIpacks twice at256MiB:37mandatory pins/232,826,480bytes,
    peak268,424,816bytes,145evictions, no extra UI pins/upload textures afterexport;
    peer ready, stage valid and last disposal0bytes. Stable evidence
    tmp/performance-charm-ui-stage-budget/results.json; session57939terminal,
    no active captures. Version/package/lock/title/changelog1.68.14. Other figure
    and environment sources remain outside the pool; initial broad startup decode
    still exceeds the intended eventual budget. Continue their active/lazy lease
    migration and narrow startup, then finish budgets/Phase4/full Phase5requirements.

11. Next-decode prerequisite at1.68.15: stageVisits.peek(stage, forceNewVisit)
    predicts the unchanged enter formula without mutating ledger/RNG. Repeated
    entries retain the current seed; forced visits predict visit+1. Four units PASS
    including full sequence identity across4initial seeds,3nine-stage cycles,
    repeat/forced entries and unrelated peeks. Strict/format/build PASS; no runtime
    use yet and no active captures. Checkpoint3decision gate is not triggered:
    no seed-sequence change. Mode-specific prediction/next slots remain pending.
    Version/package/lock/title/changelog1.68.15. Continue remaining main image
    ownership/active selections and narrow startup; use peek for quiet decode and
    normal/trial/daily/cinematic prediction, then complete Phase4/Phase5requirements.

12. Cosmetic loading dispatch verified at1.68.16: raw presentation elapsed time
    advances clock, ambient/transition motion, cosmetic weather particles, camera
    and apparel while all gameplay/run/trial/first-frame progression stays frozen.
    Temporary weather hazard-state/bank copies use cosmetic RNG; live hazard fields
    and run RNG remain unchanged. Reduced motion suppresses weather motion.
    Two new loading/weather units plus3weather units PASS; strict/format/build and
    4actual scene/continued-run browsers PASS32.9s. Session14400terminal, no captures.
    Logs tmp/performance-cosmetic-loading-browser.log/build.log. Version/package/
    lock/title/changelog1.68.16.150ms loading treatment/direct moving-pixel proof
    remain pending, alongside main ownership/active selections, mode prediction/
    next slots, paced upload/variants,120Hz fidelity and full Phase5requirements.

13. Delayed static ink veil at1.68.17 follows scene-state after150ms and cancels
    immediately after presentation; short/repeated loads and reduced-motion media
    are covered. Loading scheduling stays awake even when paused; hit-stop/slowT
    inputs are masked so frameDelta cannot spend combat timers. Actual held stage
    requests show303,422changed pixels over0.8167s active and304,235over0.8333s
    paused, with identical G/player/hazard/run-RNG/hit-stop state. Seven focused
    scene/continued-run browsers PASS1.0m,13loading/weather/frame units PASS;
    strict/format/checked production build PASS. Mobile veil screenshot reviewed.
    Stable captures/JSON: tmp/performance-loading-veil; logs same prefix with
    -browser.log/-build.log. Session72306terminal, no captures active. Version/
    package/lock/title/changelog1.68.17. This proves the selected held-load flow,
    not all cold/warm scenes or seamless promotion. Remaining main image ownership/
    active selections/startup budget, mode prediction/next slots, paced uploads/
    variants,120Hz fidelity/CPU budget and full Phase5requirements remain required.

14. Main shared-pool scheduling at1.68.18 now pauses soon/idle until visible quiet
    frames use<=75%budget. Required requests bypass pacing; visibility restoration
    requires a fresh quiet grant. One subscription per pool, change-only policy
    updates and final-owner cleanup avoid recurring queue scans/listener leaks.
    New browser proves priority bump/peer cancellation, busy/expensive/hidden gates,
    required hidden loads, visibility restoration and fresh-pool idle state.
    Eight native-pool/UI/27stage-cycle browsers PASS12.9s,6loader units PASS;
    strict/format/checked production build PASS. Logs:
    tmp/performance-main-queue-policy-browser.log/-build.log. Session75826terminal.
    Version/package/lock/title/changelog1.68.18. No automatic next-image requests
    yet. Companion inspection found both eager colour/data kits37,735,212bytes:
    stage0+charms+both=270,561,692bytes, exceeding256MiB by2,126,236bytes. Do not
    migrate both as permanent pins; implement active selection and startup/preview
    readiness together. Companion code unchanged this step. Whole-memory budgets,
    remaining main ownership/startup, mode prediction/next slots, paced uploads/
    variants,120Hz fidelity/CPU budget and full Phase5requirements remain required.

15. Pinned decoded-byte diagnostics at1.68.19 count each resident pinned URL once,
    regardless of lease reference count. Six loader units,9main-pool/worker browsers
    PASS17.3s; strict/format/checked production build PASS. Logs:
    tmp/performance-pinned-bytes-browser.log/-build.log; session79229terminal.
    Local stage0 retains213,952,112mandatory decoded bytes; stage4 retains132,140,400.
    Attempted post-compose input retirement failed the unchanged-pixel guardrail
    and is fully reverted. Even the unchanged renderer compared with itself under
    decode pressure differs at stages7/8: normal/surface alpha max28, opaque RGB
    max21, live-view max3. Stages0–6 are exact in both tested variants. Peak pool
    bytes264,282,368 remain below256MiB; no shader/feedback warnings. These are
    unresolved cache/raster reload differences, not a confirmed causal diagnosis.
    Stable evidence tmp/performance-local-input-release/unchanged-control.json;
    rejected patch and reproducible probes tmp/probes/local-input-release/README.md.
    No input-retirement optimization is accepted. Version/package/lock/title/
    changelog1.68.19. Next isolate pressure/rebuild pixel stability before retiring
    inputs; then companion active selection/startup/preview readiness together.
    Whole-memory budgets, remaining owners/startup, prediction/next slots, uploads/
    variants,120Hz fidelity/CPU budget and full Phase5requirements remain required.

16. Pressure pixel isolation keeps1.68.19 unchanged: software/no-cutout-cache
    controls still differ.53full-size source/map hashes and53direct fractional
    downsample hashes match across eviction; direct sampling with three suspect
    maps continuously pinned also matches.17isolated kits x6rotation/flip variants
    match. Four focused probes PASS10.7s/8.7s/7.1s/6.7s. Full-composition tracing
    locates first stage7 mismatch immediately after native mountain-map drawImage,
    before normal correction/masking: source hash, crop, normal matrix, target
    dimensions and colour mask match. Stage8first low/high differences are pine/
    temple posts. Cause remains unknown; full composition history is required by
    the current reproducer. Do not infer a cache-key/driver bug or accept input
    retirement. Next capture Canvas attributes/draw state and reduce source
    sampling history at that first divergent native draw. Stable JSON
    tmp/performance-local-input-release/; runnable probe index
    tmp/probes/local-input-release/README.md. All investigation processes terminal,
    no captures active. No new version/renderer change. Remaining whole-memory,
    source/startup, next-stage, upload,120Hz and Phase5work is unchanged.

17. Further pressure isolation: Canvas draw state/attributes match with no context
    loss; removing WebGL presentation still differs. A mountain-only crop/size
    history replay with pressure PASS24.2s. HTML-map bitmap snapshots make the
    bitmap-versus-bitmap repeat exact across18compositions (PASS39.9s), but original
    native-versus-bitmap parity FAILS from stage0 for HTML snapshots and both blob
    decode-option variants (large normal/surface/alpha changes, live max50).
    All bitmap/input-retirement implementations remain rejected; no tolerance
    change. Probe index tmp/probes/local-input-release/README.md and stable JSON
    tmp/performance-local-input-release/. All investigation sessions terminal.
    Native input sampling-history cause remains unresolved; continue independent
    required ownership/prediction/upload work without claiming this issue fixed.

18. Final composed-bitmap disposal at1.68.20 now immediately retires each GPU
    consumer's colour/data/crop textures. Matching composite/geometry/artwork/leaf
    bindings detach in all pooled slots before destruction; inactive slots were
    the source of warnings in the first attempt. Temporary disuse retains120-frame
    grace. Source ownership/close and baking stay unchanged; peer GPU stores remain
    independent. Eight retirement/loader units,36native rendering/worker/UI/restore/
    instancing browsers PASS1.7m; strict/format/checked production build PASS.
    Mobile-size390x844 DPR2 two-stage control counts12→12→24→24 versus current
    12→0→12→0 (draw/replacement/new draw/owner disposal). Live pixels are exact0;
    585x1266 planes give nominal old/new RGBA8 source bytes71,098,560→35,549,280
    after the second draw. These are source estimates, not resident GPU peaks.
    Stable tmp/performance-texture-retirement/counts.json; ignored reproducible
    control tmp/probes/texture-retirement/playwright.config.ts. Logs same prefix
    -focused/-corrected/-browser/-counts/-build. Session22380terminal; no captures.
    Version/package/lock/title/changelog1.68.20. Remaining main figure/source/
    startup budgets, native pressure stability, next-mode prediction/slots,
    paced uploads/variants,120Hz fidelity/CPU budget and full Phase5requirements
    remain required. GPU retirement for other source-owner lifecycles still needs
    coverage as they migrate; this is specifically final composed worker bitmaps.

19. Mode-aware next-stage rules at1.68.21: stage-progression.ts shares stage/lap
    formulas with actual wave/rush entry. Normal/daily predict the next three-wave
    visit, rush the next duel. Trials retain their scene; cinematic/inactive or
    mismatched stage state skips prediction. Actual frame samples pass the optional
    next stage to compressed prefetch; same-stage mode changes refresh priority.
    Allocation-free prediction does not enter/peek a visit or consume run RNG.
    Nineteen progression/entry/trial/seed units PASS;10prefetch/main-pool browsers
    PASS12.0s;7runtime/trial browsers PASS, and the expanded runtime sampling test
    PASS9.0s (normal/daily1, trialnone). Checked production build/typecheck PASS.
    Trial checks emit destroyed-source/sampler binding warnings; origin has not
    been isolated, so broader GPU-lifetime verification remains required. Logs
    tmp/performance-next-stage-prefetch-browser.log, -prediction-unit.log,
    -runtime-browser.log, -runtime-sampling.log, -build.log (same next-stage prefix
    except prefetch). All sessions terminal. Version/package/lock/title/changelog
    1.68.21. Compressed fetch ordering is now mode-aware; next-slot composition,
    decoded warming, paced uploads, whole-memory/startup budgets, native pressure
    stability,120Hz fidelity/CPU budget and full Phase5verification remain required.

20. Cached source binding cleanup at1.68.22: warning traces locate120-frame source
    destruction in SceneTextureStore.collect. Pixi default mesh bindings and cached
    GraphicsContext texture batch groups outlive their submitted draws. Before
    destroying an owned GPU source, source-bindings.ts snapshots its source/style
    change observers, detaches only matching BindGroup resources with public
    setResource, and leaves unrelated observers/resources intact. Guarded private
    EventEmitter context inventory is Pixi8.22-specific. No per-frame scan added;
    existing texture destruction and120-frame grace stay unchanged.
    An initial batched isolated test missed the default mesh path; native unbatched
    and pattern controls now both FAIL with cleanup disabled (source/sampler
    warnings), and both PASS enabled with counts1→0→1→0 across draw/expiry/reuse/
    disposal. All-eight-encounters and seeded retry tests add warning assertions.
    Final29rendering/lighting/UI/worker/lifetime/context browsers PASS1.6m;4focused
    native/trial browsers PASS50.1s;4retirement/resource units PASS; strict/format/
    checked production build PASS. Earlier broad/recovery runs hit the unchanged
    5s startup wait in #prevC; isolated check PASS16.1s and final broad check passes
    without changing test waits. This is not evidence of cold-start optimization.
    Stable logs tmp/performance-source-bindings-control.log (expected2FAIL),
    -final.log, -browser.log, -build.log; tracing/rejected default-mesh-only attempts
    under tmp/performance-binding-warning* and tmp/performance-mesh-retirement*.
    Ignored probes tmp/probes/binding-warning/ and tmp/probes/mesh-retirement/.
    All processes terminal. Version/package/lock/title/changelog1.68.22. Remaining
    whole-memory/startup owners/budgets, native pressure stability, decoded warming/
    next slots, paced uploads/variants,120Hz fidelity/CPU budget and full Phase5
    verification remain required. Covered warnings are resolved; no whole-game
    source-lifetime or resident-GPU peak claim is made.

21. Upload pacing investigation on unchanged1.68.22: ignored worker response hook
    initializes composed colour/emissive and data normal/surface through the same
    painter texture store, in rAF batches targeting4ms. Separate fresh-worker
    comparison differs atstage5(max33); cannot use it as parity proof. Sharing
    identical composed bitmaps between two painters gives exact pixels across9
    stages (fresh-painter PASS21.4s, corrected persistent-painter PASS13.7s).
    Persistent-painter first-draw baseline→paced ms bystage0–8:
    115.3→56.3,12.3→1.2,18.3→1.4,57.1→12.6,30.4→3.6,10.8→1.2,
    12.7→0.6,21.6→6.0,19.5→0.5. Static composed uploads leave first draw, but
    stage0 still uploads4live-fog1774x887 planes. CPU profile samples45.5ms in
    texImage2D atstage0; stage3 fresh-painter profile samples9.9ms in program
    parameter checks. Persistent stage1–8 draws fall below16ms in this sample.
    This is one diagnostic sample, not framep95/cold-load/resident-memory proof.
    Corrected warm wall durations10.5–35.9ms (incl rAF); batches4.8–8.7ms. Another
    run has a single22.6ms upload: a4ms batch target cannot split native uploads.
    Next integrate cancellation/hidden/context-restore-safe warming before worker
    publication/settlement, preserving old layers; include live fog, then shader/
    variant warming and next-slot/local ownership. Do not just add waits to cold
    loading or claim near-instant transitions. Initial persistent probe retained
    nested instrumentation wrappers; corrected probe restores texImage2D eachrun,
    original evidence preserved separately. Stable tmp/performance-scene-upload/
    and runnable index tmp/probes/scene-upload/README.md. All processes terminal.
    No production code, tests, version, assets or standard harness changed this
    checkpoint. Whole-memory/startup/local budgets, native pressure stability,
    next slots, uploads/variants,120Hz and full Phase5requirements remain required.

22. Worker source warming at1.68.23: main services pass the existing painter upload
    port. Incoming composed planes and live stage0fog initialize before replacing
    displayed layers/settling; colour/data interpretation is unchanged.4ms paced
    visible rAF batches cannot interrupt a native upload. Pending sources survive
    ordinary collection, stale/disposed waits abort, rejected bitmaps retire GPU
    consumers, restored context generations restart uploads. Local/demon paths
    retain existing readiness; no alternate cache or incoming display flush.
    Native same-input all9stage pixels exact/first-draw scenery uploads zero;
    real restore plus125collection frames succeeds, stale partial cleanup returns
    GPU count to displayed stage, failed warming settles local fallback, and
    hidden painter disposal cancels uploads. Held runtime loading preserves run/
    hazard/RNG and keeps prewarmed marks before settlement. Initial same-event
    context-restore fixture times out; next-task restore passes.
    Mobile integrated firstdraw stage0–8:61.3,2.5,0.9,66.2,2.9,12.4,0.8,8.5,1.6ms;
    warm wall20.5–125.3ms; upload max17.1ms. Control draws after warmed painter:
    cache/driver order confounds timings, not cold-load/near-zero transition proof.
    Profiles sample getProgramParameter56.7ms(stage0)/22.3ms(stage3); direct
    profiled draws61.6/53.7ms. Shader/figure/next-scene warming still required.
    Evidence tmp/performance-scene-upload/integrated-results.json and integrated
    profiles; probes tmp/probes/scene-upload. Full unit459PASS after updating old
    charm fixture with document events; checked production verification build
    PASS. Runtime worker/retirement/high-refresh13PASS and lifecycle/readiness7PASS.
    Wider scene/context13cases:10PASS/3startup5sdeadline failures before tested
    behavior, isolated3PASS34.7s without timeout changes. Broader native41cases:
    39PASS/2same5sstartup failures; default2worker focused retry also fails and
    both reproduce with only warming port disabled in ignored control probes.
    Isolated2PASS18.1s with warming enabled/timeouts unchanged. Startup parallel
    deadline remains unresolved, not an upload-specific failure. All sessions
    terminal; formatting/diff checksPASS. Version/package/lock/title/changelog1.68.23.
    Frozen standard harness/assets unchanged. Whole memory/startup/local budgets,
    native pressure stability, deterministic next slots, shader/figure warming,
    120Hz fidelity/CPU budget and all Phase5criteria remain required.

23. Ordinary scenery shader warming at1.68.24: paced Pixi shader.bind(skipSync)
    prepares geometry/composite, vector/artwork, light, shared batch and final
    back-buffer copy programs without drawing/target changes/resource sync. A
    guarded Pixi8.22 _bigTriangleShader borrow covers cold surfaces. Shader-ready
    generation skips repeated waits after first warm. Main port now warmScene:
    retain sources across both steps and repeat both after a context generation
    change. Native test forces loss during shader wait after sources warmed,
    drives125collection frames, restores and asserts pixels/no uploads/no links.
    All9same-input pixels exact/first-draw scenery uploads and program creations0;
    focused lifecycle/held-loading7PASS22.0s. Initial fixture wrong artwork handle
    selected local fallback: rejected data preserved, corrected probes require
    worker ownership. Five-program prototype stage3 stillcompilesbatch25.8ms;
    addingbatch fixeslink. Coldsurface catchesfinalcopy46.7ms; adapter fixeslink.
    Final mobile cold-surface firstdraw stage0–8:6.9,3.9,2.7,20.6,14.9,0.6,1.0,
    19.8,0.7ms. Initial warm335.8ms/later23.3–60.9ms; sourcecounts16/stage4=24.
    Native initial shadercall69.6ms stillstallsloading: not no-freeze/cold-load or
    p95proof. Profilesstage0/3draw8.4/45.6ms, zero programcreation; stage3GC8.1ms,
    graphicspreparation5.9/addPath3.6/batching3.2/nativeactiveTexture3.9ms. Remaining
    geometry/uniform/figure warming and nextslotsneeded. Evidence stable
    tmp/performance-scene-upload/shader-final-results.json and finalprofiles;
    probeindex tmp/probes/scene-upload/README.md. Full unit459PASS/checkedbuildPASS,
    version/package/lock/title/changelog1.68.24; frozen harness/assets unchanged.
    Broader native39cases34PASS/4startup5sdeadline failures/1replaypixelmax3(limit2).
    No tolerances/timeouts changed. Isolated5PASS58.6s; shader-disabled replay
    control3PASS18.3s; enabled replay/all-stage warm repeat18PASS34.9s(default2
    workers). One max3 replay remains unexplained; not clean fullsuite proof.
    All sessions terminal; formatting/diff checksPASS. Goal remains full:
    wholefigure/startup/localbudgets, nativepressure
    stability, deterministic nextslots/decode, cold smoothness, complete warming,
    120Hz fidelity/CPUbudget and Phase5allmetrics/traces/suites. Next address broad
    startup/selected figure ownership and remaining first-use scene preparation;
    prediction/nextslots still must be wired, not replaced with loading-only waits.

24. Main-image GPU retirement at1.68.25: companion/startup audit exposed pool
    eviction/final-disposal clearing pixels without notifying native consumers.
    Original-code controls fail with GPU counts1/1 after final disposal and2/1
    colour/data/crop counts after LRU eviction. Existing retirement notification
    now precedes image clearing/blob revoke; unpin retains warm pixels and peer
    disposal preserves the shared source. Native after counts0/0, exact peer
    pixels, uploaded LRU source1→0, callbacks once before width256→0. Accounted
    pressure peak264,485,456bytes within256MiB; not resident/whole-game proof.
    Enhanced16browser casesPASS20.2s/default2workers;8focusedunitsPASS. Evidence
    tmp/performance-main-image-retirement/; all-stage local cycle remains bounded.
    Companion selection/startup integration remains unimplemented: route active
    kits plus explicit preview borrowing, avoid both-kit+stage0+charm mandatory
    pins exceeding256MiB. Complete figures/startup/local budgets, native pressure
    stability, deterministic nextslots/decode, cold smoothness, complete warming,
    120Hz fidelity/CPUbudget and all Phase5 metrics/traces/suites remain required.
    Final checks: all459unitsPASS; checked production verification build/typecheck
    PASS; assets and the frozen standard performance harness remain unchanged.

25. Selected companions at1.68.26: native before control6HTMLimages37,735,212bytes;
    after nopet0, parts18,870,192(crow/cat/shiba), rock18,865,020. Shared main pool
    leases and primary/preview union; live equipment/scarecrow rule reused after
    startup restoration. Companion colours excluded from broad startup preloader.
    Standalone explicit full catalogue retained. Dropped kits unpin; peer scopes
    survive, stale/released loads cannot publish. Panel close/selection changes
    release its3native companion textures. Late preview readiness repaints without
    ticking clock/effects; suspension/disposal cancels callbacks. Repeated same-kit
    selection causes no pin/loader churn. Combined charm/local scenery visits all9
    stages with none/parts/rock:27PASS, peak264,278,624bytes<256MiB,266evictions,
    disposal0bytes. Not whole-figure/startup/resident memory proof. Exact8native
    HTML pixel comparisons and actual context-restore pixels; hidden loads work.
    Real startup succeeds with unused companion requests blocked; Armoury/support
    borrows release correctly. Fixture initially blocked Vite asset modules;
    script allowance fixes that timeout. Four old pose units now fake source leases
    without relaxed assertions.27relatedbrowsersPASS33.9s/default2workers;
    all459unitsPASS/checkedbuild&typecheckPASS. Evidence stable
    tmp/performance-companion-selection/. Assets/frozen harness unchanged.
    Arbitrary both-kit+stage0+charm mandatory union can still exhaust256MiB; normal
    runtime previews share equipped pet. Address shared/local transient headroom
    and remaining enemy/player/outfit/sword/startup inputs next. Complete warming,
    native pressure, deterministic next slots/decode,120Hz fidelity/CPUbudget,
    cold/warm timing/traces and all Phase5 suites remain required; goal active.
    Final bundled checks3PASS23.8s(default2workers), format/diffPASS. All sessions
    terminal; no push/deploy/native build or real player-save mutation.

26. Diagnostic-only local sampling controls; no accepted implementation or version
    bump. Original scenery PNG material requests (60 files, from pre-refactor)
    versus current WebP fail stage0 onward: rawmax255/livemax6. PNG repeat under
    figure decode pressure reproduces the unchanged WebP control: stages0–6 exact,
    stage7 raw127/255/live2/3, stage8 raw255/26/live3/2. WebP is not the sole cause
    of repeat instability. Original-source full-size PNG/WebP parity not audited.
    Software canvas snapshots repeat exactly18compositions(PASS38.8s), but differ
    from original HTML inputs(raw255/live50/alpha162/opaqueRGB186); rejected.
    Snapshot canvases are outside loader accounting, so bounded loader counters
    do not prove total memory. Initial PNG route intercepted figure requests;
    corrected scenery-only route measured successfully. All diagnostic processes
    terminal; one worker intentionally isolates sampling; current production
    inputs/assets/ownership and frozen standard harness unchanged. Stable evidence
    tmp/performance-local-input-release/{png,canvas}-{equivalence,repeat}.json;
    probes and instructions under tmp/probes/local-input-release/. Native sampling
    cause unresolved. Continue remaining figure/startup ownership and transient
    local headroom; next-slot readiness,120Hz and full Phase5 remain required.

27. Enemy duplicate colour decoding removed at1.68.27. Unchanged baseline16native
    images100,652,160bytes; after12PBRplanes75,489,120bytes, saving25,163,040bytes.
    Plain counterparts were readiness-only/unreachable fallback after PBR success;
    retain files for material debugging and exclude eager startup. Native14case
    comparison max1 matches unchanged-control noise; no painting/frame/tone change.
    Stable before/after JSON in tmp/performance-enemy-dedup/; original/probe in
    tmp/probes/enemy-dedup/. New tests block all four plain colours, verify native
    count/bytes/final clearing and real runtime readiness. Related7browserPASS17s,
    default2workers;8affectedunitsPASS;checkedbuild/strictTypeScript/formatPASS.
    Initial6PASS/1FAIL was a stale startup retry fixture blocking now-optional
    companion art. Delay/disposal/retry fixtures now intercept required player
    artwork, allow scripts and verify a real blocked request; assertions retained.
    Direct PBR ownership remains outside shared loader; integrate selected enemy
    kits plus GPU retirement with preview scopes and remaining player/outfit/sword
    startup ownership. Local headroom/native sampling, next-slot readiness,
    120Hz/CPUbudget and full Phase5 metrics/traces/suites remain required.
    Final bundled app/ink3PASS24.5s(default2workers); all processes terminal.
    Version/package/lock/title/changelog synchronized; diff/format checks PASS.

28. Direct PBR retirement at1.68.28: before atlas closure native4/4 and auxiliary
    stores8/4 stay alive despite four cleared images; after native0/0/stores0/0,
    all12texture objects destroyed. Four observers see positive width before
    clearing. Leased atlases only unpin: peer/native4/4 survive with exact pixels;
    final unpin leaves warm textures, final owner disposal clears native0/0,
    all widths/loader bytes0. No decode/sampling/gameplay/seed changes. Three new
    lifecycle units and two native tests, including optional emissive/multiple
    consumers and pending disposal. Initial shared fixture requested an excluded
    unused diffuse; use valid authored runtime colour, preserve all assertions.
    Related17browserPASS19.9s/default2workers; final assertions2PASS3.4s;
    all462unitsPASS;checkedbuild/strictTypeScriptPASS. Evidence
    tmp/performance-pbr-retirement/{baseline,direct-after,shared-after}.json and
    units/build logs. Prepared figure cutout/tone retirement and selected
    enemy/player/outfit/sword/startup ownership still required, plus local headroom,
    native sampling, deterministic next slots,120Hz and all Phase5 measurements.
    Final bundled startup/gameplay/Armoury/offline3PASS24.1s/default2workers;
    diff/formatPASS; version/package/lock/title/changelog synchronized. All check
    sessions terminal; no push/deploy/native build or real player-save mutation.

29. Enemy prepared-cache GPU baseline/rejected experiment; production restored
    exactly at1.68.28. An80palette queued grid stays within CPU cache limits
    (95variants/31tones;5,944,064/1,940,224pixels) but retains242native textures;
    final enemy disposal leaves240prepared colour textures. Two unchanged owners
    match exactly. Immediate eviction/disposal retirement reaches0textures but
    changes pixels by253: queued stamps lose their pooled bindings before flush.
    Reverted; no tolerance relaxation or version bump. Evidence
    tmp/performance-enemy-cache-retirement/{baseline,rejected-immediate}.json;
    saved original/reproducer under tmp/probes/enemy-cache-retirement/. Both runs
    terminal, baselinePASS4.3s/experimentcaseFAIL1.7s. Next: bounded pending live-frame
    GPU ownership and retirement after consumers finish, covering repeated flush,
    cancellation/context loss and peers. Do not force extra render passes or use
    an unbounded deferred-close queue. Existing warming pins do not cover this.
    Full selected figure/startup/local ownership, native sampling, next slots,
    120Hz and Phase5 measurements remain required. No assets/harness/seed changes.
    Restored control rerunPASS3.7s, exact pixels; implementation diff empty.

30. Enemy cache retirement at1.68.29 preserves queued/repeated frames. Explicit
    eviction mode retains only current-frame GPU sources until that painter's next
    begin/context loss/disposal; older/standalone entries release immediately.
    Final cache disposal stays immediate. No timers/extra renders or CPU-budget/
    pixel/simulation/seed changes.80palette original/current comparison exact:
    native242, pending145sources36,271,104nominal bytes; next begin97sources and
    pending0; final owner disposal0.120later frames peak97 with no pending buildup.
    This is source accounting, not a whole-game GPU cap: the synthetic live frame
    temporarily exceeds the CPU cache's8million-pixel budget on the GPU. Add pending
    resources/other owners/targets/driver overhead to full memory verification.
    Native peer/repeated pixels exact; unflushed cancellation/context restore/
    disposal pass. Final22relatedbrowserPASS22.3s/default2workers, all463unitsPASS,
    checkedbuild/strictTypeScriptPASS. Initial fixtures missed fog fields and loss
    dispatch ordering; corrected. First broad failure was evidence-writer import;
    assertions unchanged. Evidence tmp/performance-enemy-cache-retirement/ includes
    before/rejected/frame-retirement/real-cache/peer JSON and units/build logs.
    Other figure caches/selected ownership/startup/local headroom/native sampling,
    next slots,120Hz and full Phase5 measurements remain required; goal active.
    Final bundled app/ink3PASS23.3s/default2workers; diff/formatPASS and synchronized
    package/lock/title/changelog. All check sessions terminal; no push/deployment,
    native build or real player-save mutation.

31. Player/outfit/weapon GPU lifetime at1.68.30: owned raw images, tone/tint canvases
    and weapon cutouts notify native consumers before final closure. Weapon LRU
    eviction preserves queued/repeated frames until the existing painter boundary.
    All20outfits and20weapons match saved original pixels exactly. Player native61
    closes to0 (original48remaining); weapon36 closes to0 (original32remaining).
    Diagnostic100tint aliases exercise80part LRU: queued106native includes22pending
    sources7,731,680nominal bytes; next begin84/pending0; final0 (original104).
    Original/current and repeated pixels exact. New peer/catalogue/warmed eviction
    tests pass; related16browserPASS20.8s/default2workers, final3newtestsPASS5.0s;
    all463unitsPASS; checkedbuild/strictTypeScriptPASS. Evidence and saved original
    probes under tmp/performance-figure-retirement/ and tmp/probes/figure-retirement/.
    This is resource lifetime, not a whole-game GPU/decoded budget. Selected figure
    ownership/startup/local headroom/native sampling, deterministic next slots,
    120Hz and full Phase5 measurements remain required. Goal active at full scope;
    no push/deployment/native build or real player-save mutation.
    Final bundled app/ink3PASS23.0s/default2workers; diff/formatPASS; synchronized
    package/lock/title/changelog. All check sessions terminal.

32. Shared enemy decode trial rejected; production remains1.68.30. Two direct
    owners decode24maps150,978,240bytes. Existing document-loader trial shares12maps
    75,489,120bytes, keeps peer ready and final closure0; native14case differences
    match unchanged control (max1 in firstcase,13zero). Baseline2PASS3.4s/trial2PASS
    3.6s. At deviceMemory2, local stage0 pins34inputs213,952,112bytes; full enemy
    catalogue requires289,441,232combinedbytes, exceeding256MiB by21,005,776bytes,
    before charms/companions/next scene. Only base/clothing become ready; original
    preparationPASS/trialFAIL. Reverted exactly; restored4probePASS5.6s/source diff
    empty. Evidence under tmp/performance-enemy-shared/ and saved original/probes
    under tmp/probes/enemy-shared/. Next combine selected figure families with local
    compose-input lifetime/headroom, respecting prior native sampling failures.
    Do not force all-family sharing or raise/split the budget. No implementation or
    version change; all measurement handles terminal. Goal remains active at full
    scope; no push/deploy/native build/player-save mutation.

33. Completed local input lifetime diagnosticPASS50.0s across9stages/two variants.
    Test-only post-compose release retains fog4inputs or bamboo3; real LRU pressure
    closes every other captured decoded image. All12enemy maps then admit below
    256MiB. After unchanged readback/upload warmup, all18raw/live/replay comparisons
    are exact; no GL warnings. First rawmax1/live0–1 failure was reproduced by the
    immediate unchanged control, not caused by eviction. Stage0 pins34/213,952,112
    bytes fall4/25,176,608; bamboo21/132,140,400 fall3/18,870,192; other stages0.
    Maximum accounted peak264,280,976bytes;39–55evictions/case; final loader0.
    Evidence under tmp/performance-local-live-release/; probe/config/route under
    tmp/probes/local-live-release/. Production unchanged1.68.30/source diff empty.
    Next implement output-preserving release/reacquisition for every composition
    key change. Prior native rebuild sampling remains unresolved. Fresh-owner cases
    do not prove consecutive stage/incoming pin admission or whole-game budgets.
    Do not enable concurrent all-family enemy/startup plus local compose. Selected
    figure ownership, incoming headroom, next slots,120Hz and Phase5 remain required.
    All measurement handles terminal; goal active, no push/deploy/native build/saves.

34. Local compose-input release at1.68.31. Main-thread output retains its own
    colour/data planes; only fog4inputs25,176,608bytes or bamboo3/18,870,192 remain
    pinned. Other stages0. Existing independent cutouts stay bounded. Same-key
    draw/compose reuses output; changed size/DPR/quality/seed/stage reacquires inputs.
    Source-binding release preserves completed/foreground maps; obsolete pending
    generation returnsfalse before wrong-stage publication. Worker decoder/art/
    gameplay/seeds/budgets unchanged. Integrated18eviction casesPASS49.2s/exact.
    Final3all-stage lifetime/key/coalescing testsPASS34.7s, including actual native
    restoration; raw/live/replay exact, restored high-DPR fog/bamboo max1 within
    the native tolerance, no GL warnings. Two-cycle36case
    full SHA256 plane/native outputs exactly match
    saved original actors, confirmed by explicit hash gate. Cross-owner absolute
    comparator fails in unchanged and trial (stage0high29/15,stage7low255/35);
    matching complete hashes proves preservation, not root-cause resolution.
    Related11PASS/1FAIL36.1s was stale all-input peer pin expectation; expected live
    fog4pins25,176,608bytes nowPASS3.5s/exact peer checks retained. CoalescingPASS3.4s;
    all463unitsPASS; checkedbuild/strictTypeScriptPASS; bundled app/ink3PASS23.4s.
    Evidence/provenance/probes under tmp/performance-local-release-integration/
    and tmp/probes/local-release-integration/. Incoming figure/live pin union still
    needs scheduling; selected figure/startup ownership, next slots,120Hz and
    Phase5 remain required. Goal active; no push/deploy/native build/player saves.
    Final diff/formatPASS; version/package/lock/title/changelog synchronized.
    All measurement and verification sessions terminal.
