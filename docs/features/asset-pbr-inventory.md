# Game asset and PBR inventory

Last reviewed: 9 October 2026. This is a manually maintained inventory of the
current working tree. Renderer wiring does not imply visual approval or a shipped
release. All missing raster packs have now been generated and installed;
renderer coverage is tracked separately below.

## Scope and status

Lists every media file under `src/`, `public/`, `assets/` and Android source
resources, plus UI atlas metadata. Atlases represent many sprites: this document
tracks source sheets and map packs rather than counting each crop as a file.
Marketing screenshots and native icons are included in separate sections.
Ignored trials under `tmp/`, generated `dist/`, Android build outputs, dependencies
and document illustrations are outside this inventory.

- **Yes**: a validated compact runtime PBR plane set is installed in the game asset directories.
- **Generated, unwired**: validated compact planes are installed, but the source renderer
  still uses its existing artwork. Pack links lead to provenance and exact settings.
- **No installed pack**: no matching export is installed here. This does not rule
  out earlier trial exports under `tmp/`.
- **N/A**: metadata, vector source, branding or store artwork rather than a material.
- **Preset** records the actual generation preset, not a suggested future preset.
  Use `—` when there is no installed export; do not infer history from appearance.
- **Runtime/source** records direct code references or an explicit source role.
  No direct filename reference is not proof that dynamic loading is impossible.

The installed runtime set contains **266 aligned material planes** across
**86 source families**: diffuse, normal and packed surface for each, plus eight
nonzero emissive maps. The 258 redundant scalar and 78 zero-emission maps are
removed. Base artwork and diffuse remain separate for the explicit figure
colour/tone consumers and retained conversion validation. Material-only
environment, outfit, charm, companion and UI owners use plain colour plus
normal/surface/optional emissive; they no longer decode the unused diffuse sibling.
All 86 original authoring PNGs, atlas metadata, recipes and provenance remain.

Worker composition uses GPU baking for aligned full-layer PBR copies whose
source and bake pixel sizes match exactly. Atlas downsampling, fractional
backing copies and main-thread composition retain software baking; material
files and the installed plane set are unchanged.
Enemy colour/tone painting uses the PBR diffuse atlases. Its four plain colour
counterparts remain available to material debugging, but are excluded from enemy
preparation and eager startup decoding as of1.68.27. The enemy catalogue now
decodes12planes75,489,120nominal RGBA bytes, saving25,163,040bytes. This is source
accounting, not whole-game or resident GPU memory proof.
As of1.68.28, directly owned PBR images notify native GPU consumers before source
disposal. Shared image leases only unpin on atlas disposal; peers and warm cache
entries survive until the shared loader evicts or closes them. This covers atlas
planes; prepared figure cutout/tone canvases and selected-kit ownership remain
separate performance-goal work.

World UI artwork uses the shared main-thread decoded-image pool as of1.69.5:
plain colour plus normal/surface, three768×640planes (5,898,240nominal RGBA
bytes). Disposal unpins those planes without clearing peers; loader eviction
retires their GPU consumers. Owned seal tints retire on disposal and cache
eviction, preserving queued frame replay until the next frame boundary.
Outfit colour/material planes use the shared pool as of1.69.6. Runtime selection
pins equipped recipe families; previews borrow their own families and release
them on suspension/disposal. The default robe needs no outfit planes, avoiding
15 eager1254²planes (94,350,960nominal bytes/about90MiB); a family requires three
planes/18,870,192bytes. Unpinned raw images remain cacheable within the pool,
while consuming painters retire unused GPU sources at the frame boundary.
Player base sources use the pool as of1.69.7: four1254²planes/25,160,256nominal
bytes. Both plain colour (tone generation) and diffuse (untinted PBR stamps) are
required and retained. Its consuming painters release their own GPU sources on
preview suspension/disposal. Startup excludes plain player/charm/world UI images
already owned by the pool, avoiding a second startup image owner.
Enemy/weapon direct image ownership still needs integration;
the shared loader snapshot is not a whole-game memory bound.
Enemy variant/tone canvases now notify GPU consumers on eviction/final disposal
(1.68.29). Current-frame textures survive replay until that painter's next begin,
context loss or disposal; older-frame entries retire immediately. Diagnostics
account pending count/nominal bytes. This does not establish a whole-game GPU or
decoded-memory budget; selected ownership remains required.
Player/outfit tone and tint canvases, base images and weapon cutouts/raw maps now
retire native textures before source closure (1.68.30). Weapon LRU eviction uses
the same frame-preserving boundary as enemy caches. All20outfits and20weapons
match the saved original exactly; owner disposal returns native counts to zero.
These owners still prepare their catalogues outside the shared decoded budget.
Local main-thread scenery now unpins non-live inputs after compose (1.68.31).
Stage0 retains four fog planes25,176,608nominal bytes, stage4 three bamboo planes
18,870,192; other stages retain no raw compose inputs. Output canvases/cutouts
remain separately owned. Composition-key changes reacquire inputs. This permits
eviction after presentation; incoming figure/scene admission still needs scheduling.
The [generated runtime inventory](../../scripts/assets/runtime-inventory.json)
records actual source/catalog/startup-glob references, dimensions, bytes and
stage usage. Regenerate with `node scripts/assets/runtime-inventory.mjs`.
It separately flags unused diffuse decodes (340,955,484nominal RGBA bytes across
all material-only families) and startup-only vectors pending loader exclusion.
It includes retained catalog inputs, so its total is not a live-residency budget.
Runtime colour artwork uses 86 compact siblings. Eleven small colour planes use
losslessly recompressed `.compact.png`; the other runtime siblings use WebP.
No dimensions, frames, pivots, anchors or nine-slice coordinates changed.

Compaction ownership: [the asset tool](../../scripts/assets/README.md), installed
map catalog: `scripts/pbr/update-runtime-catalog.mjs`, recipe/provenance links:
the adjacent pack README files. The manifest records original/new hashes,
encodings and bytes. All 352 conversions passed browser alpha/placement and colour
tolerances, including 180 bit-exact data planes. Tight repacking remains cancelled.

## Newly generated packs

### Lighting coverage

The player base cloth pack is now selected for all supported outfit recipes.
The five outfit attachment sheets (armour, cloth, headwear, masks and special
headwear), charms, companion parts and mystic rock submit aligned normal,
packed surface (roughness, metallic, AO) and optional emissive to the material shader. Tinted and
cropped colour caches retain their original atlas frames for the other maps.
Canvas fallback retains colour artwork. Focused browser checks confirm outfit
and charm alignment, mirrored cached normals, procedural occlusion, shader
coverage and all nine stage caches. Visual approval is pending.

