# Outfit headwear atlas

Image: outfit-headwear-atlas.png; actual size 1254×1254 RGBA. Layout: four independent rear-view pieces in 2×2 arrangement.

Generated 2026-10-01 with the built-in image generation tool. Style reference: player-ronin-simple.png, inspected before generation. Original generated files retained at their source locations; project PNGs copied without repainting, thresholding or resizing.

Coordinates below are atlas-global pixels, origin top-left; rectangles are x,y,width,height. Pivots are suggested attachment points inferred visually, not verified assembled rig fits. Use source rectangles rather than automatic equal-grid slicing. Preserve aspect ratio and downstream film grading. No faces or assembled people, labels, ground or background plates. Matte flat charcoal and warm-gray facets match the reference. Upper-left lighting means mirrored pieces should be used sparingly.

## Source frames and anchors

| Piece | Source rectangle | Attachment pivot (atlas-global) | Intended use |
|---|---|---|---|
| kabuto | 85,126,488,450 | 330,515 | Rear helmet; pivot at neck guard overlap |
| kasa | 630,204,605,322 | 945,475 | Rear broad hat; underside center above head |
| hood | 141,653,399,522 | 340,975 | Rear wrapped hood; neck junction |
| collar | 747,872,399,220 | 945,910 | Plain collar; center of upper opening |

Alpha>16 visible bounds (x,y,width,height): kabuto 89,130,480,442; kasa 634,208,597,314; hood 145,657,391,514; collar 751,876,391,212. Frames retain 4px padding. 72.33% of full image pixels are exactly transparent. Full alpha>0 extent is 33,21 through1234,1254 because barely visible generated alpha≤16 specks exist outside the main shapes; no alpha cleanup performed. Main silhouettes are separate and fully captured by listed frames. Broad kasa comes close to nominal quadrant division, so use listed frames. Inspected full atlas visually and alpha numerically; assembled pose validation belongs to integration.

## Provenance

Source: C:/Users/Trent/.codex/generated_images/01a0f69e-ec38-7b32-ac7e-d8aba4341821/exec-5f8335c0-e5f4-44e0-b148-6df2941c4b36.png

Tool transparent_background: true.

Full prompt:

Use case: stylized-concept. Create one square 2x2 modular HEADWEAR sprite atlas on true transparent background. Attached image is STYLE REFERENCE ONLY: match its extremely simple flat charcoal polygon facets, clean angular silhouettes, few broad warm gray planes, no fine texture. Four complete isolated pieces, centered within each quadrant, generous empty transparent gutters and outer margins. Orthographic REAR VIEW camera, no face, no assembled human, no body. TOP LEFT: simple Japanese kabuto helmet viewed from behind, dark iron rounded faceted crown and flared segmented neck guard, small restrained side wings, no ornamental antlers. TOP RIGHT: broad conical straw kasa hat viewed from behind slightly above, muted gray-brown/ash facets, almost no weave lines. BOTTOM LEFT: wrapped charcoal shinobi hood viewed from behind, clean rounded faceted crown, fabric neck flap, no eye slit or face. BOTTOM RIGHT: plain charcoal cloth neck/collar piece only, small broad standing wrapped collar to overlap a robe at neck, no head. Use 1024x1024 square if possible. All pieces fully inside quadrants with at least 40px transparent gutters. Upper left light, matte minimal detail, dark values matching style reference. No ground, shadows, text, grid, border, logos, accessories, skin, baked background.

