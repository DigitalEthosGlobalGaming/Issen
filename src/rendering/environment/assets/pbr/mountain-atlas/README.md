# mountain-atlas PBR pack

Generated from [mountain-atlas.png](../../mountain-atlas.png) with `stone`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](mountain-atlas_diffuse.png), [normal](mountain-atlas_normal.png), [roughness](mountain-atlas_roughness.png), [metallic](mountain-atlas_metallic.png), [ao](mountain-atlas_ao.png), [emissive](mountain-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
