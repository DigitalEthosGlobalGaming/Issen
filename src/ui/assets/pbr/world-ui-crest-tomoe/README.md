# world-ui-crest-tomoe PBR pack

Generated from [world-ui-crest-tomoe.png](../../world-ui-crest-tomoe.png) with `cloth`, Sprite/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| world-ui-crest-tomoe | [diffuse](world-ui-crest-tomoe_diffuse.compact.png), [normal](world-ui-crest-tomoe_normal.webp), [surface](world-ui-crest-tomoe_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).
