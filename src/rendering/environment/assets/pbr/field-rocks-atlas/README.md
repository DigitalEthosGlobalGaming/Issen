# field-rocks-atlas PBR pack

Generated from [field-rocks-atlas.png](../../field-rocks-atlas.png) with `stone`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](field-rocks-atlas_diffuse.png), [normal](field-rocks-atlas_normal.png), [roughness](field-rocks-atlas_roughness.png), metallic constant (see `field-rocks-atlas.material.json`), [ao](field-rocks-atlas_ao.png), emissive constant (see `field-rocks-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [field-rocks-atlas.material.json](field-rocks-atlas.material.json).
