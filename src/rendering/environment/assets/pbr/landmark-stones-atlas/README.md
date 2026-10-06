# landmark-stones-atlas PBR pack

Generated from [landmark-stones-atlas.png](../../landmark-stones-atlas.png) with `stone`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](landmark-stones-atlas_diffuse.png), [normal](landmark-stones-atlas_normal.png), [roughness](landmark-stones-atlas_roughness.png), metallic constant (see `landmark-stones-atlas.material.json`), [ao](landmark-stones-atlas_ao.png), emissive constant (see `landmark-stones-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [landmark-stones-atlas.material.json](landmark-stones-atlas.material.json).
