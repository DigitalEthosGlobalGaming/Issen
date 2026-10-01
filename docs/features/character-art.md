# Ink character puppets

Artwork uses one **Options > Display and Accessibility > Artwork > Ink**
selection for scenes, player parts and weapons. Backtick switches the same mode.
Ink is the default from version 1.21.1 for new or missing preferences and Display Restore defaults; existing saved artwork choices are preserved. The existing `renderer` save key is authoritative;
older character-only preferences are read only when that key is missing/invalid.
Switching changes drawing, not encounter state, equipment or attack timing.

## Replacement coverage

| Item / figure | Ink replacement | Fallback |
| --- | --- | --- |
| Rear-view player wearing Sumi (`sumi`) | Modular torso, robe panels, head and articulated arms | Classic while unavailable |
| Player Steel sword (`steel`) | Shared modular katana aligned to grip and tip | Classic while unavailable |
| Yoroi, Helm, Shinobi, Jinbaori, Mino | Shared modular armour and clothing kit (1.19.0) | Classic while required pieces are unavailable |
| All 20 primary player outfits | Shared cloth rig with modular colour, masks, headwear and accessories (1.21.0) | Classic while required pieces are unavailable |
| All 20 primary blades | Modular profile, grip and guard recipes; beam emitter and pan (1.24.0) | Classic while required families are unavailable |
| Enemies and bosses | Modular front-view body, articulated arms/hands and interchangeable headwear (1.20.0) | Classic while required pieces are unavailable |

Body and sword selection are independent: a new sword can accompany a Classic
outfit, and the new player body can hold an unreplaced weapon. Crests, charms,
robe auras and weapon effects retain their existing drawing. Final film grading
still applies to the assembled character. These old drawings use Canvas 2D.

## Ownership and rig

`src/rendering/figures/figure.ts` owns the mixed composition and calls optional
body/head/arm and weapon hooks. The existing normalized character coordinates,
player pose targets, lean and death transforms remain the animation inputs.
`ink-player.ts` and `ink-sword.ts` own image loading and sprite placement.
The rear-view forearms/hands draw before the torso so they reach around the body,
rather than appearing folded behind the back. Ink uses its own simple waist
join instead of overlaying the Classic rectangular belt.
The runtime owns the player, enemy and sword loaders; each armoury/support
preview owns its own set and releases them on disposal. Missing images do not hide the character.

Assets are cutout parts, not pre-rendered animation frames. Sleeve and forearm
sprites rotate between shoulder, elbow and hand anchors; overlapping cuffs hide
joins. The overlapping robe panels sway together around their waist anchor. The sword is registered to the existing
weapon grip and tip so glints and effects keep their established coordinates.

Sumi supplies the common rear-view body and puppet joints. All primary outfit
recipes combine reusable cloth, armour, headwear and accessories over that body.
Enemy front views use a separate modular kit.

## Reusable source assets

- [Player kit and frame/pivot contract](../../src/rendering/figures/assets/player-ronin-simple.md)
- [Katana and grip/tip contract](../../src/rendering/figures/assets/katana.md)

Original generated PNGs are kept intact. Contracts record actual packing,
transparency observations, prompts and reference images. Rendering selects
measured source rectangles without splitting or repainting the source sheets.

## Review scope

Check rest, four swing directions, block and transitions between them. Inspect
joint coverage, sleeve overlaps, grip placement and blade tips at the player's
large foreground scale as well as tablet and armoury sizes. Keep secondary cloth
motion subordinate to attack readability and honour reduced-motion settings.
During art iteration use strict type checking, focused fallback/settings checks
and local preview inspection; no full production build is needed for each tweak.

Verified for this pass: strict TypeScript; 14 focused settings, figure fallback,
shadow and aura checks; six assembled combat poses; desktop/tablet live previews;
armoury preview; preference reload; and paused character-art switching without
changing pose, combat RNG or saved checkpoint. No full suite or production build.

The simplified player revision uses broad dark facets and minimal interior detail;
the original detailed atlas is retained as an unused source reference. It is not
loaded by the active player renderer. Cinematic Artwork selection applies the same
mode to all available replacements within that preview.

