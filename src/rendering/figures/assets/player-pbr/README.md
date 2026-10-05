# Sumi PBR atlas

Generated from `../player-ronin-simple.png` through `scripts/pbr/cli.mjs` on
5 October 2026 using the `cloth` preset in Sprite/OpenGL mode. Normal intensity
0.6, roughness base 0.85, metallic offset -0.5, metallic contrast 0 and emission
0 give the outfit softer surface detail and matte nonmetal lighting.

The six 1254×1254 maps share the source layout and diffuse alpha: diffuse,
normal, roughness, metallic, AO and emissive. Other exported maps are unused.
See [sword and Sumi lighting](../../../../../docs/features/sword-lighting.md)
for renderer ownership and lighting controls, and the
[PBR tool instructions](../../../../../scripts/pbr/README.md) for regeneration.
