# outfit-headwear-atlas PBR pack

Generated from [outfit-headwear-atlas.png](../../outfit-headwear-atlas.png) with `cloth`, `metal`, `wood`, Sprite/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| outfit-headwear-atlas | [diffuse](outfit-headwear-atlas_diffuse.webp), [normal](outfit-headwear-atlas_normal.webp), [surface](outfit-headwear-atlas_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [outfit-kit.ts](../../../outfit-kit.ts). Visual review is pending. Source artwork is unchanged.

Frame compositions and exact settings are recorded in [generation.json](generation.json). All other pixels use the base preset.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