Shared loading belongs to [asset-materials.ts](../../src/rendering/asset-materials.ts).
Worker decoded resources now share the priority/pin/LRU loader in
`src/platform/decoded-images.ts`, with catalog-sized pre-decode reservations and
device-class budgets. Main figure/UI/startup loader migration remains pending;
the inventory total is not a configured whole-application residency budget.
Local-fallback PBR maps now use the shared native main-image pool through explicit
leases; old-stage maps unpin, warm maps remain until LRU pressure, and independent
previews do not clear peer images. Local source artwork now uses the same pool;
scoped material bindings keep each preview's composed maps independent.
Final main-pool eviction/disposal notifies every native texture consumer before
clearing source pixels. Releasing a lease alone preserves warm images and peers.
UI lighting now leases one source/data pack per export and releases pins and GPU
source textures afterwards. Lit CSS outputs remain available for redraw, while
background export dispatch yields to busy/loading/hidden frames. The managed
budget covers decoded inputs, excluding browser-owned exported DOM/CSS images.
Charm renderers now share their18,874,368-byte colour/normal/surface kit through
main-pool leases; separate previews retain independent tint caches and pins.
Companions now lease only the equipped kit plus visible preview selections:
parts18,870,192bytes (crow/cat/shiba), rock18,865,020bytes. No companion needs no
kit, including startup. The scarecrow robe selects crow through the existing
equipment rule. Preview closure releases its pins/native textures; full-catalogue
preparation remains explicit for standalone callers. Other figure/startup inputs
still need migration; this is not a whole-application memory guarantee.
The generated `src/platform/runtime-assets.ts` manifest selects275runtime files
for compressed prefetch and startup filtering; regenerate with
`node scripts/assets/runtime-manifest.mjs`, then regenerate the inventory.
It excludes the80unused diffuse maps and6startup-only vector files. Prefetch
holds compressed responses only, starts after startup, and yields to combat,
loading, hidden pages, saveData and native offline assets. Worker decoding reads
its base-path-scoped cache with HTTP fallback. Main decoded ownership is pending.
Its static catalog is generated from installed pack metadata with
`node scripts/pbr/update-runtime-catalog.mjs`; regenerate it when adding packs.
Only packs selected by a renderer are decoded. Generated maps are excluded from
startup decoding. Environment source images are also excluded as of1.69.8;
scene composition, demon and drift prepare their inputs independently. This
removes36 plain startup sources/226,501,456nominal RGBA bytes, without claiming
resident savings. Drift sources/maps use pooled leases as of1.69.9:13 planes/
81,823,976nominal bytes become shared/accounted; disposal releases only its
consuming painters. All four drift families are still prepared. Selected drift
families and direct demon/fog ownership still need migration.
Scene changes retain their shared packs and release
departed selections. Sword handles, guards and special
weapons use their generated packs. Stage scenery, foreground bamboo, demon realm
props and debris now submit material data. Cached layers retain transformed
normals and material coverage; procedural paint clears covered material pixels.
Raster UI backgrounds, borders, symbols, crests and tinted seals use the same
shader through CSS texture replacement; original slices, crops and alpha remain
intact. Startup and gameplay share one session-only rig. Canvas comparison keeps
original colour art. The tilde panel's Material preview exposes all **86** packs,
including retained sources without reintroducing them into gameplay.

