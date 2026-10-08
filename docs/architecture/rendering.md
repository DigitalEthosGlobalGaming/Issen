# Rendering and visual consistency

The [PixiJS migration plan](pixijs-migration-plan.md) records the migration scope
and the later depth/shadow extensions. The implementation below uses PixiJS
8.22.0 with WebGL2. Canvas is retained for texture preparation.

Performance measurement lives in `tests/performance/`, outside the application.
Its runner builds a separate instrumented bundle with source maps; only that
bundle exposes scenario controls and callback timings. The normal Vite config
does not import its plugin. Canvas counters, CPU/heap sampling and timing windows
are separated to make instrumentation overhead explicit. See the
[performance suite](../../tests/performance/README.md) for commands and limits.
The [initial Canvas/WebGL comparison](../features/webgl-performance-2026-10-05.md)
and [rounded-stroke follow-up](../features/webgl-rounded-strokes-2026-10-05.md)
record historical measurements from before Canvas scene rendering was removed.

The rounded-stroke follow-up retains the immutable outer enemy direction ring
as shared Pixi `GraphicsContext` geometry per paint variant. `glyphs.ts` owns
the original brush recipe; `scene-brush-ring.ts` offers an optional native sink.
Changing timing rings keep their procedural drawing vocabulary. Rotations,
reflections and uniform scale reuse the ring; nonuniform transforms fall back
to the original path commands. The painter owns and disposes its cached contexts.
Overlapping marks retain individual alpha blending instead of flattening into
a translucent image. Straight, solid round-ended strokes without shadows use
retained textured meshes with one prepared cap texture; curves, gradients,
multiple subpaths and shadows keep native Graphics paths.

Version 1.61.3 also pools save/restore records and matrices, caches parsed colors
with a 256-entry bound, and remembers sprite source/frame/transform values per
draw slot. Texture hits touch the source's lifetime without rebuilding frame
keys; destroyed or revision-changed frames are reacquired. Matrix operations
compose numeric coefficients directly. Unchanged transforms are skipped and
axis-aligned sprites use position/scale directly.

Unclipped frames retain their root draw order; surplus children are detached when
a frame uses fewer slots. Clipping and film grouping leave this fast path and
keep the existing scoped tree lifecycle. Solid full ellipses can use the painter's
prepared circle texture. Compound paths, strokes, gradients and clip masks
materialize the original ellipse commands. Fixed glyph arrowheads use shared
native geometry, with procedural fallback for unsupported stroke state or
nonuniform transforms. These caches preserve the scene's explicit target ownership.
See the [adapter performance report](../features/webgl-adapter-performance-2026-10-05.md)
for the preserved-source comparison and measurement limits.

Issen uses two presentation technologies. The duel scene uses PixiJS WebGL, while
the interface around it is regular HTML and CSS. It is not an SVG-rendered game.
Ink uses aligned compact WebP planes (lossless PNG exceptions) for environments and modular figure artwork, alongside procedural grass, weather and effects.

The only SVG in the application is small inline interface artwork, such as the
mute control in `src/ui/shell.html` and the alternate mute icons assigned by
`src/ui/wiring/audio.ts`. Characters, layered scenery, weather, particles and combat effects are
drawn through the bounded `SceneDrawing` vocabulary. Its Canvas-shaped operations
keep existing pose composition readable; the native backend emits Pixi sprites,
tessellated geometry and cached text quads. Pixel preparation and readback are
outside that contract. No live full-scene Canvas bitmap is uploaded each frame.

## Native backend and materials

The active entry path is `main.ts` → `main-game.ts` → `scene-surface.ts` →
`pixi/scene-painter.ts`. `game.ts` connects the painter to
`platform/frame-loop.ts`; Pixi does not own scheduling. Material-colour and
atlas-isolation browser checks exercise this same painter. The former test-only
`createPixiBackend` implementation has been removed. `scene-frame.ts` retains
the texture, material, sprite and lighting contracts shared with the shaders.

`MainGame` prepares WebGL2 contexts for the main scene, Armoury and support
preview. Tutorial scenes own and dispose a separate WebGL2 surface. The former
renderer query selector is removed. `scene-surface.ts` never replaces its canvas.
The painter explicitly acquires WebGL2, because Pixi's preference alone permits
WebGL1. Initialization failure shows one graphics error with Retry. Context
deadlines use the same screen with Reload. `graphics-error.ts` reports failures;
`MainGame` owns the screen and the runtime suspends updates and haptics.

