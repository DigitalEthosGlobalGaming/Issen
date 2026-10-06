# drift-petals-atlas PBR pack

Generated from [drift-petals-atlas.png](../../drift-petals-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](drift-petals-atlas_diffuse.png), [normal](drift-petals-atlas_normal.png), [roughness](drift-petals-atlas_roughness.png), metallic constant (see `drift-petals-atlas.material.json`), [ao](drift-petals-atlas_ao.png), emissive constant (see `drift-petals-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [drift-renderer.ts](../../../../scene/drift-renderer.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [drift-petals-atlas.material.json](drift-petals-atlas.material.json).