All 80 previously missing raster packs are installed: 36 environment/debris,
13 figure/equipment and 31 UI/reference packs. Their rows below link to each
pack's README, six maps and `generation.json`. Presets and frame compositions
are recorded in [the generation catalog](../../scripts/pbr/asset-packs.json).
Use [the batch generation and installation instructions](../../scripts/pbr/README.md#inventory-pack-generation)
to regenerate them. SVG sources, metadata, store screenshots, native icons and
procedural families remain N/A as listed; they were not sent to PBR Forge.

Mixed compositions include stone/wood demon landmarks, leather/metal handles
and guards, mixed charm materials, cloth animals with stone/metal mystic parts,
cloth/wood/leather outfit parts, cloth/metal/wood rear headwear, and a wood basket
on the special-headwear sheet. Other mixed artwork uses its dominant preset as
a starting point. Wood approximates straw; polished wood approximates the smooth
nonmetal wind chime. Atmospheric art and raster UI symbols are reference packs,
not automatically physical materials. Visual approval of the expanded lighting is pending.

All installed maps passed archive integrity, source-hash, dimensions, applied
settings, normal-convention and diffuse-alpha validation. Six focused CLI tests
passed. Lighting integration preserves player saves and gameplay rules.
Each family also has a `_surface.png` that packs roughness, metallic and AO into
RGB. All 86 packed PNGs passed exact browser pixel comparison against the previous
runtime packing path; the six source maps and preset provenance remain unchanged.

## Renderer-connected PBR families

| Source atlas | PBR export | Preset | Coverage | Renderer |
| --- | --- | --- | --- | --- |
| [blade-profile-atlas.png](../../src/rendering/figures/assets/blade-profile-atlas.png) | Yes, six maps | `metal` + `wood` | Steel profiles: metal. Bokken: wood. | [ink-sword.ts](../../src/rendering/figures/ink-sword.ts) |
| [player-ronin-simple.png](../../src/rendering/figures/assets/player-ronin-simple.png) | Yes, six maps | `cloth` | All supported player outfit recipes use this base cloth pack. | [ink-player.ts](../../src/rendering/figures/ink-player.ts) |
| [enemy-ronin-simple.png](../../src/rendering/figures/assets/enemy-ronin-simple.png) | Yes, six maps | `cloth` | Base clothing, head and hands use the cloth pack. | [ink-enemy.ts](../../src/rendering/figures/ink-enemy.ts) |
| [enemy-clothing-variants.png](../../src/rendering/figures/assets/enemy-clothing-variants.png) | Yes, six maps | `cloth` | All six clothing frames, including stylised armour panels. | [ink-enemy.ts](../../src/rendering/figures/ink-enemy.ts) |
| [enemy-headwear-atlas.png](../../src/rendering/figures/assets/enemy-headwear-atlas.png) | Yes, six maps | `cloth` + `metal` + `wood` | Cloth default; metal kabuto/jingasa; wood approximation for straw kasa. | [ink-enemy.ts](../../src/rendering/figures/ink-enemy.ts) |
| [enemy-headwear-variants.png](../../src/rendering/figures/assets/enemy-headwear-variants.png) | Yes, six maps | `cloth` + `metal` | Cloth default; metal crested helmet with warm face/neck pixels kept nonmetal. | [ink-enemy.ts](../../src/rendering/figures/ink-enemy.ts) |

Presets live in [scripts/pbr/presets](../../scripts/pbr/presets). Generation uses
[the PBR CLI](../../scripts/pbr/README.md). Shared loading belongs to
[pbr-atlas.ts](../../src/rendering/pbr-atlas.ts); blade map packing belongs to the
sword renderer. The [shader](../../src/rendering/pixi/material.ts) uses diffuse,
normal, roughness, metallic, AO and emissive. Height, distance and separate opacity
exports are not installed or sampled. Canvas fallback uses colour art without
shader lighting.

### Mixed-material coverage

| Atlas region | Preset applied | Composition rule |
| --- | --- | --- |
| Blade profiles 0–4 | `metal` | Metal export is the base atlas. |
| Bokken profile 5 | `wood` | Replace rectangle `[107, 1080, 1043, 78]` in each blade map. |
| Headwear kasa | `wood` | Replace rectangle `[8, 137, 557, 290]` in the cloth atlas. |
| Headwear kabuto | `metal` | Replace rectangle `[582, 64, 458, 419]`. |
| Headwear jingasa | `metal` | Replace rectangle `[490, 588, 576, 301]`. |
| Headwear hair, mask and hood | `cloth` | Keep cloth export. |
| Complete-head scarf, hood and topknot | `cloth` | Keep cloth export. |
| Complete-head crested helmet | `metal` / `cloth` | Inside `[82, 660, 494, 504]`, metal applies where source alpha is positive and source R−B ≤ 12; warmer face/neck pixels retain cloth. This colour-derived mask is an approximation. |

Wood approximates matte straw; it does not generate straw grain. Cloth on face/hair
regions is a gentle nonmetal starting point, not a skin or hair-specific model.
Enemy hands use the base cloth pack; the procedural under-robe bridge has no source atlas.
All supported player outfits select the exported base cloth pack. Their attachment
sheets also submit generated materials to the shader.

### Generated map files

Each link below is an individual installed file. Presets and frame exceptions are
those in the family and mixed-material tables above.

| Source family | PBR | Preset | Installed files |
| --- | --- | --- | --- |
| `blade-profile-atlas` | Yes | `metal` + `wood` | [runtime planes and provenance](../../src/rendering/figures/assets/blade-pbr/README.md) |
| `player-ronin-simple` | Yes | `cloth` | [runtime planes and provenance](../../src/rendering/figures/assets/player-pbr/README.md) |
| `enemy-ronin-simple` | Yes | `cloth` | [runtime planes and provenance](../../src/rendering/figures/assets/enemy-pbr/README.md) |
| `enemy-clothing-variants` | Yes | `cloth` | [runtime planes and provenance](../../src/rendering/figures/assets/enemy-pbr/README.md) |
| `enemy-headwear-atlas` | Yes | `cloth` + `metal` + `wood` | [runtime planes and provenance](../../src/rendering/figures/assets/enemy-pbr/README.md) |
| `enemy-headwear-variants` | Yes | `cloth` + `metal` | [runtime planes and provenance](../../src/rendering/figures/assets/enemy-pbr/README.md) |

## Figure source atlases

| Asset | Dimensions | Runtime/source | PBR export | Preset |
| --- | --- | --- | --- | --- |
| [armour-plates-atlas.png](../../src/rendering/figures/assets/armour-plates-atlas.png) | 1254×1254 | [outfit-kit.ts](../../src/rendering/figures/outfit-kit.ts) | [Yes, connected](../../src/rendering/figures/assets/pbr/armour-plates-atlas/README.md) | `metal` |
| [blade-profile-atlas.png](../../src/rendering/figures/assets/blade-profile-atlas.png) | 1254×1254 | PBR source; [ink-sword.ts](../../src/rendering/figures/ink-sword.ts) | Yes | `metal` + `wood` |
| [charm-atlas.png](../../src/rendering/figures/assets/charm-atlas.png) | 1536×1024 | [ink-charms.ts](../../src/rendering/figures/ink-charms.ts) | [Yes, connected](../../src/rendering/figures/assets/pbr/charm-atlas/README.md) | `cloth` + `metal` + `bone` + `wood` + `polished-wood` |
| [companion-atlas.png](../../src/rendering/figures/assets/companion-atlas.png) | 1254×1254 | Retained source; active renderer uses companion-parts-atlas. | [Yes, preview](../../src/rendering/figures/assets/pbr/companion-atlas/README.md) | `cloth` |
| [companion-parts-atlas.png](../../src/rendering/figures/assets/companion-parts-atlas.png) | 1254×1254 | [ink-companions.ts](../../src/rendering/figures/ink-companions.ts) | [Yes, connected](../../src/rendering/figures/assets/pbr/companion-parts-atlas/README.md) | `cloth` + `stone` + `metal` |
| [enemy-clothing-variants.png](../../src/rendering/figures/assets/enemy-clothing-variants.png) | 1536×1024 | PBR source; [ink-enemy.ts](../../src/rendering/figures/ink-enemy.ts) | Yes | `cloth` |
| [enemy-headwear-atlas.png](../../src/rendering/figures/assets/enemy-headwear-atlas.png) | 1536×1024 | PBR source; [ink-enemy.ts](../../src/rendering/figures/ink-enemy.ts) | Yes | `cloth` + `metal` + `wood` |
| [enemy-headwear-variants.png](../../src/rendering/figures/assets/enemy-headwear-variants.png) | 1254×1254 | PBR source; [ink-enemy.ts](../../src/rendering/figures/ink-enemy.ts) | Yes | `cloth` + `metal` |
| [enemy-ronin-simple.png](../../src/rendering/figures/assets/enemy-ronin-simple.png) | 1254×1254 | PBR source; [ink-enemy.ts](../../src/rendering/figures/ink-enemy.ts) | Yes | `cloth` |
| [handle-guard-atlas.png](../../src/rendering/figures/assets/handle-guard-atlas.png) | 1254×1254 | [ink-sword.ts](../../src/rendering/figures/ink-sword.ts) | [Yes, connected](../../src/rendering/figures/assets/pbr/handle-guard-atlas/README.md) | `leather` + `metal` |
| [katana.png](../../src/rendering/figures/assets/katana.png) | 2172×724 | Retained source; active swords use modular blade profiles. | [Yes, preview](../../src/rendering/figures/assets/pbr/katana/README.md) | `metal` |
| [mystic-rock.png](../../src/rendering/figures/assets/mystic-rock.png) | 1145×1373 | [ink-companions.ts](../../src/rendering/figures/ink-companions.ts) | [Yes, connected](../../src/rendering/figures/assets/pbr/mystic-rock/README.md) | `stone` |
| [outfit-cloth-atlas.png](../../src/rendering/figures/assets/outfit-cloth-atlas.png) | 1254×1254 | [outfit-kit.ts](../../src/rendering/figures/outfit-kit.ts) | [Yes, connected](../../src/rendering/figures/assets/pbr/outfit-cloth-atlas/README.md) | `cloth` + `wood` + `leather` |
| [outfit-headwear-atlas.png](../../src/rendering/figures/assets/outfit-headwear-atlas.png) | 1254×1254 | [outfit-kit.ts](../../src/rendering/figures/outfit-kit.ts) | [Yes, connected](../../src/rendering/figures/assets/pbr/outfit-headwear-atlas/README.md) | `cloth` + `metal` + `wood` |
| [player-mask-atlas.png](../../src/rendering/figures/assets/player-mask-atlas.png) | 1254×1254 | [outfit-kit.ts](../../src/rendering/figures/outfit-kit.ts) | [Yes, connected](../../src/rendering/figures/assets/pbr/player-mask-atlas/README.md) | `polished-wood` |
| [player-ronin-atlas.png](../../src/rendering/figures/assets/player-ronin-atlas.png) | 1254×1254 | Retained detailed player source; active base uses player-ronin-simple. | [Yes, preview](../../src/rendering/figures/assets/pbr/player-ronin-atlas/README.md) | `cloth` |
| [player-ronin-simple.png](../../src/rendering/figures/assets/player-ronin-simple.png) | 1254×1254 | PBR source; [ink-player.ts](../../src/rendering/figures/ink-player.ts) | Yes | `cloth` |
| [player-special-headwear-atlas.png](../../src/rendering/figures/assets/player-special-headwear-atlas.png) | 1254×1254 | [outfit-kit.ts](../../src/rendering/figures/outfit-kit.ts) | [Yes, connected](../../src/rendering/figures/assets/pbr/player-special-headwear-atlas/README.md) | `cloth` + `wood` |
| [special-weapons-atlas.png](../../src/rendering/figures/assets/special-weapons-atlas.png) | 1774×887 | [ink-sword.ts](../../src/rendering/figures/ink-sword.ts) | [Yes, connected](../../src/rendering/figures/assets/pbr/special-weapons-atlas/README.md) | `metal` |

## Environment and debris

| Asset | Dimensions | Runtime/source | PBR export | Preset |
| --- | --- | --- | --- | --- |
| [bamboo-atlas.png](../../src/rendering/environment/assets/bamboo-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/bamboo-atlas/README.md) | `wood` |
| [bamboo-landmarks-atlas.png](../../src/rendering/environment/assets/bamboo-landmarks-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/bamboo-landmarks-atlas/README.md) | `wood` |
| [cherry-landmarks-atlas.png](../../src/rendering/environment/assets/cherry-landmarks-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/cherry-landmarks-atlas/README.md) | `wood` |
| [cherry-trees-atlas.png](../../src/rendering/environment/assets/cherry-trees-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/cherry-trees-atlas/README.md) | `wood` |
| [demon-landmarks-atlas.png](../../src/rendering/environment/assets/demon-landmarks-atlas.png) | 1254×1254 | [demon-realm.ts](../../src/rendering/environment/demon-realm.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/demon-landmarks-atlas/README.md) | `stone` + `wood` |
| [demon-terrain-atlas.png](../../src/rendering/environment/assets/demon-terrain-atlas.png) | 1254×1254 | [demon-realm.ts](../../src/rendering/environment/demon-realm.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/demon-terrain-atlas/README.md) | `stone` |
| [drift-debris-atlas.png](../../src/rendering/environment/assets/drift-debris-atlas.png) | 1774×887 | [drift-catalog.ts](../../src/rendering/scene/drift-catalog.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/drift-debris-atlas/README.md) | `cloth` |
| [drift-fire-atlas.png](../../src/rendering/environment/assets/drift-fire-atlas.png) | 1774×887 | [drift-catalog.ts](../../src/rendering/scene/drift-catalog.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/drift-fire-atlas/README.md) | `default` |
| [drift-leaves-atlas.png](../../src/rendering/environment/assets/drift-leaves-atlas.png) | 1774×887 | [drift-catalog.ts](../../src/rendering/scene/drift-catalog.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/drift-leaves-atlas/README.md) | `cloth` |
| [drift-petals-atlas.png](../../src/rendering/environment/assets/drift-petals-atlas.png) | 1774×887 | [drift-catalog.ts](../../src/rendering/scene/drift-catalog.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/drift-petals-atlas/README.md) | `cloth` |
| [fallen-bamboo-atlas.png](../../src/rendering/environment/assets/fallen-bamboo-atlas.png) | 1774×887 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/fallen-bamboo-atlas/README.md) | `wood` |
| [field-banks-atlas.png](../../src/rendering/environment/assets/field-banks-atlas.png) | 1774×887 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/field-banks-atlas/README.md) | `stone` |
| [field-rocks-atlas.png](../../src/rendering/environment/assets/field-rocks-atlas.png) | 1774×887 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/field-rocks-atlas/README.md) | `stone` |
| [foam-strips-atlas.png](../../src/rendering/environment/assets/foam-strips-atlas.png) | 1659×948 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/foam-strips-atlas/README.md) | `default` |
| [fog-wisps-atlas.png](../../src/rendering/environment/assets/fog-wisps-atlas.png) | 1774×887 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/fog-wisps-atlas/README.md) | `default` |
| [foreground-boulders-atlas.png](../../src/rendering/environment/assets/foreground-boulders-atlas.png) | 1774×887 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/foreground-boulders-atlas/README.md) | `stone` |
| [grass-edges-atlas.png](../../src/rendering/environment/assets/grass-edges-atlas.png) | 1774×887 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/grass-edges-atlas/README.md) | `wood` |
| [landmark-stones-atlas.png](../../src/rendering/environment/assets/landmark-stones-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/landmark-stones-atlas/README.md) | `stone` |
| [meadow-patches-atlas.png](../../src/rendering/environment/assets/meadow-patches-atlas.png) | 1774×887 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/meadow-patches-atlas/README.md) | `wood` |
| [mountain-atlas.png](../../src/rendering/environment/assets/mountain-atlas.png) | 1774×887 | [demon-realm.ts](../../src/rendering/environment/demon-realm.ts), [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/mountain-atlas/README.md) | `stone` |
| [petal-ground-atlas.png](../../src/rendering/environment/assets/petal-ground-atlas.png) | 1659×948 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/petal-ground-atlas/README.md) | `cloth` |
| [pine-atlas.png](../../src/rendering/environment/assets/pine-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/pine-atlas/README.md) | `wood` |
| [reeds-atlas.png](../../src/rendering/environment/assets/reeds-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/reeds-atlas/README.md) | `wood` |
| [rocks-atlas.png](../../src/rendering/environment/assets/rocks-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, preview](../../src/rendering/environment/assets/pbr/rocks-atlas/README.md) | `stone` |
| [sea-stacks-atlas.png](../../src/rendering/environment/assets/sea-stacks-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/sea-stacks-atlas/README.md) | `stone` |
| [shrubs-atlas.png](../../src/rendering/environment/assets/shrubs-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/shrubs-atlas/README.md) | `wood` |
| [snow-boulders-atlas.png](../../src/rendering/environment/assets/snow-boulders-atlas.png) | 1774×887 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/snow-boulders-atlas/README.md) | `stone` |
| [snow-peak.png](../../src/rendering/environment/assets/snow-peak.png) | 1881×836 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/snow-peak/README.md) | `stone` |
| [snow-pines-atlas.png](../../src/rendering/environment/assets/snow-pines-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/snow-pines-atlas/README.md) | `wood` |
| [snow-rocks-atlas.png](../../src/rendering/environment/assets/snow-rocks-atlas.png) | 1774×887 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/snow-rocks-atlas/README.md) | `stone` |
| [snow-woodland-landmarks-atlas.png](../../src/rendering/environment/assets/snow-woodland-landmarks-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/snow-woodland-landmarks-atlas/README.md) | `wood` |
| [temple-posts-atlas.png](../../src/rendering/environment/assets/temple-posts-atlas.png) | 2172×724 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/temple-posts-atlas/README.md) | `wood` |
| [temple-roofs-atlas.png](../../src/rendering/environment/assets/temple-roofs-atlas.png) | 2172×724 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/temple-roofs-atlas/README.md) | `stone` |
| [temple-steps-atlas.png](../../src/rendering/environment/assets/temple-steps-atlas.png) | 2172×724 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/temple-steps-atlas/README.md) | `stone` |
| [temple-walls-atlas.png](../../src/rendering/environment/assets/temple-walls-atlas.png) | 2172×724 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/temple-walls-atlas/README.md) | `stone` |
| [woodland-landmarks-atlas.png](../../src/rendering/environment/assets/woodland-landmarks-atlas.png) | 1254×1254 | [index.ts](../../src/rendering/environment/index.ts) | [Yes, connected](../../src/rendering/environment/assets/pbr/woodland-landmarks-atlas/README.md) | `wood` |

