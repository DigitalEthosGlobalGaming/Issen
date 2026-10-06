# temple-walls-atlas PBR pack

Generated from [temple-walls-atlas.png](../../temple-walls-atlas.png) with `stone`, Sprite/OpenGL.

Six aligned 2172Ã—724 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](temple-walls-atlas_diffuse.png), [normal](temple-walls-atlas_normal.png), roughness constant (see `temple-walls-atlas.material.json`), metallic constant (see `temple-walls-atlas.material.json`), [ao](temple-walls-atlas_ao.png), emissive constant (see `temple-walls-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [temple-walls-atlas.material.json](temple-walls-atlas.material.json).
