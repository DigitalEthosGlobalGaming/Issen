# katana PBR pack

Generated from [katana.png](../../katana.png) with `metal`, Sprite/OpenGL.

Six aligned 2172Ã—724 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](katana_diffuse.png), [normal](katana_normal.png), [roughness](katana_roughness.png), [metallic](katana_metallic.png), [ao](katana_ao.png), [emissive](katana_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../../../ui/material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Retained source: inspect its lighting with Material preview in the tilde panel; it is not placed in gameplay.