## UI, symbols and vector sources

| Asset | Dimensions | Runtime/source | PBR export | Preset |
| --- | --- | --- | --- | --- |
| [armoury-room.png](../../src/ui/assets/armoury-room.png) | 1536×1024 | [armory-preview.ts](../../src/rendering/armory-preview.ts), [armory.css](../../src/ui/screens/armory.css) | [Yes, shader available](../../src/ui/assets/pbr/armoury-room/README.md) | `default` |
| [awakening-button-awakened.png](../../src/ui/assets/awakening-button-awakened.png) | 256×128 | [armory.css](../../src/ui/screens/armory.css) | [Yes, shader available](../../src/ui/assets/pbr/awakening-button-awakened/README.md) | `cloth` |
| [awakening-button-normal.png](../../src/ui/assets/awakening-button-normal.png) | 256×128 | [armory.css](../../src/ui/screens/armory.css) | [Yes, shader available](../../src/ui/assets/pbr/awakening-button-normal/README.md) | `cloth` |
| [awakening-button-third.png](../../src/ui/assets/awakening-button-third.png) | 256×128 | [armory.css](../../src/ui/screens/armory.css) | [Yes, shader available](../../src/ui/assets/pbr/awakening-button-third/README.md) | `cloth` |
| [awakening-buttons-atlas.png](../../src/ui/assets/awakening-buttons-atlas.png) | 768×128 | Source/reference; no direct filename reference found. | [Yes, shader available](../../src/ui/assets/pbr/awakening-buttons-atlas/README.md) | `cloth` |
| [awakening-buttons-atlas.svg](../../src/ui/assets/awakening-buttons-atlas.svg) | Vector | Source/reference; no direct filename reference found. | N/A | — |
| [button-atlas.png](../../src/ui/assets/button-atlas.png) | 256×128 | Source/reference; no direct filename reference found. | [Yes, shader available](../../src/ui/assets/pbr/button-atlas/README.md) | `cloth` |
| [button-atlas.svg](../../src/ui/assets/button-atlas.svg) | Vector | Source/reference; no direct filename reference found. | N/A | — |
| [button-highlighted.png](../../src/ui/assets/button-highlighted.png) | 128×128 | [button-frames.css](../../src/styles/button-frames.css) | [Yes, shader available](../../src/ui/assets/pbr/button-highlighted/README.md) | `cloth` |
| [button-normal.png](../../src/ui/assets/button-normal.png) | 128×128 | [button-frames.css](../../src/styles/button-frames.css), [armory.css](../../src/ui/screens/armory.css) | [Yes, shader available](../../src/ui/assets/pbr/button-normal/README.md) | `cloth` |
| [collection-symbols.svg](../../src/ui/assets/collection-symbols.svg) | Vector | [symbol-art.ts](../../src/ui/symbol-art.ts) | N/A | — |
| [demon-mirror-symbol.png](../../src/ui/assets/demon-mirror-symbol.png) | 1254×1254 | [symbol-art.ts](../../src/ui/symbol-art.ts) | [Yes, shader available](../../src/ui/assets/pbr/demon-mirror-symbol/README.md) | `default` |
| [issen-logo.png](../../src/ui/assets/issen-logo.png) | 600×400 | [startup-loading.ts](../../src/ui/startup-loading.ts) | [Yes, shader available](../../src/ui/assets/pbr/issen-logo/README.md) | `default` |
| [panel-atlas.png](../../src/ui/assets/panel-atlas.png) | 384×192 | Source/reference; no direct filename reference found. | [Yes, shader available](../../src/ui/assets/pbr/panel-atlas/README.md) | `cloth` |
| [panel-atlas.svg](../../src/ui/assets/panel-atlas.svg) | Vector | Source/reference; no direct filename reference found. | N/A | — |
| [panel-highlighted.png](../../src/ui/assets/panel-highlighted.png) | 192×192 | [panel-frames.css](../../src/styles/panel-frames.css) | [Yes, shader available](../../src/ui/assets/pbr/panel-highlighted/README.md) | `cloth` |
| [panel-normal.png](../../src/ui/assets/panel-normal.png) | 192×192 | [panel-frames.css](../../src/styles/panel-frames.css) | [Yes, shader available](../../src/ui/assets/pbr/panel-normal/README.md) | `cloth` |
| [preset-symbol.svg](../../src/ui/assets/preset-symbol.svg) | Vector | [symbol-art.ts](../../src/ui/symbol-art.ts) | N/A | — |
| [tanto-symbol.svg](../../src/ui/assets/tanto-symbol.svg) | Vector | [symbol-art.ts](../../src/ui/symbol-art.ts) | N/A | — |
| [temple-symbols-atlas.png](../../src/ui/assets/temple-symbols-atlas.png) | 1254×1254 | [symbol-art.ts](../../src/ui/symbol-art.ts) | [Yes, shader available](../../src/ui/assets/pbr/temple-symbols-atlas/README.md) | `default` |
| [trial-symbols-atlas.png](../../src/ui/assets/trial-symbols-atlas.png) | 1448×1086 | [symbol-art.ts](../../src/ui/symbol-art.ts) | [Yes, shader available](../../src/ui/assets/pbr/trial-symbols-atlas/README.md) | `default` |
| [ui-strokes-atlas.png](../../src/ui/assets/ui-strokes-atlas.png) | 1536×256 | [trials.css](../../src/ui/screens/trials.css) | [Yes, shader available](../../src/ui/assets/pbr/ui-strokes-atlas/README.md) | `cloth` |
| [ui-strokes-atlas.svg](../../src/ui/assets/ui-strokes-atlas.svg) | Vector | Source/reference; no direct filename reference found. | N/A | — |
| [world-ui-atlas.png](../../src/ui/assets/world-ui-atlas.png) | 768×640 | [ui-art.ts](../../src/rendering/ui-art.ts) | [Yes, shader available](../../src/ui/assets/pbr/world-ui-atlas/README.md) | `cloth` |
| [world-ui-atlas.svg](../../src/ui/assets/world-ui-atlas.svg) | Vector | Source/reference; no direct filename reference found. | N/A | — |
| [world-ui-crest-aoi.png](../../src/ui/assets/world-ui-crest-aoi.png) | 128×128 | [armory.ts](../../src/ui/screens/armory.ts) | [Yes, shader available](../../src/ui/assets/pbr/world-ui-crest-aoi/README.md) | `cloth` |
| [world-ui-crest-fuji.png](../../src/ui/assets/world-ui-crest-fuji.png) | 128×128 | [armory.ts](../../src/ui/screens/armory.ts) | [Yes, shader available](../../src/ui/assets/pbr/world-ui-crest-fuji/README.md) | `cloth` |
| [world-ui-crest-juji.png](../../src/ui/assets/world-ui-crest-juji.png) | 128×128 | [armory.ts](../../src/ui/screens/armory.ts) | [Yes, shader available](../../src/ui/assets/pbr/world-ui-crest-juji/README.md) | `cloth` |
| [world-ui-crest-kikyo.png](../../src/ui/assets/world-ui-crest-kikyo.png) | 128×128 | [armory.ts](../../src/ui/screens/armory.ts) | [Yes, shader available](../../src/ui/assets/pbr/world-ui-crest-kikyo/README.md) | `cloth` |
| [world-ui-crest-rokumon.png](../../src/ui/assets/world-ui-crest-rokumon.png) | 128×128 | [armory.ts](../../src/ui/screens/armory.ts) | [Yes, shader available](../../src/ui/assets/pbr/world-ui-crest-rokumon/README.md) | `cloth` |
| [world-ui-crest-tomoe.png](../../src/ui/assets/world-ui-crest-tomoe.png) | 128×128 | [armory.ts](../../src/ui/screens/armory.ts) | [Yes, shader available](../../src/ui/assets/pbr/world-ui-crest-tomoe/README.md) | `cloth` |
| [world-ui-crest-tsuru.png](../../src/ui/assets/world-ui-crest-tsuru.png) | 128×128 | [armory.ts](../../src/ui/screens/armory.ts) | [Yes, shader available](../../src/ui/assets/pbr/world-ui-crest-tsuru/README.md) | `cloth` |
| [world-ui-material-metal.png](../../src/ui/assets/world-ui-material-metal.png) | 192×192 | Source/reference; no direct filename reference found. | [Yes, shader available](../../src/ui/assets/pbr/world-ui-material-metal/README.md) | `metal` |
| [world-ui-material-paper.png](../../src/ui/assets/world-ui-material-paper.png) | 192×192 | Source/reference; no direct filename reference found. | [Yes, shader available](../../src/ui/assets/pbr/world-ui-material-paper/README.md) | `cloth` |
| [world-ui-material-silk.png](../../src/ui/assets/world-ui-material-silk.png) | 192×192 | Source/reference; no direct filename reference found. | [Yes, shader available](../../src/ui/assets/pbr/world-ui-material-silk/README.md) | `cloth` |
| [world-ui-material-stone.png](../../src/ui/assets/world-ui-material-stone.png) | 192×192 | Source/reference; no direct filename reference found. | [Yes, shader available](../../src/ui/assets/pbr/world-ui-material-stone/README.md) | `stone` |
| [world-ui-material-wood.png](../../src/ui/assets/world-ui-material-wood.png) | 192×192 | Source/reference; no direct filename reference found. | [Yes, shader available](../../src/ui/assets/pbr/world-ui-material-wood/README.md) | `wood` |
| [world-ui-scroll-paper.png](../../src/ui/assets/world-ui-scroll-paper.png) | 192×192 | [scroll-menus.css](../../src/ui/scroll-menus.css), [rewarded-support.css](../../src/ui/screens/rewarded-support.css) | [Yes, shader available](../../src/ui/assets/pbr/world-ui-scroll-paper/README.md) | `cloth` |
| [world-ui-scroll-rod.png](../../src/ui/assets/world-ui-scroll-rod.png) | 192×48 | [scroll-menus.css](../../src/ui/scroll-menus.css), [rewarded-support.css](../../src/ui/screens/rewarded-support.css) | [Yes, shader available](../../src/ui/assets/pbr/world-ui-scroll-rod/README.md) | `wood` |

