# charm-atlas PBR pack

Generated from [charm-atlas.png](../../charm-atlas.png) with `cloth`, `metal`, `bone`, `wood`, `polished-wood`, Sprite/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| charm-atlas | [diffuse](charm-atlas_diffuse.webp), [normal](charm-atlas_normal.webp), [surface](charm-atlas_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [ink-charms.ts](../../../ink-charms.ts). Visual review is pending. Source artwork is unchanged.

Frame compositions and exact settings are recorded in [generation.json](generation.json). All other pixels use the base preset.

Polished wood approximates a smooth nonmetal wind chime; the flame remains a matte first-pass export.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
