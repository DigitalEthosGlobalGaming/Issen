# Demon realm landmarks

`demon-landmarks-atlas.png` contains four separate scenery cutouts in a uniform
2 × 2 grid. The image is 1254 × 1254 pixels; every source frame is 627 × 627
pixels. Source coordinates have a top-left origin. Preserve each frame's square
aspect ratio and apply normal alpha blending.

| Landmark | Source rectangle x, y, width, height | Visible alpha bounds in frame | Base-center pivot in frame pixels |
| --- | --- | --- | --- |
| Horned skull ridge | 0, 0, 627, 627 | 85, 115–574, 550 | 313.5, 550 |
| Ruined demon torii | 627, 0, 627, 627 | 97, 139–533, 552 | 313.5, 552 |
| Obsidian hornspire cluster | 0, 627, 627, 627 | 95, 85–585, 528 | 313.5, 528 |
| Twisted dead tree | 627, 627, 627, 627 | 98, 90–540, 533 | 313.5, 533 |

Visible alpha bounds use a 16/255 threshold and inclusive maximum coordinates.
Base pivots are frame-local pixel coordinates, not atlas coordinates. They place
the bottom of each visible silhouette at its ground contact. Typical drawn frame
size is 100–400 pixels; the skull ridge is a distant monumental landmark, the
other cutouts can populate the midground. Horizontal mirroring is allowed for
placement variation, although it reverses the painted highlight direction. Do
not rotate, stretch, or tile these silhouettes.

## Style and composition

Charcoal and ash-gray faceted Japanese ink forms have small crimson fissures.
The skull is geological scenery, the torii is ruined stone architecture, the
hornspires are obsidian rock, and the tree is bare twisted timber. All horns,
branches, crossbeams and bases are complete and isolated. There is no baked sky,
moon, ground rectangle, background smoke, character, text or interface content.
Runtime sky, ground and atmospheric layers should compose the surrounding scene.

## Provenance

Generated with the built-in image generation tool on 2026-10-02, using the
accepted demon-realm scene study as a style-only reference. The style study was
based on this directory's `field-rocks-atlas.png` and `mountain-atlas.png`.
A second image-generation pass shrank and separated the four objects after the
first candidate crossed a cell boundary. No procedural repainting, recoloring,
cropping or resampling was applied to the final PNG.

Prompt: exact 2 × 2 transparent scenery atlas; complete horned skull-shaped ridge,
ruined demon torii, cluster of curved obsidian hornspires, and twisted dead tree
in row-major order; charcoal ink and ash-gray angular planes with tiny crimson
fissures; full isolated silhouettes, center-base alignment, ample transparent
gutters, no baked sky, floor, scenery rectangle, fog backing, labels or figures.
Correction prompt retained all four designs and changed only their scale and
placement to stay inside their respective square frames.

## Verification

Verified actual 32-bit RGBA encoding and 1,137,440 fully transparent pixels.
All visible artwork remains inside its own source frame; no visible strokes
cross either center line. Actual padding varies, with a minimum visible margin
of 41 pixels, rather than the requested uniform 20% margin. Keep the entire frame
when sampling so transparent gutters prevent neighboring-frame bleed.

Inspected the full atlas and a 512-pixel sheet composite over muted violet.
Silhouettes read independently at 256 pixels per frame and retain the accepted
demonic landscape's texture, scale and color language. Transparency exposes the
runtime backdrop through the gate, branches and gaps between rocks.
