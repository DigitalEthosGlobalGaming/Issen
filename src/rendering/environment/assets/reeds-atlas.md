# Reeds atlas

Generated2026-10-01 with the built-in image tool; retained original output without pixel editing. Prompt below records the production/edit brief.

Final PNG: `reeds-atlas.png`, RGBA **1254 × 1254**, uniform2×2 atlas, source cell **627 × 627px**. Not animation frames or seamless tiles. Preserve native cell aspect and transparent padding.

The accepted project PNG preserves the final generated output unchanged.

All coordinates top-left origin. Source frames `(column*cellWidth,row*cellHeight,cellWidth,cellHeight)`. Anchor X is0.5 of frame width. Anchor Y below is normalized relative to frame height. Visible bounds exclude alpha<=16 and use cell-local pixel coordinates `(left,top,right,bottom)`; right/bottom are exclusive.

| Cell | Variant | Visible bounds | Contact Y |
| --- | --- | --- | --- |
| 0 | Upright rushes | `(128, 63, 556, 621)` | 0.99 |
| 1 | Wind-bent tuft | `(48, 216, 557, 623)` | 0.993 |
| 2 | Broad sedge | `(73, 111, 626, 542)` | 0.865 |
| 3 | Sparse cattails | `(103, 65, 554, 545)` | 0.87 |

Alpha inspection: extrema(0, 255); 65.93% exactly transparent. Visually inspected silhouette, palette and cell separation. True transparent backgrounds; no rectangle, text or figures. Neutral charcoal/warm gray/ivory values keep downstream film grading usable.

Initial generated tip was clipped; built-in image edit reconstructed it and improved spacing. Cell2 has a leaf within1pixel of its right cell edge; do not expand source crop into neighboring cells. All visible bodies are otherwise isolated. Use mostly small shoreline tufts, with larger reeds restricted to screen edges.

## Prompt brief

Keep these four reed clump designs and Japanese ink-faceted art style, but scale each complete clump DOWN to65% inside its own exact2x2 cell and center it with true transparent padding on ALL four sides. Reconstruct the clipped top-left tip so the entire reed head is inside the frame. None may touch outer image edges or middle lines. At least70 transparent pixels between tips and cell edge. Native proportions, same neutral colors, no scenery/grid/border/labels. Square canvas.
