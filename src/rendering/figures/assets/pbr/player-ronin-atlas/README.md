# player-ronin-atlas PBR pack

Generated from [player-ronin-atlas.png](../../player-ronin-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](player-ronin-atlas_diffuse.png), [normal](player-ronin-atlas_normal.png), [roughness](player-ronin-atlas_roughness.png), metallic constant (see `player-ronin-atlas.material.json`), [ao](player-ronin-atlas_ao.png), emissive constant (see `player-ronin-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../../../ui/material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Retained source: inspect its lighting with Material preview in the tilde panel; it is not placed in gameplay.

Redundant generated maps and exact replacements: [player-ronin-atlas.material.json](player-ronin-atlas.material.json).
