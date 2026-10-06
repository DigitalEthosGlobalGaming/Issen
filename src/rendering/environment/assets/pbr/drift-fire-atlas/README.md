# drift-fire-atlas PBR pack

Generated from [drift-fire-atlas.png](../../drift-fire-atlas.png) with `default`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](drift-fire-atlas_diffuse.png), [normal](drift-fire-atlas_normal.png), [roughness](drift-fire-atlas_roughness.png), [metallic](drift-fire-atlas_metallic.png), [ao](drift-fire-atlas_ao.png), [emissive](drift-fire-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [drift-renderer.ts](../../../../scene/drift-renderer.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Generated reference maps; this artwork is not automatically a physical material or a lit surface.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [drift-fire-atlas.material.json](drift-fire-atlas.material.json).
