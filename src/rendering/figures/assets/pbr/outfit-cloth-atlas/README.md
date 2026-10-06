# outfit-cloth-atlas PBR pack

Generated from [outfit-cloth-atlas.png](../../outfit-cloth-atlas.png) with `cloth`, `wood`, `leather`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](outfit-cloth-atlas_diffuse.png), [normal](outfit-cloth-atlas_normal.png), [roughness](outfit-cloth-atlas_roughness.png), metallic constant (see `outfit-cloth-atlas.material.json`), [ao](outfit-cloth-atlas_ao.png), emissive constant (see `outfit-cloth-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [outfit-kit.ts](../../../outfit-kit.ts). Visual review is pending. Source artwork is unchanged.

Frame compositions and exact settings are recorded in [generation.json](generation.json). All other pixels use the base preset.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [outfit-cloth-atlas.material.json](outfit-cloth-atlas.material.json).
