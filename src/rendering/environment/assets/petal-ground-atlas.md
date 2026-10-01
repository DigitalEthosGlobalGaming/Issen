# Fallen petal ground atlas

Generated for The Falling Blossom Path on 2026-10-01 with the built-in image-generation tool. Final image is `petal-ground-atlas.png`; the original, unchanged generated source remains at:

`C:/Users/Trent/.codex/generated_images/01a0f69e-ec38-7b32-ac7e-d8aba4341821/exec-d30cfa2e-4704-44ad-adaf-35eb22d34920.png`

## Geometry and rendering contract

Actual dimensions: **1659 × 948 px**, RGBA. Four unrelated variations in a 2 × 2 grid, not animation frames. The atlas has an odd pixel width: uniform source cells are **829.5 × 474 px**, and Canvas can sample fractional source coordinates. Preserve source aspect ratios. Do not stretch patches to fill cells.

All rectangles use top-left origin and `(x, y, width, height)` in atlas pixels. Alpha bounds below exclude near-invisible alpha values at or below 16; they are artwork bounds, not frame rectangles.

| Cell | Name | Frame rectangle | Visible alpha bounds | Frame-local contact anchor |
| --- | --- | --- | --- | --- |
| 0 | Thin scatter | `(0, 0, 829.5, 474)` | `(52, 299, 739, 126)` | `(414.75, 425)` |
| 1 | Crescent drift | `(829.5, 0, 829.5, 474)` | `(884, 236, 706, 211)` | `(414.75, 447)` |
| 2 | Dense shallow patch | `(0, 474, 829.5, 474)` | `(26, 636, 777, 205)` | `(414.75, 367)` |
| 3 | Broken narrow strip | `(829.5, 474, 829.5, 474)` | `(863, 700, 754, 107)` | `(414.75, 333)` |

Contact anchors mark the nearest edge of each ground deposit, in **frame-local pixels**. Normalized anchor Y values: `0.897`, `0.943`, `0.774`, `0.703`. Choose ground placement deliberately; equal cell-bottom anchors leave different transparent offsets. Native cell width includes generous horizontal spacing around visible artwork.

Intended visible widths approximately 100–250 logical pixels, with smaller and lower-opacity patches farther away. Prefer sparse placement along path/bank edges over a continuous carpet. Horizontal mirroring and slight in-plane rotation are acceptable; avoid vertical flips or large rotations that break the shallow ground perspective. Standard source-over blending; runtime film grading remains downstream.

## Inspection

Visually inspected full atlas: four independent low-perspective deposits, predominantly pale ivory with warm gray/charcoal undersides and very subdued blush; no scenery, rectangular ground plate, lettering or airborne confetti. The deposits include a mix of petal flakes and flattened blossom fragments.

Alpha extrema are 0–255; 78.73% of pixels are exactly transparent. Visible alpha above 16 is clear of all cell boundaries. Some nearly invisible alpha at or below 16 extends into transparent gutters and across the horizontal split; this is recorded rather than silently thresholded. Source alpha was preserved without repainting or thresholding. Not a seamless texture.

Style references inspected: `meadow-patches-atlas.png` and `grass-edges-atlas.png`, plus the ink-game-assets art direction and environment contract. No renderer code was changed during asset production.

## Final generation prompt

Create a production game sprite atlas: FOUR separate fallen cherry blossom PETAL GROUND DEPOSITS in a precise 2x2 grid on a genuinely transparent background. Landscape canvas, desired 1792x1024. Each quadrant must have generous transparent gutters on every side (at least 60px) and be fully independent. Top-left: sparse thin scatter of individual settled petals. Top-right: shallow crescent-shaped petal drift. Bottom-left: denser shallow oval patch of overlapping petals. Bottom-right: broken narrow horizontal strip of petals in 3 connected-ish sparse groups. Camera VERY LOW oblique side view of the ground, all deposits horizontally flattened to width about 4 times visible height. Every petal lies ON the same ground plane: NO airborne petals, no upright flowers. Ground-contact plane centered about 75 percent down each quadrant. Match Japanese ink-painted faceted game scenery: dry brush broken edges, angular low-poly-like value planes, charcoal accents, warm gray shadows, pale ivory petals with EXTREMELY restrained faded blush on only a few petals. Mostly neutral ivory and gray; no saturated pink. Individual petals small, natural five-lobed blossom fragments sparingly mixed with single petal flakes. Economical broad shapes readable when entire patch is 100-200 pixels wide. Light from upper left. NO soil rectangle, NO ground plate or dirt island, NO grass or scenery, no trees, no figures, no sky, no shadows spanning cells, no paper background, no checkerboard drawn in image, no text, labels, borders or grid lines. All space between petals and around each independent patch must be true transparent alpha. These are reusable game sprites, not a composed scene.
