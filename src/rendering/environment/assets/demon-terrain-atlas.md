# Demon terrain atlas

`demon-terrain-atlas.png` is a 1254 × 1254 RGBA sheet with four independently
composable ground props in a 2 × 2 grid. Each grid cell is 627 × 627 pixels.
Coordinates below are source pixels with a top-left origin. Rendering rectangles
include approximately 20 pixels of padding around the visible silhouettes and
preserve the native aspect ratio. Pivots are normalized within those rectangles;
they place the visible ground contact near the bottom center.

| Prop | Grid cell (x, y, w, h) | Rendering rectangle (x, y, w, h) | Native aspect | Pivot (x, y) |
| --- | --- | --- | --- | --- |
| Cracked obsidian mound | 0, 0, 627, 627 | 21, 231, 580, 285 | 2.0351 | 0.5, 0.93 |
| Lava bank and interior cleft | 627, 0, 627, 627 | 650, 240, 586, 285 | 2.0561 | 0.5, 0.93 |
| Jagged boulder cluster | 0, 627, 627, 627 | 17, 716, 594, 353 | 1.6827 | 0.5, 0.94 |
| Ash and weathered bones | 627, 627, 627, 627 | 645, 782, 593, 298 | 1.9899 | 0.5, 0.93 |

The visible alpha bounds at alpha ≥ 8, in sheet pixels, are respectively
`(41,251)-(581,496)`, `(670,260)-(1216,505)`,
`(37,736)-(591,1049)` and `(665,802)-(1218,1060)` (right/bottom exclusive).
The full sheet retains very faint alpha below 8 outside these bounds; use the
rendering rectangles to avoid sampling irrelevant edge remnants. All four
silhouettes are complete and separated. Alpha ranges from 0 to 255; 76.3% of
sheet pixels are completely transparent. No opaque landscape plate is present.

Use shallow side-view placement at the edges of the combat field, with occasional
smaller low props in open terrain. Do not stretch these into a complete scene or
call them seamless tiles. Mirroring is permitted for silhouette variation;
rotation is unsuitable for ground contact. Film grading belongs downstream.

## Generation

Generated with the built-in ImageGen tool on 2026-10-02. The visual direction was
informed by the earlier demonic realm concept and the ink/faceted environment
style. The final prompt requested a transparent 2 × 2 atlas containing a cracked
obsidian mound, a rocky lava bank with interior cleft, jagged boulders, and an ash
mound with stylized weathered bone fragments. It specified charcoal and warm ash
facets, muted ivory upper-left highlights, restrained scarlet fissures, shallow
side view, complete silhouettes, and no sky, characters, text, grid, atmospheric
backdrop or ground plate. Earlier atmospheric candidates were rejected.

Inspected the final sheet visually and measured dimensions, alpha extrema,
transparency proportion and per-cell silhouette bounds. Rendering rectangles
retain the sheet unchanged and isolate each useful cutout.
