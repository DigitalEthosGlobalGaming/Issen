# Woodland landmark atlas

Production sprite family for visibly different midground landmarks. Built-in image generation; original generated sheets retained unchanged. Final PNG is a byte-for-byte copy of the selected generated output, with genuine RGBA transparency. No painted background, floor plate, figures, labels or grid.

## Geometry

Actual image: **1254 × 1254 px**. Four exact **627 × 627 px** cells, row-major, top-left origin. Bounds below are inclusive atlas-global pixel coordinates measured at alpha > 16. Ground pivots are **frame-local pixels**, selected at the root contact, not at the bounding-box center.

| Cell | Landmark | Source frame x,y,w,h | Visible global x0,y0,x1,y1 | Ground pivot local x,y |
| --- | --- | --- | --- | --- |
| 0 | Wide windswept pine | 0,0,627,627 | 92,202,617,521 | 525,521 |
| 1 | Slender forked dead pine | 627,0,627,627 | 889,153,1097,551 | 373,551 |
| 2 | Gnarled split-trunk pine | 0,627,627,627 | 94,775,561,1091 | 330,464 |
| 3 | Fallen rooted trunk | 627,627,627,627 | 766,808,1163,1099 | 258,472 |

Use native aspect ratio. For a visible height target, calculate scale from the visible height, not the full padded cell height. Intended tree height is 150–250 screen pixels; broad trees can occupy 20–32% viewport width. The dead pine is intentionally narrower. Fallen trunk is naturally low and diagonal; do not stretch it into an upright tree. Horizontal mirroring and slight terrain rotation are supported; these are independent props, not seamless tiles. Blend normal source-over, film grading downstream. Root fades may be applied at composition time, preserving the PNG.

## Inspection

1334242 pixels have alpha exactly zero, out of 1,572,516. Both central cell seams have maximum alpha **0**, so no visible object crosses either split. Tiny low-alpha generated fringe specks are retained. The closest visible canopy tip reaches x=617 in the upper-left cell; do not expand this source frame into its neighbour. Visually checked full silhouettes: broad left-extending canopy, bare fork, separated twin trunks, and exposed root fan. Snow uses substantial muted-ivory caps while preserving charcoal branch structure. The initial generated sheet had overlapping nominal cell bounds; the selected packing correction places each whole silhouette in its own cell.

## Provenance and full prompts

References: `pine-atlas.png` and `field-rocks-atlas.png` from this directory, inspected before generation.

### Initial prompt

Use case: stylized-concept. Production environment landmark sprite atlas for Issen. Use the two attached existing pine and rock sheets ONLY as palette/ink style references; create NEW clearly different silhouettes. Square atlas, 2x2 grid of exactly FOUR complete isolated woodland objects on TRUE TRANSPARENT alpha. Every object fully inside its own quarter with generous 8% transparent padding and clear central gutters. TOP LEFT: broad low windswept pine, trunk leaning right, long almost-horizontal asymmetrical canopy extending left. TOP RIGHT: tall slender dead pine, bare trunk with two distinctive forked upper branches, few broken stubs, no foliage. BOTTOM LEFT: ancient squat gnarled pine with two visibly split trunks and broad sparse separated foliage pads, large negative spaces between branches. BOTTOM RIGHT: fallen diagonal rooted trunk with exposed root fan at left, broken angular end at right, two short branch stubs; no standing tree. Strongly distinct outer silhouettes readable at 150-250 pixels tall and 20-32% viewport width. Side-on shallow game camera, complete root contacts. Charcoal, warm gray and muted ivory broad faceted value planes; irregular dry ink edges, restrained dry-brush texture only inside the silhouettes. Simplify the references: broad planes, no tiny realistic bark or needle detail, no glossy 3D. Soft common upper-left lighting. No ground strip, no floor plate, no cast shadow, no backdrop, no fog, no landscape, no figures, no text, no visible grid, no checkerboard. Preserve genuine alpha outside objects.

### Packing correction prompt

Edit this woodland landmark atlas only for clean sprite packing. Keep the SAME four tree identities, same ink style, same palette and silhouettes. Scale each whole object DOWN by about 25% within its own quadrant and recenter it: windswept pine top-left, bare forked dead tree top-right, split-trunk pine bottom-left, fallen rooted trunk bottom-right. Every COMPLETE object must fit wholly inside its exact quarter of this square canvas with at least 45 pixels of fully transparent margin on ALL sides. No part may cross the horizontal or vertical center lines. Leave a visibly wide clear central cross-shaped transparent gutter. Do not cut branches, canopy or roots. Preserve true transparent alpha background, no background/floor/shadow/grid/text. This is exact packing correction, not new scenery.
