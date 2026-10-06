# snow-boulders-atlas PBR pack

Generated from [snow-boulders-atlas.png](../../snow-boulders-atlas.png) with `stone`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](snow-boulders-atlas_diffuse.png), [normal](snow-boulders-atlas_normal.png), [roughness](snow-boulders-atlas_roughness.png), metallic constant (see `snow-boulders-atlas.material.json`), [ao](snow-boulders-atlas_ao.png), emissive constant (see `snow-boulders-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [snow-boulders-atlas.material.json](snow-boulders-atlas.material.json).
