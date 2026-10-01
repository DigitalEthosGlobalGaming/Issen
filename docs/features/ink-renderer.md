# Ink layer renderer preview

Version 1.14.0 adds an optional image-sprite environment. Choose **Options →
Display and Accessibility → Scene artwork → Ink layers (preview)** from the title
or a paused run. The backtick key also toggles artwork outside menus; typing, held keys, modifier chords, and custom combat bindings take precedence. Classic remains the default; the choice is saved with the active
profile's existing settings. Switching does not reset an encounter or alter its
random stream, equipment, or checkpoint. Press the backtick key to toggle artwork
from the title, during play, or while paused. The shortcut ignores held keys,
modifier chords, text entry, and open panels; custom combat bindings take priority.

## Composition and ownership

The router in src/rendering/environment/index.ts owns loading, atlas drawing,
three cached depth planes, mist, and disposal. The runtime passes an explicit
Canvas 2D context and presentation frame; it still owns combat composition and
the final film pass. The three planes are sky/ground, distant scenery, and nearby props. Their contents
vary by scene. Atlas cells can be repeated, mirrored, positioned, and scaled
independently before caching. Distant and near planes have different small
horizontal offsets. No WebGL or recovered 3D geometry is required.

The eleven PNG atlases contain four cells in a 2 by 2 grid. The foreground boulder sheet has explicit pixel rectangles because its height is odd. Drawing source
rectangles selects a sprite without splitting files or stretching a full scene.
The assets are AI-generated cutouts based on the user's ink-and-mist atmosphere
reference: charcoal bamboo, rough ivory highlights, faceted rocks, and grasses.
The generated full-scene concepts were exploration only and are not shipped.

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

## Prototype scope and fallback

The first scene retains the classic sky, rolling field, and dense static
grass as its base. The base omits its procedural pine row and edge tree; only
generated pine sprites populate the distant foothills. A four-cell mountain atlas
replaces the procedural ridges through a background rendering callback. Three
rows overlap, mirror, and repeat the tiles at their native aspect ratio. Per-row
fog tint and alpha fading soften detail and joins; this is cached Canvas artwork,
with no shader dependency. Mountains are drawn before the original foothills and
grass, so fog cannot wash out the playable field. Tree placement still consumes
the same visual random sequence so the static grass pattern stays unchanged;
no close image trees, extra ground strokes, or extra mist cover the field. Its
existing midground and foreground animated grass are unchanged. Stages 3–9 currently use the bamboo
preview with their stage palette, weather, and gameplay. Unique image sets for
the shore, cherry blossom, temple, and other stages are future art work. Character
sprite replacement is also future work. Classic background glow overlays and
the classic stage wipe are skipped while the ink background is active; stage
palette changes rebuild the layered caches directly.

Classic scenery is drawn while atlases load and if an asset fails. The persisted
choice stays Ink, allowing the next application load to retry. Each renderer
instance owns its loaders and caches, and disposal releases them without touching
the live scene or another preview.

## Verification

The renderer-switch browser tests cover live switching during a paused run,
unchanged checkpoint/random state/film selection, saved preference reload,
tablet/desktop resize, default restoration, and unavailable assets.
The layered-environment browser tests cover independent instances, cache reuse,
allocation bounds, state restoration, disposal, and fallback pixels.
Settings unit tests cover legacy/default/invalid renderer values.

Use the worktree's own Vite server when testing. A server already running on
port 5173 can belong to another checkout; do not interpret those test results
as verification of this worktree.

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

The Ink field omits the two original decorative Jizo statues at the left edge. Classic retains them and its original oval foreground rocks. The Ink field replaces those rocks with irregular faceted boulders from a separate atlas. Their frame rectangles and ground anchors live in foreground.ts; two variants are cached in the base before animated grass, preserving their native aspect ratio.


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
for all eleven sheets, measured dimensions, cell descriptions, current anchors,
and known packing limitations. Optional background hooks apply only when supplied;
Classic artwork and the first Ink field keep their existing composition.