# special-weapons-atlas PBR pack

Generated from [special-weapons-atlas.png](../../special-weapons-atlas.png) with `metal`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](special-weapons-atlas_diffuse.png), [normal](special-weapons-atlas_normal.png), [roughness](special-weapons-atlas_roughness.png), [metallic](special-weapons-atlas_metallic.png), [ao](special-weapons-atlas_ao.png), emissive constant (see `special-weapons-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [ink-sword.ts](../../../ink-sword.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [special-weapons-atlas.material.json](special-weapons-atlas.material.json).
