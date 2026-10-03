# World UI atlas

One editable, packed grayscale atlas extends Issen's existing procedural panel
artwork and calligraphic symbols. It contains five seal materials, scroll paper
and its rod, and the seven existing crest motifs. Regenerate with
`node scripts/generate-world-ui-atlas.mjs`; the script renders the SVG through
Playwright's Edge channel and writes the atlas and exact frame crops.

The atlas is 768 × 640 pixels. [The manifest](world-ui-atlas.json) contains frame
rectangles with a top-left origin and frame-local center pivots. Material and
scroll-paper frames are 192 × 192 with a 36-pixel nine-slice inset. The rod is
192 × 48. Crest cells are 128 × 128 and retain transparent negative space.

All RGB channels are equal, allowing runtime tinting. Material interiors are
opaque, with charcoal edges and light value planes; their surrounding gutters
are transparent. Crests use white brush strokes on transparency. Tint the
complete material image while preserving its luminance differences; mask
coloring alone is suitable for crests. Do not mirror or rotate crest motifs.

The materials use paper fibres, wood grain, riveted metal facets, silk folds and
stone chips to distinguish them without labels. Bold tapered crest strokes,
irregular rings and small dry-brush breaks follow the main Issen logo. Source
motifs match `drawCrest`'s Tomoe, Bellflower, Cross, Hollyhock, Wisteria, Crane
and Six Coins, preserving the existing equipment IDs.

Validation: rendered and inspected the packed sheet; every frame has transparent
corners and contained alpha bounds, and no pixel has unequal RGB channels.
There is at least seven pixels of transparent padding around material silhouettes
and fourteen around crest artwork. The atlas requires no image-generation call.
