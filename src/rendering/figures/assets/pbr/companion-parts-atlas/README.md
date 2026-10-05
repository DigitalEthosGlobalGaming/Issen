# companion-parts-atlas PBR pack

Generated from [companion-parts-atlas.png](../../companion-parts-atlas.png) with `cloth`, `stone`, `metal`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](companion-parts-atlas_diffuse.png), [normal](companion-parts-atlas_normal.png), [roughness](companion-parts-atlas_roughness.png), [metallic](companion-parts-atlas_metallic.png), [ao](companion-parts-atlas_ao.png), [emissive](companion-parts-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [ink-companions.ts](../../../ink-companions.ts). Visual review is pending. Source artwork is unchanged.

Frame compositions and exact settings are recorded in [generation.json](generation.json). All other pixels use the base preset.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
