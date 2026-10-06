# awakening-buttons-atlas PBR pack

Generated from [awakening-buttons-atlas.png](../../awakening-buttons-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 768Ã—128 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](awakening-buttons-atlas_diffuse.png), [normal](awakening-buttons-atlas_normal.png), [roughness](awakening-buttons-atlas_roughness.png), metallic constant (see `awakening-buttons-atlas.material.json`), [ao](awakening-buttons-atlas_ao.png), emissive constant (see `awakening-buttons-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [awakening-buttons-atlas.material.json](awakening-buttons-atlas.material.json).
