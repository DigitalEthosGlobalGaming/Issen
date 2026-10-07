# drift-leaves-atlas PBR pack

Generated from [drift-leaves-atlas.png](../../drift-leaves-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](drift-leaves-atlas_diffuse.png), [normal](drift-leaves-atlas_normal.png), [roughness](drift-leaves-atlas_roughness.png), [metallic](drift-leaves-atlas_metallic.png), [ao](drift-leaves-atlas_ao.png), [emissive](drift-leaves-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [drift-renderer.ts](../../../../scene/drift-renderer.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
