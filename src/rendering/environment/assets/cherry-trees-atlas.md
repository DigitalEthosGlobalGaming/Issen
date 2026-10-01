# Cherry tree atlas

Generated 2026-10-01 with the built-in image-generation tool for Falling Blossom
Path. Style reference: [pine-atlas.png](pine-atlas.png). Final project source:
[cherry-trees-atlas.png](cherry-trees-atlas.png), preserved complete and unmodified.

Square 1254 x 1254 RGBA PNG, four 627 x 627 cells, top-left image origin.
Frame coordinates and anchors below are pixels. Anchors are visually estimated
trunk ground contacts for composition, not automatically derived alpha centers.

| Cell | Variation | Rectangle x,y,w,h | Suggested anchor x,y in frame | Alpha >16 bounds, inclusive, in frame |
| --- | --- | --- | --- | --- |
| 0 | Broad leaning tree, canopy reaching right | 0,0,627,627 | 250,594 | 116,180 to 593,594 |
| 1 | Upright open branching canopy | 627,0,627,627 | 323,594 | 97,192 to 527,594 |
| 2 | Low spreading tree | 0,627,627,627 | 355,488 | 88,227 to 612,488 |
| 3 | Smaller sparse tree with bent trunk | 627,627,627,627 | 333,483 | 86,89 to 530,483 |

Render with native aspect; vary placement and scale for orchard depth. Avoid
uniform bottom-center registration: root position differs by variant. Cell 0 is
suited to left edge framing; keep its low rightward canopy out of combat silhouettes.
Mirroring can vary planting but reverses light and branch lean; no rotation or
nonuniform stretching is intended. These are variations, not animation frames.
Neutral charcoal trunk facets, warm ivory blossom and dry ink grain retain downstream
film grading. Fine blossom detail should remain subordinate to the tree silhouette.

Validation: inspected final sheet visually. 1,144,076 pixels have alpha zero;
central vertical seam maximum alpha 1, horizontal seam 0. Complete visible trees
stay inside cells; cell 2 rightmost visible pixels have a modest 14px margin, not
the requested 12 percent. Near-transparent dust remains around some trees. No
people, labels, scenery plate or baked sky. Actual alpha exteriors preserved.

Initial output crossed the central division; it was rejected for integration.
Imagegen correction shrank/repositioned the four objects while retaining style.
The accepted full corrected sheet is preserved unchanged in the project PNG.

## Initial prompt

Use case: stylized-concept. Asset type: transparent modular cherry-tree sprite atlas for a Japanese ink game, viewed from shallow side/front at ground level. Reference image supplies charcoal angular trunk facets, dry-brush texture and illustration style ONLY, not pine foliage. Generate FOUR COMPLETE FLOWERING CHERRY TREES, strict 2 by 2 equally sized square cells on a square canvas. Top left: broad leaning cherry tree. Top right: upright tree with an open branching canopy. Bottom left: low spreading cherry tree. Bottom right: sparse smaller cherry tree with visible branches. Dark charcoal trunks and branches, pale ivory blossom clusters with an extremely subtle desaturated warm tint, ash-gray shadow facets. Broad graphic blossom masses with small ragged edges, Japanese sumi-e dry ink, angular low-poly-like planes and restrained paper grain INSIDE the art. Not realistic, not smooth 3D, no saturated pink. Common upper-left light. EACH tree must be fully contained within the middle 70 percent width and 76 percent height of its OWN CELL, with at least 12 percent TRANSPARENT margin on all four sides of every cell. Generous transparent central cross gutter: no leaf, blossom, branch or root may cross the cell boundaries. Tree root contact centered horizontally near 87 percent of cell height. Keep silhouettes varied and useful for repeating at different depths. No background paper, ground plate, scenery, rocks, sky, fog, people, labels, grid lines, watermark or scattered detached petals. Actual transparent exterior. Four variations, not animation frames.

## Packing correction prompt

Edit the exact cherry-tree atlas to fix packing only. Keep all four trees and
ink/faceted charcoal and ivory blossom art. Shrink each tree to 65 percent of
current dimensions within its quadrant; preserve proportions, center root near
82 percent cell height. Square canvas and equal 2x2 cells, at least 12 percent
transparent margins. No blossom/branch/dust at divisions or outer edges. Remove
detached speckles; do not crop branches or add objects/text/background. Actual
transparency. Inspect output rather than assuming the requested margins succeeded.
