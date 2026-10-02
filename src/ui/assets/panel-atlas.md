# Ink panel nine-slice atlas

Created 2026-10-02 as procedural vector ink, rasterized with Edge by
`scripts/generate-panel-atlas.mjs`. Regenerate with
`node scripts/generate-panel-atlas.mjs` using the existing Playwright dependency.
Style references: `button-atlas.png` for palette and
`src/rendering/environment/assets/field-rocks-atlas.png` for broad faceted edges.
Panel corners have heavier brushwork than button corners; long edges stay quiet.

## Geometry

- Source: `panel-atlas.svg`; raster atlas: `panel-atlas.png`.
- Atlas: 384 × 192 RGBA pixels, transparent margins, top-left origin.
- Normal frame: `(0, 0, 192, 192)`; `panel-normal.png`.
- Highlighted frame: `(192, 0, 192, 192)`; `panel-highlighted.png`.
- Slice insets: 36 source pixels on each edge; centre: 120 × 120 pixels.
- CSS uses `border-image-slice: 36 fill`, with 12 CSS-pixel edge bands on
  containers and 9 CSS-pixel bands on compact Temple tiles.
- The full frame includes transparent outer margins. No pivot is needed: the DOM
  rectangle anchors the frame. Do not rotate or mirror the artwork.
- Corners stay fixed; edges and the dark centre stretch independently. These
  are nine-slices, not seamless repeating textures.

## Integration

`src/styles/panel-frames.css` is imported after the button frames. It explicitly
overrides the image on Temple upgrade tiles while keeping their text, donation
state markers and selection behavior. Hover, press, focus and selection use the
highlighted panel frame; ordinary action buttons keep their button artwork.
Noninteractive panels stay on the normal frame.

Bounded containers include Temple detail cards, the pause menu and its scrollable
blessings inset, Trial cards/results, Testing tools groups and the cinematic
toolbar. Full-screen backdrops remain separate. Padding and border-box sizing on
the pause wrapper keep its content inside the frame. Existing blessing-list
scrolling remains independent, including short landscape layouts.

Startup preloads the PNG and SVG assets through the existing artwork glob. Dark
fallback fills keep labels readable, and forced-colors mode uses system borders.
