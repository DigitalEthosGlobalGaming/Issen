# Stage art and composition plan

Status: all nine Ink compositions implemented in version 1.17.0, updated 2026-10-01.
The first field keeps its established grass and composition. Each later scene
has a dedicated composition module and reusable sprite kit. Existing weather
and gameplay rules remain unchanged; art remains open to visual feedback.

Current stage order and weather come from
[src/game/content/stages.ts](../../src/game/content/stages.ts). See
[Ink renderer](ink-renderer.md) for implemented art ownership and
[cinematic viewer](cinematic.md) for reviewing scenes.

## Shared direction

Keep the charcoal, warm-gray, and muted-ivory ink palette, dry-brush texture, and
angular faceted shapes established in the first field. Scenes must remain
recognisable in monochrome through silhouette, terrain, composition, and
landmarks, rather than depending on different tints. Film grading stays
downstream; avoid baking a particular film look into assets.

Reuse independent sprites through deliberate changes to density, spacing,
scale, depth, cropping, and placement. Preserve native aspect ratios. Mirror
only where lighting and asymmetric details permit. Fog may soften overlapping
silhouette joins; those tiles are not necessarily seamless.

Each stage gets one defining visual feature and an open combat area. Desktop
layouts can expose additional scenery at the sides; tablet layouts must retain
the defining feature and readable enemies. Background canopies, architecture,
and ground detail should not obscure blade silhouettes.

All names below are applied in code in the existing stage order. Existing weather themes and gameplay behavior remain the baseline;
the visual ideas below do not authorize new hazards or balance changes.

## 1. The Whispering Field

Current stage: Windswept Field. Existing weather: none.

A broad, windswept meadow beneath layered mountains. This establishes the quiet,
open atmosphere of the game.

Composition: retain distant ridges, scattered pines, low shrubs, rolling banks,
and dense foreground grass. The new boulders anchor the lower-right edge.
Leave a wide, uninterrupted middle ground around the enemies.

Features: layered mountain haze, subtle grass movement, broken meadow edges,
and sparse ground fog. Keep the existing procedural static and animated grass.

Reuse: this is the core landscape kit for the other stages.

New assets: none planned. Treat the current scene as essentially finished,
subject to visual feedback. Its name is applied in version 1.17.0.

## 2. Last Light Ridge

Implemented: Last Light Ridge (formerly Dusk), stage index 1, version 1.16.0. Existing weather: gust.

An exposed hillside overlooking a valley, with a low sun disappearing behind a
ridge.

Composition: an asymmetric rising bank and a small group of windswept pines on
one side, balanced by a broad empty valley on the other. Use fewer mountain
layers, with one prominent diagonal ridge. Grass and leaves reinforce the wind
direction.

Features: strong ridge silhouette, low light, open sky, and passing leaves.

Reuse: mountains, banks, pines, shrubs, and rocks from the field.

Assets: reuses the existing mountain, pine, field-bank, shrub, and low-rock atlases.
No new image was required. The composition lives in src/rendering/environment/ridge.ts;
the low sun, terrain silhouette, and valley haze are rendered in code. Existing
grass, film grading, and gust weather remain. See the
[asset library](environment-asset-library.md) for reusable cells and constraints.

## 3. The Falling Blossom Path

Current stage: Cherry Blossom. Existing weather: sakura.

An old path passing through a neglected cherry orchard, with petals settling
among grass and stones.

Composition: a large blossom tree partly outside one edge, balanced by smaller
trees farther away. A pale, broken path curves into the distance rather than
running straight through the centre. Keep the canopy above enemy silhouettes.

Features: overhanging blossom clusters, drifting petals, patchy petal deposits,
and the winding path.

Reuse: banks, rocks, shrubs, meadow patches, and distant mountains.

New assets: cherry-tree variations and a small atlas of petal-covered ground
patches. Compose the path procedurally where practical.

## 4. Rainwater Hollow

Current stage: Rain. Existing weather: rain.

A low, rain-soaked clearing where shallow pools collect between grassy islands.

Composition: predominantly horizontal, with low banks, broad shallow puddles,
and a distant treeline almost lost in rain. Mountains barely register.
Broken reflections and ripples should read as wet ground, not a lake.

Features: shallow water between raised ground, reed silhouettes, rain haze,
and restrained reflections.

Reuse: banks become raised islands; grass edges outline puddles; pines and
shrubs form the distant boundary.

New assets: a few reed clumps. Handle water, ripples, and subdued reflections
in rendering rather than baking them into large scenery images.

## 5. The Hollow Bamboo Road

Current stage: Bamboo Grove. Existing weather: bamboo.

A narrow passage through bamboo, opening into a mist-filled clearing.

Composition: strong vertical shapes, with dense stalks at the sides, smaller
repeated clumps deeper in the scene, and a lighter central opening. Leave gaps
between groups to retain depth. A few fallen stalks break up the ground.

Features: layered bamboo silhouettes, glimpses through the stalks, ground mist,
and occasional fallen bamboo.

