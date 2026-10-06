# fog-wisps-atlas PBR pack

Generated from [fog-wisps-atlas.png](../../fog-wisps-atlas.png) with `default`, Sprite/OpenGL.

Six aligned 1774Ã—887 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](fog-wisps-atlas_diffuse.png), [normal](fog-wisps-atlas_normal.png), [roughness](fog-wisps-atlas_roughness.png), [metallic](fog-wisps-atlas_metallic.png), [ao](fog-wisps-atlas_ao.png), [emissive](fog-wisps-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [index.ts](../../../index.ts). Visual review is pending. Source artwork is unchanged.

This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement during visual review.

Generated reference maps; this artwork is not automatically a physical material or a lit surface.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [fog-wisps-atlas.material.json](fog-wisps-atlas.material.json).
