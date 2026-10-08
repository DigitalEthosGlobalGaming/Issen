# ui-strokes-atlas PBR pack

Generated from [ui-strokes-atlas.png](../../ui-strokes-atlas.png) with `cloth`, Sprite/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| ui-strokes-atlas | [diffuse](ui-strokes-atlas_diffuse.webp), [normal](ui-strokes-atlas_normal.webp), [surface](ui-strokes-atlas_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).
