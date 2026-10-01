# Flat faceted armour modules

Generated 2026-10-01 with built-in imagegen.
Reference: [player-ronin-simple.png](player-ronin-simple.png), inspected before generation.
Project original: [armour-plates-atlas.png](armour-plates-atlas.png), unmodified full1254 x1254 RGBA PNG.

Simple large charcoal/gray planes, sparse broad lamellar bands, no fine lacing,
fabric grain or painted scene. This flat treatment intentionally follows the latest
player direction rather than the earlier textured environment assets.

## Frames and attachments

The visual arrangement is2x2 but actual complete objects require the explicit
source windows below; equal627px quadrant cuts would clip torso and waist art.
Image coordinates originate at top-left. Bounds are inclusive alpha>16, local
to each frame. Attachment points are visual estimates for integration, not a
verified rig fit.

| Part | Source x,y,w,h px | Visible bounds in frame | Attachment in frame px |
| --- | --- | --- | --- |
| Rear torso cuirass | 0,0,700,627 | 79,74 to662,606 | Top center375,74 |
| Screen-right shoulder guard | 700,0,554,627 | 149,116 to493,587 | Top strap290,116 |
| Screen-left shoulder guard | 0,650,580,604 | 64,45 to439,524 | Top strap315,45 |
| Rear waist skirt plates | 600,650,654,604 | 22,81 to601,488 | Belt center315,100 |

The generated shoulder directions differ from the prompt labels: top-right
slopes right and bottom-left slopes left. Use those actual visual roles for the
rear-view player. Separate asymmetric guards avoid flipping light direction.
Native aspect should be preserved. A torso visible width0.35 at player height1
gives visible height approximately0.32; inspect the assembled placement against
the existing torso target0.35 x0.355 rather than stretching the art automatically.
Shoulder plates should overlap upper-arm cloth at attachment; skirt plates
overlap the belt and upper hakama. No limbs, hands or weapon are baked in.

Intended shared reuse: Yoroi, Helm armour and armour beneath Jinbaori.
Muted runtime palette changes may distinguish equipment; base plates remain
neutral for downstream film grading. These modules are not animation frames.
Do not rotate or mirror the torso; shoulder rotation must follow the actual rig.

## Inspection

Visually inspected all four modules for simple facets and complete shapes.
951,498 pixels have alpha0. Maximum alpha on the explicit frame edges is
0,0,1,1 respectively; no visibly opaque neighbouring-object fragments occur.
Original strict15-percent padding request was not fully followed, so explicit
frames supersede generic grid slicing. Actual joint extremes and outfit
assembly are the integration renderer's validation responsibility.

## Full generation prompt

Use case: stylized-concept. Generate a game armor module atlas matching the provided player sprite's EXACT SIMPLE FLAT LOW-POLY STYLE: large flat charcoal and gray polygon planes, minimal muted ivory highlights, no texture, no grain, no ink brush noise, no weave, no fine lacing, no photoreal material. Reference is only a style and rear-view anatomy reference. FOUR separate modules on square transparent canvas in strict 2x2 cells. Top-left: back-facing lamellar cuirass panel for the rear torso, broad roughly square upper back, slightly tapered waist, only four broad horizontal overlapping plate bands. No attached arms or neck/body. Top-right: LEFT hanging rectangular shoulder guard (sode), three broad segmented horizontal plates, seen from behind, top attachment at center, slightly angled outward left. Bottom-left: RIGHT shoulder counterpart facing right, common lighting and same proportions. Bottom-right: lower-waist segmented skirt plate cluster, three broad hanging panels, rear view, top attachment belt line and modest outward flare. Pieces neutral dark charcoal and muted gray, subtly lighter top-left planes. Rear torso intended width .35 and height .355 relative to player total height1; shoulders independently attach to rear rig, no bodies baked in. All pieces complete with 15 percent transparent gutters around each cell, no overlap or cut edges. No characters, hands, faces, swords, text, grid, shadows, background or extra objects. Actual transparent exterior. Clear readable simple armor at small game scale.
