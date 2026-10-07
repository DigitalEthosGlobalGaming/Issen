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
Ink uses layered PNG atlases for environments and modular figure artwork, alongside procedural grass, weather and effects.

The only SVG in the application is small inline interface artwork, such as the
mute control in `src/ui/shell.html` and the alternate mute icons assigned by
`src/game.ts`. Characters, layered scenery, weather, particles and combat effects are
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
The broad W2.1 check remains pending.
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
frame composition and delegates individual kinds of drawing to `src/rendering/`.
The canvas backing store is sized for the device pixel ratio, capped at 2, while
drawing uses CSS-pixel coordinates. A resize rebuilds layout-dependent cached
art and reprojects active figures.

The main scene is assembled back to front in a deliberate order:

1. cached stage background and light glows;
2. stage transition, mist, grass and ground stains;
3. rear leaves and enemies, including fog between depth groups;
4. boss, attacking enemies, bamboo, player and pet;
5. combat particles and foreground grass;
6. gameplay glyphs, smoke, front leaves, weather and text popups;
7. stamps and full-frame film, grain, vignette, damage, flash and letterbox effects.

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
returning. Leaked Canvas state can subtly recolor or displace every later layer.

## Where rendering changes belong

| Change                                                 | Owning location                     |
| ------------------------------------------------------ | ----------------------------------- |
| Stage palette, weather choice or background theme      | `src/game/content/stages.ts`        |
| Layered image environments and sprite atlases          | `src/rendering/environment/`        |
| Static stage scenery and props                         | `src/rendering/scene/background.ts` |
| Moving weather, leaves, grass or smoke                 | `src/rendering/scene/`              |
| Figure shape, clothing, weapon or pet drawing          | `src/rendering/figures/`            |
| Robe or blade appearance data                          | `src/game/content/cosmetics.ts`     |
| Combat particles and transient effects                 | `src/rendering/effects/`            |
| Main scene composition and full-frame post effects     | `src/game.ts`                       |
| HUD or screen layout and styling                       | `src/ui/` and `src/styles/`         |
| Armory-only composition                                | `src/rendering/armory-preview.ts`   |
| Native GPU drawing, film shaders and material lighting | `src/rendering/pixi/`               |

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
