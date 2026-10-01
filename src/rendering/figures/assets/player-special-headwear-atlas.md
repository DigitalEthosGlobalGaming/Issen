# Player special headwear and tail

Generated2026-10-01 with built-in imagegen, transparent_background true.
Reference [player-ronin-simple.png](player-ronin-simple.png) was inspected for the
current broad flat charcoal/gray facet style. Project source
[player-special-headwear-atlas.png](player-special-headwear-atlas.png) is the
complete unchanged1254 x1254 RGBA generated sheet.

Four rear-view modules, arranged2x2 in627 x627 cells. These are equipment parts,
not animation frames. Neutral muted colors retain downstream film grading.
There is no cloth grain, tiny stitch detail, background scene or whole character.

## Frames and attachment points

Coordinates are atlas-global pixels, top-left origin. Source rectangles are
x,y,width,height and retain4px padding around alpha>16 silhouettes.
Suggested pivots are visual attachment estimates, pending rig assembly review.

| Module | Source rectangle | Pivot atlas-global | Role |
| --- | --- | --- | --- |
| Komuso basket |147,92,357,501|326,552|Full rear head cover; lower rim overlaps neck |
| Kabuki ivory mane |703,85,494,507|943,540|Replace rear hair/head silhouette; red strap at neck |
| Tanuki hood |101,702,458,411|330,1058|Full rear head cover with ears, neck overlap |
| Tanuki tail |690,783,526,369|720,860|Left root attaches at body-right; rest extends right/down |

Source cell order: basket top-left; mane top-right; hood bottom-left; tail bottom-right.
Measured inclusive alpha>16 bounds:151,96 to499,588;707,89 to1192,587;
105,706 to554,1108;694,787 to1211,1147. Equal cell slicing is safe if registration
padding is retained, but the tight rectangles above make sizing more convenient.
Convert each global pivot to frame-local by subtracting rectangle x/y.

Preserve native aspect. Basket is deliberately taller than a bare head; mane is
broader than the ordinary topknot. Tanuki hood includes no face/muzzle. Tail has
three broad dark bands, no fine fur. Prefer dedicated orientation over mirroring;
flipping changes lighting and tail attachment side. Tail may rotate subtly around
its left attachment if the rig supports it. Check head/shoulder overlap and tail
occlusion in assembled poses rather than assuming atlas appearance proves fit.

## Inspection and provenance

Visually inspected all pieces for front/back consistency and flat simple forms.
981,043 full-sheet pixels have alpha0. Maximum alpha at each nominal cell perimeter
is1/255, so no visible opaque adjacent piece crosses a cell. True transparency
retained; no alpha cleanup or image repainting performed. Fine near-transparent
specks may remain outside visible bounds. The project PNG preserves the full generated sheet unchanged.

## Full generation prompt

Use case: stylized-concept. Create a square transparent 2x2 atlas of FOUR independent REAR VIEW modular player costume pieces. Match attached reference exact simple flat low-poly art: only a few broad clean charcoal/warmgray/ivory polygon planes, NO grain, texture, fine weave, stitches, tiny detail, or realism. Top-left: komuso basket hat covering whole head down to neck, rear view, tall tapered cylindrical straw basket, muted gray-tan, broad faceted bands imply woven material with NO fine weave. Top-right: kabuki broad ivory angular wild hair mane, REAR VIEW, layered large pointed ivory locks, small muted red strap and underside visible at neck, no face or mask. Bottom-left: tanuki brown cloth hood from BEHIND, rounded small animal ears, broad muted brown planes and darker ear interiors, short neck attachment, NO animal face, eyes or muzzle. Bottom-right: separate tanuki striped tail, horizontal curved appendage attached at its LEFT end to player body-right, extends right and curves slightly downward, three broad dark bands over muted brown, no fur texture. Each object complete within its own quadrant with at least15percent empty margin on all sides. TRUE transparent background and generous central gutter. No head/body/skin, figures, ground, shadow, glows, text, labels or grid. Common upper-left light. Must remain readable at tiny game scale. Four modular pieces, not a whole character.