`pixi/scene-painter.ts` reuses draw slots and renderer-owned texture sources. The
runtime's existing scheduler calls `begin()` and `flush()`; there is no Pixi ticker.
Prepared canvases use `texture-revision.ts` to signal changed pixels. Gradients,
patterns and clipping use target coordinates, including the runtime's DPR and
camera transforms. Noir and glitch feedback use separate filtered render targets;
other films use ordered native geometry and blend operations.

Owned `color`, `soft-light` and `overlay` shaders apply their blend functions to
straight colours before alpha compositing. This preserves translucent Canvas
grading. Film grouping preserves child order explicitly, and each flush clears
both the back buffer and presentation target so transparent frames cannot accumulate.

The runtime prepares camera shake and post-effect randomness once per presentation
frame. Drawing synchronously reads the current poses and effects; it does not yet
serialize the entire scene into an immutable snapshot. Repeated-draw tests verify
that this path leaves gameplay, cosmetic state, RNG, haptics and saves unchanged.
Scene-ready gameplay continuations run in runtime orchestration immediately after
presentation. Direct drawScene calls never commit a pending scene transition;
the readiness isolation test verifies this and exactly-once runtime settlement.

`scene-material.ts` provides explicit material stamps and lighting inputs. The
material shader accepts aligned colour/normal/mask textures, ambient and directional
lighting, at most four point lights and logical depth/fog. Transparency retains
painter order. Normal maps and material masks are linear data; RGB normals use
X right, Y down, Z toward the viewer. Mask channels are specular strength, gloss
and emission. Normals follow rotation, mirroring and nonuniform draw transforms.
Logical depth is distance away from the viewer in the same units as light positions
and radii; it does not enable hardware depth writes or cast shadows.

The initial broad cloth, rock and steel surface studies in `surface-maps.ts` are
procedural authored forms, independent of the brightness of painted ink. The live
player torso retains its cloth response on non-Sumi outfits; Sumi uses aligned
PBR maps on all nine parts. Modular sword blades use the supplied
PBR atlas instead of the generated steel study. The material shader also accepts
packed roughness/metallic/AO and an emissive texture. OpenGL normal Y is converted
to the scene's Y-down basis before rotation and mirroring. See [sword lighting](../features/sword-lighting.md) for debug controls and map ownership. GPU resources belong to each
renderer, while the small prepared maps belong to their artwork owner.
See [material studies](../features/material-studies.md) for authoring conventions,
the selected artwork and the visual comparison fixture.

Main-context loss stops scene updates and leaves a live run paused. Restoration
requires explicit resume. After eight seconds without restoration, a graphics
error offers Reload while the run remains paused and its checkpoint remains intact.
Auxiliary surfaces use the same eight-second deadline. Preview effects and tutorial
timing/input stop during loss. No canvas replacement or alternate renderer occurs.
Material stamps require a native material sink; posed figures have no Canvas
material branch. `cachedMaterialContext` explicitly marks Canvas texture
preparation so aligned normal/surface/emission maps can still be baked there.
Armoury previews require a prepared WebGL2 surface. Films and SVG scene paths
also require registered native sinks. Noir and glitch use owned Pixi filters;
Canvas film self-copies, copy storage and Canvas Path2D fallback are removed.
Remaining procedural film geometry is drawn by the same native painter.
Workstream verification is recorded in [runtime refactor results](../development/runtime-refactor-results.md).
`SceneSurface` shares repeated initialization calls and owns each auxiliary
surface's bound listeners and recovery deadline. Restoration cancels that deadline;
disposal removes listeners, cancels recovery and releases any late-created context.
The runtime retains ownership of combat suspension and main-canvas input rebinding.
The pinned Pixi version needs a guarded filter bind-group adapter. It detaches
pooled targets after rendering, before resize can destroy them, and cleans up the
shared binding group during disposal. Warning-sensitive native and stage-switch
browser tests cover those paths.

See [Ink layer renderer](../features/ink-renderer.md) for responsive image layers,
live switching, shared film grading, and prototype limits.

## Rendering surfaces

### Main scene

