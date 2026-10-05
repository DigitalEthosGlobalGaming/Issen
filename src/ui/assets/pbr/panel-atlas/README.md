# panel-atlas PBR pack

Generated from [panel-atlas.png](../../panel-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 384Ã—192 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](panel-atlas_diffuse.png), [normal](panel-atlas_normal.png), [roughness](panel-atlas_roughness.png), [metallic](panel-atlas_metallic.png), [ao](panel-atlas_ao.png), [emissive](panel-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).
