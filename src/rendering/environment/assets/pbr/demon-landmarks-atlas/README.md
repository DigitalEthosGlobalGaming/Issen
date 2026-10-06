# demon-landmarks-atlas PBR pack

Generated from [demon-landmarks-atlas.png](../../demon-landmarks-atlas.png) with `stone`, `wood`, Sprite/OpenGL.

Six aligned 1254Ã—1254 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](demon-landmarks-atlas_diffuse.png), [normal](demon-landmarks-atlas_normal.png), [roughness](demon-landmarks-atlas_roughness.png), metallic constant (see `demon-landmarks-atlas.material.json`), [ao](demon-landmarks-atlas_ao.png), emissive constant (see `demon-landmarks-atlas.material.json`).

Exact settings and provenance: [generation.json](generation.json).

Renderer lighting is connected through [demon-realm.ts](../../../demon-realm.ts). Visual review is pending. Source artwork is unchanged.

Frame compositions and exact settings are recorded in [generation.json](generation.json). All other pixels use the base preset.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).

Redundant generated maps and exact replacements: [demon-landmarks-atlas.material.json](demon-landmarks-atlas.material.json).