`src/ui/shell.html` provides the full-screen `canvas#c`. `src/game.ts` owns its
frame scheduling. `src/presentation/scene.ts` owns named frame composition and
delegates individual kinds of drawing to `src/rendering/`.
The canvas backing store is sized for the device pixel ratio, capped at 2, while
drawing uses CSS-pixel coordinates. A resize rebuilds layout-dependent cached
art and reprojects active figures.

The main scene is assembled back to front in a deliberate order:

1. `environment`: cached stage background and light glows;
2. `midground`: mist, mid grass, ground stains and rear leaves;
3. `rear-enemies`: boss dimming, rear enemies and fog between depth groups;
4. `combat`: boss, attacking enemies, player, companions and combat particles;
5. `foreground`: foreground bamboo and grass;
6. `atmosphere`: gameplay glyphs, smoke, front leaves, weather and text popups;
7. `post`: camera restore, stamps, film, grain, vignette, damage, flash and letterbox.

`presentation/scene-composer.ts` requires an explicit neighbour for extensions,
for example `scene.composer.insert({ name: 'example', draw(frame, views) {} }, { after: 'combat' })`.
The returned unsubscribe is idempotent. Installation/removal during a draw affects
the next frame; pass names are unique and missing/ambiguous neighbours throw.
The current order preserves the original runtime body, including bamboo after
combat particles. Scene-ready gameplay settlement stays outside all passes.

The order is part of the presentation contract. Adding a renderer without choosing
its depth explicitly can make an otherwise correct effect appear behind fog,
figures or post-processing.

### Cached and generated canvases

Static or expensive artwork is drawn once to off-screen canvases and then submitted
as reusable textures.
`src/rendering/scene/background.ts` creates a seeded stage
background at the current size and device pixel ratio. `src/game.ts` similarly
generates reusable mist, smoke, grain, vignette and ink-edge material. These are
generated bitmaps, not checked-in image assets.

### Interface, preview and sharing

HUD and screen content under `src/ui/` use HTML and CSS layered over the main
canvas. CSS variables in `src/styles/tokens.css` provide the core ink, paper,
seal and type values, and `src/styles/index.css` fixes the cascade order.

Buttons use the shared ink nine-slice frames in `src/styles/button-frames.css`,
imported after screen styles. It covers menu, HUD, tutorial, cinematic and startup
buttons, including segmented choices, Armoury tiles and Temple upgrades. The
normal and highlighted centres remain dark; existing labels, equipped badges,
rarity indicators, disabled opacity and focus outlines retain their own meaning.
See the [atlas contract](../../src/ui/assets/button-atlas.md) for slice geometry
and regeneration. The gameplay painter uses explicit prepared textures for these UI assets.

Bounded panels use the heavier frames in `src/styles/panel-frames.css`, imported
after button frames. Temple tiles use compact panel corners with selection and
hover highlights; Temple details, pause containers, Trial cards/results, Testing
tools groups and the cinematic toolbar use the normal container frame. Full-screen
backdrops and inner scrolling retain their existing owners. See the
[panel atlas contract](../../src/ui/assets/panel-atlas.md) for geometry and regeneration.

The armory has its own canvas. `src/rendering/armory-preview.ts` reuses the figure,
effect and film renderers but owns a separate animation clock and effect state.
The runtime lends its prepared artwork renderers and tint caches to Armoury and
support previews. Draw inputs remain explicit; caches contain prepared pixels,
not animation state. Borrowing previews never dispose the runtime's artwork.
Standalone previews can still own and dispose their own artwork.
There is currently no live-scene screenshot/export consumer under `src/`.
WebGL drawing-buffer preservation stays disabled. A future export must render
and capture a completed frame on demand; reading the canvas after browser
compositing can return a cleared buffer.

## Patterns that keep the style consistent

### A restrained ink, paper and seal language

The dominant values are near-black ink, warm off-white paper, muted natural
tones and a red seal accent. DOM surfaces take their core values from
`src/styles/tokens.css`. Figure colors start from `BASE` in
`src/rendering/palette.ts`; stage atmosphere comes from the stage records in
`src/game/content/stages.ts`; robe and blade variations live in
`src/game/content/cosmetics.ts`.

This is a shared visual language, not a single universal token system. Some Canvas
effects and props intentionally contain local color literals. Before adding a new
color, prefer an existing palette, stage value or CSS token when that value has
the same meaning; keep genuinely effect-specific colors beside their renderer.

