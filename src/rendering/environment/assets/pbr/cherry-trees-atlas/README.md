# cherry-trees-atlas PBR pack

Generated from [cherry-trees-atlas.png](../../cherry-trees-atlas.png) with `wood`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](cherry-trees-atlas_diffuse.png), [normal](cherry-trees-atlas_normal.png), [roughness](cherry-trees-atlas_roughness.png), metallic constant (see `cherry-trees-atlas.material.json`), [ao](cherry-trees-atlas_ao.png), emissive constant (see `cherry-trees-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [cherry-trees-atlas.material.json](cherry-trees-atlas.material.json).
