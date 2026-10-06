# armour-plates-atlas PBR pack

Generated from [armour-plates-atlas.png](../../armour-plates-atlas.png) with `metal`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](armour-plates-atlas_diffuse.png), [normal](armour-plates-atlas_normal.png), [roughness](armour-plates-atlas_roughness.png), [metallic](armour-plates-atlas_metallic.png), [ao](armour-plates-atlas_ao.png), emissive constant (see `armour-plates-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [outfit-kit.ts](../../../outfit-kit.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [armour-plates-atlas.material.json](armour-plates-atlas.material.json).
