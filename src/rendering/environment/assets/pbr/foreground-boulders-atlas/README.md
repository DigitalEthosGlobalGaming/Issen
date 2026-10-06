# foreground-boulders-atlas PBR pack

Generated from [foreground-boulders-atlas.png](../../foreground-boulders-atlas.png) with `stone`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](foreground-boulders-atlas_diffuse.png), [normal](foreground-boulders-atlas_normal.png), [roughness](foreground-boulders-atlas_roughness.png), metallic constant (see `foreground-boulders-atlas.material.json`), [ao](foreground-boulders-atlas_ao.png), emissive constant (see `foreground-boulders-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [foreground-boulders-atlas.material.json](foreground-boulders-atlas.material.json).
