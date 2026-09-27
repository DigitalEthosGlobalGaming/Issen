# Rendering and visual consistency

Issen uses two rendering surfaces. The duel scene is procedural Canvas 2D, while
the interface around it is regular HTML and CSS. It is not an SVG-rendered game
and it does not use a sprite-sheet or image-asset pipeline.

The only SVG in the application is small inline interface artwork, such as the
mute control in `src/ui/shell.html` and the alternate mute icons assigned by
`src/game.ts`. Characters, scenery, weather, particles and combat effects are
drawn through `CanvasRenderingContext2D` paths, rectangles, ellipses, text,
gradients and compositing operations.

## Rendering surfaces

### Main scene

`src/ui/shell.html` provides the full-screen `canvas#c`. `src/game.ts` owns its
frame composition and delegates individual kinds of drawing to `src/rendering/`.
The canvas backing store is sized for the device pixel ratio, capped at 2, while
drawing uses CSS-pixel coordinates. A resize rebuilds layout-dependent cached
art and reprojects active figures.

The main scene is assembled back to front in a deliberate order:

1. cached stage background and light glows;
2. stage transition, mist, grass and ground stains;
3. rear leaves and enemies, including fog between depth groups;
4. boss, attacking enemies, bamboo, player and pet;
5. combat particles and foreground grass;
6. gameplay glyphs, smoke, front leaves, weather and text popups;
7. stamps and full-frame film, grain, vignette, damage, flash and letterbox effects.

The order is part of the presentation contract. Adding a renderer without choosing
its depth explicitly can make an otherwise correct effect appear behind fog,
figures or post-processing.

### Cached and generated canvases

Static or expensive artwork is drawn once to off-screen canvases and then copied
with `drawImage`. `src/rendering/scene/background.ts` creates a seeded stage
background at the current size and device pixel ratio. `src/game.ts` similarly
generates reusable mist, smoke, grain, vignette and ink-edge material. These are
generated bitmaps, not checked-in image assets.

### Interface, preview and sharing

HUD and screen content under `src/ui/` use HTML and CSS layered over the main
canvas. CSS variables in `src/styles/tokens.css` provide the core ink, paper,
seal and type values, and `src/styles/index.css` fixes the cascade order.

The armory has its own canvas. `src/rendering/armory-preview.ts` reuses the figure,
effect and film renderers but owns a separate animation clock and effect state.
`src/ui/share-card.ts` creates another canvas, copies the live scene into it and
adds a paper-like score-card layout. Neither renderer swaps or mutates the live
game canvas.

## Patterns that keep the style consistent

### A restrained ink, paper and seal language

The dominant values are near-black ink, warm off-white paper, muted natural
tones and a red seal accent. DOM surfaces take their core values from
`src/styles/tokens.css`. Figure colors start from `BASE` in
`src/rendering/palette.ts`; stage atmosphere comes from the stage records in
`src/game/content/stages.ts`; robe and blade variations live in
`src/game/content/cosmetics.ts`.

This is a shared visual language, not a single universal token system. Some Canvas
effects and props intentionally contain local color literals. Before adding a new
color, prefer an existing palette, stage value or CSS token when that value has
the same meaning; keep genuinely effect-specific colors beside their renderer.

### One typographic voice and repeated seal motifs

The application uses `Shippori Mincho B1` with Japanese serif fallbacks for both
DOM text and Canvas text. Heavy kanji, generous letter spacing, paper-colored
labels and red square seals recur in the HUD, banners, combat stamps and share
cards. Canvas renderers receive the font and seal color as explicit inputs so
secondary surfaces match the live game.

### Proportional geometry instead of fixed artwork

Figures are constructed from normalized proportions relative to their height.
`src/rendering/figures/types.ts` describes a figure as position, height, palette,
pose and optional costume or weapon details. `src/rendering/figures/figure.ts`
turns that model into Canvas paths. Poses are small data objects and are blended
or approached by the animation modules instead of being separate images.

The same principle applies to the scene. `src/rendering/layout.ts` derives the
horizon, ground, combat slots, player, strike and boss positions from viewport
dimensions. Most detail sizes use a scale based on the viewport or figure height.
Portrait and landscape therefore share a composition rather than maintaining two
sets of art.

### Seeded imperfection

Procedural hems, sleeves, hair, grass, ridgelines, clouds and stage props use
seeded random sources. The small variations keep silhouettes from feeling
mechanically identical, while stable seeds prevent static art from changing on
every frame. Frame-to-frame randomness is reserved for transient material such
as grain, scratches and particles.

### Depth through scale, fog and layer order

Enemy slots carry position, height and fog values. Distant figures are smaller
and have their base palette blended toward the stage fog color. Enemies are sorted
by vertical position where necessary, and foreground weather or foliage is drawn
after figures. This repeated combination creates depth without a 3D renderer.

### A common material pass

Gradients, soft radial blobs, low-saturation palettes and selective `lighter`,
`multiply`, `overlay` and `color` compositing create the painted light and mist.
`src/rendering/effects/film.ts` supplies named color treatments to both the live
scene and the armory preview. The final scene pass adds grain, scratches, vignette,
ink edges and flashes, which helps procedural elements read as one image.

### Explicit renderer inputs and isolated state

Renderer factories receive a specific `CanvasRenderingContext2D` and the values
they need. They do not discover a global canvas. Preview effects, live effects and
share output have separate state. This makes shared drawing code reusable without
letting a preview change gameplay or paint into the wrong surface.

Use `save()` and `restore()` around temporary transforms, alpha or composite modes.
If state is intentionally set without a save, restore the expected baseline before
returning. Leaked Canvas state can subtly recolor or displace every later layer.

## Where rendering changes belong

| Change | Owning location |
| --- | --- |
| Stage palette, weather choice or background theme | `src/game/content/stages.ts` |
| Static stage scenery and props | `src/rendering/scene/background.ts` |
| Moving weather, leaves, grass or smoke | `src/rendering/scene/` |
| Figure shape, clothing, weapon or pet drawing | `src/rendering/figures/` |
| Robe or blade appearance data | `src/game/content/cosmetics.ts` |
| Combat particles and transient effects | `src/rendering/effects/` |
| Main scene composition and full-frame post effects | `src/game.ts` |
| HUD or screen layout and styling | `src/ui/` and `src/styles/` |
| Armory-only composition | `src/rendering/armory-preview.ts` |
| Shared result-card composition | `src/ui/share-card.ts` |

Keep drawing functions dependent on explicit dimensions, time, state and random
sources. Reuse the figure/effect/film renderers for alternate views instead of
copying their shapes. Keep gameplay rules out of renderers: the runtime should
translate game state into poses, positions, appearance and effects.

## Verification

`tests/browser/rendering.spec.ts` checks renderer isolation, decorative particles,
all robe and blade variants, deterministic backgrounds in portrait and landscape,
and restoration of Canvas state after film effects. `tests/browser/game.spec.ts`
and `tests/production/app.spec.ts` cover armory drawing and landscape behavior in
the running application. These checks establish ownership and isolation; they do
not provide pixel-perfect visual regression coverage.
