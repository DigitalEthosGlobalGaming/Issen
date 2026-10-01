# Front-view ronin enemy atlas

Image: enemy-ronin-simple.png, actual1254×1254 RGBA. Created2026-10-01 with built-in image generation using inspected player-ronin-simple.png as style/proportion reference. Original retained; PNG copied unchanged. Nine independent front-facing rig parts in nominal3×3 arrangement. **Use packed rectangles below: several pieces cross nominal cell boundaries.**

## Geometry

All coordinates atlas-global pixels from top-left. Rectangle format x,y,width,height. Suggested pivots are visually inferred attachment points, not verified rig fits. Visible bounds measured at alpha>16, with4px transparent padding included in source frames.

| Part | Source frame | Pivot | Secondary attachment |
|---|---|---|---|
| torso |63,92,343,334|235,350 waist|235,128 neck|
| head |510,101,230,319|627,397 neck|—|
| left panel |865,63,365,395|1098,101 waist|—|
| right panel |38,470,385,371|200,500 waist|—|
| left sleeve |508,502,242,336|649,538 shoulder|620,791 elbow|
| right sleeve |911,502,246,339|990,537 shoulder|1045,794 elbow|
| left forearm |157,875,139,314|221,908 elbow|226,1154 wrist|
| right forearm |550,875,139,320|611,908 elbow|619,1158 wrist|
| hand |971,944,166,228|1052,991 wrist|1052,1090 grip|

Visible alpha>16 bounds x,y,width,height: torso67,96,335,326; head514,105,222,311; left panel869,67,357,387; right panel42,474,377,363; left sleeve512,506,234,328; right sleeve915,506,238,331; left forearm161,879,131,306; right forearm554,879,131,312; hand975,948,158,220.

Preserve native aspect and use modest joint overlap to hide seams. Limb axes point downward from proximal to distal joints; source silhouette includes some natural lateral offset. Left/right are atlas labels matching requested layout. Retain distinct sleeve and panel art rather than mirror when possible because lighting differs.

## Inspection

69.20% of pixels exactly transparent. Complete silhouettes visually inspected, separated without clipped geometry; very faint alpha<=16 generated specks exist outside main shapes. No cleanup or thresholding performed on PNG. Front V collar and blank warm ivory face distinguish front from rear player. Broad charcoal and warm-gray facets, small restrained value groups, no eye/nose/mouth detail, scenery or text. Integration must independently inspect assembled standing and attack extremes; this asset-only delivery does not claim validated articulation.

## Provenance

Tool transparent_background: true. Reference: src/rendering/figures/assets/player-ronin-simple.png.

Full prompt:

Use case: stylized-concept. Create a modular FRONT VIEW ronin enemy sprite atlas, 3 columns by3 rows, square1254x1254 if possible, TRUE TRANSPARENT background. Attached image is rear-view STYLE+PROPORTION reference, but all NEW parts face the camera. Match very simple flat dark charcoal polygon facets, broad warm gray planes, clean angular silhouettes, no fine detail or texture. Nine separate COMPLETE parts evenly centered within their own cells, at least30px transparent margins within every cell; never crossing cell lines. Row1 left: front-facing sleeveless kimono TORSO neck-to-waist with simple overlapping V collar and broad obi waist band, no arms/head. Row1 middle: front-facing HEAD, tied dark hair/topknot, blank warm ivory faceted face silhouette, NO facial features, short neck, no shoulders. Row1 right: LEFT long flared robe skirt panel waist-to-ankle. Row2 left: RIGHT matching long flared robe skirt panel. Row2 middle: LEFT broad short kimono sleeve shoulder-to-elbow, neutral vertical axis. Row2 right: RIGHT matching sleeve shoulder-to-elbow. Row3 left: LEFT slim wrapped forearm elbow top wrist bottom, no hand. Row3 middle: RIGHT matching forearm, no hand. Row3 right: single compact warm ivory gripping HAND with small charcoal cuff, minimal faceted shape, no weapon. Pieces are rigging cutouts, NOT a diagram or complete assembled human. Concealed top joint overlap on limbs, keep native proportions like reference, all parts front-facing. Small economical value groups, strongest shapes, upper-left lighting, neutral film-gradeable palette. No labels, text, grid, background plates, shadows, ground, weapons, extra body parts, eyes/nose/mouth. Generous empty alpha gutters.
