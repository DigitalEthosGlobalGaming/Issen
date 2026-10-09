# Mobile performance continuation

The [active objective](../../goal-objective.md) supersedes the earlier exact-pixel
performance goal. Intentional rendering simplifications are allowed when the
game's feel and readability remain good. Worker scenery is required on supported
platforms; automatic local fallback is replaced with error/retry recovery.
Cancelled general packing and the separate lit-only integration remain cancelled.
The requested merged drift atlas is a narrowly scoped exception, not a restart
of general asset packing.

## Required transition headroom — 9 October 2026

Version1.69.27 compares required preparation/upload estimates against the combined
document budget after reclaiming unpinned images. Under pressure it retires the
outgoing normal/surface/emissive planes and their GPU sources while retaining
colour planes for animated loading presentation. Incoming scenery still prepares
all material planes and warms them before readiness. Retiring outgoing maps clears
its completed key, so cancellation/return recomposes the full original materials.
An already prepared promotion retains its admitted resources normally.

The same390x844/DPR2/deviceMemory2 stage0–8→0 sample now observes a maximum
494,093,948bytes (471MiB), versus540,926,164bytes (516MiB) before this change.
Settled samples419–471MiB; return-to-meadow preparation469MiB. The first experiment
retired only before upload and peaked536,694,428bytes, leaving insufficient
headroom; moving pressure retirement before composition addresses that overlap.
Evidence: `tmp/probes/all-stage-memory-{upload,preparation}-headroom.json`.
These are nominal observations for this viewport, not a physical or universal cap.
Preview/Demon/concurrent ownership and intermediate native scratch remain to audit.

Five focused pressure/promotion tests pass; the final two pressure cases pass7.1s
after early retirement. They use actual native rendering, verify outgoing colour
survives while maps close, and verify cancellation returns full material planes
through recomposition. No feedback-loop/destroyed-bound-source/invalid-operation
warnings occur. Source draw logic and gameplay seed handling remain unchanged.

## Compact low-memory worker inputs — 9 October 2026

Version1.69.26 decodes catalogue scenery colour and aligned material inputs at
half width/height on the256MiB decoded tier. It asks native bitmap decoding for
high-quality resizing without retaining a separate full-sized bitmap. Worker
images expose original logical dimensions; drawImage adapts source rectangles,
implicit destination sizes and pattern transforms to the smaller backing.
This preserves atlas layout, landmark validation and existing stage geometry.
Higher tiers keep the original decode interpretation. Required composition now
reclaims unpinned main images against the incoming estimate before loading fog
or sending work; next-slot reservations use the actual compact decode dimensions.

The same390x844/DPR2/deviceMemory2 all-stage diagnostic observes worker input
residency108–204MiB→27–51MiB (approximately75% lower). With compaction alone,
maximum observed committed memory654→522MiB; with required pre-compose cache
reclamation it reaches516MiB. The remaining peak is540,926,164bytes during
incoming texture warming, with current+incoming transferred planes57,674,880bytes.
All settled samples fit512MiB; a whole-app/transient cap remains unproven and
the observed return-to-meadow peak still exceeds it. Native decoder scratch is
opaque, and event/sampling observations cannot prove an absolute peak.

Evidence: `tmp/probes/all-stage-memory-compact{,-reclaimed}.json`.
Reviewed actual composited screenshots
`tmp/probes/compact-worker-visuals-stage-{0,4,6,7}.png`: meadow/bamboo/temple/coast
retain coherent ink detail, atmosphere and lighting. Direct canvas.toDataURL
captures were black because the drawing buffer is discarded; these are not
visual evidence. The usable captures use browser element screenshots.

Three decoded-tier all-stage lifetime checks and phase accounting pass. Ten
focused promotion/recovery/suspension/accounting checks pass22.6s. Unit checks
cover fractional crop coordinates, implicit/explicit destinations, decode sizes
and reservations. The strict software-vs-GPU copy matrix fails on colour-plane
hashes in later cycles at both2GiB and8GiB. Low-tier report inspection found only
stage0/7 colour differences; material-plane hashes match throughout that report.
Later focused browser checks overwrote those default-suite artifacts; observed
failure details are retained in `tmp/probes/compact-worker-copy-failures.md`.
High-tier decode is unchanged, but this does not establish a
baseline failure. Keep assertions intact and diagnose the mismatch at integration
checkpoint before final completion. No repeated full matrix ran.

