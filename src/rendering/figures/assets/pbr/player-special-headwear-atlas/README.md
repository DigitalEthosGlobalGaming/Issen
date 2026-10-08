# player-special-headwear-atlas PBR pack

Generated from [player-special-headwear-atlas.png](../../player-special-headwear-atlas.png) with `cloth`, `wood`, Sprite/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| player-special-headwear-atlas | [diffuse](player-special-headwear-atlas_diffuse.webp), [normal](player-special-headwear-atlas_normal.webp), [surface](player-special-headwear-atlas_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [outfit-kit.ts](../../../outfit-kit.ts). Visual review is pending. Source artwork is unchanged.

Frame compositions and exact settings are recorded in [generation.json](generation.json). All other pixels use the base preset.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
