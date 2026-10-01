# Enemy front-view headwear

Full original generated PNG: [enemy-headwear-atlas.png](enemy-headwear-atlas.png),
1536 x1024 RGBA. Six independent front-view modules, visually arranged3x2.
Do not use equal512px cells: the brim widths produce uneven packing.

Style references inspected before generation: [player-ronin-simple.png](player-ronin-simple.png)
and [outfit-headwear-atlas.png](outfit-headwear-atlas.png). Broad flat charcoal,
gray and muted ivory facets; no weave/grain/fine ornament. Front face openings
are empty so the renderer can retain its face beneath the accessory.

## Measured source windows

Coordinates top-left origin, x,y,width,height in pixels. Bounds are inclusive
alpha>16, local to each frame. Suggested anchors are visually inferred attachment
points, not verified rig fits. Keep native aspect and overlap underlying head.

| Part | Source window | Local visible bounds | Suggested local anchor |
| --- | --- | --- | --- |
| Kasa | 0,0,575,512 | 10,139 to562,424 | 287,340 brim center |
| Kabuto | 575,0,495,512 | 9,66 to462,480 | 235,275 forehead |
| Swept hair/topknot | 1070,0,466,512 | 37,56 to432,500 | 240,285 hairline |
| Lower-face mask | 0,512,475,512 | 65,90 to442,416 | 255,170 nose bridge |
| Jingasa | 475,512,605,512 | 17,78 to587,374 | 310,285 brim center |
| Hood | 1080,512,456,512 | 32,17 to422,463 | 230,225 upper face opening |

Hats deliberately have broader silhouettes than face-covering pieces. Size against
the original enemy head and shoulders rather than forcing every module to one
width. Preserve original face/head behind helmet, hair and hood openings. Lower
mask only covers nose/mouth. No assembled character is baked into the atlas.
Mirroring changes lighting and hair asymmetry; do not mirror by default. These
are interchangeable modules, not animation frames.

## Inspection and provenance

Generated2026-10-01 using built-in imagegen with transparent_background true.
Initial source exec-f25dd826-7900-4e81-9ce8-2c146f26b10c.png; final source
exec-cf7584e1-f995-4fd6-804e-76d785a0304d.png. Complete final sheet copied unchanged.
Generation display showed background RGB/glow-like colors, so actual alpha was
measured rather than trusting that display:1,013,920 pixels are fully transparent.
Maximum alpha on the six explicit frame edges is1,1,0,1,1,1. Sampled kabuto,
hair and hood face openings are alpha0, as is the inter-object background.
Transparent pixels can retain hidden RGB; respect alpha when decoding/rendering.
No pixel thresholding, repainting or crop files produced. Assembly and pose checks
belong to the renderer integration.

## Initial prompt

Use case: stylized-concept. Create SIX modular FRONT VIEW enemy headwear cutouts in a strict 3 columns by 2 rows atlas, landscape 3:2 canvas and square cells. Reference images style ONLY: extremely simple flat low-poly charcoal/ash/ivory polygon planes, clean silhouette, no grain, no texture, no fine weave/lacing. These must be viewed STRAIGHT FROM THE FRONT at eye level, not rear view. Row1 left: broad straw kasa hat, muted ash warmgray broad conical planes and dark underside, no head. Row1 middle: front kabuto iron helmet, simple crown with modest forehead plate and two cheek-side guards framing an empty transparent face opening, no ornate antlers, no face. Row1 right: loose swept charcoal hair with a small topknot, front hairline arched around an empty transparent forehead/face opening, no skin or head. Row2 left: simple dark lower-face cloth mask, shallow shaped fabric covering nose and mouth, empty object, no eyes or head. Row2 middle: jingasa conical iron hat, darker flatter metal cone distinct from straw kasa, simple small raised center, no head. Row2 right: plain cloth hood front view, dark faceted cloth surrounding a clearly transparent central face opening with short neck sides, no skin/head. All six complete separate objects comfortably centered in each cell with at least 15 percent transparent margins, no crossing any grid division. Each independent equipment piece sized for front-facing game's head. Upper-left light. Preserve broad readable forms for tiny display. No people, faces, shoulders, hands, weapons, text, grid lines, shadows, background. Actual transparent exterior and transparent openings.

## Correction prompt

Fix this game atlas: remove ALL background, ALL glows, ALL cast shadows and vignette so there is TRUE PNG TRANSPARENCY around each headwear object and INSIDE helmet/hair/hood face openings. Keep the exact six simple flat polygon objects but arrange in six equal 3column2row cells with each object scaled to fit within central70percent width and80percent height of own cell. No objects or halos may cross cell boundaries. Hats must remain complete with brims fully inside cells. Kasa, kabuto, hair in top row; mask, jingasa, hood bottom row. Pure flat neutral charcoal/gray planes, NO lighting halos. These are isolated transparent cutout sprites, NOT an atmospheric presentation board. No background pixels, no drop shadow, no text. Keep face openings actually transparent, not black filled cavities.

