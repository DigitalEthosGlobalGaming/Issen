# demon-terrain-atlas PBR pack

Generated from [demon-terrain-atlas.png](../../demon-terrain-atlas.png) with `stone`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](demon-terrain-atlas_diffuse.png), [normal](demon-terrain-atlas_normal.png), [roughness](demon-terrain-atlas_roughness.png), [metallic](demon-terrain-atlas_metallic.png), [ao](demon-terrain-atlas_ao.png), [emissive](demon-terrain-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [demon-realm.ts](../../../demon-realm.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