## Worker preparation phase accounting — 9 October 2026

Version1.69.25 reports decoded-loader and tracked-canvas ownership at assets-ready
and after composition, before releasing inputs. The main owner adopts these
resource counters without resolving the compose request or scene readiness.
Failure responses also include current counters; final responses replace them
after export/reclamation. Phase observation does not allocate rendering resources.

A real-runtime diagnostic at390x844/DPR2/deviceMemory2 paused combat, visited
ordinary stages0–8 through `game.setStage`, then returned to0. All settled
estimates fit512MiB (412–478MiB in the first sample). Without worker phase
accounting the observed transition peak was516MiB; with phase accounting it
was654MiB. Incoming pinned worker kits contribute108–204MiB. Stage preparation
peaks observed at phase boundaries were556–654MiB; final residency430–478MiB.
These are nominal ownership estimates, not physical residency or a bound on
intermediate native scratch. Preparation times573–1234ms include loading,
composition, warming and first presentation, not compose CPU time alone.

Evidence: `tmp/probes/all-stage-memory-before.json` and
`tmp/probes/all-stage-memory-phases.json`. The extended existing admission probe
records50ms samples plus resource snapshots on worker response events. No full
measurement matrix or physical-device capture ran. Preview/Demon peaks remain
unmeasured. Next reduce required worker input pressure while preserving scene
layout and then enforce the combined transient budget; optional next admission
still does not establish a whole-app cap.

## Cache reclamation and low-memory drawing — 9 October 2026

Version1.69.24 limits the256MiB decode tier's main drawing buffer to roughly600k
pixels/DPR1.5. Logical viewport, input coordinates and gameplay seed ownership
stay unchanged. It reclaims unpinned main-image cache before scene work/readiness,
targeting32MiB free within the existing combined budget. Optional next preparation
also reclaims against its estimated reservation. Live/preview pins remain intact.
Fog closes after ordinary stage replacement or next-slot cancellation when no
current/requested/next identity needs stage0; return reloads normally.

Representative390x844/DPR2 low-memory first-game: drawing527x1140,
committed591,861,324→500,847,196bytes (478MiB,35MB below512MiB). Main decoded
142,777,176; tracked canvas43,594,168; GPU estimate175,299,164; worker canvases
and transferred planes28,837,440each; native/browser reserve81,501,808.
Without32MiB free-space targeting, the new buffer alone measured526,008,924;
final cache reclamation removes25MB more decoded bytes. These are nominal
ownership estimates, not physical residency/all-stage peak evidence. Reviewed
`tmp/probes/scene-low-memory-reclaimed.png`: atmosphere and text remain coherent.

Focused pressure/native-peer and fog0→1→0 cases pass: pins survive exact pixels,
evicted cache reloads, fog decoded0 while away and restored native pixels match.
Related browser12PASS20.4s/default2workers covers scene promotion/cancellation,
worker suspension, startup ownership, cinematic switching and responsive Armoury.
Added low-memory variant of the existing Armoury flow PASS7.0s. Focused units
18PASS; checked build/strict TypeScript PASS. Version metadata/changelog agree.
Evidence: `tmp/probes/scene-low-memory-reclaimed{,-headroom}.json`, gameplay PNG,
browser results and `tmp/probes/memory-reclamation-build.log`.

Remaining: combined mandatory/transient enforcement and all-stage peaks. Current
first-game fit does not prove incoming raw worker kits/copies fit alongside current
resources, or that preview ownership remains below the total limit. Final
integration/matrix/suites and physical Android/120Hz proof remain unfinished.
No push/deployment/native build/real-save changes; cancelled work stays cancelled.

## Low-memory enemy part preparation — 9 October 2026

Version1.69.23 replaces full enemy atlas residency on the256MiB decode-budget tier
with25aligned part frames, maximum edge256px. It uses the existing colour cutout
resolution for colour, normal and surface; existing tone/material drawing then
uses those owned planes. Preparation processes one family at a time and yields
between copies; raw images close after the family's parts are complete. Other
tiers use original atlases. No asset files, appearance rules or RNG changed.

Low-memory390x844/DPR2 first-game accounting before→compact sample:

| Component | Before bytes | Compact bytes |
| --- | ---: | ---: |
| Main decoded | 243,432,120 | 167,943,000 |
| Main canvases | 27,940,280 | 43,491,768 |
| GPU estimate | 259,071,932 | 219,235,868 |
| Committed including reserves | 691,635,020 | 591,861,324 |