## Public web artwork

| Asset | Dimensions | Runtime/source | PBR export | Preset |
| --- | --- | --- | --- | --- |
| [favicon.svg](../../public/favicon.svg) | Vector | [index.html](../../index.html) | N/A | — |

## Branding source artwork

| Asset | Dimensions | Runtime/source | PBR export | Preset |
| --- | --- | --- | --- | --- |
| [issen-launcher-foreground-v1.png](../../assets/branding/issen-launcher-foreground-v1.png) | 1254×1254 | Branding source | N/A | — |
| [issen-play-store-icon-512.png](../../assets/branding/issen-play-store-icon-512.png) | 512×512 | Branding source | N/A | — |
| [issen-splash-v1.png](../../assets/branding/issen-splash-v1.png) | 1254×1254 | Branding source | N/A | — |
| [issen-text-free-cover-v1.png](../../assets/branding/issen-text-free-cover-v1.png) | 1672×941 | Branding source | N/A | — |

## Store artwork and screenshots

| Asset | Dimensions | Runtime/source | PBR export | Preset |
| --- | --- | --- | --- | --- |
| [common/app-icon-512.png](../../assets/play-store/common/app-icon-512.png) | 512×512 | Store presentation | N/A | — |
| [common/feature-graphic-1024x500.png](../../assets/play-store/common/feature-graphic-1024x500.png) | 1024×500 | Store presentation | N/A | — |
| [desktop/01-title.png](../../assets/play-store/desktop/01-title.png) | 1920×1080 | Store presentation | N/A | — |
| [desktop/02-waves.png](../../assets/play-store/desktop/02-waves.png) | 1920×1080 | Store presentation | N/A | — |
| [desktop/03-boss-duel.png](../../assets/play-store/desktop/03-boss-duel.png) | 1920×1080 | Store presentation | N/A | — |
| [desktop/04-armoury.png](../../assets/play-store/desktop/04-armoury.png) | 1920×1080 | Store presentation | N/A | — |
| [desktop/05-temple.png](../../assets/play-store/desktop/05-temple.png) | 1920×1080 | Store presentation | N/A | — |
| [issen-feature-graphic-1024x500.jpg](../../assets/play-store/issen-feature-graphic-1024x500.jpg) | — | Store presentation | N/A | — |
| [pc/01-title.png](../../assets/play-store/pc/01-title.png) | 1920×1080 | Store presentation | N/A | — |
| [pc/02-waves.png](../../assets/play-store/pc/02-waves.png) | 1920×1080 | Store presentation | N/A | — |
| [pc/03-boss-duel.png](../../assets/play-store/pc/03-boss-duel.png) | 1920×1080 | Store presentation | N/A | — |
| [pc/04-armoury.png](../../assets/play-store/pc/04-armoury.png) | 1920×1080 | Store presentation | N/A | — |
| [pc/05-temple.png](../../assets/play-store/pc/05-temple.png) | 1920×1080 | Store presentation | N/A | — |
| [pc/feature-graphic-1920x1080.png](../../assets/play-store/pc/feature-graphic-1920x1080.png) | 1920×1080 | Store presentation | N/A | — |
| [pc/logo-600x400.png](../../assets/play-store/pc/logo-600x400.png) | 600×400 | Store presentation | N/A | — |
| [phone/01-title.png](../../assets/play-store/phone/01-title.png) | 1080×1920 | Store presentation | N/A | — |
| [phone/02-waves.png](../../assets/play-store/phone/02-waves.png) | 1080×1920 | Store presentation | N/A | — |
| [phone/03-boss-duel.png](../../assets/play-store/phone/03-boss-duel.png) | 1080×1920 | Store presentation | N/A | — |
| [phone/04-armoury.png](../../assets/play-store/phone/04-armoury.png) | 1080×1920 | Store presentation | N/A | — |
| [phone/05-temple.png](../../assets/play-store/phone/05-temple.png) | 1080×1920 | Store presentation | N/A | — |
| [tablet-10-inch/01-title.png](../../assets/play-store/tablet-10-inch/01-title.png) | 1920×1080 | Store presentation | N/A | — |
| [tablet-10-inch/02-waves.png](../../assets/play-store/tablet-10-inch/02-waves.png) | 1920×1080 | Store presentation | N/A | — |
| [tablet-10-inch/03-boss-duel.png](../../assets/play-store/tablet-10-inch/03-boss-duel.png) | 1920×1080 | Store presentation | N/A | — |
| [tablet-10-inch/04-armoury.png](../../assets/play-store/tablet-10-inch/04-armoury.png) | 1920×1080 | Store presentation | N/A | — |
| [tablet-10-inch/05-temple.png](../../assets/play-store/tablet-10-inch/05-temple.png) | 1920×1080 | Store presentation | N/A | — |
| [tablet-7-inch/01-title.png](../../assets/play-store/tablet-7-inch/01-title.png) | 1280×720 | Store presentation | N/A | — |
| [tablet-7-inch/02-waves.png](../../assets/play-store/tablet-7-inch/02-waves.png) | 1280×720 | Store presentation | N/A | — |
| [tablet-7-inch/03-boss-duel.png](../../assets/play-store/tablet-7-inch/03-boss-duel.png) | 1280×720 | Store presentation | N/A | — |
| [tablet-7-inch/04-armoury.png](../../assets/play-store/tablet-7-inch/04-armoury.png) | 1280×720 | Store presentation | N/A | — |
| [tablet-7-inch/05-temple.png](../../assets/play-store/tablet-7-inch/05-temple.png) | 1280×720 | Store presentation | N/A | — |

