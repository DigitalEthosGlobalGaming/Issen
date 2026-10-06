# rocks-atlas PBR pack

Generated from [rocks-atlas.png](../../rocks-atlas.png) with `stone`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](rocks-atlas_diffuse.png), [normal](rocks-atlas_normal.png), [roughness](rocks-atlas_roughness.png), metallic constant (see `rocks-atlas.material.json`), [ao](rocks-atlas_ao.png), emissive constant (see `rocks-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../../../ui/material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Retained source: inspect its lighting with Material preview in the tilde panel; it is not placed in gameplay.

Redundant generated maps and exact replacements: [rocks-atlas.material.json](rocks-atlas.material.json).