Saving99,773,696bytes/14.4%; still55MB above512MiB. These are ownership estimates,
not physical device memory. The compact sample preceded final serial-family
scheduling; plane dimensions/content/lifetimes are unchanged. A failed first
diagnostic injection used `window` in a worker; corrected to `globalThis` and the
sample completed. No product fix was inferred from that harness timeout.

Native36appearance montages cover regular/boss palettes, fog, daylight/dark
directional light and mirroring. Visual review retains silhouettes/tints/material
lighting; average channel difference0.020/255 (intentional detail reduction,
not an exact-pixel gate). Raw decoded bytes after full-reference disposal0,
maximum compact plane256. Actual compact context restoration is exact. Hidden
disposal settlesfalse and releases inputs/canvases; final native sources0.
Ten unique related browser checks PASS9.9s; final compact/recovery2PASS4.4s.
Related units10PASS; checked build/strict TypeScript PASS. Evidence:
`tmp/probes/scene-low-memory-{baseline,compact-enemy}.json`,
`tmp/test-results/browser/compact-enemy-*/` (JSON/original/compact screenshots)
and `tmp/probes/compact-enemy-build.log`.

Next: reclaim unused main-image/fog/preview resources and enforce combined
mandatory budgets. Full all-stage/transition/final validation remains; physical
Android/120Hz targets unproven. General packing/lit-only work stays cancelled;
no push/deployment/native build/real-save changes.

## Ordinary worker suspension during Demon — 9 October 2026

Version1.69.22 terminates the ordinary scenery worker on Demon entry rather than
retaining its canvas backing indefinitely. It aborts warming/preparation, releases
current and next transferred planes plus main fog inputs/cutouts, and settles
pending callers without reporting a worker failure. Ordinary scenery restarts a
required worker on demand, using the requested unchanged seed. Hidden state and
background sampling cannot restart the suspended owner. Generation guards also
prevent old background completion from changing a restarted owner's state.

Native160x100 stage0 with a warmed next scene: worker canvas768,000bytes,
transferred1,536,000bytes and main decoded fog25,176,608bytes all become0 on
suspension; artwork GPU sources/reservations0. Worker instances1→2 on return,
both terminated by final disposal. Re-entry pixels match exactly and the next
scene can prepare again. Pending requests settlefalse without failure listeners.
These are ownership estimates, not physical driver residency measurements.

Two new cases PASS5.8s;16related browser checks PASS35.3s/default2workers cover
all9ordinary compositions, next promotion/cancellation, startup/presented worker
recovery, cinematic switching, Demon Mirror and Inferno. Nine related units PASS;
checked production verification build/strict TypeScript PASS. Evidence:
`tmp/test-results/browser/worker-suspension-*/worker-suspension.json` and
`tmp/probes/worker-suspension-build.log`. No full suites repeated.

This removes simultaneous realm residency, not the whole-app memory limit gap.
Required first-game desktop accounting still exceeds the low-memory admission
ceiling; selected figure/startup/target ownership and combined enforcement need
completion before final all-stage verification. No push/deployment/native build
or real save changes.

## Demon preparation and realm exit — 9 October 2026

Version1.69.21 prepares the existing mountain/prop caches through a tiny CPU
capture surface and warms the captured material sources through the gameplay
painter. It retains current sources across texture collection. Only Demon
preparation additionally compiles its blur/grayscale programs; ordinary startup
omits them. Realm exit cancels stale work and retires raw inputs, prop cutouts
and cached layer maps. Re-entry uses the same artwork builders. Scene timing
marks assets ready, CPU cache capture duration and actual prewarmed readiness.

Native240x320 before/after, re-entry and actual context restoration match exactly.
After160collection frames, first-draw artwork uploads and program links remain0;
restored first draw also0. Realm exit releases16artwork textures and all9decoded
inputs56,622,840bytes. Tracked CPU canvases fall18,627,800 to360,000bytes (painter
defaults remain). Solo desktop capture4.2ms is not mobile-scale evidence; the
final related suite capture4.6ms ran alongside another browser worker.
Obsolete warming cannot publish after release/re-entry/disposal.

Focused browser10PASS18.2s/default2workers: new preparation/context/cancellation
cases, Demon Mirror, Inferno, cinematic switching, mist repetition and affected
material coverage/cutout caches. Related units8PASS; checked verification build
includes strict TypeScript. No full suite repeated. Evidence under
`tmp/test-results/browser/demon-preparation-*/demon-preparation.json` and
`tmp/probes/demon-preparation-build.log`. Version metadata/changelog synchronized.

