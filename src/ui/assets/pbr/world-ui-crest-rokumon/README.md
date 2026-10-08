# world-ui-crest-rokumon PBR pack

Generated from [world-ui-crest-rokumon.png](../../world-ui-crest-rokumon.png) with `cloth`, Sprite/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| world-ui-crest-rokumon | [diffuse](world-ui-crest-rokumon_diffuse.compact.png), [normal](world-ui-crest-rokumon_normal.webp), [surface](world-ui-crest-rokumon_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).
