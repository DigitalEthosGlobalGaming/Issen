# Ink button nine-slice atlas

Procedural ink/faceted artwork, created 2026-10-02 with
`scripts/generate-button-atlas.mjs`. The source is `button-atlas.svg`; Edge
rasterizes it into `button-atlas.png` and extracts the two runtime PNG frames.
Regenerate with `node scripts/generate-button-atlas.mjs` using the existing
Playwright dependency. Style reference: the charcoal facets and warm gray edges
in `src/rendering/environment/assets/field-rocks-atlas.png`.

## Layout contract

- Atlas: 256 × 128 pixels, transparent RGBA, top-left origin.
- Normal frame: `(0, 0, 128, 128)`; `button-normal.png`.
- Highlighted frame: `(128, 0, 128, 128)`; `button-highlighted.png`.
- Each frame is sliced 24 pixels from every side, leaving an 80 × 80 centre.
- Corner blocks stay fixed. The edge bands and centre stretch independently;
  these are nine-slices, not repeating textures. No rotation or mirroring.
- The silhouette has transparent outer margins; frame rectangles include these
  margins. There is no pivot: DOM layout determines each control's rectangle.
- CSS renders each 24-pixel band at 8 CSS pixels, using `border-image-slice:
  24 fill` and an explicit `border-image-width: 8px`. Existing layout border
  widths and content padding are retained.

Both centres stay dark so paper-colored labels, dim descriptions and gold/red
rarity labels remain readable. Highlighting adds brighter ivory ink and muted
vermilion corner marks. This frame covers primary, selected, equipped, preview,
focus, press and mouse-hover states; disabled and locked opacity is independent.
Locked Armoury tiles are previewable and receive hover/press highlights while
retaining their locked opacity. Hover uses `any-hover` so a secondary mouse or
trackpad can highlight controls on a device whose primary pointer is touch.

`src/styles/button-frames.css` owns shared styling and is imported last by
`src/styles/index.css`. Startup automatically preloads these assets through the
existing artwork glob. The plain charcoal fallback remains readable if an
image fails. Equipped badges, rarity indicators and keyboard outlines remain
separate from the frame. Forced-colors mode uses native system colors.