## Android splash and launcher resources

| Asset | Dimensions | Runtime/source | PBR export | Preset |
| --- | --- | --- | --- | --- |
| [drawable/splash.png](../../android/app/src/main/res/drawable/splash.png) | 480×320 | Native launcher/splash | N/A | — |
| [drawable-land-hdpi/splash.png](../../android/app/src/main/res/drawable-land-hdpi/splash.png) | 800×480 | Native launcher/splash | N/A | — |
| [drawable-land-mdpi/splash.png](../../android/app/src/main/res/drawable-land-mdpi/splash.png) | 480×320 | Native launcher/splash | N/A | — |
| [drawable-land-xhdpi/splash.png](../../android/app/src/main/res/drawable-land-xhdpi/splash.png) | 1280×720 | Native launcher/splash | N/A | — |
| [drawable-land-xxhdpi/splash.png](../../android/app/src/main/res/drawable-land-xxhdpi/splash.png) | 1600×960 | Native launcher/splash | N/A | — |
| [drawable-land-xxxhdpi/splash.png](../../android/app/src/main/res/drawable-land-xxxhdpi/splash.png) | 1920×1280 | Native launcher/splash | N/A | — |
| [drawable-port-hdpi/splash.png](../../android/app/src/main/res/drawable-port-hdpi/splash.png) | 480×800 | Native launcher/splash | N/A | — |
| [drawable-port-mdpi/splash.png](../../android/app/src/main/res/drawable-port-mdpi/splash.png) | 320×480 | Native launcher/splash | N/A | — |
| [drawable-port-xhdpi/splash.png](../../android/app/src/main/res/drawable-port-xhdpi/splash.png) | 720×1280 | Native launcher/splash | N/A | — |
| [drawable-port-xxhdpi/splash.png](../../android/app/src/main/res/drawable-port-xxhdpi/splash.png) | 960×1600 | Native launcher/splash | N/A | — |
| [drawable-port-xxxhdpi/splash.png](../../android/app/src/main/res/drawable-port-xxxhdpi/splash.png) | 1280×1920 | Native launcher/splash | N/A | — |
| [mipmap-hdpi/ic_launcher.png](../../android/app/src/main/res/mipmap-hdpi/ic_launcher.png) | 72×72 | Native launcher/splash | N/A | — |
| [mipmap-hdpi/ic_launcher_foreground.png](../../android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png) | 162×162 | Native launcher/splash | N/A | — |
| [mipmap-hdpi/ic_launcher_round.png](../../android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png) | 72×72 | Native launcher/splash | N/A | — |
| [mipmap-mdpi/ic_launcher.png](../../android/app/src/main/res/mipmap-mdpi/ic_launcher.png) | 48×48 | Native launcher/splash | N/A | — |
| [mipmap-mdpi/ic_launcher_foreground.png](../../android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png) | 108×108 | Native launcher/splash | N/A | — |
| [mipmap-mdpi/ic_launcher_round.png](../../android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png) | 48×48 | Native launcher/splash | N/A | — |
| [mipmap-xhdpi/ic_launcher.png](../../android/app/src/main/res/mipmap-xhdpi/ic_launcher.png) | 96×96 | Native launcher/splash | N/A | — |
| [mipmap-xhdpi/ic_launcher_foreground.png](../../android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png) | 216×216 | Native launcher/splash | N/A | — |
| [mipmap-xhdpi/ic_launcher_round.png](../../android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png) | 96×96 | Native launcher/splash | N/A | — |
| [mipmap-xxhdpi/ic_launcher.png](../../android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png) | 144×144 | Native launcher/splash | N/A | — |
| [mipmap-xxhdpi/ic_launcher_foreground.png](../../android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png) | 324×324 | Native launcher/splash | N/A | — |
| [mipmap-xxhdpi/ic_launcher_round.png](../../android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png) | 144×144 | Native launcher/splash | N/A | — |
| [mipmap-xxxhdpi/ic_launcher.png](../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png) | 192×192 | Native launcher/splash | N/A | — |
| [mipmap-xxxhdpi/ic_launcher_foreground.png](../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png) | 432×432 | Native launcher/splash | N/A | — |
| [mipmap-xxxhdpi/ic_launcher_round.png](../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png) | 192×192 | Native launcher/splash | N/A | — |

