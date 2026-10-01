# Companion atlas

Original built-in imagegen PNG, 1254 × 1254 RGBA. Generated 2026-10-01 from `player-ronin-simple.png` as style reference. Source: `exec-ee7c7225-6074-467b-9311-b3f5be107a1b.png`. Original sheet retained unchanged here.

All existing companions: shiba, cat, crow; fourth image is the crow's raised-wing reaction. Animals face right. Broad flat facets and muted brown/ivory/charcoal support downstream film grading. No baked floor or shadow. These are complete sprites, not articulated limbs.

Coordinates below are source pixels with top-left origin; pivots are frame-local foot-contact coordinates. Explicit packed frames replace the requested equal 2×2 grid because seated animals extend below nominal y=627. Do not split at mathematical halves.

| Name | Source rectangle x,y,w,h | Pivot x,y | Visible alpha >16 bounds, global inclusive |
|---|---|---|---|
| Shiba | 0,0,660,665 | 433,637 | 45,46–616,636 |
| Cat | 660,0,594,665 | 364,640 | 705,85–1192,639 |
| Crow perched | 0,665,660,589 | 397,525 | 44,777–626,1190 |
| Crow raised | 660,665,594,589 | 366,525 | 719,691–1237,1190 |

Measured 1,029,400 fully transparent pixels. All four explicit frame boundaries have maximum alpha 1; these negligible generated specks are retained. Full animals and feet are present, with no neighboring-object crop. Crow pose foot pivots share global y=1190 (the measured toe contact). Native proportions are retained. Shiba height is 1.14×caller size; cat height 1.08×size; perched crow width 1.65×size (existing shoulder call uses size 0.1). Both crow frames use the same pixel scale. The raised pose is a reaction replacement, not a verified looping animation.

`createInkCompanionRenderer(doc)` exposes `prepare()`, `draw(type,g,x,y,size,time=0,active=false,reducedMotion=false): boolean`, `dispose()`, and `ready`. False reports unsupported IDs/loading/failure/disposal/invalid geometry; callers do not substitute old animal artwork. Feet remain pinned during subtle pet breathing; reduced motion freezes it and uses perched crow. Caller canvas alpha and transforms are restored. Caller owns selection, film grading, and any reaction effects. Horizontal mirroring is possible if the scene needs it, but default matches existing right-facing companions.

Validation: inspected original appearance and measured alpha/bounds. Runtime fit still requires integrated preview. No gameplay content or settings changed.

## Full generation prompt

Generate a production game companion sprite atlas, transparent background, 2x2 layout of FOUR fully separate complete animals with generous gutters. Reference image is STYLE ONLY: match its very simple broad flat polygon facets, minimal charcoal/ivory planes, clean angular silhouettes, absolutely no grain/fur texture or fine detail. Top left: seated shiba dog side profile facing RIGHT, muted desaturated brown and ivory chest, pointed ears and curled tail, all feet visible. Top right: seated charcoal cat side profile facing RIGHT, pointed ears, long curling tail, broad ash-gray facets. Bottom left: perched crow facing RIGHT, folded wings, long leftward tail, two visible feet together beneath body. Bottom right: SAME perched crow facing RIGHT with wings raised in a restrained reaction pose, feet still at same ground height and body same size as bottom-left. NOT a flying bird. Keep both crows similarly sized; no scenery, floor, shadow, glow, labels, grid or extra objects. Neutral film-gradeable palette, broad 5-10 major planes per animal, tiny restrained eye. Each object fully contained in own quadrant with at least 10% padding. Four isolated flat graphic game cutouts, not rendered 3D toys. Canvas square.
