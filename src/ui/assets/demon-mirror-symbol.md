# Demon Mirror emblem

`demon-mirror-symbol.png` is a dedicated 1254 × 1254 transparent PNG for the
Demon Mirror trial. It is a single symbol, not part of the trial atlas. Frame-local
pivot is `(627, 627)` pixels; render the full square at its native aspect ratio.
Intended display size is 48–96 pixels. Do not mirror or rotate the emblem.

The horned oni face is formed by opposite-facing ivory calligraphic curves and
mirrored negative space, with a small vermilion accent in one eye. Broad dry brush
strokes and muted warm-gray inner texture match Issen's existing trial symbols.
There is no text, frame, background plate, or baked shadow.

## Provenance

Generated with the built-in image generation tool on 2026-10-02. Style-only
references were `assets/play-store/pc/logo-600x400.png` and
`src/ui/assets/trial-symbols-atlas.png`. The output was copied without procedural
repainting, recoloring, or resampling.

Prompt: one square transparent Demon Mirror trial emblem, Japanese shodo ivory
brush calligraphy; horned oni face suggested by opposite-facing curved strokes,
mirrored central negative space, two upswept horns, tiny restrained vermilion eye;
economical bold gestures legible at 48–96 pixels; dry edges and subtle internal
warm gray; no text, paper, labels, frame, grid, shadow, or colored backing.

## Verification

Verified actual 32-bit RGBA encoding and 1,126,267 fully transparent pixels.
Visible alpha bounds above 16/255 are `(125, 67)` through `(1128, 1194)`, inclusive.
The generated emblem has safe uncut edges but approximately 5–10% artwork margins,
rather than the requested uniform 20%; use layout spacing around the full square
if additional breathing room is needed.

Inspected the full image and a 192-pixel square composite over a charcoal UI
surface. The horns, mirrored face and red eye remain distinct with normal alpha
blending. Near-transparent RGB fringe in the raw alpha preview does not appear
in that dark composite.