### One typographic voice and repeated seal motifs

The application uses `Shippori Mincho B1` with Japanese serif fallbacks for both
DOM text and Canvas text. Heavy kanji, generous letter spacing, paper-colored
labels and red square seals recur in the HUD, banners, combat stamps and share
cards. Canvas renderers receive the font and seal color as explicit inputs so
secondary surfaces match the live game.

### Proportional geometry instead of fixed artwork

Figures are constructed from normalized proportions relative to their height.
`src/rendering/figures/types.ts` describes a figure as position, height, palette,
pose and optional costume or weapon details. `src/rendering/figures/figure.ts`
composes that model through modular image renderers and shared effects. Poses are small data objects and are blended
or approached by the animation modules instead of being separate images.
Measured atlas parts replace masks, coats, armour, body and weapon geometry.
`ink-player.ts`, `outfit-kit.ts`, and `ink-enemy.ts` attach those parts to the
same normalized pose coordinates. Crests and effects remain procedural.
Within each figure, the back-facing player's weapons are painted behind the robe,
while front-facing enemies paint their arms before their weapons. Hands finish over
the grip in both views.

The same principle applies to the scene. `src/rendering/layout.ts` derives the
horizon, ground, combat slots, player, strike and boss positions from viewport
dimensions. Most detail sizes use a scale based on the viewport or figure height.
Portrait and landscape therefore share a composition rather than maintaining two
sets of art.

### Seeded imperfection

Procedural hems, sleeves, hair, grass, ridgelines, clouds and stage props use
seeded random sources. The small variations keep silhouettes from feeling
mechanically identical, while stable seeds prevent static art from changing on
every frame. Frame-to-frame randomness is reserved for transient material such
as grain, scratches and particles.

### Depth through scale, fog and layer order

Enemy slots carry position, height and fog values. Distant figures are smaller
and have their base palette blended toward the stage fog color. Enemies are sorted
by vertical position where necessary, and foreground weather or foliage is drawn
after figures. This repeated combination creates depth without a 3D renderer.

### Enemy status cues

`src/rendering/glyphs.ts` separates attacker status from swipe direction. The
runtime passes the actual attacker and ordered rank: an attacker has a larger,
bright paper marker with square corner brackets; the next ordered enemy has a
smaller paper marker; waiting enemies have dim, dark-centred outlined markers.
Entry fades multiply that status brightness, so arriving enemies cannot briefly
look like the attacker. Numbered seals still show ordered priority.

The brackets remain when direction arrows or timing rings are hidden. They do
not reveal a direction or a perfect-cut window. Fog and weather visibility still
apply to the whole marker; existing arrow-fade and equipment rules remain in the
runtime. Boss/standoff glyphs retain their existing presentation.

### A common material pass

Version 1.13.0 adds Falling Leaves, Ember Ash and Ink Wash through the shared effect
spawner. Ordinary sliced enemies use a typed dissolve death for those selected
effects; its body fade and raw-time shadow cleanup stay independent of combat RNG.
Armoury demos preview selected locked effects without equipping them or sharing
live particles. See [mastery presentation](../features/editions-and-mastery.md).

Gradients, soft radial blobs, low-saturation palettes and selective `lighter`,
`multiply`, `overlay` and `color` compositing create the painted light and mist.
`src/rendering/effects/film.ts` supplies named color treatments to both the live
scene and the armory preview. The final scene pass adds grain, scratches, vignette,
ink edges and flashes, which helps procedural elements read as one image.

Glitch and Noir use Pixi-owned feedback targets and filters at the surface's
backing resolution. Canvas-only self-copy logic and its copy-storage cache were
removed in W2. The [earlier performance report](../features/performance-profile-2026-10-04.md)
describes the retired implementation, not current measurements.

The main scene skips drawing while the opaque fullscreen equipment inspection is
open; the preview continues on its own canvas. Ordinary Armoury, Stats and Options
scrolls reveal the scene around their edges and therefore retain scene rendering.

### Explicit renderer inputs and isolated state

Renderer factories receive a specific `SceneDrawing` target and the values
they need. They do not discover a global canvas. Preview effects, live effects and
auxiliary scenes have separate state. This makes shared drawing code reusable without
letting a preview change gameplay or paint into the wrong surface.

