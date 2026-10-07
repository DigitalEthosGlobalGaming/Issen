# outfit-cloth-atlas PBR pack

Generated from [outfit-cloth-atlas.png](../../outfit-cloth-atlas.png) with `cloth`, `wood`, `leather`, Sprite/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| outfit-cloth-atlas | [diffuse](outfit-cloth-atlas_diffuse.webp), [normal](outfit-cloth-atlas_normal.webp), [surface](outfit-cloth-atlas_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [outfit-kit.ts](../../../outfit-kit.ts). Visual review is pending. Source artwork is unchanged.

Frame compositions and exact settings are recorded in [generation.json](generation.json). All other pixels use the base preset.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
