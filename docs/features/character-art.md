# Ink player puppet

Version 1.18.1 uses one **Options > Display and Accessibility > Artwork > Ink**
selection for scenes, player parts and weapons. Backtick switches the same mode.
Classic remains the default. The existing `renderer` save key is authoritative;
older character-only preferences are read only when that key is missing/invalid.
Switching changes drawing, not encounter state, equipment or attack timing.

## Initial replacement coverage

| Item / figure | Ink replacement | Fallback |
| --- | --- | --- |
| Rear-view player wearing Sumi (`sumi`) | Modular torso, robe panels, head and articulated arms | Classic while unavailable |
| Player Steel sword (`steel`) | Separate katana aligned to grip and tip | Classic while unavailable |
| Other robes and weapons | No replacement yet | Existing procedural drawing |
| Enemies and bosses | No replacement yet | Existing procedural drawing |

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
The runtime owns one pair of loaders; each armoury/support preview owns its own
pair and releases them on disposal. Missing images do not hide the character.

Assets are cutout parts, not pre-rendered animation frames. Sleeve and forearm
sprites rotate between shoulder, elbow and hand anchors; overlapping cuffs hide
joins. The overlapping robe panels sway together around their waist anchor. The sword is registered to the existing
weapon grip and tip so glints and effects keep their established coordinates.

The first supported clothing kit is deliberately restricted to Sumi. Further
outfits need measured compatible parts and their own availability mapping before
being opted into the Ink path. Enemy front views require their own art.

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
