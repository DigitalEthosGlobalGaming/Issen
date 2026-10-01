# Mystic rock companion

Single complete floating-stone sprite, **1145 × 1373 pixels**, original RGBA PNG retained without repainting or trimming. Broad charcoal/ivory facets, restrained pale lavender and antique-gold fissures, three large geometric rune motifs, and a close broken orbital ring. No ground, floor shadow, landscape or character face. The local glow and ring are baked into the same cutout and cannot rotate independently.

## Geometry and use

- Source frame: `x=0, y=0, width=1145, height=1373`.
- Visible bounds at alpha >16, inclusive source coordinates: `(183,103)` through `(971,1259)`; width789, height1157.
- Floating center/pivot: `(580,680)` in source pixels (top-left origin), chosen visually around the stone's mass. Suggested rotation should be small; the source is a fixed three-quarter graphic view.
- Virtual ground anchor: `(580,1350)` in source pixels. This is a placement convention, not a pixel contact point: the stone remains suspended91 source pixels above it.
- At120px visible height use uniform scale `120/1157`. Visible width is approximately81.8px including ring; native aspect must be preserved rather than stretched to100px.
- Anchoring the virtual ground point at the usual companion feet places the stone's bottom about9.4px above that ground. A subtle independent vertical bob may move the whole cutout. Reduced-motion mode should use a stationary pose.
- Keep normal source-over blending and existing downstream film grading. No additive full-image blend is required. The glow is restrained and does not require pulsing or flashing.

Measured **1,143,169 fully transparent pixels**,428,194 partially transparent pixels (including generated near-opaque surface pixels, antialiasing, and local aura). Outer image boundary maximum alpha is0. Complete rock and ring fit within safe padding; the transparent background and interior spaces around the ring were inspected. This is one pose, not an animation atlas. No renderer integration or gameplay unlock code is included in this asset-only change.

## Provenance

Generated2026-10-01 with the built-in imagegen tool. Actual references inspected and supplied:

- `src/rendering/figures/assets/player-ronin-simple.png`: primary broad flat minimal-detail character palette/facet style.
- `src/rendering/environment/assets/rocks-atlas.png`: secondary irregular rock silhouette only; its ground and surface texture were explicitly excluded.

Original generation filename: `exec-fff01c3a-27f1-42f2-8f2f-ab0196d3c216.png`. Saved project PNG is the unmodified original output.

## Full generation prompt

Create ONE transparent game sprite of a mystical majestic floating stone companion. Reference1 player parts establishes broad SIMPLE FLAT charcoal/gray/ivory polygon facets and minimal detail; reference2 establishes irregular rock shapes only, DO NOT copy its texture, ground, grass or clusters. One upright irregular monolithic stone, wider upper shoulders narrowing to a broken pointed lower end, slightly asymmetrical, approximately 100px wide by120px tall in final gameplay. Broad flat angular charcoal and muted ivory facets, 8-12 major planes, no realistic surface texture/grain or fine details. Two or three broad fissures emit restrained pale lavender and muted antique-gold light, a simple thin broken mystical elliptical ring floats around its middle and a few large geometric rune marks on the stone. Quiet majestic supernatural character, not smiling/no face. Keep the ring close to stone so overall silhouette taller than wide; soft faint local glow only, true transparent background. Center entire complete cutout with 15% generous transparent margins on all sides. No ground, floor shadow, pedestal, environment, people, characters, text, labels, grid, extra rocks or particles. One single coherent cutout, not a sprite sheet. Flat ink-and-faceted game art that reads at120px.
