# handle-guard-atlas PBR pack

Generated from [handle-guard-atlas.png](../../handle-guard-atlas.png) with `leather`, `metal`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](handle-guard-atlas_diffuse.png), [normal](handle-guard-atlas_normal.png), [roughness](handle-guard-atlas_roughness.png), [metallic](handle-guard-atlas_metallic.png), [ao](handle-guard-atlas_ao.png), emissive constant (see `handle-guard-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [ink-sword.ts](../../../ink-sword.ts). Visual review is pending. Source artwork is unchanged.

Frame compositions and exact settings are recorded in [generation.json](generation.json). All other pixels use the base preset.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [handle-guard-atlas.material.json](handle-guard-atlas.material.json).
