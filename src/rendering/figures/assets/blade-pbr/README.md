# Blade PBR atlas

Regenerated through `scripts/pbr/cli.mjs` on 5 October 2026. Each atlas plane is
1254×1254 and shares the existing `BLADE_PROFILE_FRAMES` layout in
`blade-recipes.ts`. The six rows supply five metal blade shapes and the wooden
bokken profile. The source is `../blade-profile-atlas.png`. Sprite/OpenGL exports
use the `metal` preset for steel and the `wood` preset for the bokken. The wood
export replaces the bokken frame `[107, 1080, 1043, 78]` in each metal atlas map.
Diffuse alpha retains the source silhouette.

Imported maps: diffuse, normal, roughness, metallic, AO and emissive. Normal
orientation is interpreted as OpenGL Y-up and converted in the shader.
The asset tool packs roughness, metallic and AO into an opaque RGB data texture.
Diffuse retains its alpha and recipe tint. Height, distance and separate opacity
exports are omitted because the runtime uses flat sprites and diffuse alpha.

See [sword lighting](../../../../../docs/features/sword-lighting.md) for ownership,
lighting controls and verification.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| blade-profile-atlas | [diffuse](blade-profile-atlas_diffuse.webp), [normal](blade-profile-atlas_normal.webp), [surface](blade-profile-atlas_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->
