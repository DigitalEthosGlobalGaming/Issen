# Sea Stacks atlas

Generated2026-10-01 with the built-in image tool; retained original output without pixel editing. Prompt below records the production/edit brief.

Final PNG: `sea-stacks-atlas.png`, RGBA **1254 × 1254**, uniform2×2 atlas, source cell **627 × 627px**. Not animation frames or seamless tiles. Preserve native cell aspect and transparent padding.

Original final source: `C:/Users/Trent/.codex/generated_images/01a0f69e-ec38-7b32-ac7e-d8aba4341821/exec-75a96f8a-b1a3-45fa-ac5e-209bf4543a9c.png`.
Initial source preserved: `exec-41054572-4288-446e-b11b-5667fa5d6db7.png` in the same generated-image folder.

All coordinates top-left origin. Source frames `(column*cellWidth,row*cellHeight,cellWidth,cellHeight)`. Anchor X is0.5 of frame width. Anchor Y below is normalized relative to frame height. Visible bounds exclude alpha<=16 and use cell-local pixel coordinates `(left,top,right,bottom)`; right/bottom are exclusive.

| Cell | Variant | Visible bounds | Contact Y |
| --- | --- | --- | --- |
| 0 | Slanted monolith | `(160, 131, 484, 582)` | 0.928 |
| 1 | Paired pillars | `(83, 173, 529, 578)` | 0.922 |
| 2 | Layered shelf | `(131, 117, 577, 507)` | 0.809 |
| 3 | Broken teeth | `(90, 118, 526, 509)` | 0.812 |

Alpha inspection: extrema(0, 255); 76.42% exactly transparent. Visually inspected silhouette, palette and cell separation. True transparent backgrounds; no rectangle, text or figures. Neutral charcoal/warm gray/ivory values keep downstream film grading usable.

First generation had neighboring rock bases crossing row boundaries; built-in edit reduced and separated all four silhouettes. Final visible bodies are wholly isolated. These are rocks only: water/foam are separate. Use different depths and scale; avoid mirroring the strong upper-left lighting.

## Prompt brief

Keep these same four ink-faceted sea stack designs and all colors but correct layout ONLY. Each rock at most400 pixels tall in its627x627 quadrant on square1254 canvas. Four separate complete rock formations exact2x2 with at least80px transparent margin all sides of each cell. Do not touch outer edges or center dividing lines. Baselines at80% down each cell, tips well below cell top. Retain dry-brush angular gray rock texture, no water/foam/ground plate/text/grid. Actual alpha background.
