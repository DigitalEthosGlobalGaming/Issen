# Snow pines atlas

Generated with built-in imagegen 2026-10-01 from [pine-atlas.png](pine-atlas.png).
Complete derived sprites with snow resting on upper surfaces; NOT fitted overlays.
Source subject order remains TL/TR/BL/BR matching the reference, but packing and
silhouettes changed, so these cannot be composited on the originals as masks.

Actual PNG dimensions: 1254 x 1254. Four visual variants. Fully transparent pixels:
1127343. Maximum alpha at central vertical/horizontal seam: 250 / 0 (0-255).
Corrected packing once, but broad cell0 still reaches across vertical midpoint. Winter uses safe explicit windows: group variant1 (700,0,554,627), ground anchor normalized (.5,.975); leaning variant3 (660,660,594,594), anchor (.5,.81). Other variants are available but require custom rectangles before reuse. Root positions are visual composition estimates.

Source image origin top-left; rectangle values x,y,width,height in pixels.
Preserve native aspect. Snow is warm ivory over charcoal/gray facets, suitable for
downstream film grading. No baked scene sky or falling snow. Avoid mirrored near
props because light direction reverses; not animation frames. Winter caches sprite
source selection and ground fades in its layer build, not each animation frame.

Visually inspected snow accumulation, dark exposed surfaces and actual alpha.
Original full generated sheet is retained as snow-pines-atlas.png. No pixel edits.

## Generation prompt

Create full snow-covered sprite variants of the four pines in the reference, matching charcoal faceted Japanese dry-ink illustration exactly. Preserve the four reference subjects in their same top-left/top-right/bottom-left/bottom-right order, basic silhouettes and view. Add physically resting ivory snow caps on upper branches or upward-facing rock ledges, irregular accumulated snow volumes, exposed dark sides/trunks still dominant. This is complete derived art not an overlay. Strict 2x2 square canvas with genuine transparent exterior. Keep each complete object inside its cell with generous 10 percent transparent margin; shrink uniformly inside each cell if necessary. No art crossing center divisions. Neutral ivory ash-gray charcoal, no saturated blue, no scenery, ground plate, sky, fog, falling snow particles, labels or grid. Upper-left soft light, rough brush texture inside forms, broad readable shapes.


Source generation exec-acf13d78-a971-46f2-82e7-8c71eb11f7f5.png; accepted packing correction exec-36c54b4f-924f-491d-b0cc-f5ee38cd7be8.png. Correction prompt asked to shrink each complete tree to 65 percent in its quadrant, root center at .5/.85, preserve snow/style, remove divisions overlap. Actual residual overlap is documented above.