Use `save()` and `restore()` around temporary transforms, alpha or composite modes.
If state is intentionally set without a save, restore the expected baseline before
returning. Leaked drawing state can subtly recolor or displace every later layer.

## Where rendering changes belong

| Change                                                 | Owning location                                          |
| ------------------------------------------------------ | -------------------------------------------------------- |
| Stage palette, weather choice or background theme      | `src/game/content/stages.ts`                             |
| Layered image environments and sprite atlases          | `src/rendering/environment/`                             |
| Static stage scenery and props                         | `src/rendering/scene/background.ts`                      |
| Moving weather, leaves, grass or smoke                 | `src/rendering/scene/`                                   |
| Figure shape, clothing, weapon or pet drawing          | `src/rendering/figures/`                                 |
| Robe or blade appearance data                          | `src/game/content/cosmetics.ts`                          |
| Combat particles and transient effects                 | `src/rendering/effects/`                                 |
| Runtime cached environment construction                | `src/presentation/environment-artwork.ts`                |
| Runtime ambient/grass/weather drawing host             | `src/presentation/environment.ts`                        |
| Runtime feedback effect spawning/drawing               | `src/presentation/feedback.ts`                           |
| Runtime enemy/boss projection and figure host          | `src/presentation/figures.ts`                            |
| Main scene composition / full-frame drawing            | `src/presentation/scene.ts` / `src/presentation/post.ts` |
| HUD or screen layout and styling                       | `src/ui/` and `src/styles/`                              |
| Armory-only composition                                | `src/rendering/armory-preview.ts`                        |
| Native GPU drawing, film shaders and material lighting | `src/rendering/pixi/`                                    |

Keep drawing functions dependent on explicit dimensions, time, state and random
sources. Reuse the figure/effect/film renderers for alternate views instead of
copying their shapes. Keep gameplay rules out of renderers: the runtime should
translate game state into poses, positions, appearance and effects.

## Verification

`tests/browser/rendering.spec.ts` checks renderer isolation, decorative particles,
all robe and blade variants, deterministic backgrounds in portrait and landscape,
and restoration of Canvas state after film effects. `tests/browser/game.spec.ts`
and `tests/production/app.spec.ts` cover armory drawing and landscape behavior in
the running application. These checks establish ownership and isolation; they do
not provide pixel-perfect visual regression coverage.

The native checks are `tests/browser/pixi-backend.spec.ts`, `pixi-scenes.spec.ts`,
`pixi-catalogue.spec.ts` and `pixi-films.spec.ts`. They exercise real WebGL drawing,
material maps, isolated native surface comparisons, texture invalidation,
repeat-draw state isolation, graphics errors and context loss/restoration. Primitive
drawing checks may use Canvas as a reference for the drawing vocabulary; it is
never a live scene backend. Canvas-only film parity tests and runners are removed. Use
`npx playwright test --config playwright.rendering-v2.config.ts` for the broad
browser suite on its dedicated development server; pass the desired test files
for focused checks. This configuration keeps verification separate from a live
preview server. Unit post-frame tests check immutable preparation and haptic
cadence. Android web tests establish offline bundle behavior, not physical-device
graphics compatibility or performance.

## Layout-preserving compact assets

Runtime atlases keep their existing dimensions, UV windows, anchors, pivots and
nine-slice crops. Original authoring PNGs remain checked in; startup globs retain
compact artwork siblings. Separate base and diffuse consumers remain separate.
Required planes are diffuse, normal and packed surface (R roughness, G metallic,
B AO), with optional emissive. Missing emission binds the existing neutral
texture or procedural zero plane and never loads a black image. Cached coverage
and blend modes match explicit zero maps, including additive emission.

Encoding belongs to `scripts/assets/compact.mjs` and the hash/byte manifest;
installation and generated catalog belong to `scripts/pbr`. Runtime loading stays
in `pbr-atlas.ts`, `asset-materials.ts`, `cached-materials.ts`, UI lighting and the
existing worker path. Data WebP decodes bit-exactly with alpha/colour conversion
disabled in the browser comparison. Lossless `.compact.png` exceptions preserve
pixel and colour interpretation. Every converted plane is verified by
`tests/browser/compacted-planes.spec.ts`; normal/material/Canvas comparisons use
the focused rendering suites. No repacking, new loaders or downscaling.