Remaining: ordinary worker output still lives during Demon activity; required
combined memory enforcement and all-stage peak verification remain unfinished.
Demon CPU capture is synchronous and needs representative mobile-size timing;
animated gradient churn has not been investigated. Physical targets and final
matrix/suites remain unproven. No push/deploy/native build/save mutation.

## Incoming figure GPU preparation — 9 October 2026

Version1.69.20 extends the stage gate to prepare regular enemy variants and the
next boss archetype's possible palettes without choosing identities/advancing RNG.
The current boss retains its palette during recovery. Enemy preparation uses
existing bounded sprite/tone caches; unchanged intact source lists reuse without
another paced CPU pass. Selected enemy/player weapon preparation returns the
same cutouts/material maps used by drawing, including special/gold recipes.
One gameplay-painter lease protects current prepared figure sources. Obsolete
scene requests abort and cancelled/replaced/disposed jobs release their leases.

The shared painter also warms white/empty defaults, geometry/light buffers and
its existing back-buffer texture. Native comparison initially exposed one1px
default upload and four160x100target allocations after cold restoration; both
are now prepared before readiness. A resize-during-shader fixture exposed six
allocations after warming old-size targets; synchronising dimensions and tracking
viewport/target/context generations fixes this. No tolerance was relaxed.

Final figure comparison covers38regular/boss appearances and every weapon recipe:
pixels match the cold renderer (maximum0), drawing readbacks/uploads/program
creation0. Prepared source lists survive160collection frames. The fixture keeps
84variant parts4,363,520pixels and40tones1,978,880pixels within the existing8million
combined pixel allowance. Cancellation retains the previous86GPU sources;
actual context restore then first draw uploads0; final disposal releases all86.
Resize during shader preparation also yields first-draw uploads0 and correct
pixels. Related checks cover nine scenery compositions, held/loading/paused boss
adoption, failed/hidden warming and next-scene promotion. Fourteen unique focused
browser checks and11related units pass; full suites remain for larger checkpoints.

The reused390x844/DPR2 first-game probe reports nominal accounted601,477,452bytes:
decoded243,432,120, main canvas27,874,744, GPU259,072,028, worker canvas35,549,280,
transferred35,549,280. Browser/native reserve90,092,128 gives committed691,569,580
against desktop1,073,741,824. All nine conservative next-scene estimates fit that
snapshot. This is not a physical measurement, low-memory admission proof or
all-stage peak. Compared with the prior corrected point561,930,484, required
preparation adds39,546,968 nominal bytes; this cost must participate in final
combined-memory enforcement.

Evidence: `tmp/probes/figure-gpu-{related,final-related,bosses,restoration,resize,
units,build}.log`, `tmp/probes/scene-admission-after-figures.json`, and the native
fixture's `figure-preparation.json` under Playwright output. A fixture return-field
mistake was corrected before final assertions; rendering tolerances stayed fixed.
Next: combined required-resource ownership/limits, Demon scenery GPU preparation
and mode exit lifetime, then all-stage transitions/memory and final measurements.
Same-stage later boss palettes can still be generated lazily; stage-entry
preparation does not claim to eliminate every encounter-time variant miss.

## Budget-aware next scene — 9 October 2026

Version1.69.19 composes and warms one predicted next scene through the existing
worker/painter. Current transferred planes stay drawable. An exact identity
promotes the prepared scene without another worker composition. Texture leases
survive collection; busy frames retain completed slots and cancel pending work.
Hidden state, geometry/quality/seed mismatch, context loss, explicit preparation
and disposal invalidate speculative ownership. Cancellation checks surround
worker building/copying; a synchronous native canvas call cannot be interrupted.

Combined nominal admission sums registered main/preview/worker resources and
pending reservations. Optional work uses512/768/1024MiB low-memory/mobile/desktop
ceilings,64MiB native reserve and12bytes per painter output pixel for browser
buffers. Estimation includes decoded stage inputs, canvas/copy/GPU planes and
20MiB scratch, plus first fog preparation. This limits speculative work, not the
whole app. Required resources, unregistered canvases, actual driver allocations
and all-stage combined peaks still need final verification.