## Atlas metadata

| File | Purpose | PBR | Preset |
| --- | --- | --- | --- |
| [awakening-buttons-atlas.json](../../src/ui/assets/awakening-buttons-atlas.json) | UI atlas frame metadata | N/A | — |
| [ui-strokes-atlas.json](../../src/ui/assets/ui-strokes-atlas.json) | UI atlas frame metadata | N/A | — |
| [world-ui-atlas.json](../../src/ui/assets/world-ui-atlas.json) | UI atlas frame metadata | N/A | — |

## Player outfit coverage

The IDs below come from [outfit-kit.ts](../../src/rendering/figures/outfit-kit.ts).
They share sheets, so an atlas conversion does not automatically convert every
outfit. [ink-player.ts](../../src/rendering/figures/ink-player.ts) selects the
exported base cloth pack for all supported outfits; attachment sheets use their own packs.

| Outfit ID | Exported PBR active | Preset |
| --- | --- | --- |
| `sumi` | Yes | `cloth` |
| `hai` | Yes | Base `cloth`; attachments use their catalog presets. |
| `aka` | Yes | Base `cloth`; attachments use their catalog presets. |
| `shiro` | Yes | Base `cloth`; attachments use their catalog presets. |
| `kasa` | Yes | Base `cloth`; attachments use their catalog presets. |
| `monk` | Yes | Base `cloth`; attachments use their catalog presets. |
| `oni` | Yes | Base `cloth`; attachments use their catalog presets. |
| `tengu` | Yes | Base `cloth`; attachments use their catalog presets. |
| `kitsune` | Yes | Base `cloth`; attachments use their catalog presets. |
| `noh` | Yes | Base `cloth`; attachments use their catalog presets. |
| `komuso` | Yes | Base `cloth`; attachments use their catalog presets. |
| `kabuki` | Yes | Base `cloth`; attachments use their catalog presets. |
| `tanuki` | Yes | Base `cloth`; attachments use their catalog presets. |
| `rags` | Yes | Base `cloth`; attachments use their catalog presets. |
| `scarecrow` | Yes | Base `cloth`; attachments use their catalog presets. |
| `yoroi` | Yes | Base `cloth`; attachments use their catalog presets. |
| `helm` | Yes | Base `cloth`; attachments use their catalog presets. |
| `shinobi` | Yes | Base `cloth`; attachments use their catalog presets. |
| `jinbaori` | Yes | Base `cloth`; attachments use their catalog presets. |
| `mino` | Yes | Base `cloth`; attachments use their catalog presets. |

