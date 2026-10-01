# Cherry landmarks atlas

Four new complete cherry silhouettes, generated with the built-in image tool on
2026-10-02 from cherry-trees-atlas.png as a style reference. Tall forked, wide
umbrella, wind-bent and fallen flowering trunk, respectively. Charcoal faceted
trunks, warm ivory/pale blush blossoms, dry ink inside forms and true alpha.

Accepted full PNG: 1254 × 1254. Alpha-zero pixels: 1,084,205. Initial generation
packing was rejected and corrected using the built-in tool. Residual lower-left
root crosses the nominal central division, so **do not use uniform quadrants**.
Safe independent windows (top-left x,y,width,height) are (0,0,627,627),
(627,0,627,627), (0,627,665,627), (665,627,589,627). Their perimeter alpha maxima
are 1,1,0,0. Alpha>16 frame-local bounds, exclusive right/bottom: respectively
(117,90,510,591), (3,245,570,596), (79,84,628,532), (42,135,531,537).

Ground anchors, visually estimated GLOBAL source pixels: (322,590), (968,595),
(478,1158), (1010,1164). Runtime landmark-layout.ts records alpha>16 bounds with
four-pixel padding and converts these anchors to normalized cropped coordinates.
Source sheets remain untrimmed; renderer crops only at draw time. Preserve native
aspect. Midground placement uses root fading and slight terrain angle; no sky,
scene fog, ground plate, cast shadow or figures are baked in. These are independent
variations, not animation frames. Upper-left lighting means mirrored forms reverse
light direction. Inspect at intended180–260px scale and film grade.

## Provenance and prompts

Initial: C:/Users/Trent/.codex/generated_images/01a0f695-0376-77a3-9c20-3f667b8e27a7/exec-7aae63b9-c54c-4766-806d-f78a4f8ae423.png
Accepted packing edit: C:/Users/Trent/.codex/generated_images/01a0f695-0376-77a3-9c20-3f667b8e27a7/exec-d5f1af69-dd39-4670-b61b-bb9f35dec7c2.png

Generation prompt:
Use case: stylized-concept. New project asset: four DISTINCT cherry blossom landmark tree silhouettes in a 2x2 square sprite atlas with TRUE TRANSPARENT background. Input image is STYLE REFERENCE ONLY. Match its charcoal faceted Japanese dry-ink trunks and warm ivory very pale blush blossoms, but simplify into broad graphic low-poly planes and clusters so each reads at 180-260px height. Four complete separate objects: top-left tall narrow forked tree with a few blossoms on upward branches; top-right very wide low umbrella canopy on short thick twisted trunk; bottom-left dramatically wind-bent tree with crown leaning left and exposed roots; bottom-right low fallen flowering trunk with branches reaching upward. Side/front three-quarter landscape prop view, roots all shown, upper-left soft light, dry brush texture INSIDE forms. These must have clearly different silhouettes, not repeated tree with recoloring. Each complete object centered inside its own cell with at least 12% transparent margins on every side, no crossing center divisions. No ground plate, floor, landscape, sky, fog, people, animals, text, labels, grid lines, checkerboard or opaque backdrop. Each root can fade through compositing later; do not bake fog. Preserve neutral palette for runtime film grading. Produce only the sprite atlas.

Packing edit prompt:
Edit this cherry landmark atlas for production packing ONLY. Keep all FOUR existing distinct tree designs, their ivory/pale blush blossoms, dark faceted trunks and dry ink style. Arrange them in strict equally-sized 2x2 square cells, same order. Uniformly shrink EACH complete tree to 70% of its current size, center it in its own cell and position roots at 85% down that cell. Wide umbrella canopy must fit FULLY in upper-right cell, and leaning lower-left tree must fit FULLY inside lower-left cell. Give at least12% transparent gutters to all cell edges. NO object or stray brush mark crosses the central horizontal/vertical division, NO clipped edge anywhere. Remove tiny stray marks at exterior edges. Preserve TRUE TRANSPARENT exterior and inter-object gaps, no backdrop, grid, labels, text, sky, paper rectangle. Do not introduce new objects or change silhouettes.
