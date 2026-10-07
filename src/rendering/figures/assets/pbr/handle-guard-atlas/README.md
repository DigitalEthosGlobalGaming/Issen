# handle-guard-atlas PBR pack

Generated from [handle-guard-atlas.png](../../handle-guard-atlas.png) with `leather`, `metal`, Sprite/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| handle-guard-atlas | [diffuse](handle-guard-atlas_diffuse.webp), [normal](handle-guard-atlas_normal.webp), [surface](handle-guard-atlas_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [ink-sword.ts](../../../ink-sword.ts). Visual review is pending. Source artwork is unchanged.

Frame compositions and exact settings are recorded in [generation.json](generation.json). All other pixels use the base preset.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