Native tests prove exact held current pixels through160draws, promotion with
only two worker compositions total, and zero uploads/program creation on the
incoming first draw. Pressure denial creates no speculative composition;
geometry invalidation closes next planes while current planes survive. Busy
cancellation during warming closes pending planes and releases reservations
without failing current rendering. Three focused next-scene cases pass.
Explicit preparation lifecycle passes. Worker regression files pass9cases,
including all nine compositions, peer/pending disposal, visibility and startup,
transition and already-presented failure recovery. Active failure notification
now holds combat/RNG/checkpoint and retries the same seed. Older image-preload
matrix fixtures now explicitly choose the local diagnostic builder and select
current transferred planes by key; the large matrix remains for integration.

Focused units16pass; checked verification build/strict TypeScript pass. Logs:
`tmp/probes/next-scene-{units,build,recovery}.log`. Restricted Vite spawning initially
failed withEPERM; the approved subprocess build passes. Full suites remain reserved
for the transition integration checkpoint/final gate. Next: incoming figure GPU
warming, required-resource ownership/combined limits, representative runtime
admission and cold/warm transition measurements. Physical120Hz/Android evidence
and complete final measurement matrix remain unproven.

## Reclaimed scenery headroom and target accounting — 9 October 2026

App1.69.18 trims unpinned worker decoded images after all independent plane
copies settle. Required pins and pending work remain untouched; repeated keys
still reuse completed canvases and visit/key changes reacquire inputs normally.
Demon scenery now loads on preparation, shares pending work and can retry failed
decodes. Ordinary startup does not allocate its nine decoded inputs. Rendering
and gameplay rules remain unchanged.

Document GPU accounting now uses every painter's Pixi managed textures, including
HDR, filter/history and back-buffer textures, with format-aware byte sizes/mips.
A guarded Pixi8.22 descriptor adapter adds stencil/MSAA renderbuffers using their
actual attachment formats and four samples; missing descriptors reserve RGBA32F.
Retired null texture entries are ignored. No native queries or allocations are
introduced. Default browser drawing buffers and driver overhead remain outside
the nominal sum. Foundation exposes native services' `memorySnapshot()`.

One390×844/DPR2 ordinary-start/first-game snapshot before and after shows main
decoded300,054,960→243,432,120bytes and worker decoded213,952,112→0bytes. Combined
decoded saving270,574,952bytes (52.6%). This is a representative snapshot, not an
all-stage peak or physical-memory claim. With the initial conservative MSAA
counter, combined nominal sum900,962,068→629,315,324bytes. Correct attachment-format
accounting is recorded separately in `scene-admission-after-formats.json`; do not
attribute that counter correction to an optimization. These numbers demonstrate
why a second scene cannot be admitted from the decode-pool budget alone.
The corrected current sum is561,930,484bytes, including234,168,260 nominal GPU
bytes across painters; the main painter's26,332,800 renderbuffer bytes use actual
RGBA8/depth-stencil storage instead of the initial conservative reserve.

Focused unit coverage passes18 unique cases for decoded trimming, image/canvas/
GPU/mip accounting and lazy/retry/disposed Demon ownership. Three browser cases
pass: nine-stage texture warming with zero worker decoded residency and unchanged
pixels/no first-draw upload/link; Demon cinematic entry/resize/reload; repeated
Demon mist in both orientations/DPRs. The27-composition retained-plane check
passes exact held/repeated copies after eviction, with no build for unchanged keys.
Fixtures now explicitly prepare lazily loaded Demon scenery.
Logs: `tmp/probes/scene-headroom-{units,browser,plane-lifetime}.log`,
`demon-lifetime-unit.log`, `scene-gpu-accounting-unit.log`; compatible snapshot
JSONs are `tmp/probes/scene-admission-{baseline,after,after-formats}.json`.
No full suite or complete performance matrix is repeated during iteration.
Checked verification build/strict TypeScript passes; changed formatting/diff
checks pass. Build log: `tmp/probes/scene-headroom-build.log`.

Next finish combined admission/next-slot composition and promotion, incoming
figure warming and remaining ownership. No whole-app cap is enforced yet;
startup/transient overlap, auxiliary canvases and browser/driver reserves remain.

## Combined resource accounting groundwork — 9 October 2026

App1.69.17 introduces weak observation of main decoded images and canvas backing
sizes, including shared decode leases, direct PBR/weapon/Demon inputs, startup
images, figure tone/crop caches and material cutouts. Observation does not pin
pixels. Worker documents report every created canvas's current backing size;
this includes colour/data layers, material scratch and temporary copies still
alive before garbage collection. Transferred ImageBitmaps are counted separately
by actual dimensions, with shared references counted once. Painter source stores
report nominal RGBA texture backing with exact mip chains; all registered
document painters contribute, including previews. Native services expose these
components and their `accountedBytes` sum.

