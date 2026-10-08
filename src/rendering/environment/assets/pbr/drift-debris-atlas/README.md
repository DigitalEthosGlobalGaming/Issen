# drift-debris-atlas PBR pack

Generated from [drift-debris-atlas.png](../../drift-debris-atlas.png) with `cloth`, Sprite/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| drift-debris-atlas | [diffuse](drift-debris-atlas_diffuse.webp), [normal](drift-debris-atlas_normal.webp), [surface](drift-debris-atlas_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [drift-renderer.ts](../../../../scene/drift-renderer.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
