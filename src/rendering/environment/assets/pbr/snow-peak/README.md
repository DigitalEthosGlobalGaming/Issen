# snow-peak PBR pack

Generated from [snow-peak.png](../../snow-peak.png) with `stone`, Sprite/OpenGL.

Six aligned 1881Ã—836 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](snow-peak_diffuse.png), [normal](snow-peak_normal.png), [roughness](snow-peak_roughness.png), metallic constant (see `snow-peak.material.json`), [ao](snow-peak_ao.png), emissive constant (see `snow-peak.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [snow-peak.material.json](snow-peak.material.json).