This is not yet whole-app admission: render targets, driver overhead and some
auxiliary canvases remain outside the counters, and decode budgets remain per
pool. Worker data describes the last response rather than a continuous reading.
Next complete those estimates and use reservations before composing/warming a
next slot; do not treat the existing loader limit as a combined cap.

Ten focused unit cases pass (accounting/mips, plane copying and PBR lifetime).
The existing nine-stage native warming case verifies transferred-byte equality,
worker canvas and source GPU estimates, identical scenery, no first-draw upload
or link, and zero transferred/source-GPU bytes after disposal. It passes in7.5s.
Logs: `tmp/probes/scene-memory-{units,browser,typecheck}.log`.
Checked production verification build/strict TypeScript passes; build log is
`tmp/probes/scene-memory-build.log`. Changed formatting/diff checks pass.
No additional performance run or full suite is required for these counters.

## Drift runtime integration — 9 October 2026

App1.69.15 installs the two1024×512 WebP planes and128px cells. At DPR3,
the controlled largest-gust review remains readable;192px is unnecessary.
Four logical families share the pair, preserving surviving particles during
stage changes. Runtime ownership holds two leases/4,194,304nominal decoded bytes.
Encoded size is155,694bytes; full-set reduction is94.87% decoded and96.44% encoded.
Mipmapped RGBA GPU estimate is5,592,405bytes, not physical GPU measurement.
Original PNG artwork/PBR recipes remain; four unused generated base WebPs and
old drift runtime material entries are removed.

Instancing, analytic motion, alpha quantization, folded faces, depth ordering,
spawn mixtures and density remain. Ambient leaves draw once per layer and weather
embers use the same cheap instanced composite shader. Drift writes no geometry
buffers and binds no normal/surface maps. Scene-light lookup samples lighting
behind the sprite; empty geometry uses scene ambient. Only fire samples emission.
Drift texture sources alone enable automatic mipmaps with linear min/mipmap filters.
Full PBR is removed at every quality: small moving paper does not justify its
extra detail/cost. Saved checked controls retain the old renderer for comparison,
without a duplicate runtime fallback.

Focused browser checks pass14 cases: all32 frames/all cinematic scenes, warming,
two-plane ownership, supersession, pending motion/readiness, instanced flutter,
clipping/order, context restoration, sky lighting/emission and DPR3 review.
Unit suite passes476 cases; production checkpoint passes all4 cases including
strict TypeScript/build/offline resize. Full browser checkpoint executes374:
371 pass/3 fail in18.7m. Historical compaction checks still requested the four
retired base WebPs; they now verify retained PNG authoring sources and preserve
all180 exact data-plane checks. Material preview expected86 packs rather than82.
Those two test expectations are corrected. The native leaf restoration test
reports one alpha mismatch in the full run, with all geometry/HDR targets exact;
its cause is not established. All five cases in the affected three files pass
the focused rerun in16.4s, with the strict alpha assertion retained and added
restoration diagnostics. No unchanged full suite is repeated after test-only
corrections. This does not establish the complete mobile/transition goal.

Checkpoint logs: `tmp/probes/drift-{units,production,browser-full,focus-final}.log`.
Original failures are preserved under `tmp/probes/drift-full-failures/`.

Representative before/after DPR3 captures are under
`tmp/probes/drift-scenes/{current,new}-{daylight,lantern,fire,gust}-DPR3.png`,
with requested/rendered scene evidence in `evidence.json`. The file named lantern
captures the dark Rainwater Hollow; controlled lantern/sky/fire/gust captures
are under `tmp/probes/drift-new/`. All eight gameplay captures were reviewed:
ink silhouettes remain coherent and fire remains visible against dark sky.
Cosmetic timing and preview figure choices vary, so these are representative
visual comparisons, not deterministic pixel oracles. Controlled DPR3 checks
isolate lantern lighting and emission and include enlarged90CSSpx gusts.

### Replacement measurements

All24 samples pass across new/rate1 and off/new/saved-current/rate4, with the
same390×844/DPR2, High, seed424242,3s warmup/5s measurement and three repetitions.
Statistics below are medians of sample statistics; threshold counts sum intervals.