Version 1.18.1 verification: type checking and ten focused unit checks passed.
A focused browser test confirmed the shared Artwork mode reaches both scene and
figure renderers without changing the paused encounter or checkpoint. Desktop,
tablet and six-pose screenshots were inspected after replacing the atlas.

## Modular outfit kit (version 1.19.0)

`outfit-kit.ts` describes reusable part selection and placement per existing
saved robe ID. `ink-player.ts` loads the source families and assembles the selected
recipe at the existing torso, waist, head and arm anchors. The outfit IDs and
unlock rules stay in the equipment catalog; these recipes change appearance.

| Existing outfit | Composition |
| --- | --- |
| Yoroi | Heavy cuirass, paired shoulder guards, waist plates and kabuto |
| Helm | Lighter plate arrangement and shared kabuto |
| Shinobi | Dark cloth, wrapped hood and bracers |
| Jinbaori | Open sleeveless coat halves |
| Mino | Straw cape and kasa over the shared cloth body |

The armour atlas separates cuirass, left/right shoulder guards and waist plates.
The headwear atlas separates helmet, kasa, hood and collar. The cloth atlas
separates left/right coat panels, cape and bracer. These are reusable components,
not five baked full-character images. Opposite sides retain their own frames.

A recipe requires its source families before replacing the Classic outfit.
Missing armour does not prevent the base Sumi kit from drawing. Classic armour,
coat and cape overlays are suppressed only when the Ink body succeeds, avoiding
duplicate clothing. Crests, charms, auras and the final film pass remain shared.

Atlas contracts contain measured frame rectangles, pivots, permitted transforms,
transparency inspection and generation prompts:

- [Armour plates](../../src/rendering/figures/assets/armour-plates-atlas.md)
- [Headwear](../../src/rendering/figures/assets/outfit-headwear-atlas.md)
- [Cloth pieces](../../src/rendering/figures/assets/outfit-cloth-atlas.md)


## Front-view enemy kit (version 1.20.0)

`ink-enemy.ts` owns a front-view torso, paired robe panels, upper/lower arms,
hand and interchangeable head pieces. Current regular enemy looks (plain,
mask, monk and jingasa) and boss looks (kasa, kabuto, swept hair, mask and
jingasa) share this kit. Mirror retains its pale robe palette. Recipes and
measured frame geometry stay in the renderer; encounter identities, timing,
weapon reach and unlock rules stay in their gameplay owners.

Front arms draw after the body; weapons draw after arms; separate hands draw
last at the existing grip targets. Twin swords and the spear retain their
existing weapon shapes and pose geometry. Death clipping, opacity, fog and
film grading remain shared. Unknown looks or missing source families fall
back to Classic. Runtime and isolated Armoury previews own and dispose their
loaders independently. The single Artwork option applies to both views.

- [Front-view modular body contract](../../src/rendering/figures/assets/enemy-ronin-simple.md)
- [Front-view headwear contract](../../src/rendering/figures/assets/enemy-headwear-atlas.md)


Version 1.20.0 verification: strict TypeScript and 17 focused figure, settings,
shadow and aura checks passed. Desktop/tablet galleries cover all enemy/boss
looks, fog, Mirror, twin swords, spear and unknown-look fallback. Running scene
screenshots and paused Artwork switching were inspected without changing
combat RNG, pose or saved checkpoint. No production build or full suite ran.


## All primary player outfits (version 1.21.0)

The primary equipment catalog has 20 outfits. All use the same normalized puppet
and modular recipe system in Ink mode. Awakening designs are outside this art pass;
existing powers/effects remain in their shared rendering and gameplay owners.
The first five armour recipes above stay available alongside the added recipes:

| Outfit | Reused body and distinctive pieces |
| --- | --- |
| Sumi | Neutral charcoal cloth and tied hair |
| Hai | Ash cloth recolour |
| Aka | Charcoal cloth with restrained red sash |
| Shiro | Pale ivory cloth recolour |
| Kasa | Shared straw hat |
| Oni | Horned red mask and rear hair |
| Tengu | Long-nosed red mask and rear hair |
| Monk | Wrapped hood and collar |
| Kitsune | Ivory fox mask with pointed ears |
| Noh | Smooth ivory theatre mask |
| Komuso | Basket head cover |
| Rags | Muted worn cloth and large patch accents |
| Kabuki | Broad ivory mane |
| Scarecrow | Straw cloth, kasa and cape accents |
| Tanuki | Brown cloth, rounded-ear hood and separate striped tail |

