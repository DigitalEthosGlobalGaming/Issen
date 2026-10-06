# button-normal PBR pack

Generated from [button-normal.png](../../button-normal.png) with `cloth`, Sprite/OpenGL.

Six aligned 128Ã—128 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](button-normal_diffuse.png), [normal](button-normal_normal.png), [roughness](button-normal_roughness.png), metallic constant (see `button-normal.material.json`), [ao](button-normal_ao.png), emissive constant (see `button-normal.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [button-normal.material.json](button-normal.material.json).
