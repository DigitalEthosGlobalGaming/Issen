# field-banks-atlas PBR pack

Generated from [field-banks-atlas.png](../../field-banks-atlas.png) with `stone`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](field-banks-atlas_diffuse.png), [normal](field-banks-atlas_normal.png), [roughness](field-banks-atlas_roughness.png), metallic constant (see `field-banks-atlas.material.json`), [ao](field-banks-atlas_ao.png), emissive constant (see `field-banks-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [field-banks-atlas.material.json](field-banks-atlas.material.json).