Whole-head replacements register their measured neck anchors at the collar.
The mask family uses rear three-quarter silhouettes so mask edges remain visible
from the player's rear camera. Reusable source sheets stay intact and allow later
mixing; saved outfit IDs select recipes without creating new equipment.

- [Player masks and rear head contract](../../src/rendering/figures/assets/player-mask-atlas.md)
- [Special headwear and tail contract](../../src/rendering/figures/assets/player-special-headwear-atlas.md)


Cloth recolours are cached once per recipe/frame at the source frame resolution
so the large foreground player and Armoury crops retain the atlas detail.
Classic tail, patch and straw overlays are suppressed after a successful Ink
body; the recipe supplies matching modular or simple faceted accents instead.
The enemy under-robe join now receives the same fog blend as its sprite panels.

Version 1.21.0 verification: strict TypeScript and 18 focused checks passed.
All 20 primary outfits were inspected in six combat poses, plus desktop/tablet
catalog galleries. A deliberately blocked mask atlas fell back for the entire
Oni body/head/arms while Sumi and Tanuki remained available. Disposal released
the loaded kit. The local preview is available; no full build or suite ran.


## Companions and regular enemy variety (1.22.0)

`ink-companions.ts` supplies Shiba, Cat and perched/raised-wing Crow from one
[companion atlas](../../src/rendering/figures/assets/companion-atlas.md).
Existing foot/shoulder anchors and pet reactions remain shared. Reduced motion
freezes the pose; Classic or unavailable sprites retain procedural companions.
Runtime and Armoury each own and release a companion loader.

Regular enemy Ink appearance uses `enemy-appearance.ts`: six head silhouettes,
four muted cloth palettes and subtle body-width variation derived from the saved
figure seed. No extra combat RNG calls or saved gameplay fields are added. Hands,
weapons, reach, glyphs and encounter timing stay at their original coordinates.
Authored masks remain selected; bosses retain their authored look and palette.
Strict TypeScript, nine focused character checks and desktop/tablet galleries
passed. No full build or Android test ran.


## Modular blades (1.24.0)

`blade-recipes.ts` maps every primary blade ID to a profile, grip, guard and
restrained colour treatment. `ink-sword.ts` assembles cached cutouts from three
source families. Measured blade roots/tips align with the existing grip and
item-specific reach; short, long, serpent, heavy and wooden profiles remain
distinct. The beam retains its procedural energy effect over the sprite emitter,
and the pan uses its separate full shape. Aura, glow, transparency and film
passes remain caller-owned. Unknown IDs and unavailable required families fall
back to Classic, independently of the player outfit. The previous single-katana
source remains as provenance and is not used by the active renderer.

- [Blade profiles and item recipe mapping](../../src/rendering/figures/assets/blade-profile-atlas.md)
- [Reusable grips and guards](../../src/rendering/figures/assets/handle-guard-atlas.md)
- [Beam emitter and pan](../../src/rendering/figures/assets/special-weapons-atlas.md)

Strict TypeScript and ten focused character checks passed. All 20 weapons were
inspected as an assembled gallery and representative forms in held combat poses.
No full build or Android test ran.


## Charm artwork (1.25.0)

All 19 physical charms use `ink-charms.ts` and a single twelve-piece
[charm atlas](../../src/rendering/figures/assets/charm-atlas.md). Shared pouch
shapes receive restrained palette variants, while bell, cat, Daruma, fox-fire,
wind chime, ward, mirror and fortune slip keep distinct silhouettes. `charmId`
selects the recipe; the existing colour field retains Classic fallback. The
suspension cord stays at the original waist anchor. Powers and triggered effects
are unchanged. Runtime and Armoury own and dispose separate charm loaders;
missing/unknown sprites preserve the procedural pouch. Cached variants cap at32.
Strict TypeScript, eleven focused character checks, the complete nineteen-charm
gallery and representative held-player compositions passed without a full build.