Encoded byte savings reduce download/APK storage. GPU dimensions stay unchanged;
only removed scalar and zero-emission uploads can reduce texture residency.

## Runtime composition ownership

`presentation/scene.ts` supplies seven named passes: environment, midground,
rear-enemies, combat, foreground, atmosphere and post. `scene-composer.ts` requires
an explicit before/after neighbour for extensions. Figure/environment/post draws
read current views and cosmetic randomness; rule mutation, saves and haptics are
not drawing operations. Runtime frame dispatch owns rule/cosmetic update order;
scene readiness settles after a presented frame in `runtime/scene-flow.ts`.

WebGL2 is the only live renderer. Canvas/OffscreenCanvas preparation and the
local alternative to worker texture preparation remain authoring/preparation tools.
The native colour/soft-light/overlay blend filters remain because they implement
live Pixi grading with correct alpha; they are not an alternate Canvas renderer.
The forward material pipeline described above remains until Workstream 3 replaces
it; no light pre-pass completion is claimed here.

## W3 geometry buffer (phase 1)

Each PixiScenePainter owns three native MRT attachments in geometry-buffer.ts.
G0 stores octahedral world normal XY, signed depth normalized into a scene-sized
range, and effective coverage. G1 stores roughness/metallic/AO and a byte material
flag (0 neutral/unlit, 1 PBR including converted legacy masks). G2 stores linear albedo and
material lighting amount. All are 8-bit normalized data; zero-depth ties round
explicitly to the upper representable neighbour. Geometry alpha cutoff defaults
to 0.5 and is configurable per SceneMaterial. Last covered writer wins in painter
order, blending is disabled, and the original clip hierarchy is retained. Fog,
film and grading filters remain exclusively in the ordered composite.

Geometry shaders share the current material maps, UVs and inverse-transpose normal
matrix. OpenGL normalY, mirroring, rotation and nonuniform scale are preserved.
The painter replaces its targets on size/context restoration and releases them on
disposal. Main geometry remains DPR-capped by viewport.ts; auxiliary surfaces own
independent targets at their explicit canvas size. A restored context revalidates
MRT. Fewer than three draw buffers or colour attachments shows the existing
unsupported-graphics Retry/Reload view; there is no multipass substitute.

The session-only lighting panel offers Scene, Normal/depth, Surface and Linear
albedo views. The painter records the completed lightingFrameView separately from
the requested lightingView, so tests capture an actual rendered buffer. Borrowed
readonly geometryTargets expose current g0/g1/g2 textures, dimensions, depth range
and generation; extensions must reacquire after resize/restore and never destroy
or mutate these owner resources. Light targets are implemented in phase 2 below; final public post hooks
remain later W3 work.

This is phase 1, not a completed deferred-lighting pipeline: the current forward
material shader still renders the ordinary scene while geometry buffers are
verified. The light pass, 16-light registry, lookup composite, legacy unification,
instanced foliage and half-resolution option are still required. No performance
measurement or physical-device verification is claimed.

## W3 light accumulation (phase 2)

