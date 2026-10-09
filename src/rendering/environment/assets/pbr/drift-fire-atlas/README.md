# drift-fire-atlas PBR pack

Generated from [drift-fire-atlas.png](../../drift-fire-atlas.png) with `default`, Sprite/OpenGL.

Authoring planes retain the original atlas dimensions and diffuse alpha. This pack is excluded from the runtime material catalog as of1.69.15; drift uses the merged colour/emissive pair under `../../drift/`.

<!-- runtime-planes:start -->
## Retained authoring plane set

| Source family | Aligned planes |
| --- | --- |
| drift-fire-atlas | [diffuse](drift-fire-atlas_diffuse.webp), [normal](drift-fire-atlas_normal.webp), [surface](drift-fire-atlas_surface.webp), [emissive](drift-fire-atlas_emissive.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->

Exact settings and provenance: [generation.json](generation.json).

Runtime lighting uses the cheap composite path in [drift-renderer.ts](../../../../scene/drift-renderer.ts). These full-resolution maps remain for authoring and regeneration; source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Generated reference maps; this artwork is not automatically a physical material or a lit surface.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
