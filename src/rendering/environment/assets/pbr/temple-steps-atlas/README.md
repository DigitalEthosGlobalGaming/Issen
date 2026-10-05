# temple-steps-atlas PBR pack

Generated from [temple-steps-atlas.png](../../temple-steps-atlas.png) with `stone`, Sprite/OpenGL.

Six aligned 2172Ã—724 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](temple-steps-atlas_diffuse.png), [normal](temple-steps-atlas_normal.png), [roughness](temple-steps-atlas_roughness.png), [metallic](temple-steps-atlas_metallic.png), [ao](temple-steps-atlas_ao.png), [emissive](temple-steps-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
