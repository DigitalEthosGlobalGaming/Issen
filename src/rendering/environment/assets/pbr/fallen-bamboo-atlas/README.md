# fallen-bamboo-atlas PBR pack

Generated from [fallen-bamboo-atlas.png](../../fallen-bamboo-atlas.png) with `wood`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](fallen-bamboo-atlas_diffuse.png), [normal](fallen-bamboo-atlas_normal.png), [roughness](fallen-bamboo-atlas_roughness.png), metallic constant (see `fallen-bamboo-atlas.material.json`), [ao](fallen-bamboo-atlas_ao.png), emissive constant (see `fallen-bamboo-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [fallen-bamboo-atlas.material.json](fallen-bamboo-atlas.material.json).
