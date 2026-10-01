# Bamboo foreground reuse

The foreground pass reuses the existing `bamboo-atlas.png` unchanged. No new
image was generated or edited. The source sheet was visually inspected: four
independent upright bamboo clumps with transparent space, charcoal stems,
ivory leaves and small root clusters. Existing atlas provenance remains in
`README.md`.

`../bamboo-foreground.ts` uses equal 2×2 cells 0 (upper left) and 3 (lower right).
Each complete square cell is scaled with native aspect to 1.18 viewport heights.
Roots end at 1.13 viewport heights, outside the visible screen. The right clump
is mirrored to frame inward; this deliberately changes its light direction.

Two private transparent edge canvases retain only the outer 20% of portrait
width or 24% of landscape width. Their inward edges fade to alpha zero rather
than creating an abrupt rectangle. The central 60%/52% remains clear, apart
from at most 2px of presentation sway. Cache density is capped at 1.5 (1 in
low-quality mode) and the pair is limited to two million pixels. Resizing or
changing the atlas rebuilds them; disposal zeros and releases both canvases.

The pass targets Hollow Bamboo Road, scene index 4. It must be composed after
the player and enemies, before film grading and interface elements, only while
the Ink environment is active and ready. Its input image is caller-owned;
loading, Classic fallback and backend selection remain with the environment
renderer. Reduced-motion and reduced-flash settings freeze sway. No gameplay
randomness or state is consumed. Foreground assembly still needs final
desktop/tablet preview inspection in the integrated scene.
