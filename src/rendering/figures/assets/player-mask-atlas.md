# Rear three-quarter player mask heads

Image: player-mask-atlas.png, actual1254×1254 RGBA. Four separate wearable heads, facing slightly screen-right from behind. Created2026-10-01 through built-in image generation, transparent_background:true. Style reference player-ronin-simple.png inspected first. Original preserved; project copy unchanged.

## Frames and anchors

Atlas-global coordinates in pixels, origin top-left; rectangles x,y,width,height. Suggested pivots visually inferred at neck overlap, not validated rig fits. **Use packed rectangles rather than equal2×2 cells:** Kitsune ear extends above nominal horizontal midpoint.

| Outfit | Source frame | Neck pivot |
|---|---|---|
| Oni |150,40,436,535|365,540|
| Tengu |692,79,525,497|901,540|
| Kitsune |144,589,458,555|366,1105|
| Noh |733,654,381,497|931,1115|

Alpha>16 visible bounds: Oni154,44,428,527; Tengu696,83,517,489; Kitsune148,593,450,547; Noh737,658,373,489. Frames include4px padding. Pivot positions are atlas-global; subtract frame origin to obtain frame-local pivots.

Render with native aspect; scale based on ordinary cranium/neck rather than totalwidth because Tengu's nose projects right. Horns/ears should increase apparent height rather than shrink head to compensate. Dark tied hair and straps dominate rear view; a narrow side mask edge remains visible. Avoid mirroring unless the character intentionally turns the opposite direction. Use normal source-over before film grading.

## Inspection

61.40% pixels exactlytransparent. Main silhouettes complete and separate, no assembled bodies, labels, grid or backdrop. Extremely faint alpha≤16 specks outside shapes and a few tiny colored edge fringes are present in generated original; not repainted. Crops exclude remote specks. Simple broad facets match base player; Oni/Tengu muted red and Kitsune/Noh ivory side profiles distinguish the heads while preserving rear orientation. Neck underside generated in warm skin tone rather than requested charcoal; overlap with torso collar during integration. No full frontal faces. Assembled pose/scale verification belongs to integration.

## Provenance

Source retained: C:/Users/Trent/.codex/generated_images/01a0f69e-ec38-7b32-ac7e-d8aba4341821/exec-f335065b-eaf0-414e-9ab6-846c2e1677de.png

Reference: src/rendering/figures/assets/player-ronin-simple.png.

Full prompt:

Use case: stylized-concept. Create a single square2x2 atlas of four wearable Japanese MASKED HEAD silhouettes for a rear-view game player. Attached image is STYLE and player HEAD proportion reference, not edit target. Match its very simple flat broad polygon facets, matte charcoal/warmgray, minimaldetail. TRUE transparent background, four complete separate heads centered within quadrants, generous empty margins/gutters40pxminimum. ALL HEADS SEEN FROM BEHIND in rear THREE-QUARTER view turned slightly toward screen RIGHT: back of dark tied hair/hood and dark mask straps dominate; ONLY a narrow right-facing side mask profile visible, never full frontal face pasted on back. Include short charcoal neck underside for torso overlap, no shoulders/bodies. TOP LEFT ONI: dark hair back, muted vermilion-red side mask edge and TWO short angular horns protruding at crown for recognizable rear silhouette, restrained ivory horn tips. TOP RIGHT TENGU: dark hair/hood back and dark muted red side mask with distinctive long straight nose projecting toward RIGHT visible as narrow profile, no full face. BOTTOM LEFT KITSUNE: back dark hood/hair with two pointed ivory fox ears and a narrow ivory fox-mask cheek/snout edge on RIGHT, tiny restrained mutedred accent, no detailed face. BOTTOM RIGHT NOH: plain rounded dark tied-hair back, thin smooth warm ivory theatrical mask side rim visible along RIGHT temple/nose/chin profile, simple understated shape, no horns/ears. All same scale neck/head proportions, neutral upper-left light, economic darkvalue planes. Four modular cutouts NOT assembled person. Square1254x1254 if possible. No labels,text,grid,background,ground,shadows,weapons,front-facing faces,eyes/mouthdetail,finehairstrands. Keep complete horns/ears/nose inside eachcell.

