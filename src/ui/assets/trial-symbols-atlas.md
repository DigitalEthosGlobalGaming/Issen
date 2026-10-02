# Trial calligraphy atlas

`trial-symbols-atlas.png` contains the ten trial emblems in a uniform 4-column,
3-row atlas. The image is 1448 × 1086 pixels; every frame is 362 × 362 pixels.
Coordinates use the top-left origin. Frame-local pivot is `(181, 181)` pixels.
Render the complete square frame without stretching, mirroring, or rotating.
The intended UI size is 48–96 pixels per square frame.

| Trial ID         | Pictogram                             | Frame x | Frame y | Visible alpha bounds within frame |
| ---------------- | ------------------------------------- | ------: | ------: | --------------------------------- |
| quiet-blade      | Upright silent sword                  |       0 |       0 | 134, 61–275, 349                  |
| duel-master      | Crossed sword strokes and glint       |     362 |       0 | 73, 78–326, 343                   |
| unbroken         | Continuous enso                       |     724 |       0 | 50, 81–300, 336                   |
| true-edge        | Precise slash and glint               |    1086 |       0 | 51, 89–273, 341                   |
| still-water      | Three calm ripples                    |       0 |     362 | 79, 97–327, 281                   |
| sightless        | Eye above blade                       |     362 |     362 | 60, 68–338, 301                   |
| twin-fang        | Parallel blade strokes and two glints |     724 |     362 | 47, 58–306, 305                   |
| three-masters    | Three upright blades                  |    1086 |     362 | 61, 54–276, 303                   |
| golden-sovereign | Crown/sun above endurance strokes     |       0 |     724 | 74, 20–322, 288                   |
| broken-reality   | Broken enso divided by a slash        |     362 |     724 | 51, 20–331, 285                   |
| unused           | Empty                                 |     724 |     724 | None at alpha > 16                |
| unused           | Empty                                 |    1086 |     724 | None at alpha > 16                |

Visible bounds use an alpha threshold of 16/255 and inclusive maximum
coordinates. All visible strokes stay within their assigned frames. Padding
varies by symbol; it is not a uniform 20%. The smallest visible edge margin is
13 pixels below the quiet-blade emblem.

## Style and provenance

Generated with the built-in image generation tool on 2026-10-02. The art direction
comes from the inspected Issen logo at `assets/play-store/pc/logo-600x400.png`:
ivory Japanese brush calligraphy, broad gestural marks, dry edges, and restrained
warm gray inside strokes. The accepted final generation uses a prose style brief
without an image reference, after reference-based variants introduced excess
colored backing. No procedural repainting or recoloring was applied.

Final generation prompt: a new transparent game UI atlas of ten ivory Japanese
shodo brush pictograms; bold stroke silhouettes with rough dry tips and tiny
interior breaks; ivory with subtle warm gray inside strokes; no colored fringe,
paper, shadow, outlines, text, labels, or grid; exact 4 × 3 square-cell layout,
compact 2–6 stroke symbols in the order above, and two unused cells.

## Inspection

The PNG has a real 32-bit RGBA alpha channel: 1,168,145 pixels have alpha zero,
403,824 have partial alpha, and 559 are fully opaque. The unused cells contain
78 near-transparent residual pixels with alpha at most 16/255; they have no
visible artwork. No red pixels were found at alpha above 100/255.

The sheet was inspected in full and composited over a dark UI surface at 120
pixels per frame. The ivory strokes remain legible and the ten silhouettes are
distinct. Near-transparent RGB fringe can look bright in the tool's alpha preview
but does not appear in the inspected dark UI composite. Use normal alpha blending
and retain native color; no screen or additive blending is needed.
