# Drifting dry debris atlas

Generated on 2026-10-05 with the built-in image-generation tool using
`field-rocks-atlas.png` as the visual style reference. This is a family of eight
independent particle variations, not animation frames.

The actual generated sheet is **1774 × 887 RGBA pixels**, in four columns and two
rows. The requested 1024 × 512 size was not produced; consumers must use the
actual rectangles below. Coordinates start at the image top left; pivots are
normalized to each frame, `(0.5, 0.5)`. Rotation, mirroring, uniform scaling and
vertical flattening for tumbling are allowed. Use normal source-over blending.

| Stable ID | Subject | Frame x, y, width, height |
| --- | --- | --- |
| debris.torn | Torn dry leaf | 0, 0, 444, 444 |
| debris.skeletal | Solid dry leaf with bold vein marks | 444, 0, 443, 444 |
| debris.needles | Short three-needle cluster | 887, 0, 444, 444 |
| debris.bark-strip | Thin curved bark strip | 1331, 0, 443, 444 |
| debris.bark-chip | Curled bark chip | 0, 444, 444, 443 |
| debris.splinter | Pointed bamboo splinter | 444, 444, 443, 443 |
| debris.ash | Broad irregular ash flake | 887, 444, 444, 443 |
| debris.charred | Curled charred fragment | 1331, 444, 443, 443 |

## Production prompt

Create a production game particle atlas using the reference only for its
restrained Japanese ink brush texture and angular warm-grey charcoal facets.
Use a transparent 4-column, 2-row grid of eight centered independent objects:
torn dry leaf, skeletal dry leaf with a solid silhouette and bold veins, three
short pine needles joined at their base, curved bark strip, curled bark chip,
pointed bamboo splinter, broad irregular ash flake, and curled charred fragment.
Use charcoal, warm grey and muted ivory highlights with no saturated colour.
Prioritize clear silhouettes at 4–32 pixels over fine details. Keep complete
objects inside generously padded cells. No grid, text, paper backdrop, scenery
or cast shadows. A follow-up edit filled the skeletal leaf's holes, retained its
bold vein marks, and requested clean transparent gutters.

## Inspection

Inspected the full sheet and 8, 16 and 32-pixel frame previews over warm light and
dark backgrounds. All eight silhouettes are distinct and remain readable at
16–32 pixels; 8-pixel particles read primarily by their outline. No unintended
subjects, labels, scenery or clipped main silhouettes are present. Alpha is
real transparency, with transparent cell corners and generous space around the
visible artwork. The generated file contains sparse pixels with alpha at most
16 in outer gutters; visible artwork above that threshold does not touch any
frame edge. Do not describe the sheet as having perfectly empty gutters.

These are neutral source sprites for downstream scene grading. Decode once and
reuse frames; do not process the sheet per particle or per frame.

Runtime IDs and normalized source rectangles are authoritative in `../../scene/drift-catalog.ts`. Uniform-grid boundaries round independently to integer pixels: x = 0, 444, 887, 1331, 1774; y = 0, 444, 887. Earlier inspection rectangles may differ by one transparent gutter pixel.
