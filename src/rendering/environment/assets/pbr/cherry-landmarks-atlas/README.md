# cherry-landmarks-atlas PBR pack

Generated from [cherry-landmarks-atlas.png](../../cherry-landmarks-atlas.png) with `wood`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](cherry-landmarks-atlas_diffuse.png), [normal](cherry-landmarks-atlas_normal.png), [roughness](cherry-landmarks-atlas_roughness.png), [metallic](cherry-landmarks-atlas_metallic.png), [ao](cherry-landmarks-atlas_ao.png), [emissive](cherry-landmarks-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
