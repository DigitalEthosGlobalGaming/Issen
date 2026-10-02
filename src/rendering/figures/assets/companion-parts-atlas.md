# Modular companion parts

Original built-in ImageGen PNG, 1254 × 1254 pixels, RGBA, generated 2026-10-02. References: [existing companions](companion-atlas.png) and [mystic rock](mystic-rock.png). The saved PNG is unchanged; no recoloring, trimming or procedural repainting.

Sixteen detached parts support articulated animation: head turns, tail movement, foreleg gestures, crow wing rotation and independent mystic-stone shards/ring. Broad muted ash-brown/ivory Shiba facets and charcoal/gray cat/crow facets match existing companions. The rock retains restrained gold/lavender accents. Animals face right.

## Frame geometry

The generated sheet does **not** align to an equal 4 × 4 grid. Use these verified packed frames. Coordinates are source pixels, top-left origin. Bounds are frame-local `(left, top, right, bottom)`, right/bottom exclusive, at alpha ≥ 32. Pivots are proposed normalized frame-local `(x, y)` attachment points; they require parent rig assembly/pose validation and are not verified joints.

| Part            | Frame `(x, y, width, height)` | Visible bounds         | Proposed pivot and meaning             |
| --------------- | ----------------------------- | ---------------------- | -------------------------------------- |
| shiba-body      | `(0, 0, 313, 440)`            | `(106, 221, 254, 361)` | `(0.69, 0.80)` hindfoot ground         |
| shiba-head      | `(313, 0, 314, 440)`          | `(105, 236, 244, 372)` | `(0.53, 0.81)` short neck base         |
| shiba-tail      | `(627, 0, 313, 440)`          | `(111, 259, 223, 364)` | `(0.68, 0.80)` lower-right tail base   |
| shiba-foreleg   | `(940, 0, 314, 440)`          | `(110, 229, 182, 370)` | `(0.44, 0.54)` upper leg joint         |
| cat-body        | `(0, 440, 313, 300)`          | `(106, 86, 254, 230)`  | `(0.67, 0.73)` hindfoot ground         |
| cat-head        | `(313, 440, 314, 300)`        | `(117, 82, 251, 233)`  | `(0.58, 0.75)` short neck base         |
| cat-tail        | `(627, 440, 313, 300)`        | `(101, 90, 239, 230)`  | `(0.72, 0.73)` lower-right tail base   |
| cat-frontlegs   | `(940, 440, 314, 300)`        | `(104, 99, 201, 222)`  | `(0.49, 0.34)` paired upper leg joints |
| crow-body       | `(0, 740, 313, 250)`          | `(91, 66, 281, 210)`   | `(0.71, 0.82)` toe ground              |
| crow-head       | `(313, 740, 314, 250)`        | `(121, 89, 262, 193)`  | `(0.58, 0.74)` neck base               |
| crow-nearwing   | `(627, 740, 313, 250)`        | `(91, 74, 240, 209)`   | `(0.72, 0.34)` upper-right wing root   |
| crow-farwing    | `(940, 740, 314, 250)`        | `(78, 76, 227, 209)`   | `(0.28, 0.35)` upper-left wing root    |
| rock-core       | `(0, 990, 313, 264)`          | `(111, 62, 243, 198)`  | `(0.57, 0.49)` core center             |
| rock-uppershard | `(313, 990, 314, 264)`        | `(143, 71, 221, 198)`  | `(0.58, 0.50)` shard center            |
| rock-lowershard | `(627, 990, 313, 264)`        | `(118, 77, 206, 197)`  | `(0.52, 0.52)` shard center            |
| rock-ring       | `(940, 990, 314, 264)`        | `(72, 98, 243, 180)`   | `(0.50, 0.52)` ellipse center          |

Frame rectangles include transparent attachment room. Native visible pixel scale varies slightly between body/head/wing parts; assemble with explicit per-part scales rather than stretching every full frame to one equal square. Heads include short neck material for overlap. Dog torso retains hindlegs and a far frontleg; cat torso retains only haunch and hindfoot. Crow torso retains feet and leftward tail; broad side facet shapes form the torso/tail transition. Separate wings are layered over its upper flank. The mystical ring is a fixed three-quarter ellipse; independent in-plane rotation is possible, but a true 3D orbit requires a renderer treatment.

## Validation

Inspected each detached part on the sheet. Alpha spans 0–255; 87.29% of source pixels are fully transparent. Materially visible alpha ≥ 32 is wholly inside the explicit frames. The largest part is the crow body at 190 × 144 visible pixels. Very faint generated fringe remains below that alpha threshold. No ground, cast floor shadows, text or assembled animal is baked into the atlas. Assembly proportions, pivots, joint overlaps, extreme poses and intended display scale must be validated in the parent renderer before treating the rig as finished.

## Prompt and refinement

Generate sixteen disconnected parts in four rows using the existing companion and mystic-rock references, with broad flat charcoal/gray/ivory facets and muted Shiba brown. Row one: headless tailless dog torso with hindlegs and far frontleg, right-facing head with short neck, curled tail, detached near foreleg. Row two: headless tailless cat torso with haunch/hindfoot only, right-facing head, long curved tail, paired frontlegs. Row three: crow torso with feet and leftward tail, no head or separate wings attached; right-facing head/neck; near wing with root at upper right; opposite wing with root upper left. Row four: faceted mystic core, detached upper shard, detached lower shard, thin elliptical mystical ring. Every part stays complete and isolated with real alpha, no text/grid/ground/shadows. Correct cat torso to remove frontlegs. Reduce every part independently to sparse packing with large transparent gutters, preserving anatomy and colors. The final generated spacing is represented by measured packed frames above.

## Runtime assembly validation

The parent renderer uses explicit source-pixel joints and independent part scales, rather than the provisional normalized pivots alone. Idle, moving and active reaction assemblies were inspected in a four-companion browser gallery. Foot anchors stay fixed for the seated animals and Crow; Mystic Rock intentionally floats. The upper and lower shards sit apart from the core. Joint transforms freeze with reduced motion and restore caller canvas state. Frame geometry and native aspect ratios are checked in the companion unit tests.
