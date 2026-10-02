# Temple calligraphy symbol atlas

- Image: `temple-symbols-atlas.png`, 1254 × 1254 pixels, RGBA.
- Layout: uniform 3 × 3 grid, 418 × 418 pixel cells, top-left origin.
- Anchor: each cell center, `(209, 209)` in cell-local pixels.
- Intended display: 48–96 pixel square cells; preserve aspect ratio.
- Transforms: do not mirror or rotate; each pictogram has a fixed meaning.
- Rendering: use native image alpha; no recoloring or background plate is baked in.

| Symbol      | Frame rectangle `(x, y, width, height)` | Visible bounds within cell at alpha ≥ 32 |
| ----------- | --------------------------------------- | ---------------------------------------- |
| precision   | `(0, 0, 418, 418)`                      | `(104, 108, 334, 341)`                   |
| discernment | `(418, 0, 418, 418)`                    | `(93, 166, 340, 326)`                    |
| vitality    | `(836, 0, 418, 418)`                    | `(101, 142, 306, 341)`                   |
| focus       | `(0, 418, 418, 418)`                    | `(115, 117, 313, 320)`                   |
| offerings   | `(418, 418, 418, 418)`                  | `(103, 117, 331, 312)`                   |
| awakening   | `(836, 418, 418, 418)`                  | `(130, 85, 307, 329)`                    |
| knife       | `(0, 836, 418, 418)`                    | `(104, 89, 350, 309)`                    |
| composure   | `(418, 836, 418, 418)`                  | `(124, 90, 293, 294)`                    |
| recovery    | `(836, 836, 418, 418)`                  | `(120, 98, 314, 303)`                    |

Visible bounds are `(left, top, right, bottom)`, with right/bottom exclusive. Frame rectangles include transparent padding and must not be trimmed.

## Art direction and provenance

Generated with the built-in image generation tool on 2026-10-02, using [the main logo](../../../assets/play-store/pc/logo-600x400.png) as a visual style reference. The final sheet is the original generated PNG, copied without pixel edits. Pictograms use ivory, pressure-tapered Japanese calligraphic brush gestures, broken dry edges, subtle warm-gray stroke texture and restrained vermilion accents.

Final prompt: Create a square transparent 3 × 3 sprite sheet of nine small isolated ivory brushstroke pictograms. Use the logo as a style reference only. Keep broad pressure-tapered strokes, subtle warm gray inside them and tiny vermilion details. Center each icon with large transparent gutters and no separate splatter. Row one: slash through target ring, eye with return curve, heart. Row two: enso circle and glint, torii over offering bowl, rising flame. Row three: diagonal knife, shield, sprout with circular return stroke. Use clear silhouettes for 48-pixel display; no paper, text, labels, grid or backdrop.

## Validation

Inspected the original sheet and alpha values. Fully transparent pixels account for 82.17% of the sheet; alpha spans 0–255. At alpha ≥ 32, all nine silhouettes stay in their own cells with at least 68 pixels of clear padding. No opaque or materially visible yellow pixels were found. Very faint dry-brush scatter below alpha 32 can reach cell boundaries; native alpha keeps it subdued at UI scale. The artwork remains identifiable by its silhouette rather than texture detail.
