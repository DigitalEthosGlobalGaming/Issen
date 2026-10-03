# UI completion brush strokes

[The atlas](ui-strokes-atlas.png) contains eight distinct left-to-right marks for
completed Trial cards and other decorative UI overlays. Each complete stroke
occupies one cell in a 4-column, 2-row uniform grid. The PNG is 1536 × 256 pixels;
each cell is 384 × 128 pixels with a 3:1 logical aspect ratio.

[The manifest](ui-strokes-atlas.json) records exact frame rectangles, frame-local
center pivots `(192, 64)`, and visible alpha bounds. Coordinates use the top-left
origin; bounds include every pixel with alpha above zero and have inclusive
maximum coordinates. Do not mirror or rotate these marks. Preserve the complete
cell and its aspect ratio when displaying it.

| Name | Frame x | Frame y | Visible alpha bounds within frame |
| --- | ---: | ---: | --- |
| broad-rise | 0 | 0 | 29, 32–350, 99 |
| fine-rise | 384 | 0 | 29, 32–351, 89 |
| dry-brush | 768 | 0 | 29, 48–351, 87 |
| sweeping-arc | 1152 | 0 | 28, 29–349, 98 |
| double-streak | 0 | 128 | 30, 33–351, 100 |
| loaded-taper | 384 | 128 | 30, 40–350, 82 |
| falling-cut | 768 | 128 | 30, 26–350, 89 |
| low-sweep | 1152 | 128 | 29, 43–349, 89 |

Use normal alpha blending on a dark UI surface. Base ink is light grayscale,
with restrained darker value inside each stroke. A muted ivory tint may match
the surrounding symbol artwork. Intended full-cell width is 144–288 display
pixels, with corresponding height 48–96 pixels. For completion overlays behind
button labels, start around 0.24 opacity and inspect the actual card; the useful
range is roughly 0.18–0.32. Text, focus, and selected-state indicators remain
independent foreground elements. The strokes are decorative, so hide them from
assistive technology. The eight cells are variations, not animation frames.

## Style and provenance

Created on 2026-10-04 from inspected repository references:
`assets/play-store/pc/logo-600x400.png`, `src/ui/assets/world-ui-atlas.png`, and
[calligraphic symbol art](../../../docs/features/symbol-art.md). Broad loaded
contacts, tapered right-hand tips, broken bristle tracks, irregular edges, and
negative space extend the logo's brush vocabulary without adding scenery,
outlines, paper rectangles, text, or colored fringes.

Regenerate with `node scripts/generate-ui-strokes.mjs`. The source uses seeded
pressure ribbons along explicit curves and directional dry-brush masks, rendered
through Playwright's Edge channel. [The editable SVG](ui-strokes-atlas.svg) is
generated from that script. No image-generation call or external source artwork
was used. Add `--preview` to write a temporary dark-card review sheet; the review
sheet is not a shipped asset.

## Inspection and contract checks

The actual raster and all eight cells were inspected at native resolution and
composited on 268 × 72 dark cards with a 248 × 83 display area at 0.28 opacity.
The silhouettes are distinct, their left-to-right direction is preserved, and
labels remain readable in that representative composition. Final card placement
must still be checked in the owning menu.

Every cell has at least 26 fully transparent pixels between visible artwork and
the nearest cell edge. Each contains transparent, antialiased, and opaque pixels;
all four corners are transparent. No visible pixel has unequal RGB channels,
and no artwork crosses a cell boundary. The generator verifies bounds and
grayscale after rasterization and fails if a gutter falls below 14 pixels.
`node --check scripts/generate-ui-strokes.mjs` passes.
