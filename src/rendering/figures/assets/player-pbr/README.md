# Sumi PBR atlas

Generated from `../player-ronin-simple.png` through `scripts/pbr/cli.mjs` on
5 October 2026 using the `cloth` preset in Sprite/OpenGL mode. Normal intensity
0.6, roughness base 0.85, metallic offset -0.5, metallic contrast 0 and emission
0 give the outfit softer surface detail and matte nonmetal lighting.

The original six 1254×1254 maps share the source layout and diffuse alpha: diffuse,
normal, roughness, metallic, AO and emissive. Other exported maps are unused.
See [sword and Sumi lighting](../../../../../docs/features/sword-lighting.md)
for renderer ownership and lighting controls, and the
[PBR tool instructions](../../../../../scripts/pbr/README.md) for regeneration.

<!-- runtime-planes:start -->
## Runtime plane set

| Source family | Aligned planes |
| --- | --- |
| player-ronin-simple | [diffuse](player-ronin-simple_diffuse.webp), [normal](player-ronin-simple_normal.webp), [surface](player-ronin-simple_surface.webp) |

Surface RGB stores roughness, metallic and AO. Missing emissive means zero.
Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,
material recipes and generation provenance remain available for regeneration.
<!-- runtime-planes:end -->
