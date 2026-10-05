# Enemy PBR atlases

Generated on 5 October 2026 through `scripts/pbr/cli.mjs` using the `cloth` preset
in Sprite/OpenGL mode. Sources are `../enemy-ronin-simple.png` (1254×1254) and
`../enemy-clothing-variants.png` (1536×1024). Source atlases are retained.

Each atlas supplies diffuse, normal, roughness, metallic, AO and emissive maps.
Normal intensity 0.6, roughness base 0.85, metallic offset -0.5, metallic contrast
0 and emission 0 provide soft, matte clothing. The first pass applies cloth to
all clothing variants, including stylised armour panels; mixed-material exports
can replace individual frames later.

`ink-enemy.ts` preserves its existing frame rectangles, palette recolouring,
pose transforms and Canvas fallback. Clothing and heads sample aligned PBR maps;
hands and the procedural under-robe bridge retain their existing flat rendering.
Fog is applied after shader lighting, and remains baked into Canvas cutouts.
All maps participate in renderer readiness and disposal.

Regenerate from the repository root:

```powershell
node scripts/pbr/cli.mjs --input src/rendering/figures/assets/enemy-ronin-simple.png --output tmp/pbr/enemies/base --preset cloth --mode sprite
node scripts/pbr/cli.mjs --input src/rendering/figures/assets/enemy-clothing-variants.png --output tmp/pbr/enemies/clothing --preset cloth --mode sprite
```

Extract only the six maps above into this directory after inspecting the exports.
Height, distance and separate opacity outputs are unused. Export integrity,
dimensions, applied settings and unchanged diffuse alpha were verified on import.
See the [PBR tool instructions](../../../../../scripts/pbr/README.md).

## Headwear materials

Added in 1.64.0. Sources are `../enemy-headwear-atlas.png` (1536×1024) and
`../enemy-headwear-variants.png` (1254×1254), generated in Sprite/OpenGL mode.
Both supply the same six maps and retain original diffuse alpha.

The accessory atlas starts with `cloth`. Replace the kasa frame
`[8, 137, 557, 290]` with the `wood` export for a matte straw approximation,
and the kabuto `[582, 64, 458, 419]` and jingasa `[490, 588, 576, 301]` frames
with `metal`. Hair, mask and hood retain cloth. Transparent face openings are
preserved.

The complete-head atlas starts with `cloth`. Its crested helmet frame
`[82, 660, 494, 504]` uses `metal` only where source alpha is nonzero and
source red minus blue is at most 12 (8-bit channels). Warm ivory face and neck
pixels retain cloth maps. This colour-based mask is specific to the current
atlas; inspect it again if the artwork changes. Other complete heads remain matte.
The base face uses the existing nonmetal base maps without palette recolouring.

To regenerate, export the accessory atlas once each with `cloth`, `metal` and
`wood`, and the complete-head atlas once each with `cloth` and `metal`, then
compose the frames and mask above for all six maps:

```powershell
node scripts/pbr/cli.mjs --input src/rendering/figures/assets/enemy-headwear-atlas.png --output tmp/pbr/enemies/heads --preset metal --mode sprite
node scripts/pbr/cli.mjs --input src/rendering/figures/assets/enemy-headwear-variants.png --output tmp/pbr/enemies/heads --preset cloth --mode sprite
```

All five exports passed archive, settings, dimensions and diffuse-alpha checks.
The composed helmet's warm face and neck pixels were checked against the cloth
metallic map. Strict TypeScript checks passed; gameplay tests were not run.
