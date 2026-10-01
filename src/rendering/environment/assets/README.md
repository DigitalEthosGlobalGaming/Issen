# Generated environment sprite atlases

Generated on 2026-10-01 with the built-in image generation tool, using the
user-supplied charcoal bamboo duel image as an atmosphere reference.

- bamboo-atlas.png: four upright bamboo clumps, 2 by 2 equal cells.
- pine-atlas.png: windswept pine silhouettes for the first scene, 2 by 2 equal cells.
- mountain-atlas.png: four wide ridge segments, 2 by 2 cells; overlap and fog hide joins.
- field-banks-atlas.png: four low rolling earth banks, 2 by 2 cells.
- shrubs-atlas.png: four sparse shrub variations, 2 by 2 cells.
- field-rocks-atlas.png: four low rock clusters without vegetation, 2 by 2 cells.
- grass-edges-atlas.png: four broken grass fringe strips, 2 by 2 cells.
- meadow-patches-atlas.png: four flattened meadow textures, 2 by 2 cells.
- fog-wisps-atlas.png: four separate pale fog wisps, 2 by 2 cells.
- foreground-boulders-atlas.png: four irregular foreground boulders; explicit integer frames.
- rocks-atlas.png: rocks, grasses, boulder, and rubble, 2 by 2 equal cells.

All eleven files have transparent backgrounds. Cells are selected with Canvas drawImage
source rectangles and reused at multiple depths; no baked full-screen picture is
used. Keep transparent margins when replacing cells so scaling and mirroring do
not include neighbouring artwork. Existing sheets do not all meet this ideal:
pine canopy, meadow patches and fog have artwork at/across cell divisions.
See the [measured visual catalog](../../../../docs/features/environment-asset-library.md)
for all eleven source previews, cell descriptions, dimensions, alpha and reuse limits.

Art direction: near-black sumi-e dry brush, desaturated ivory highlights, angular
faceted shapes, rough texture inside the silhouettes, no characters or labels.
Final film looks and motion are applied in code, not baked into these assets.


## Foreground boulders

foreground-boulders-atlas.png replaces the smooth foreground ellipses only in
Ink scene 0. Original full generated sheet retained, 1774 x 887 RGBA pixels,
2 x 2 cells (top row height 443, bottom row 444; width 887 each).
Frame rectangles and frame-local pixel ground anchors are recorded in
../foreground.ts. Variants are fractured, split slab, sloped wedge and compact crag.
These are individual props, not seamless tiles. Preserve native aspect and upper-left
lighting; current composition does not mirror or rotate them. Two variants are
cached into the ground layer, before live animated grass and downstream film grading.

Generated 2026-10-01 using the built-in image tool, with field-rocks-atlas.png as
style reference. Source generation: exec-5a20ce24-065a-4df4-964c-6016c04504d5.png.
Prompt: Four distinct complete low irregular angular boulders, strict 2 x 2 atlas,
wide 2:1 canvas, shallow front/side view, upper-left light; fractured boulder,
split slab, sloped wedge, compact crag. Charcoal, warm gray, muted ivory broad
facets, rough ink-paper texture inside rocks, dry brush edges, darker foreground
contrast. True transparency and isolated complete cells. No smooth ovals,
backdrop, fog, scenery, grass, figures, text, grids or extended cast shadows.
Alpha inspected: transparent exterior with near-opaque textured interiors.
