# Asset lighting

Implemented in 1.62.0. The six blade profiles in `figures/assets/blade-pbr/`
provide aligned 1254×1254 diffuse, OpenGL normal, roughness, metallic, ambient
occlusion and emissive maps. `ink-sword.ts` keeps the existing recipe frames,
grips, tips, tints and animation transforms. Since 1.66.0, handles, guards, beam
and pan also use their generated PBR packs while retaining their colour artwork.

Each sword renderer owns decoded images, cropped diffuse parts and one packed
surface atlas (R roughness, G metallic, B AO, opaque alpha). PBR images participate
in startup validation. Every modular profile uses the shader, including enemy
weapons and Armoury previews; Canvas fallback uses the same diffuse cutouts.

`pixi/material.ts` uses a roughness-dependent GGX/Smith specular response,
metallic diffuse/specular separation, ambient occlusion on ambient light and
additive emission. It keeps the existing material-mask path for other surfaces.
Since 1.64.2, both PBR and material-mask paths decode albedo from sRGB and use
linear radiance before returning to display colour. GGX replaces the earlier
Blinn-Phong approximation to keep rough cloth from receiving oversized white
highlights. PBR emission also decodes from sRGB. A hue-preserving highlight
shoulder leaves values up to 0.8 linear unchanged and compresses only brighter
values, replacing 1.64.1's global Reinhard tone mapping. Unlit comparison keeps
the diffuse artwork. Tint applies to surfaces before lighting; fog blends after
display conversion without inheriting surface tint. Coverage stays premultiplied.

Since 1.66.0, nine-stage colour and material composition runs in an owned worker
where supported. Transferred colour ImageBitmaps preserve premultiplied coverage;
normal, surface and emissive planes preserve raw channel data. The last completed
scene keeps drawing until the latest requested scene is ready. Cached material
revisions increase across rebuilds so reused colour canvases cannot leave stale
GPU textures after a scene change. See [performance follow-up](pbr-performance-2026-10-05.md).

Normal, mask and surface textures use separate raw-data uploads without alpha
premultiplication; diffuse and emission retain colour-texture uploads. Surface
atlases remain opaque. Cached scenery layers opt into surface-alpha lighting
coverage so procedural pixels retain their original colour. Material UVs require untrimmed, unrotated frames, enforced
by the backend. The compositor supplies full scene transforms to meshes in an
identity root (temporary film/clip containers do not change that coordinate
space); normal transforms and screen-space light positions use that same space.
Every painter slot and backend sprite owns its material mesh and uniforms.

One light loop handles either material mode, gates highlights by N·L, safely
handles zero half-vectors and skips lights outside their footprints. Radius uses
2D screen distance, while height affects light direction. The four strongest
lights reaching the sprite bounds are selected instead of the first four array
entries. Point-light colours are authored in sRGB and decoded on the CPU;
ambient and directional values are linear RGB radiance. CPU updates reuse UV,
normal and uniform arrays, and normalize the directional vector once per update.
Normals follow rotation, mirroring and nonuniform scale. OpenGL Y-up is flipped
before the scene transform. Diffuse alpha owns coverage and painter ordering.
Height, opacity and distance outputs are not sampled: these remain flat 2D
sprites, and diffuse alpha already provides their silhouette. There is no
displacement, shadow casting or environment reflection in this shader.

In 1.62.1 these maps were regenerated with `scripts/pbr/cli.mjs` in Sprite/OpenGL
mode. Steel profiles use the `metal` preset; the bokken frame uses the `wood`
preset, composited into the same atlas layout. Metal uses normal intensity 1.5
and roughness base 0.25; wood uses 0.8 and 0.7 with zero metallic response.

## First outfit

The first outfit, Sumi, uses a Sprite/OpenGL PBR Forge conversion of
`player-ronin-simple.png`. Its six exported maps live in `figures/assets/player-pbr/`.
`pbr-atlas.ts` owns decoded maps and packed surface data per player renderer.
`ink-player.ts` applies aligned frame materials to all nine Sumi parts: torso,
head, two robe panels, two sleeves, two forearms and the hand stamp. Existing
joint transforms and animation remain in place. The small procedural under-robe
bridge retains its existing flat colour. Since 1.65.0 all supported outfits use
this base cloth pack, with aligned packs on armour, hats, masks and overlays.
Charms, companions, enemy hands, scenery and debris also use generated materials.

