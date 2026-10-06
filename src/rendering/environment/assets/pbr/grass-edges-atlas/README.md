# grass-edges-atlas PBR pack

Generated from [grass-edges-atlas.png](../../grass-edges-atlas.png) with `wood`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](grass-edges-atlas_diffuse.png), [normal](grass-edges-atlas_normal.png), [roughness](grass-edges-atlas_roughness.png), metallic constant (see `grass-edges-atlas.material.json`), [ao](grass-edges-atlas_ao.png), emissive constant (see `grass-edges-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [grass-edges-atlas.material.json](grass-edges-atlas.material.json).
