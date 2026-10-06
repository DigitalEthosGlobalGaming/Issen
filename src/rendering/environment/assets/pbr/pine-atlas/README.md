# pine-atlas PBR pack

Generated from [pine-atlas.png](../../pine-atlas.png) with `wood`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](pine-atlas_diffuse.png), [normal](pine-atlas_normal.png), [roughness](pine-atlas_roughness.png), metallic constant (see `pine-atlas.material.json`), [ao](pine-atlas_ao.png), emissive constant (see `pine-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [pine-atlas.material.json](pine-atlas.material.json).