| CPU rate | Mode | Scene | Render median | Frame p95 | Frame p99 | >8.3ms | >16.7ms |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | new | calm | 2.1 | 16.9 | 17.3 | 900 | 277 |
| 1 | new | gust | 2.1 | 16.9 | 17.3 | 899 | 254 |
| 4 | off | calm | 9.3 | 17.4 | 30.2 | 872 | 342 |
| 4 | new | calm | 9.6 | 17.3 | 30.2 | 875 | 337 |
| 4 | current | calm | 10.5 | 17.8 | 30.2 | 863 | 339 |
| 4 | off | gust | 9.7 | 18.2 | 40.3 | 864 | 356 |
| 4 | new | gust | 10.4 | 17.3 | 29.8 | 863 | 335 |
| 4 | current | gust | 10.9 | 18.4 | 30.4 | 867 | 338 |

Calm populations are27, gust0. Rate1/new gust starts35/8 in all samples;
rate4/new/current gust starts55/28, while off starts55/28,55/28,63/36.
Rate4 current→new CPU render medians improve8.6% calm/4.6% gust. Off subtraction
suggests smaller incremental calm cost but varies in gust and is not isolated
GPU timing. Rate1 previous-current→new is5.3→2.1ms, but earlier off results and
rate4 baseline differences show host variance; do not claim that as a causal
60% drift speedup. Saved current uses the checked pre-integration application
build, with original source/instrumentation recorded; comparison includes runtime
ownership/catalog changes. No physical-mobile GPU or120Hz target is proven.
The structural single-pass/texture savings are verified; a substantial isolated
mobile rendering-cost reduction remains a hardware validation gap.

Evidence under `tmp/performance/`:

- `2026-10-09T08-10-22.639Z-2e783e02`: new/rate1.
- `2026-10-09T08-11-34.575Z-b43d97a9`: off/rate4.
- `2026-10-09T08-13-10.952Z-7d3464e9`: new/rate4.
- `2026-10-09T08-14-47.109Z-94027dbf`: saved current/rate4.

All timing/capture processes are terminal. No further desktop drift reruns are
planned without a concrete question that could change implementation. Grass's
geometry bandwidth and large maps may offer similar opportunities; unchanged
because this checkpoint is drift-only.

### Worker capability finding for the next integration

