# Snow boulders atlas

Generated with built-in imagegen 2026-10-01 from [foreground-boulders-atlas.png](foreground-boulders-atlas.png).
Complete derived sprites with snow resting on upper surfaces; NOT fitted overlays.
Source subject order remains TL/TR/BL/BR matching the reference, but packing and
silhouettes changed, so these cannot be composited on the originals as masks.

Actual PNG dimensions: 1774 x 887. Four visual variants. Fully transparent pixels:
1042550. Maximum alpha at central vertical/horizontal seam: 0 / 0 (0-255).
Clear central seams. Four variants fractured/split slab/wedge/crag, source cells use887 x443.5 Canvas rectangles. Winter uses top-left variant0, normalized anchor(.5,.95), ground fade .86-.97.

Source image origin top-left; rectangle values x,y,width,height in pixels.
Preserve native aspect. Snow is warm ivory over charcoal/gray facets, suitable for
downstream film grading. No baked scene sky or falling snow. Avoid mirrored near
props because light direction reverses; not animation frames. Winter caches sprite
source selection and ground fades in its layer build, not each animation frame.

Visually inspected snow accumulation, dark exposed surfaces and actual alpha.
Original full generated sheet is retained as snow-boulders-atlas.png. No pixel edits.

## Generation prompt

Create full snow-covered sprite variants of the four boulders in the reference, matching charcoal faceted Japanese dry-ink illustration exactly. Preserve the four reference subjects in their same top-left/top-right/bottom-left/bottom-right order, basic silhouettes and view. Add physically resting ivory snow caps on upper branches or upward-facing rock ledges, irregular accumulated snow volumes, exposed dark sides/trunks still dominant. This is complete derived art not an overlay. Strict 2x2 wide 2:1 canvas with genuine transparent exterior. Keep each complete object inside its cell with generous 10 percent transparent margin; shrink uniformly inside each cell if necessary. No art crossing center divisions. Neutral ivory ash-gray charcoal, no saturated blue, no scenery, ground plate, sky, fog, falling snow particles, labels or grid. Upper-left soft light, rough brush texture inside forms, broad readable shapes.