## Procedural assets and materials

These families are generated by code; they have no source image to send to PBR
Forge and are not counted in the media-file total above.

| Family | Owner/evidence | PBR export | Preset |
| --- | --- | --- | --- |
| Cloth, steel and stone normals/material masks | [surface-maps.ts](../../src/rendering/surface-maps.ts) | No; procedural shader materials | — |
| Background skies and generated scene layers | [background.ts](../../src/rendering/scene/background.ts), [environment](../../src/rendering/environment/index.ts) | No image conversion | — |
| Weather particles and debris placement | [weather-particles.ts](../../src/rendering/scene/weather-particles.ts), [drift-renderer.ts](../../src/rendering/scene/drift-renderer.ts) | No separate export; debris sheets listed above | — |
| Weapon auras, lightning and figure joins | [figure.ts](../../src/rendering/figures/figure.ts) and figure renderers | No image conversion | — |
| Synthesised effects and ambience | [audio.ts](../../src/audio/audio.ts) | N/A; Web Audio | — |

No standalone audio, video, font or 3D model files were found in the inventoried
directories at review time. System fonts, generated sounds and procedural shapes
are maintained in their owning code.

## Maintaining this document

Update this inventory whenever an asset is added, retired, converted, regenerated
with another preset, or connected to/removed from the material renderer.

1. Add/update the source row, including retained references and editable SVGs.
2. Generate materials through [scripts/pbr/cli.mjs](../../scripts/pbr/cli.mjs)
   using the [documented presets](../../scripts/pbr/README.md). Keep trial outputs
   and manifests under ignored `tmp/`.
3. Record the actual preset, mode, normal convention and frame/mask composition in
   adjacent provenance. A filename containing `normal` does not prove a preset.
4. Mark PBR **Yes** only after the installed map set exists. Check renderer wiring
   independently; label generated-but-unwired exports as such.
5. Update map links, dimensions, outfit/part coverage and exclusions.
6. Review diffuse alpha, alignment and lighting. Record pending visual feedback
   separately from successful export/code checks. Update the review date.

Suggested row format:

| Asset | Dimensions | Runtime/source | PBR export | Preset |
| --- | --- | --- | --- | --- |
| Repository-relative source link | width×height | Owning renderer/reference | No installed pack / generated but unwired / Yes | Actual preset or — |

Rescan with `rg --files src public assets android/app/src/main/res`, filter media
extensions, and check PBR directories, adjacent provenance and renderer sources.
Ignored trial exports are not evidence of installed game integration.

Enemy headwear provenance and wiring are documented in the enemy pack README.
Retained source artwork is lit in Material preview rather than placed in gameplay.
Expanded material coverage still awaits visual approval. Functional checks cover
all 31 UI packs, nine stage caches, mirrored cached normals, procedural occlusion,
shader colour/coverage, outfit/charm frames and the retained/original pack previews.
