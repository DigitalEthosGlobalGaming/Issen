# Drifting leaves, petals and debris

Implemented in 1.59.0 on develop. Full regression and performance comparison are deferred to the later release pass.

## Player controls

Options → Display and Accessibility → Drifting leaves selects **Stage sprites**
(default) or **Original leaves**. Backtick / tilde switches immediately, including
in gameplay and the cinematic viewer. The choice uses the existing profile-aware
`issen.settings` save; older settings default to sprites. The shortcut ignores
repeat events, modifier chords other than Shift, and text-entry controls, and is
reserved from combat key bindings.

Triple-click the title logo to open the cinematic viewer. Its Debris selector
also exposes **Reusable shape**, which reuses one normalized Path2D leaf instead
of reconstructing two curves per leaf per frame. Viewer-only choices are temporary;
exiting restores the saved option. The keyboard shortcut changes the saved option.

## Asset families and stages

Three transparent 4×2 sheets provide 24 independent variations. They are not
animation frames. Actual generated dimensions are 1774×887 per sheet (about
18 MiB of nominal combined RGBA pixels); the requested 1024×512 size was not
returned by generation. Original sheets remain intact. Each adjacent asset note
records provenance, generation prompts, alpha observations and frame geometry.

| Stage | Main mixture | Accents |
| --- | --- | --- |
| Whispering Field | Willow and oval leaves | Winged seeds, seed fluff, curled leaves |
| Last Light Ridge | Curled leaves, pine needles | Bark strips, winged seeds |
| Falling Blossom Path | Rounded, notched, narrow and folded petals | Paired petals, oval leaves |
| Rainwater Hollow | Oval and heart-shaped leaves | Torn leaves, seed husks |
| Hollow Bamboo Road | Pointed and curved bamboo leaves | Bamboo splinters |
| White Silence Pass | Pine needles, skeletal and curled leaves | Bark chips |
| Ember Courtyard | Ash and charred fragments | Torn leaves |
| Broken Shore | Torn and curled leaves, bark strips | Bark chips, seed husks |
| Moonwatch Clearing | Ginkgo and maple leaves | Winged seeds, pale petals |

Snow, rain, weather petals, sparks and other existing weather continue through
their existing renderer. Demon retains its separate scene and suppresses leaves.

## Ownership and extension

- `src/rendering/scene/drift-catalog.ts`: atlas URLs, stable sprite IDs, normalized
  source rectangles, normalized frame-local pivots, size/spin/opacity presets and
  weighted stage mixtures. Entries follow `STAGES` order.
- `src/rendering/scene/drift-renderer.ts`: decoded image ownership, original curve,
  retained Path2D and sprite drawing. Images prepare before frame startup and
  release with the runtime. No per-frame image decoding, tinting or offscreen
  buffer allocation occurs.
- `src/rendering/scene/ambient.ts`: particles, wind, tumbling, depth, gusts and
  density controls. Sprite identity is selected at spawn with cosmetic randomness
  and stays stable until respawn. Stage changes rebuild particles for the new mix.
- `src/game.ts`: connects settings, shortcut, scene changes and lifecycle.

To add variety, register an image in `DRIFT_ATLASES`, add sprite entries to
`DRIFT_SPRITES`, and give their IDs positive weights in the desired mixtures.
Source rectangles use normalized atlas coordinates; frame boundaries round to
integer image pixels. Arbitrary rectangles and frame-local pivots support future
nonuniform sheets. Keep alpha padding, complete silhouettes and native aspect
ratios. Rotation, mirroring and vertical flattening are permitted by the artwork.
Broad silhouettes remain distinguishable at 16–32 pixels; at 4–8 pixels they read
as flecks. Very faint alpha noise in original gutters is documented in asset notes.

Original and retained-shape modes preserve the original rotation rate; sprite
mode applies the family spin preset. All modes share particle positions and count
when switching, so comparisons do not restart the scene or reroll particles.
Existing density/reduced-motion controls still bound the particle population.

## Focused verification

Strict TypeScript and develop-path build; focused ambient/settings/catalog unit
checks; browser checks for Options, shortcut persistence, all nine scenes, all
24 frames painting, retained-shape/original alpha parity, and existing cinematic
isolation. Atlas sheets and tiny light/dark previews were visually inspected.
Portrait/desktop scene previews and the nested develop-path smoke check also passed.
Full regression, allocation/frame-time A/B measurements and physical-device
checks remain for the later testing pass. No performance improvement is claimed
from geometry reuse until measured.
