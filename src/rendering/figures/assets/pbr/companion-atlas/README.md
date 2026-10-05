# companion-atlas PBR pack

Generated from [companion-atlas.png](../../companion-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](companion-atlas_diffuse.png), [normal](companion-atlas_normal.png), [roughness](companion-atlas_roughness.png), [metallic](companion-atlas_metallic.png), [ao](companion-atlas_ao.png), [emissive](companion-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../../../ui/material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Retained source: inspect its lighting with Material preview in the tilde panel; it is not placed in gameplay.
