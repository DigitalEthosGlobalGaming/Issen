# Armoury room background

- Image: `armoury-room.png`, 1536 × 1024 pixels, opaque RGB.
- Use: full scenic menu backdrop; preserve its 3:2 aspect ratio with cover cropping.
- Composition: quiet shaded wall and empty tatami occupy the center, with weapons and furnishings toward the sides. No player or people are baked into the scene; the live equipment-preview character stands over this background.
- Suggested focus: center `(0.5, 0.5)` in normalized image coordinates. Portrait cover crops retain the room's calm central wall and empty tatami; edge decorations may be partially cropped.
- Do not mirror: the asymmetric lighting, garden and player placement are intentional.

## Art direction and provenance

Generated with the built-in image generation tool on 2026-10-02. Visual references: [simplified player ronin](../../rendering/figures/assets/player-ronin-simple.png) and [field rocks](../../rendering/environment/assets/field-rocks-atlas.png). The repository PNG is an unchanged copy of the selected generated image.

Scene brief: Create a wide 1536 × 1024 opaque scenic menu background for Issen: the player's private comfortable traditional Japanese warrior room at quiet evening. Use subtle Japanese ink texture and angular warm-gray facets consistent with the environment and charcoal player art. Include tatami, timber beams, soft amber paper lantern light, folded robes, sword racks at left and right edges, a modest suit of armour by the wall, and a window looking onto a peaceful garden. Keep the central 40% darker and low detail for readable menus. Concentrate decorative furniture toward the edges, with muted ivory planes and restrained amber. Use broad flat angular values and painterly graphic ink surfaces; no text, UI, logos, borders or atlas grid. Fill every edge opaquely. Preserve a comfortable sanctuary impression when center-cover cropped.

Final edit prompt: Remove the kneeling person completely, including hair, head, torso, robes and associated shadow. Replace that area with continuous empty tatami and ordinary room structure matching perspective, window light and natural shadows. No player, people, silhouettes, figurines or humanoid mannequins. Keep the cozy room, sword racks, lanterns, folded robes, timber, garden window, palette, graphic ink-faceted style and perspective unchanged. The historical armour display at far left remains equipment only. Preserve a clear empty center floor for a live player model during equipment try-on. Final scene is an unoccupied opaque room background, without text or UI.

## Validation

Visually inspected the final edited scene. No player or person remains in the artwork. The garden and lanterns provide restrained warmth, with a quiet shaded wall and open tatami for the live character and menu overlay. No baked text or UI appears. Pixel inspection verified 1536 × 1024 RGB, which is fully opaque. Responsive crop and text contrast should also be checked in the consuming menu.
