# petal-ground-atlas PBR pack

Generated from [petal-ground-atlas.png](../../petal-ground-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 1659Ã—948 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](petal-ground-atlas_diffuse.png), [normal](petal-ground-atlas_normal.png), [roughness](petal-ground-atlas_roughness.png), metallic constant (see `petal-ground-atlas.material.json`), [ao](petal-ground-atlas_ao.png), emissive constant (see `petal-ground-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [petal-ground-atlas.material.json](petal-ground-atlas.material.json).
