# sea-stacks-atlas PBR pack

Generated from [sea-stacks-atlas.png](../../sea-stacks-atlas.png) with `stone`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](sea-stacks-atlas_diffuse.png), [normal](sea-stacks-atlas_normal.png), [roughness](sea-stacks-atlas_roughness.png), metallic constant (see `sea-stacks-atlas.material.json`), [ao](sea-stacks-atlas_ao.png), emissive constant (see `sea-stacks-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [sea-stacks-atlas.material.json](sea-stacks-atlas.material.json).
