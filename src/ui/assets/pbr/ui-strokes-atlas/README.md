# ui-strokes-atlas PBR pack

Generated from [ui-strokes-atlas.png](../../ui-strokes-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 1536Ã—256 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](ui-strokes-atlas_diffuse.png), [normal](ui-strokes-atlas_normal.png), [roughness](ui-strokes-atlas_roughness.png), metallic constant (see `ui-strokes-atlas.material.json`), [ao](ui-strokes-atlas_ao.png), emissive constant (see `ui-strokes-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [ui-strokes-atlas.material.json](ui-strokes-atlas.material.json).
