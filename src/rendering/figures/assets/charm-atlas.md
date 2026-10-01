# Charm sprite atlas

Image: charm-atlas.png,1536×1024 RGBA,12 independent pendants. Generated2026-10-01 with built-in imagegen transparent_background:true using inspected player-ronin-simple.png style reference. Source copied unchanged and retained.

## Measured frames

Atlas-global pixels, top-left origin, x,y,width,height. Four columns/three visual rows but **not equal third-height cells**. Source frames include4px padding. Suspension pivot is the center of the top edge of each frame; renderer size means total height including loop. Loops may need tiny horizontal adjustment for extreme closeups; gameplay placement uses centered top attachment.

|Index|Piece|Source rectangle|
|---|---|---|
|0|Cross-block charcoal pouch|110,22,265,336|
|1|Ivory narrow pouch|501,21,166,336|
|2|Gold round pouch|802,42,247,311|
|3|Red diamond pouch|1159,25,268,334|
|4|Suzu bell|157,384,173,245|
|5|Beckoning cat|491,369,200,275|
|6|Daruma|809,371,238,283|
|7|Fox flame|1199,374,192,287|
|8|Glass wind chime|147,650,170,353|
|9|Ofuda paper|509,650,141,332|
|10|Mirror|810,670,238,296|
|11|Fortune knot|1179,681,227,293|

## Recipes

hisshou0 red; kaiun2; yakuyoke0 graygreen; enmei1 green; shobai2 bronze; kotsu3 bluegray; gakugyo1 violet; suzu4; maneki5; daruma6; kitsunebi7; furin8; ofuda9; kinun2 gold; kachi0 indigo; shingan3 purple; ryoen3 rose; kagami10; omikuji11. Pouch tint is a restrained source-atop overlay preserving facets and symbols. Unique pendant silhouettes retain original accents. No charm and unknown IDs return false for caller fallback. This defines presentation only, never gameplay effects or unlocks.

## Inspection and integration

68.06% of pixels exactlyalpha0. Broad shapes visually inspected. Background RGB contains studio-like colors in fully transparent pixels; sampled gutters(400,250),(750,500),(700,950) are alpha0. Respect alpha; do not flatten. Pieces are separate, complete and crop-safe. Tiny residual edge alpha may exist; no threshold/cleanup performed. Faces only use minimalcat/darumashapes. Script marks are abstract geometry, not claimed readable Japanese.

ink-charms.ts owns image lifecycle and up to32 small cropped/tinted canvases each128px high. prepare resolvesfalse on invaliddimensions/failure/disposal. draw returnsfalse whileloading or forunknown/nocharm, preserves caller canvas state, and consumes no clocks or randomness. x,y is the suspension point; size is full spriteheight, width follows nativeaspect. Caller draws cords and supplies pose transform, equipmentselection and filmprocessing. No assembly at20px is claimed until final integrated preview.

## Provenance

Source: C:/Users/Trent/.codex/generated_images/01a0f69e-ec38-7b32-ac7e-d8aba4341821/exec-1fca977d-8d09-45f7-a00f-548edf40968c.png

Full prompt:

Use case stylized-concept. Generate one transparent GAME CHARM SPRITE ATLAS, 4columns by3rows, landscape1536x1024. Attached player is STYLE REFERENCE ONLY. Twelve independent tiny waist pendants/omamori, broad simple flat polygon facets, charcoal warmgray mutedivory and restrained dull red/brass accents, minimal detail, readable at20px. Every complete charm vertically oriented with a small suspension loop at top, centered within its own cell, generous40px clear cellgutters, no cell overlap. ROW1 left-to-right:1 square charcoal cloth pouch with ivory geometric cross-like block symbol;2 slim ivory cloth talisman pouch with three charcoal rectangular marks;3 rounded muted brass-gold pouch with simple dark diamond block emblem;4 muted darkred diamond-shaped cloth pouch with ivory simple circle emblem. ROW2 left-to-right:5 tiny brass round SUZU BELL with red cord and single dark slit;6 ivory beckoning CAT figurine pendant simple pointed ears and raised paw, no fineface;7 squat mutedred DARUMA doll pendant with ivory oval facepatch and two black dots;8 paleivory and mutedblue FOXFLAME teardrop pendant broad angularflame silhouette. ROW3 left-to-right:9 grayivory glass WINDCHIME bell with narrow hanging paperstrip;10 rectangular ivory OFUDA paper ward with3large charcoal abstract block symbols;11 round dullbrass MIRROR pendant with darkrim and flat lightgray reflectivecenter;12 folded ivory FORTUNE PAPER strip tied as angular knot, no text. Orthographic front view. Same upperleft illumination and economical matte facets as reference. Loop included but no long cords beyondpieces. All twelve isolated on ACTUALTRANSPARENT background. No humans, scenery, labels, letters, readable writing, grid, border, castshadows, ground, ornamental detail, realistictexture. Do not copy player parts.

