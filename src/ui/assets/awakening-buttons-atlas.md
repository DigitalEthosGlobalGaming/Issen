# Awakening form button plates

[The atlas](awakening-buttons-atlas.png) contains three nine-slice plates for the
Armoury's Normal, Awakened, and Third form controls. Each is a matte charcoal ink
panel with cut corners, irregular loaded brush edges, sparse directional breaks,
and restrained faceted value planes. The label area stays quiet. Artwork contains
no lettering, emblem, fold pattern, glow, or baked shadow.

Normal has a muted ivory edge. Awakened uses a warm gold edge with fine inner
bristle strokes. Third uses a stronger gold contact and a distinct double rim,
so its geometry also distinguishes it from the other forms.

[The manifest](awakening-buttons-atlas.json) uses top-left pixel coordinates and
frame-local center pivots `(128, 64)`. The atlas is 768 × 128 pixels: three columns,
one row, each frame 256 × 128 pixels. Nine-slice insets are 32 source pixels on
every side. Alpha bounds include every pixel above zero alpha; maximum values
are inclusive.

| Form     | Frame x | Frame y | Visible frame-local alpha bounds | Extracted image                           |
| -------- | ------: | ------: | -------------------------------- | ----------------------------------------- |
| Normal   |       0 |       0 | 6, 7–248, 120                    | [Normal](awakening-button-normal.png)     |
| Awakened |     256 |       0 | 6, 7–248, 120                    | [Awakened](awakening-button-awakened.png) |
| Third    |     512 |       0 | 6, 7–248, 120                    | [Third](awakening-button-third.png)       |

Use each extracted PNG as its form's `border-image-source`, with
`border-image-slice: 32 fill` and `border-image-repeat: stretch`. A destination
border width of 8–12 CSS pixels preserves the corners on 44-pixel-high controls;
10 pixels was used for inspection. The center is opaque and stretches cleanly.
All visible decoration occupies the outer slice bands. Keep labels and semantic
pressed, locked, focus, and disabled states in the owning menu. Render with normal
alpha blending; do not mirror or rotate these plates.

## Style and provenance

Created on 2026-10-04 from inspected repository references:
`assets/play-store/pc/logo-600x400.png`, `src/ui/assets/world-ui-atlas.png`, and
[calligraphic symbol art](../../../docs/features/symbol-art.md). Sparse texture,
loaded brush contact, tapered breaks, and angular charcoal planes extend the
Issen ink family while keeping the short labels readable.

Regenerate with `node scripts/generate-awakening-buttons.mjs`. The script authors
exact vector geometry, renders the [editable SVG](awakening-buttons-atlas.svg)
through Playwright's Edge channel, and extracts the three full-frame PNGs without
trimming their padding. No image-generation call or external artwork was used.
Add `--preview` to produce a temporary CSS nine-slice review sheet.

## Inspection

The actual raster atlas and all extracted frames were inspected. CSS nine-slice
compositions at 100 × 44, 130 × 44, and 150 × 44 pixels were checked over a dark
menu surface, using ivory labels. Corners and double rims remain distinct after
stretching; the center has no distracting lines or folds. Ivory `#ece6da` text
has center contrast ratios of 12.65:1, 12.30:1, and 12.10:1 respectively.

Every frame has genuine transparent gutters, all four corners are transparent,
and no artwork crosses a cell boundary. The nearest visible edge is six source
pixels from its cell edge. Each frame contains transparent, antialiased, and
opaque pixels. The entire 192 × 64 center slice is fully opaque in every frame.
The generator verifies gutter, corner alpha, and center alpha after rendering.
`node --check scripts/generate-awakening-buttons.mjs` passes. Final selected and
locked states still require verification in the integrated Armoury.
