# ui-strokes-atlas PBR pack

Generated from [ui-strokes-atlas.png](../../ui-strokes-atlas.png) with `cloth`, Sprite/OpenGL.

Six aligned 1536Ã—256 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](ui-strokes-atlas_diffuse.png), [normal](ui-strokes-atlas_normal.png), [roughness](ui-strokes-atlas_roughness.png), [metallic](ui-strokes-atlas_metallic.png), [ao](ui-strokes-atlas_ao.png), [emissive](ui-strokes-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is available through [material-lighting.ts](../../../material-lighting.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../scripts/pbr/README.md).
