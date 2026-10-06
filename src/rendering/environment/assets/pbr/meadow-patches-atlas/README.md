# meadow-patches-atlas PBR pack

Generated from [meadow-patches-atlas.png](../../meadow-patches-atlas.png) with `wood`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](meadow-patches-atlas_diffuse.png), [normal](meadow-patches-atlas_normal.png), [roughness](meadow-patches-atlas_roughness.png), metallic constant (see `meadow-patches-atlas.material.json`), [ao](meadow-patches-atlas_ao.png), emissive constant (see `meadow-patches-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [meadow-patches-atlas.material.json](meadow-patches-atlas.material.json).
