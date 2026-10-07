# button-atlas PBR pack

Generated from [button-atlas.png](../../button-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 256Ã—128 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](button-atlas_diffuse.png), [normal](button-atlas_normal.png), [roughness](button-atlas_roughness.png), [metallic](button-atlas_metallic.png), [ao](button-atlas_ao.png), [emissive](button-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).
