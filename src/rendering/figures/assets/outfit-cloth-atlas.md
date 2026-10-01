# Outfit cloth atlas

Image: outfit-cloth-atlas.png; actual size 1254×1254 RGBA. Four separate clothing pieces, nominal 2×2 arrangement with a wider cape occupying more than the lower-left quadrant.

Generated 2026-10-01 with the built-in image generation tool. Style reference: player-ronin-simple.png, inspected before generation. Original generated files retained at their source locations; project PNGs copied without repainting, thresholding or resizing.

Coordinates below are atlas-global pixels, origin top-left; rectangles are x,y,width,height. Pivots are suggested attachment points inferred visually, not verified assembled rig fits. Use source rectangles rather than automatic equal-grid slicing. Preserve aspect ratio and downstream film grading. No faces or assembled people, labels, ground or background plates. Matte flat charcoal and warm-gray facets match the reference. Upper-left lighting means mirrored pieces should be used sparingly.

## Source frames and anchors

| Piece | Source rectangle | Attachment pivot (atlas-global) | Intended use |
|---|---|---|---|
| jinbaori left | 146,53,408,551 | 442,80 | Left shoulder; straight inner edge on right |
| jinbaori right | 718,53,394,552 | 826,80 | Right shoulder; straight inner edge on left |
| mino cape | 64,663,746,532 | 420,695 | Center neckline/shoulders; whole cape |
| bracer | 927,692,208,481 | 1012,724 | Elbow; wrist attachment 1060,1130 |

Alpha>16 visible bounds (x,y,width,height): left 150,57,400,543; right 722,57,386,544; cape 68,667,738,524; bracer 931,696,200,473. Frames retain 4px padding. The cape crosses x627: **do not use equal quadrants**. It is safely separated from the bracer by ~125px. 63.71% of full sheet pixels are exactly transparent. Full alpha>0 extent reaches x0,y1254 due to barely visible generated alpha≤16 specks; no cleanup performed. Main pieces are complete. Cape uses broad angular planes rather than individual straw fibers. Separate jinbaori halves should overlap at center seam and retain distinct left/right lighting. Shoulder pivots are provisional; body height and neck alignment need integration pose inspection.

## Provenance

Source: C:/Users/Trent/.codex/generated_images/01a0f69e-ec38-7b32-ac7e-d8aba4341821/exec-c940ebce-1077-4110-85ad-3a49b721e38e.png

Tool transparent_background: true.

Full prompt:

Use case: stylized-concept. Create one square 2x2 modular CLOTH sprite atlas on TRUE TRANSPARENT background. Attached image is STYLE REFERENCE ONLY; match extremely simple flat dark charcoal polygon facets, clean angular silhouettes, just a few broad warm gray planes, minimal details. Four complete isolated pieces each centered within its own quadrant, generous empty gutters. Orthographic REAR VIEW, clothing pieces without a human. TOP LEFT: LEFT HALF of sleeveless open Japanese jinbaori overcoat, one long cloth panel from shoulder to thigh, dark charcoal with a narrow muted ivory hem, straight center seam on its RIGHT edge, slight outward flared left hem. TOP RIGHT: RIGHT HALF counterpart, straight center seam on its LEFT edge, matching shape/proportion, outward flare right hem. These halves will overlap slightly down center of back when assembled; each is only half the garment, no sleeves. BOTTOM LEFT: a complete simple rear-view mino straw cape, shoulder-width neckline at top, broad trapezoid flaring out to thigh-length angular hem, muted dark gray-brown straw represented as 8 to 12 broad angular matte planes, NOT individual fibers. BOTTOM RIGHT: one standalone long padded charcoal forearm bracer, narrow vertical shape, elbow cuff at top wrist cuff bottom, no hand, broad polygon facets. Square 1024x1024 if possible, generous at least40px transparent outer and cell margins. Full complete pieces no cutoffs. Neutral upper-left light, film-gradeable palette, no fine grain/weave or individual straw lines. No background, ground, shadows, assembled person, heads, skin, extra objects, labels, grid, text.