The painter runs one fullscreen native MRT pass after geometry. Two RGBA16F
attachments retain diffuse irradiance and GGX specular radiance above 1 until the
ordered composite applies the existing highlight roll-off. The light BRDF uses
the existing Fresnel tint, Smith geometry and Lambert gain. Ambient AO is included
in diffuse times (1-metallic); the previous albedo-tinted ambient metal energy is
retained in specular. RGBA16F values are bounded by its finite maximum 65504.
The [Khronos float extension](https://registry.khronos.org/webgl/extensions/EXT_color_buffer_float/)
or [half-float extension](https://registry.khronos.org/webgl/extensions/EXT_color_buffer_half_float/)
must enable that same native format, and actual framebuffer completeness is checked.
Unsupported HDR reports the normal graphics error; there is no alternate format.
Depth decode anchors canonical zero at byte128; other depths retain 8-bit error
within one scene-range quantization step.

presentation/light-sources.ts owns source sampling and the global16 budget. Each
source supplies stable local IDs and receives explicit target dimensions and the
presentation clock. Sources are sampled from a snapshot, so registration/removal
during sampling applies next frame. Ranking uses intensity times exact clipped
circular viewport area, with code-point source/ID ties. light-budget.ts supplies
the pure shared calculation; the native backend also applies it to direct preview
lighting inputs. No per-sprite selection occurs in this light pass and no gameplay
randomness is consumed. The retained stage rig enters the same budget.

Borrowed painter.lightTargets exposes diffuse/specular Texture wrappers, size and
generation. Never mutate/destroy these resources; reacquire on resize/restore.
Each preview has its own attachments. Geometry sampler bindings are detached
before old G targets are released. Explicit HDR sources are destroyed by their
owner, because RenderTarget does not manage externally supplied sources.
The light debug views map radiance to radiance/(1+radiance) for display only;
production light targets retain HDR. Controls stay session-only.

The ordinary scene still uses the forward shader until phase3 implements lookup.
Legacy model unification, instanced foliage, half-resolution lighting, event
sources and named GPU composer passes remain required migration work.

## W3 lookup composite (phase 3)

Ordinary material sprites now sample the painter's diffuse/specular targets at
world screen position and combine their own linear albedo and emission. The
existing highlight roll-off, display encoding, coverage, fog, tint and ordered
native blend/film passes remain. The sprite shader performs no BRDF evaluation.
Below-cutoff translucency samples the surface behind it, including its normal,
depth, roughness, metallic tint and AO. This is the requested accepted
approximation; overlapping materials can therefore share or tint highlights.

The geometry cutoff uses exact effective mesh/ancestor alpha instead of Pixi's
byte-packed colour alpha, so authored alpha0.5 is included at default cutoff0.5.
Composite output preserves Pixi's existing premultiplied-alpha convention.
Light sampler bindings are detached before light attachments are replaced.

During phase3 only, canvas.dataset.lightingComparison='forward' selects the old
forward shader for developer/browser comparison. Phase4 removes both this flag
and that shader. The native light pass still runs during comparison; this flag
does not select another renderer. Normal production drawing defaults to lookup.

Native PBR studies cover rock, cloth and steel with mirror/rotation/nonuniform
scale, translucent coverage, fog, warm/cool point lights, actual noir grading and
lighting disabled. Mean displayed RGB differences were0.03855/0.04166/0.04091/0
against the existing native scene tolerance9, with zero alpha mismatches and
24396 covered pixels per case. Thin edges compare their actual displayed
contribution over black. Screenshots and numeric JSON use testInfo.outputPath;
ignored checkpoint copies preserve evidence across later test-result cleanup.

This is still migration work. Legacy mapping/old-shader removal, complete scene
route audit, instanced foliage, half-res quality, event light sources and named
GPU composer passes remain required before the lighting workstream is complete.

## W3 single material model and old-shader removal (phase 4 checkpoint)

The old forward fragment, per-sprite four-point selection, its uniforms and the
temporary runtime comparison flag have been removed. The recoverable reference
is commit472f60aa71787adec717adbf8f982109790925f6. geometry-material.ts converts
legacy gloss to GGX roughness using (2/(mix(8,96,gloss)+2))^(1/4), maps legacy
specular strength to metallic response, and supplies AO1. Both legacy and authored
PBR surfaces carry flag1 and use the same light-pass GGX equations. This mapping
is an approximation of legacy authored response, not another BRDF. Legacy blue
emission remains an own-albedo term in the ordered composite; it never enters
shared diffuse/specular targets. Native equivalent-map/emission checks pass.

Regression references under tests/browser/fixtures/lighting-forward are actual
RGBA captures from the old shader before removal. Provenance records the source
commit and four controlled scenes. The browser compares native lookup output
against those images at unchanged mean scene tolerance9 and exact alpha equality.
It no longer sets a runtime shader flag. Current differences remain below0.042.

This checkpoint proves unified material stamps, not the complete all-scene
contract. Ordinary drawImage/cached text and procedural Graphics/round strokes/
brush rings/ellipses/glyph arrows still use stock native colour drawing. Routing
these through the common pipeline and shared neutral-emissive binding remains
required before this migration can be called complete. Instancing, event sources,
half-resolution lighting and named GPU composer passes also remain pending.

Absent emissive maps now bind the shared zero Texture.EMPTY source, including initialization and release. No per-material neutral image is allocated and no absent map is requested. The five focused omission/colour/legacy/reference browser checks pass; whole-scene stock-route integration remains pending.
