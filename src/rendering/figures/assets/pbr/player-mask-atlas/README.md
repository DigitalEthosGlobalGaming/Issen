# player-mask-atlas PBR pack

Generated from [player-mask-atlas.png](../../player-mask-atlas.png) with `polished-wood`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](player-mask-atlas_diffuse.png), [normal](player-mask-atlas_normal.png), [roughness](player-mask-atlas_roughness.png), metallic constant (see `player-mask-atlas.material.json`), [ao](player-mask-atlas_ao.png), emissive constant (see `player-mask-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [outfit-kit.ts](../../../outfit-kit.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [player-mask-atlas.material.json](player-mask-atlas.material.json).