Installed Capacitor8.4.3's `Bridge.DEFAULT_ANDROID_WEBVIEW_VERSION` is60;
`capacitor.config.json` does not override it. That native floor does not prove
the required worker compositor can run. Chrome's documentation places
[OffscreenCanvas](https://web.dev/articles/offscreen-canvas) at69 and
[module workers](https://developer.chrome.com/blog/new-in-chrome-80) at80.
[Capacitor's minimum WebView setting](https://capacitorjs.com/docs/config)
can declare the application's actual floor. Next integration must align that
floor with bundled JavaScript and perform actual worker/canvas capability checks,
plus visible failure/retry for constructor, message and composition failures.
Android version alone cannot establish those capabilities. No physical Android
WebView validation has been performed for the new requirement yet.

## Required-worker recovery integration — 9 October 2026

App1.69.16 removes factory/owner automatic local fallback. The shared
composition module remains inside the worker and in diagnostic comparisons.
The owner checks required APIs, handles constructor/error/messageerror/post/
compose/upload/timeout failures, aborts uploads, terminates the worker, releases
planes and settles callers. Retry starts a fresh generation; stale preparation,
response or warming cannot publish or settle new callers. Scene flow retries
the same identity without advancing the visit seed or clearing its continuation.
Startup reports scene failure with reload retry; later failures use a concise
scene retry panel and keep simulation held. Disposal removes the error panel.

Capacitor now declares WebView111, matching installed Vite8.3.1's Chrome111
baseline. This is a capability/build alignment, not physical-device proof.
The native error path serves a static offline startup message without JavaScript
or plugins; the configured floor alone would only log an error in Capacitor.
Strict TypeScript and16 focused unit/tool cases pass. Initial21-case browser
selection passes18 and fails3: startup's unavailable diagnostic was absent in
two cases, and the new gameplay test remained on setup without pressing Begin.
The startup diagnostic and test flow are corrected; those three cases pass the
focused rerun in14.8s. The failure/retry case also passes with a silent-worker
timeout added, using a shortened fixture timer instead of waiting45seconds.
The native error page passes with JavaScript disabled. Logs are under
`tmp/probes/worker-{required-browser,required-repair,required-timeout,native-error-page}.log`.
Checked production verification build passes and contains the static page;
`tmp/probes/worker-required-build.log` records the build. Formatting/diff checks pass.
No full suite is repeated for this iteration. Next-scene promotion,
figure warming and combined memory ownership remain incomplete.

## Drift baseline tooling and trial atlas — 9 October 2026

The existing opt-in performance runner now supports calm/gust scenes, an
instrumented-build-only off/current switch, optional CPU throttling and raw p99
and counts over 8.3/16.7ms. The new mode explicitly fails until implemented.
Off suppresses drawing, not simulation or preparation. Normal bundles are
unchanged. CPU throttling approximates CPU execution only, not a mobile GPU.

Calm removes gusts after updates because both weather and combat can generate
them. Gust uses repeated normal cosmetic bursts. Initial contaminated calm
captures are retained but excluded from the baseline. Guards reject contaminated
calm scenes or missing drift/gust populations. Controlled gust populations still
vary with lifetime and sample boundaries; recorded counts must accompany timing
comparisons. Do not infer precise isolated GPU cost from these CPU timings.

`scripts/assets/drift-atlas.py` produces reproducible trial colour/emissive WebP
planes under ignored tmp, retaining sources. A128px cell contains120px artwork
and a4px transparent gutter. Associated-alpha Lanczos resizing prevents hidden
transparent RGB leaking into visible edges. All32 frames fit1024×512.

Complete old drift base/normal/surface/emissive set:4,378,340 encoded bytes and
81,823,976 nominal decoded bytes. Trial two-plane output:155,694 encoded bytes
and4,194,304 decoded bytes (94.87% reduction); mipmapped RGBA GPU estimate
5,592,405 bytes. This is a full-set comparison, not current-stage residency or
measured physical GPU memory. Runtime remains on the original assets and shaders.

Generator checks cover alpha-safe resizing, odd source dimensions, frame layout
and gutters. Sheet review passes initial legibility; largest-gust DPR3 and
daylight/dark/fire/gust scene reviews remain required before installation.

Next: integrate the reviewed atlas, drift-only mipmaps and one-pass lit shader,
then compare against saved controls. Complete drift checkpoint before moving to
worker simplification and transition/resource integration. Reserve full suites
for substantial checkpoints and final verification.

### Corrected baseline

All four runs pass, with three repetitions per calm/gust scenario, 3s warmup and
5s measured windows at390×844/DPR2, High quality, seed424242. Native Edge on the
same host; CPU rate4 is CDP throttling. Table timing is the median of each run's
three sample statistics, in milliseconds; threshold counts sum raw intervals.

| CPU rate | Mode | Scene | Render median | Frame p95 | Frame p99 | >8.3ms | >16.7ms |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | off | calm | 6.6 | 18.2 | 21.7 | 894 | 388 |
| 1 | current | calm | 5.3 | 19.1 | 25.2 | 888 | 349 |
| 1 | off | gust | 5.1 | 18.1 | 30.0 | 889 | 342 |
| 1 | current | gust | 5.3 | 19.4 | 27.7 | 887 | 350 |
| 4 | off | calm | 4.9 | 25.4 | 39.9 | 847 | 409 |
| 4 | current | calm | 9.3 | 17.4 | 30.2 | 872 | 386 |
| 4 | off | gust | 4.4 | 17.9 | 27.2 | 890 | 407 |
| 4 | current | gust | 9.1 | 17.7 | 29.2 | 869 | 373 |

Desktop calm off is slower than current in render CPU time; this matrix does not
establish an isolated causal cost. CPU-throttled current is slower in CPU render
time, but frame-p95 does not track that difference. Do not turn the subtraction
into a claimed speedup or120Hz result. Retain raw samples and workload counts for
the replacement comparison; do not spend additional iteration rerunning baseline
noise before implementing the requested cheaper path.

Evidence under `tmp/performance/`:

- `2026-10-09T07-47-49.482Z-ef7d859c`: off/rate1.
- `2026-10-09T07-49-07.089Z-225a0523`: current/rate1.
- `2026-10-09T07-50-25.720Z-5c950fb1`: off/rate4.
- `2026-10-09T07-52-02.672Z-acf5641d`: current/rate4.

All measurement handles are terminal. Runtime rendering remains unchanged;
package/lock/title/changelog advance to1.69.14 after the1.69.13 baseline captures.
