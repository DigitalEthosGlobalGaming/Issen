# bamboo-atlas PBR pack

Generated from [bamboo-atlas.png](../../bamboo-atlas.png) with `wood`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](bamboo-atlas_diffuse.png), [normal](bamboo-atlas_normal.png), [roughness](bamboo-atlas_roughness.png), [metallic](bamboo-atlas_metallic.png), [ao](bamboo-atlas_ao.png), [emissive](bamboo-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