The runtime and Armoury use the same explicit light inputs as the swords. Canvas
fallback shows the exported diffuse parts. These maps participate in artwork
startup and renderer disposal; no player save migration is needed.

In 1.62.1 Sumi's maps use the `cloth` preset: normal intensity 0.6, roughness
base 0.85, zero metallic response and zero emission. Diffuse alpha and all
existing part frames are retained.

## Lighting controls

Backtick / tilde opens a non-modal Lighting panel. Adjust X/Y, height, radius,
intensity, light colour and ambient light, or drag the sun marker. Lighting enabled
compares against the diffuse artwork; Reset light restores defaults. Escape, the
close button or tilde closes the panel. Modifier chords and external text fields
do not trigger it; Shift+tilde is accepted. It does not pause or resume gameplay.

Startup owns a session-only `lighting-rig.ts` instance and supplies lighting
explicitly to the main scene and preview frames. X/Y are fractions of each
target's dimensions; height/radius use its longest dimension, including DPR.
This keeps the marker and rendered light aligned on resized canvases. Control
changes redraw settled scenes and previews without writing player saves. Other
opt-in material surfaces also receive this rig; unlit artwork is unaffected.
Canvas views report that lighting requires WebGL.

Raster UI textures are rendered through the same shader on lighting changes.
CSS border slices, atlas positions and tinted seal colours remain in place;
the explicit Canvas comparison retains original artwork. The material catalog
contains all 86 packs. The panel's Material preview can inspect retained source
art without adding it to gameplay. Scene, preview and UI resources have explicit
owners and are released on disposal.

The 1.64.1 defaults place the light at X 0.5, Y 0.4, height 0.5 and radius 1.6,
with intensity 2 and ambient 0.55. The higher, centred light provides more even
foreground/background illumination. Reset light applies these defaults; the
rig remains session-only.

## Verification

The 1.66.0 material-loading pass excludes generated maps from lifetime startup
retention. Environment selection keeps packs shared by consecutive scenes and
releases the rest. Cached material baking uses destination backing resolution;
aligned OpenGL normals copy directly, while rotations, mirrors and nonuniform
scales retain inverse-transpose conversion. Readback canvases request CPU backing.
Roughness, metallic and AO are prepacked by the PBR tool into an opaque RGB
`_surface.png`. Runtime owners decode that texture instead of combining scalar
maps on the main thread. All 86 textures passed exact browser pixel comparison;
six-map exports remain available, and unconverted callers retain the old fallback.
Focused browser checks cover original-art startup gating, disposal and retry,
shared-pack reuse and release, mirrored normals, procedural occlusion, unchanged
alpha, all nine environments and CSS material slices. TypeScript passed.

For 1.64.2, strict TypeScript, three focused unit checks and two focused browser
checks passed. The new material-colour check exercises unit-ambient midtone
preservation, rough-cloth highlight bounds, back-facing light rejection, data-map
alpha independence, light-height coverage, strongest-light selection, neutral fog
on tinted sprites and unchanged alpha. The existing material check verifies
normal mirroring, moved-light response and fog. Whole-game visual feedback is
still needed for the final artistic balance.

For 1.64.1, strict TypeScript and version consistency checks passed. The focused
sword-lighting browser check did not return a result; no visual validation is
claimed for the colour-space and default-light adjustment.

The 1.62.1 preset refresh verified all three ZIP archives and applied settings,
1254×1254 map dimensions, unchanged diffuse alpha, and installed pixels against
the intended exports (including the wood-frame composite). Gameplay tests and
builds were not run for this asset refresh; visual feedback is pending.

The sword-focused checks completed before the request to stop testing. The full
browser run was stopped, and the later Sumi integration was not tested or built
at the user's request.

`tests/browser/sword-lighting.spec.ts` covers exported atlas loading, every blade
recipe, changing pixel response under moved lights, unchanged transparent
coverage, debug controls/dragging and session-only settings. The existing Pixi
material test covers mirrored normals and alpha. Debris tests cover old-save
migration, absence of removed selectors, every scene and all 32 sprite frames.
