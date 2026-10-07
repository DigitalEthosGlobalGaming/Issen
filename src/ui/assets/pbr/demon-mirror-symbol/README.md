# demon-mirror-symbol PBR pack

Generated from [demon-mirror-symbol.png](../../demon-mirror-symbol.png) with `default`, Sprite/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| demon-mirror-symbol | [diffuse](demon-mirror-symbol_diffuse.webp), [normal](demon-mirror-symbol_normal.webp), [surface](demon-mirror-symbol_surface.webp), [emissive](demon-mirror-symbol_emissive.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Generated reference maps; this artwork is not automatically a physical material or a lit surface.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).
