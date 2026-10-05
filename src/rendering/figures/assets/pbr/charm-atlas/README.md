# charm-atlas PBR pack

Generated from [charm-atlas.png](../../charm-atlas.png) with `cloth`, `metal`, `bone`, `wood`, `polished-wood`, Sprite/OpenGL.

Six aligned 1536×1024 maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.

Maps: [diffuse](charm-atlas_diffuse.png), [normal](charm-atlas_normal.png), [roughness](charm-atlas_roughness.png), [metallic](charm-atlas_metallic.png), [ao](charm-atlas_ao.png), [emissive](charm-atlas_emissive.png).

Exact settings and provenance: [generation.json](generation.json).

Generated and installed; renderer lighting is not connected by this pack. Visual review is pending. Source artwork is unchanged.

Frame compositions and exact settings are recorded in [generation.json](generation.json). All other pixels use the base preset.

Polished wood approximates a smooth nonmetal wind chime; the flame remains a matte first-pass export.

Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions](../../../../../../scripts/pbr/README.md).
