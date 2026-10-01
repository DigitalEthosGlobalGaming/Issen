# Snow woodland landmark atlas

Production sprite family for visibly different midground landmarks. Built-in image generation; original generated sheets retained unchanged. Final PNG is a byte-for-byte copy of the selected generated output, with genuine RGBA transparency. No painted background, floor plate, figures, labels or grid.

## Geometry

Actual image: **1254 × 1254 px**. Four exact **627 × 627 px** cells, row-major, top-left origin. Bounds below are inclusive atlas-global pixel coordinates measured at alpha > 16. Ground pivots are **frame-local pixels**, selected at the root contact, not at the bounding-box center.

| Cell | Landmark | Source frame x,y,w,h | Visible global x0,y0,x1,y1 | Ground pivot local x,y |
| --- | --- | --- | --- | --- |
| 0 | Wide windswept pine | 0,0,627,627 | 90,199,622,524 | 525,524 |
| 1 | Slender forked dead pine | 627,0,627,627 | 885,149,1100,553 | 373,553 |
| 2 | Gnarled split-trunk pine | 0,627,627,627 | 90,771,562,1093 | 330,466 |
| 3 | Fallen rooted trunk | 627,627,627,627 | 762,806,1167,1102 | 258,475 |

Use native aspect ratio. For a visible height target, calculate scale from the visible height, not the full padded cell height. Intended tree height is 150–250 screen pixels; broad trees can occupy 20–32% viewport width. The dead pine is intentionally narrower. Fallen trunk is naturally low and diagonal; do not stretch it into an upright tree. Horizontal mirroring and slight terrain rotation are supported; these are independent props, not seamless tiles. Blend normal source-over, film grading downstream. Root fades may be applied at composition time, preserving the PNG.

## Inspection

1305792 pixels have alpha exactly zero, out of 1,572,516. Both central cell seams have maximum alpha **0**, so no visible object crosses either split. Tiny low-alpha generated fringe specks are retained. The closest visible canopy tip reaches x=622 in the upper-left cell; do not expand this source frame into its neighbour. Visually checked full silhouettes: broad left-extending canopy, bare fork, separated twin trunks, and exposed root fan. Snow uses substantial muted-ivory caps while preserving charcoal branch structure. The snow edit retains corresponding identities and approximate placement, but its bounds/anchors are measured independently; do not assume pixel registration with the dry atlas.

## Provenance and full prompts

References: `pine-atlas.png` and `field-rocks-atlas.png` from this directory, inspected before generation. Seasonal edit additionally references the final `woodland-landmarks-atlas.png`.

Use case: lighting-weather edit. Create a SNOW-COVERED seasonal counterpart of this exact four-object woodland landmark sprite atlas. Keep each object's identity, complete silhouette, position, scale, frame layout and large transparent gutters unchanged: broad windswept pine top-left, slender bare forked dead pine top-right, gnarled split-trunk pine bottom-left, fallen rooted trunk bottom-right. Add substantial graphic muted-IVORY snow caps on top-facing pine foliage pads, branch tops, fork crotches and roots, leaving charcoal trunks readable. Dead tree remains bare with small accumulated snow on branch forks; fallen trunk has snow along upper ridge and root tops. Broad simple angular snow planes, not fluffy realistic texture; same ink facets and restrained interior dry brush as source. True transparent alpha everywhere outside objects; no snowfall particles, ground strip, floor, scene, fog, shadow, labels or grid. All full roots/branches strictly inside own quarter, no changes to safe packing.
