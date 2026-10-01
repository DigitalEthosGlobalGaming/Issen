# Ink layer renderer preview

Ink is the sole environment renderer from version 1.28.0. The old Artwork
selector and backtick switch are removed; old saved renderer choices are ignored.
Animated procedural grass, sky, terrain, weather and awakening effects remain
where they complement the sprite artwork. Cinematic browsing changes scene and
film without changing equipment or the saved run.

## Composition and ownership

The router in src/rendering/environment/index.ts owns loading, atlas drawing,
three cached depth planes, mist, and disposal. The runtime passes an explicit
Canvas 2D context and presentation frame; it still owns combat composition and
the final film pass. The three planes are sky/ground, distant scenery, and nearby props. Their contents
vary by scene. Atlas cells can be repeated, mirrored, positioned, and scaled
independently before caching. Distant and near planes have different small
horizontal offsets. No WebGL or recovered 3D geometry is required.

The 24 PNG atlases include four-cell grids and explicitly packed architectural
frames. Per-atlas contracts record dimensions, safe source windows, ground
anchors and provenance in the [asset library](environment-asset-library.md).
Only the current scene's kit stays loaded. Shared images survive switches;
unused sources are released and depth caches rebuilt. A generation counter
prevents obsolete loading callbacks from changing the current scene.

Scene placement is recomputed from viewport dimensions and the existing combat
layout. Side framing stays near the edges, while smaller repeated bamboo supplies
distant depth. Phone, tablet, landscape, and desktop compositions share the same
assets. Cache resolution is capped independently of logical scene size, with
approximately three million total backing pixels across the three planes. This
keeps a large desktop or high-DPI tablet from multiplying scenery memory without
bound. Low effects quality uses fewer distant sprites and stationary layers.

Film grading remains downstream in the existing applyFilm pass, so every
equipped film still treats scenery, figures, and effects together. Reduced motion
or reduced flashes freezes parallax and mist drift. Existing weather, characters,
attack glyphs, and combat effects are still drawn by their current renderers.
Armoury previews remain independent.

## Scene composition and readiness

The first scene retains the procedural sky, rolling field, and dense static
grass as its base. The base omits its procedural pine row and edge tree; only
generated pine sprites populate the distant foothills. A four-cell mountain atlas
replaces the procedural ridges through a background rendering callback. Three
rows overlap, mirror, and repeat the tiles at their native aspect ratio. Per-row
fog tint and alpha fading soften detail and joins; this is cached Canvas artwork,
with no shader dependency. Mountains are drawn before the original foothills and
grass, so fog cannot wash out the playable field. Tree placement still consumes
the same visual random sequence so the static grass pattern stays unchanged;
no close image trees, extra ground strokes, or extra mist cover the field. Its
existing midground and foreground animated grass are unchanged. All nine stages have distinct compositions in version 1.17.0: orchard canopy and
petal path, shallow rain pools, bamboo road, snow drifts, ruined temple, coastal
stacks and a moonlit gate. Each has a dedicated composition module. scene-kit.ts
supplies native-aspect stamps, packed frames, anchor rotation and cached contact
fading. Water motion draws before figures and respects reduced motion/flashes.
Characters and primary equipment also use modular image artwork. Stage palette
changes rebuild the layered caches directly. The former background glow and
stage wipe paths have been removed.

Ink is the only rendering path. Startup waits for image decoding and validates
required figure and scene families. Failed assets display a retry screen instead
of substituting old scenery. Each renderer instance owns its loaders and caches;
disposal releases them without touching another preview.

## Verification

Focused browser checks cover legacy saved artwork flags, absence of the mode
selector, inert backtick rendering behavior, cinematic film/scene persistence,
and loading delay, disposal, failure and retry. Layered-environment checks cover
independent instances, cache reuse, allocation bounds, context restoration,
accessibility motion and missing-asset transparency. Settings unit tests verify
old artwork flags are ignored while unrelated saved preferences survive.

Use the main checkout's Vite server when testing. A server already running on
port 5173 can belong to another checkout; do not interpret those test results
as verification of main.

## Midground field props

The first field adds three separate atlases for rolling earth banks, shrubs, and
low rock clusters, with four variations per atlas. The midground renderer places
small, sparse groups around the distant tree baseline and caches them on the
existing distant plane. Each object preserves its image aspect ratio. Bank width,
shrub density, and rock frequency can be adjusted independently in midground.ts.
The original static and animated grass remains unchanged. No shader is required.

## Meadow transition

The first Ink field reduces the two classic ground-mist strips to 30% strength.
Broken grass edges and flattened meadow patches are cached on its base layer;
they supplement the unchanged live grass. Sparse fog-wisp sprites drift slowly
above that transition before characters are drawn. Reduced motion, reduced flashes,
and Low effects quality freeze their movement. The three atlases have four
variations each, drawn at native aspect ratio with soft, low-opacity edges.

The Ink field omits the two original decorative Jizo statues at the left edge. The Ink field replaces those rocks with irregular faceted boulders from a separate atlas. Their frame rectangles and ground anchors live in foreground.ts; two variants are cached in the base before animated grass, preserving their native aspect ratio.


Use the [cinematic scene viewer](cinematic.md) to compare scene artwork and films without starting a run.

See the [stage art and composition plan](stage-art-plan.md) for scene identities, asset reuse, and implementation status; stages 3–9 remain planned.

## Last Light Ridge

Version 1.16.0 replaces stage index 1's Ink bamboo prototype with an exposed
hillside and open valley. Its display name changes from Dusk to Last Light Ridge;
the existing gust weather and gameplay behavior remain.

The cached composition in src/rendering/environment/ridge.ts reuses mountain,
pine, field-bank, shrub, and field-rock atlases. A descending irregular ridge,
low sun, sparse left-side pines, and valley haze distinguish it from the layered
first field. Terrain shading blends the rising bank into the combat ground.
Native sprite proportions are retained at desktop and tablet sizes. Existing
static and animated grass remain, and film looks still apply downstream.

No new image was needed. See the [visual asset library](environment-asset-library.md)
for all sheets, measured dimensions, cell descriptions, current anchors,
and known packing limitations. Optional background hooks apply only when supplied;
The first Ink field keeps its existing composition.
## Version 1.17.0 art review

All nine compositions were loaded through the local preview; new scenes were
visually reviewed at desktop 1440 x 900 and tablet 768 x 1024. A focused loader
check covered cache reuse, rapid scene changes, disposal and per-scene image
counts (four to nine). Strict TypeScript passed. No full build or broad browser
suite was run during this art iteration. The original field grass is unchanged;
Ink snow uses cached sparse short tips to expose snowdrifts, and Ink bamboo
suppresses the classic foreground stalk overlay. Gameplay simulation is unchanged.

Player and weapon replacements share the Ink presentation path. See
[player artwork](character-art.md).


## Hollow Bamboo Road foreground (1.23.0)

Stage 4 reuses the bamboo atlas in `bamboo-foreground.ts` as two near edge planes.
`environmentRenderer.drawForeground()` runs after player/companions, before grass,
weather and film grading. It only draws after a successful Ink background. Full-height native-aspect clumps have their roots
below the viewport and fade toward the central encounter area. Portrait/tablet
composition leaves the central 60% clear; landscape leaves 52% clear. Sway freezes
for reduced motion/flashes. The private caches are capped at two million pixels
and disposed with the environment renderer. See the
[reuse contract](../../src/rendering/environment/assets/bamboo-foreground.md).
Strict TypeScript and desktop/tablet cinematic previews passed without a build.
