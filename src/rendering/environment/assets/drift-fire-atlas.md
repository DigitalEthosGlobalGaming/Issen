# Drifting fire and spirit atlas

Generated on 2026-10-05 with the built-in image-generation tool using
`demon-terrain-atlas.png` as a style reference for angular charcoal facets and
embers. The eight independent sprites are variations, not animation frames.

The actual sheet is **1774 × 887 RGBA pixels**, four columns and two rows.
The requested target was 1024 × 512; use the actual frame rectangles below.
Coordinates start at the image top left. Pivots are normalized frame-local
`(0.5, 0.5)`. Rotation, mirroring, scaling and flattening are permitted. Normal
source-over blending preserves both charcoal and luminous painted accents.
Decode once; reuse the image and frames without per-frame processing.

| Stable ID | Subject | Frame x, y, width, height |
| --- | --- | --- |
| fire.ember | Bright pointed ember fleck | 0, 0, 444, 444 |
| fire.coal | Charred coal flake with glowing crack | 444, 0, 443, 444 |
| fire.streak | Curved tapering ember streak | 887, 0, 444, 444 |
| fire.forked | Small forked flame | 1331, 0, 443, 444 |
| fire.wisp | Curling fire wisp | 0, 444, 444, 443 |
| fire.spectral-flame | Violet spectral flame | 444, 444, 443, 443 |
| fire.spirit-shard | Angular violet ink-spirit shard | 887, 444, 444, 443 |
| fire.spectral-cinder | Violet spectral cinder | 1331, 444, 443, 443 |

## Production prompt

Create eight tiny independent drifting fire and spirit particles matching the
reference's Japanese ink brush texture and angular charcoal facets. Use a
transparent four-column two-row atlas with centered complete sprites, generous
padding and no background, paper, labels, scenery or grid. In row-major order:
bright ember fleck, charred glowing coal flake, curved ember streak, small forked
flame, curling fire wisp, violet spectral flame, angular violet ink-spirit shard,
and violet spectral cinder. First five use vermilion, amber, ivory and charcoal;
last three use spectral violet, charcoal and ivory. Prioritize bold asymmetric
silhouettes readable at 4–32 pixels, with broad drybrush facets and tightly
contained alpha glow. No satellite particles or streaks crossing cells.

## Inspection

Inspected the full sheet and 8, 16 and 32-pixel frame previews on light warm and
dark backgrounds. All eight subjects are present in the specified order, with
coherent faceted brushwork and distinct silhouettes. Painted luminous accents
remain legible at small sizes. Real RGBA transparency is present; main artwork
and visible glow remain inside each frame without clipping. Sparse generated
pixels of alpha at most 16 extend into gutters. Above that threshold all frame
edges are empty; this is not a claim of mathematically empty alpha gutters.

Intended frame display size is approximately 4–32 pixels. At the smallest sizes,
colour, direction and silhouette carry the effect; fine internal texture is not
expected to remain visible.
