# drift-debris-atlas PBR pack

Generated from [drift-debris-atlas.png](../../drift-debris-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](drift-debris-atlas_diffuse.png), [normal](drift-debris-atlas_normal.png), [roughness](drift-debris-atlas_roughness.png), metallic constant (see `drift-debris-atlas.material.json`), [ao](drift-debris-atlas_ao.png), emissive constant (see `drift-debris-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [drift-renderer.ts](../../../../scene/drift-renderer.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [drift-debris-atlas.material.json](drift-debris-atlas.material.json).
