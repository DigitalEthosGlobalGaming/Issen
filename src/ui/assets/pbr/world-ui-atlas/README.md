# world-ui-atlas PBR pack

Generated from [world-ui-atlas.png](../../world-ui-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 768Ã—640 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](world-ui-atlas_diffuse.png), [normal](world-ui-atlas_normal.png), [roughness](world-ui-atlas_roughness.png), metallic constant (see `world-ui-atlas.material.json`), [ao](world-ui-atlas_ao.png), emissive constant (see `world-ui-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [world-ui-atlas.material.json](world-ui-atlas.material.json).