Reuse: existing bamboo, rocks, banks, fog, and sparse grass. Mountains appear
only through distant gaps.

New assets: a small fallen-bamboo and stump atlas if upright sprites cannot
convincingly supply those details. Do not rotate upright clumps indiscriminately
if their foliage, lighting, or ground contact makes the result implausible.

## 6. White Silence Pass

Current stage: Snow. Existing weather: snow.

A high mountain clearing where snow has buried most of the vegetation.

Composition: the clearest and sparsest landscape in the set. One dominant
distant peak, a low saddle between two ridges, and a handful of dark pines.
Broad snow banks replace busy meadow textures. Exposed rocks and grass tips
provide scale.

Features: generous pale negative space, dark exposed silhouettes, snow resting
on upper surfaces, and drifting snow.

Reuse: mountain silhouettes, pines, boulders, and banks.

New assets: snow-cap variants or fitted snow overlays for selected rocks and
trees. White tint alone should not substitute for snow accumulating on surfaces.
Any overlays must match their base sprites and anchor positions.

## 7. The Ember Courtyard

Current stage: Burning Temple. Existing weather: smoke.

The remains of a hillside temple, with fire glowing beyond its ruined courtyard.

Composition: architecture defines the scene. An offset broken gate, low walls,
and a damaged roofline sit behind drifting smoke. Keep the central courtyard
open. Fire appears through gaps rather than forming an uninterrupted wall.

Features: broken architectural silhouettes, intermittent glow, drifting smoke,
and occasional embers.

Reuse: rock clusters become rubble; banks form raised foundations; sparse
pines remain beyond the walls. Fog sprites can supplement smoke where their
shapes fit, without assuming that recoloring alone creates convincing smoke.

New assets: a modular temple-ruin atlas with wall sections, posts, roof
fragments, and steps. Keep glow, smoke, and embers separate from structures.

## 8. The Broken Shore

Current stage: Stormy Shore. Existing weather: storm.

A rocky coastal shelf above rough water, with distant headlands appearing
through sea spray.

Composition: open one side to the sea. The opposite side has a low cliff and
a wind-bent pine. A broken shoreline runs diagonally behind the combat ground,
with waves striking scattered offshore rocks.

Features: a broad water horizon, diagonal land edge, sea stacks, foam, and spray.

Reuse: mountain tiles become distant headlands; boulders form shoreline
clusters; pines, shrubs, and grass become sparse coastal vegetation.

New assets: a few distinctive sea-stack silhouettes and foam strips. Keep
water movement and spray separate from the static rock shapes.

## 9. The Moonwatch Clearing

Current stage: Moonlit Night. Existing weather: night.

A still clearing beneath a pale moon, with a solitary weathered shrine marking
the end of the journey.

Composition: return to the openness of the first scene, simplified to one
distant ridge, isolated pines, low drifting mist, and a small shrine or gate
off-centre. Large areas of darkness make moonlit ground and blades stand out.

Features: a restrained moon silhouette, quiet open space, a single landmark,
and low mist.

Reuse: mountains, pines, grass, boulders, and fog. Temple posts and steps can
form the landmark if their damage is not too distinctive.

New assets: at most one intact shrine or gate variation if the ruin kit cannot
provide a convincing silhouette.

## Shared asset families

See the [stage sprite inventory](stage-sprite-inventory.md) for existing files, proposed object families and variants, per-scene reuse, and elements that stay procedural.

| Family | Planned reuse |
| --- | --- |
| Mountains and ridges | Field, ridge, snowy pass, coastal headlands, night; distant glimpses in other scenes |
| Pines and shrubs | Open landscapes, wet hollow, coast, night; background beyond temple |
| Banks and ground patches | Hillsides, path borders, puddle boundaries, snow drifts, raised foundations |
| Rocks and boulders | Ground anchors, temple rubble, exposed snow rocks, shoreline clusters |
| Atmospheric layers | Valley mist, rain haze, snow haze, selected smoke and sea-spray support |
| Architecture | Temple ruins and the final moonlit landmark |

New object families should generally get separate sprite atlases, with multiple
variations where useful. Grid geometry follows the asset; four variants in a
2-by-2 sheet are a precedent, not a universal requirement. Preserve transparent
padding, record frame rectangles and anchors, and inspect the result at gameplay
scale before integration.

## Production and review boundary

Unimplemented sections remain plans. The original documentation pass created no
images or code; implementation status is recorded per scene as work proceeds.

When implementation begins, start by arranging existing sprites for a scene,
then create only the missing defining assets. Review each composition in the
cinematic viewer at desktop and tablet sizes and with contrasting film looks.
Preserve classic comparison mode and the existing grass where appropriate.
During art iteration, use typechecking for code changes and the running preview
for feedback; avoid full builds and test suites for each art adjustment.
Shared runtime or gameplay changes still need their relevant repository checks.

Update this plan's status as scenes are delivered, keeping proposed names and
assets distinct from what is actually implemented.
