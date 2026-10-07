# armoury-room PBR pack

Generated from [armoury-room.png](../../armoury-room.png) with `default`, Texture/OpenGL.

Runtime planes retain the original atlas dimensions and diffuse alpha.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| armoury-room | [diffuse](armoury-room_diffuse.webp), [normal](armoury-room_normal.webp), [surface](armoury-room_surface.webp), [emissive](armoury-room_emissive.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Generated reference maps; this artwork is not automatically a physical material or a lit surface.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).
