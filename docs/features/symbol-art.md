# Calligraphic symbol art

## Shared direction

Symbols, emblems and menu illustrations should use the calligraphic brush style
of Issen's main logo. Use [the logo](../../assets/play-store/pc/logo-600x400.png)
as the style reference: broad gestural strokes, tapered ends, dry-brush breaks,
irregular edges and generous negative space. Symbols represent their meaning
through a few readable strokes rather than detailed object illustrations.

Use muted ivory ink on dark menus, restrained warm-gray texture within the
strokes, and occasional small vermilion accents. Preserve actual transparent
backgrounds. Avoid smooth outline icon sets, emoji, glossy shading, colored
fringes and paper rectangles. Match this direction for new or revised game
symbols; retain legible direction cues and accessible text. Existing functional
symbols can migrate when their owning surface is updated.

## Temple and Trials

Version 1.33.0 adds one symbol for each of the nine Temple upgrades and ten
Trials. Temple tiles and their selected detail share the same emblem. Trial
cards and result panels show the emblem for the corresponding encounter.
Names, objectives, ranks and button labels remain visible text; the artwork is
decorative and hidden from assistive technology.

- [Temple atlas](../../src/ui/assets/temple-symbols-atlas.md): three columns,
  three rows, all cells used.
- [Trial atlas](../../src/ui/assets/trial-symbols-atlas.md): four columns,
  three rows, the last two cells empty.

`src/ui/symbol-art.ts` maps stable upgrade/trial IDs to row-major cells and
creates a shared decorative DOM element. Its CSS background scales the complete
atlas and selects a cell without stretching the square symbol or decoding
separate images. Layout and display sizes belong to the owning screen styles.
The PNGs live under `src/ui/assets/`, so startup's existing artwork preloader
loads and decodes them before screens mount. No gameplay or save rules change.

Keep each complete symbol inside its cell with transparent padding. Do not
rotate or mirror it in the UI: direction and composition are part of its
meaning. Future atlas additions must update the ID mapping and atlas metadata
together. Inspect the sheet, alpha boundaries, representative cells at menu
scale, and portrait/landscape screens before accepting a new batch.

Demon Mirror is the eleventh Trial and uses the dedicated calligraphic [horned mirror emblem](../../src/ui/assets/demon-mirror-symbol.png), alongside the original ten-emblem Trial atlas.

Temple upgrade tiles use gold for affordable ranks, muted grey for unavailable ranks and jade for maxed ranks. Selection uses a separate ivory outline. Prices and owned ranks remain visible; completion has no extra label and no donation count appears on the title menu.
