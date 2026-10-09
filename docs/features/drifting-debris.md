# Drifting leaves, petals and debris

Introduced in1.59.0, with quieter mixtures and fire/spirit artwork in1.60.0.
Version1.69.15 replaces full PBR drift with a small single-pass lit atlas.

## Player controls

Stage sprites are the only debris presentation as of 1.62.0. The original curved
leaves and reusable-shape comparison are removed from the renderer, Options and
cinematic viewer. Legacy `issen.settings.debrisStyle` values normalize to
`sprites` while preserving the rest of the profile. Backtick / tilde now opens the
[lighting debug controls](sword-lighting.md) and remains reserved from combat bindings.

Triple-click the title logo to open the cinematic viewer. Scene and film choices
remain independent of player equipment; every scene uses stage debris artwork.

## Asset families and stages

Four authoring sheets provide32 independent variations, not animation frames.
Runtime uses one1024×512 colour sheet and matching emissive plane, with128px
cells,120px artwork and4px transparent gutters. Associated-alpha downsampling
and drift-only trilinear mipmaps reduce fringes and minification shimmer.
The two planes use4MiB nominal decoded pixels,94.87% below the historical
full map set. Original1774×887 PNG sheets and PBR recipes remain authoring inputs.
Regenerate using `scripts/assets/drift-atlas.py`; see its adjacent tool README.

| Stage | Main mixture | Accents |
| --- | --- | --- |
| Whispering Field | Willow and oval leaves | Winged seeds, seed fluff, curled leaves |
| Last Light Ridge | Curled leaves, pine needles | Bark strips, winged seeds |
| Falling Blossom Path | Rounded, notched, narrow and folded petals | Paired petals, oval leaves |
| Rainwater Hollow | Oval and heart-shaped leaves | Torn leaves, seed husks |
| Hollow Bamboo Road | Pointed and curved bamboo leaves | Bamboo splinters |
| White Silence Pass | Pine needles, skeletal and curled leaves | Bark chips |
| Ember Courtyard | Ember flecks, coal, streaks | Forked flame, fire wisp, ash and charred fragments |
| Broken Shore | Torn and curled leaves, bark strips | Bark chips, seed husks |
| Moonwatch Clearing | Ginkgo and maple leaves | Winged seeds, pale petals |
| Demon | Violet spectral cinders and flames | Angular ink-spirit shards |

Snow, rain and weather petals continue through their existing renderer. In sprite
mode the Courtyard weather sparks also use ember/coal/streak frames. Demon uses
spectral sprites and keeps its separate scene renderer.

Sprite density by scene is Field 40%, Ridge 30%, Blossom 100%, Hollow 30%,
Bamboo 40%, Snow 15%, Courtyard 35%, Shore 25%, Moonwatch 25%, Demon 30% of
the prior leaf count, multiplied by existing quality/reduced-motion density.
Blossom remains unchanged. Density applies to gusts as well as ordinary drift.

## Ownership and extension

- `src/rendering/scene/drift-catalog.ts`: atlas URLs, stable sprite IDs, normalized
  source rectangles, normalized frame-local pivots, size/spin/opacity presets and
  weighted stage mixtures and density. Entries follow `STAGES` order, then Demon.
- `src/rendering/scene/drift-images.ts`: two shared decoded-image leases and logical
  family selections. Startup selects the restored scene; scene flow awaits the
  incoming set. All families share the same pixels, including surviving particles.
  Superseded requests cannot publish. Disposal releases the pair and retires only
  consuming painters' uploads.
  Runtime preparation also awaits paced native texture/program warming and keeps
  its painter lease across frame collection until replacement or disposal.
  Superseded/hidden requests abort; failed warming allows retry while retaining
  the previous drawable set.
- `src/rendering/scene/drift-renderer.ts`: instanced sprites and weather embers.
  While incoming images load, the previous submitted particles
  keep moving through their analytic presentation clock. No per-frame image
  decoding, tinting or offscreen buffer allocation occurs.
- `src/rendering/scene/ambient.ts`: particles, wind, tumbling, depth, gusts and
  density controls. Sprite identity is selected at spawn with cosmetic randomness
  and stays stable until respawn. Stage changes rebuild particles for the new mix.
- `src/game.ts`: connects settings, shortcut, scene changes and lifecycle.

To add variety, update the merged atlas generator, register frame entries in
`DRIFT_SPRITES`, and give their IDs positive weights in the desired mixtures.
Source rectangles use normalized atlas coordinates; frame boundaries round to
integer image pixels. Arbitrary rectangles and frame-local pivots support future
nonuniform sheets. Keep alpha padding, complete silhouettes and native aspect
ratios. Rotation, mirroring and vertical flattening are permitted by the artwork.
Broad silhouettes remain distinguishable at 16–32 pixels; at 4–8 pixels they read
as flecks. Very faint alpha noise in original gutters is documented in asset notes.

Sprites apply family spin, rise and flutter presets. Fire rises gently and avoids
flattening completely. The composite shader uses scene lighting behind each
sprite, ambient lighting over empty geometry and fire-only emissive. No drift
normal/surface sampling or geometry-buffer writes remain. Cheap lighting is used
at every quality level; full PBR's detail did not justify a retained desktop path.
Existing density/reduced-motion controls still bound the particle population.

## Focused verification

Focused checks cover all32 frames, all cinematic scenes, two-plane ownership,
readiness gates, instanced ordering/flutter, context restoration, empty-sky lighting,
fire emission and DPR3 enlarged gusts. Representative before/after captures and
CPU-throttled timing are recorded in
[mobile performance progress](../development/mobile-performance-progress.md).
Those desktop measurements do not prove mobile GPU cost or120Hz delivery.
