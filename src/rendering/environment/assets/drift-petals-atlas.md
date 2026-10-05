# Drifting petals and seeds

`drift-petals-atlas.png` contains eight independent variants in a four-column,
two-row layout. It is **1774 × 887 pixels**, RGBA, with actual transparent alpha.
The generated size differs from the requested 1024 × 512; consume the explicit
frames below rather than assuming 256-pixel cells. Coordinates are pixels from
the top-left. Pivots are frame-local pixels; all variants permit rotation,
mirroring and vertical flattening for tumbling.

| Stable ID | x | y | width | height | pivot x | pivot y |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| petal.rounded | 0 | 0 | 444 | 444 | 222 | 222 |
| petal.notched | 444 | 0 | 443 | 444 | 221.5 | 222 |
| petal.narrow | 887 | 0 | 443 | 444 | 221.5 | 222 |
| petal.folded | 1330 | 0 | 444 | 444 | 222 | 222 |
| petal.paired | 0 | 444 | 444 | 443 | 222 | 221.5 |
| seed.winged | 444 | 444 | 443 | 443 | 221.5 | 221.5 |
| seed.husk | 887 | 444 | 443 | 443 | 221.5 | 221.5 |
| seed.fluff | 1330 | 444 | 444 | 443 | 222 | 221.5 |

Use normal source-over blending and preserve alpha. The ivory/warm-grey sprites
already contain charcoal folded edges; downstream film grading may tint them.
No on-frame image processing is required. Frame dimensions include generous
padding and differ from visible artwork bounds.

## Provenance and inspection

- Generated 2026-10-05 with the built-in image-generation tool, using the
  `ink-game-assets` and built-in `imagegen` skills.
- Style reference: `petal-ground-atlas.png` in this directory, supplied as an
  actual image reference. Reference used for palette/material only.
- Prompt: eight isolated sprites in a 4 × 2 transparent atlas, in the table's
  order: rounded cherry petal, notched cherry petal, narrow petal, folded petal,
  paired petals, winged seed, seed husk and compact seed fluff. Japanese ink and
  faceted treatment; charcoal, warm grey and muted ivory; broad readable value
  planes, centred pivots, generous transparent gutters, complete silhouettes,
  no text, labels, grid lines, scenery or cast shadows. Intended for 4–32-pixel
  drifting particles with rotation and tumbling.
- Inspected the full sheet and all frames at 4, 8, 16 and 32-pixel frame sizes.
  Distinct silhouettes are apparent at 16–32 pixels; at 4–8 pixels they read as
  small drifting flecks. Actual alpha range is 0–255. Strong artwork (alpha >16)
  stays inside every cell, with at least 35 pixels of margin. Very faint generated
  alpha noise (16/255 or less) extends into some gutters; no strong silhouette
  crosses a frame. No generated source pixels were repainted or resampled.

Runtime IDs and normalized source rectangles are authoritative in `../../scene/drift-catalog.ts`. Uniform-grid boundaries round independently to integer pixels: x = 0, 444, 887, 1331, 1774; y = 0, 444, 887. Earlier inspection rectangles may differ by one transparent gutter pixel.
