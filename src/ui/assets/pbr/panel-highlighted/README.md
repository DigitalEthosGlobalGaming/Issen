# panel-highlighted PBR pack

Generated from [panel-highlighted.png](../../panel-highlighted.png) with `cloth`, Sprite/OpenGL.

Six aligned 192Ã—192 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](panel-highlighted_diffuse.png), [normal](panel-highlighted_normal.png), [roughness](panel-highlighted_roughness.png), metallic constant (see `panel-highlighted.material.json`), [ao](panel-highlighted_ao.png), emissive constant (see `panel-highlighted.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [panel-highlighted.material.json](panel-highlighted.material.json).
