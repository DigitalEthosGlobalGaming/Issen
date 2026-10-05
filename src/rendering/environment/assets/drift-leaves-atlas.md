# Drifting leaves atlas

Generated with built-in imagegen on 2026-10-05, using `pine-atlas.png` as an actual style reference. Original sheet: 1774 × 887 RGBA, four columns and two rows. Generation requested 1024 × 512; the original is retained at the tool's actual dimensions.

Row-major variants: willow, pointed bamboo, curved bamboo, oval, heart-shaped, maple, ginkgo, curled dry leaf. These are independent variations, not animation frames. Normalized frame-local pivot: `(0.5, 0.5)`. Rotation, mirroring, uniform scaling and vertical flattening are allowed. Render with ordinary alpha compositing and image smoothing; downstream film grading supplies stage colour.

Integer source rectangles `(x, y, width, height)` are `(0, 0, 444, 444)`, `(444, 0, 443, 444)`, `(887, 0, 443, 444)`, `(1330, 0, 444, 444)`, `(0, 444, 444, 443)`, `(444, 444, 443, 443)`, `(887, 444, 443, 443)`, `(1330, 444, 444, 443)`. Actual visible silhouettes are smaller than these rectangles.

Inspection: all eight whole leaves are present and visually separate, with no labels, backdrop or grid. Alpha-zero pixels account for 75.87% of the sheet. Very faint generation specks (alpha at most 16) occur near some cell boundaries; visible silhouettes remain separated. Contact-sheet review at 4, 8, 16 and 32 pixels confirms strong shapes at 16–32 pixels; at 4–8 pixels they function as subtle debris rather than individually identifiable leaf species.

## Generation prompt

Create a new production sprite atlas of eight individual drifting leaves for Issen, using the pine atlas only as reference for charcoal/warm-grey Japanese ink and faceted value planes. Four columns by two rows, desired 1024 × 512, one complete centered leaf per square cell with generous transparent padding. Row one: long narrow willow, straight pointed bamboo, curved crescent bamboo, broad oval. Row two: heart-shaped with clear notch, angular maple, fan-shaped ginkgo, curled dry leaf. Loose unattached leaves in top or shallow turned view, short sturdy stems, bold irregular ink edges, broad charcoal and warm ash-grey facets, restrained lighter planes, no tiny veins or speckles. Readable at 4–32 pixels, similarly sized by largest dimension, suitable for arbitrary rotation, mirroring and scaling. Genuinely transparent background and gutters; no paper, checkerboard, border, labels, shadows, grid, trees or scenery. Match reference palette and ink feeling with simplified detail for game particles.

Runtime IDs and normalized source rectangles are authoritative in `../../scene/drift-catalog.ts`. Uniform-grid boundaries round independently to integer pixels: x = 0, 444, 887, 1331, 1774; y = 0, 444, 887. Earlier inspection rectangles may differ by one transparent gutter pixel.
