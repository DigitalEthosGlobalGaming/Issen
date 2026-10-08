# world-ui-material-metal PBR pack

Generated from [world-ui-material-metal.png](../../world-ui-material-metal.png) with `metal`, Texture/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| world-ui-material-metal | [diffuse](world-ui-material-metal_diffuse.webp), [normal](world-ui-material-metal_normal.webp), [surface](world-ui-material-metal_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).
