# PixiJS rendering and 2D lighting migration plan

Status: implemented and integrated into `develop`, 5 October 2026.
The sections below retain the design and acceptance criteria. See
[implemented rendering](rendering.md) for current code and ownership. WebGL is
now the default. The implementation was merged from `feature/rendering-v2` into
the main `develop` checkout. Focused parity, unit, production and offline
Android web checks have passed. Broad browser validation and corrected-fixture
reruns leave one existing short-screen UI overflow, detailed below.
The branch was reconciled with freshly fetched `develop` after implementation.
Actual Android WebView validation still needs a connected device. The HTML/CSS
interface stays in place.

Read [implemented rendering](rendering.md) and [architecture](overview.md) for
current ownership. Source references below are discovery starting points, not
fixed function names or a required future directory tree. The concurrent
leaves/debris atlas refactor was present in the implementation base and remains
the owner of its catalog, motion and settings.

## Implemented decisions

- Pin PixiJS 8.22.0 and explicitly use WebGL. Keep `?renderer=canvas` for comparison
  and automatic Canvas fallback when initialization or restoration fails.
- Reuse the finished drift atlas and existing composition through a bounded
  `SceneDrawing` contract. Static prepared pixels become cached textures; live
  figures, particles and paths become native GPU draws.
- Use separate main, Armoury, support and tutorial surfaces with existing frame
  scheduling. Do not create a Pixi ticker or a context per equipment tile.
- Use forward material shading with at most four local lights, one directional
  light, ambient illumination and logical depth fog. Cloth and steel are enabled
  selectively; the rock is an authoring study. General shadows and screen-space
  depth buffers remain later extensions.
- Prepare camera/post randomness once. Synchronous composition reads current
  poses without advancing simulation. A complete serialized scene snapshot is
  not required by this implementation; `scene-frame.ts` also supplies the explicit
  sprite/material contract used by isolated material studies.
- Preserve Canvas blend definitions with owned grading shaders. Tolerant native
  comparisons cover films at DPR 1, 1.5 and 2, scene composition, equipment and
  death coverage; these establish representative parity rather than pixel identity.
- The [paired performance comparison](../features/webgl-performance-2026-10-05.md)
  measures higher CPU rendering cost in every tested WebGL scene; no speedup is claimed.

The remaining sections preserve the original design rationale and phased criteria;
use [implemented rendering](rendering.md) for current ownership and behavior.

## Validation and rollout limits

The migration was checked with 248 unit tests, four production tests and five
offline Android web tests. The 213-case browser run passed 199 initially;
13 failures passed on focused reruns after startup waits were corrected. Fixtures
must wait for `.startup-loading` to disappear before reading initialized saves or
sending input: mounted menu markup alone no longer means GPU startup is complete.
The final 18-case native/recovery/resize set also passed, including warning-sensitive
stage switching and resizing.

The remaining browser failure is the existing setup layout at 360×640:
`mobile-temple.spec.ts` reports a scroll height of 653 against a client height of 640. The same case with `?renderer=canvas` produces the same dimensions. This
renderer change does not alter that interface layout.

This is ready for feature-branch testing, not evidence of universal device support.
No Android device was connected during verification. The Android web bundle checks
use Edge with touch input and do not establish actual WebView GPU compatibility.
Retain the Canvas fallback and validate a real device before production rollout.
The desktop comparison measures a CPU rendering regression, including reduced
callback cadence in the stress scene. Battery behavior remains unmeasured.

## Goals and scope

- Preserve Issen's ink artwork, modular character poses, combat readability,
  portrait/landscape composition and timing while moving scene drawing to PixiJS.
- Make film treatments, distortion, material lighting and depth fog extensible
  through shaders without changing gameplay rules.
- Reuse existing colour atlases. Add normal/material maps selectively rather than
  requiring every asset to be re-authored before the renderer can ship.
- Preserve `issen.*` saves, equipment IDs, accessibility settings, preview
  isolation, lifecycle cleanup and existing scene/preview scheduling.

This is not a migration of menus, HUD, controls, navigation or CSS artwork.
Game-world glyphs, damage text, stamps and tutorial/Armoury scene canvases are
rendering surfaces even when their controllers live under `src/ui/`; they need
explicit treatment. Gameplay stays 2D. Full 3D models, physics, perspective camera
redesign, general-purpose real-time shadows and WebGPU parity are outside the
initial scope.

## Renderer decision and supported capabilities

Use PixiJS v8 with an explicitly selected WebGL backend for the first version.
Pin and verify an exact release when implementation starts; do not silently rely
on whichever backend an automatic selection chooses. Custom GLSL shaders do not
by themselves provide a working WebGPU implementation.

Pixi supplies sprite rendering, custom mesh geometry/shaders, render textures,
depth state and render targets. It does not provide the complete proposed Issen
material system out of the box. See the official [mesh guide][pixi-mesh],
[render state reference][pixi-state] and [render target reference][pixi-target].
Verify backend/format support on the pinned version before depending on sampled
depth textures or multiple render attachments.

The [PixiJS Lights plugin][pixi-lights] demonstrates deferred normal-map lighting,
but its documented setup targets Pixi v7 and `@pixi/layers`. Treat it as a design
reference, not an assumed v8 dependency. Build a small owned lighting layer on
supported Pixi APIs. Reconsider this choice only if a maintained compatible
solution passes the same art, lifecycle and device checks.

| Input                            | Meaning                                                | Initial use                                  |
| -------------------------------- | ------------------------------------------------------ | -------------------------------------------- |
| Colour/alpha atlas               | Painted appearance and coverage                        | Existing assets                              |
| Normal atlas                     | Surface direction at each texel                        | Selected cloth, rock and metal               |
| Material mask                    | Response strength, specular response, emission         | Keep ink/cloth matte; allow blade highlights |
| Logical scene depth              | Camera distance shared by scene layers and figures     | Fog and light separation                     |
| Optional height map              | Local surface elevation in a defined coordinate system | Later lighting/occlusion experiments         |
| Shadow occluder geometry or maps | Surfaces that block a light                            | Separate later feature                       |

A normal map neither changes a silhouette nor creates cast shadows. Sprite
`zIndex` controls ordering; it is not a physical depth buffer. A depth attachment
only becomes meaningful when shaders write meaningful depth values. Start with
explicit painter ordering and logical depth rather than enabling depth writes
for every transparent sprite.

## Current evidence and migration seams

At planning time, the runtime composes the main Canvas scene and film pass in
[`src/game.ts`](../../src/game.ts). The renderer families are under
[`src/rendering/`](../../src/rendering/): layered environments, modular figures,
weather, ambient decoration and combat effects. Cached environment images and
existing atlas rectangles are reusable inputs. Canvas draw calls themselves are
not portable Pixi commands.

[`film.ts`](../../src/rendering/effects/film.ts) contains both simple grading and
multi-step copying/compositing. The runtime's post pass also advances visual
state and can trigger heartbeat haptics. Extract update responsibilities before
allowing two backends to draw the same presentation frame.

[`armory-preview.ts`](../../src/rendering/armory-preview.ts) and the
[`tutorial controller`](../../src/ui/screens/tutorial.ts) use separate canvases.
Preserve separate clocks/effects and explicit targets. Share prepared immutable
asset data where practical, not mutable animation state.

The [existing performance report](../features/performance-follow-up-2026-10-04.md)
records roughly 0.6–1.0 ms median rendering-command time for ordinary gameplay
scenarios on its recorded desktop setup. This is historical CPU submission
evidence, not current GPU timing or proof of Android performance. The subsequent
[paired Canvas/WebGL report](../features/webgl-performance-2026-10-05.md) records
current CPU submission measurements and their limits.

## Target ownership and frame flow

The runtime updates gameplay and presentation once, then supplies a read-only
scene description to the selected renderer:

```text
Gameplay state + cosmetic clocks + layout
                  |
         Presentation frame
     poses / ordered layers / particles / camera / film / lights
                  |
        Canvas or Pixi scene backend
                  |
     Scene colour -> optional post passes -> game canvas
                  |
      Browser composites existing HTML/CSS UI
```

Introduce these responsibilities within the existing rendering ownership; exact
filenames can follow the completed refactors:

| Responsibility          | Contract                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| Scene frame builder     | Translates runtime state into poses, placements, ordered effects and preferences |
| Renderer backend        | Prepare assets, resize, render a supplied frame, capture if needed, dispose      |
| Asset/material registry | Atlas frames, anchors, colour/normal/mask pairing, bounded resource lifetime     |
| Figure renderer         | Transforms existing pose/part data into sprite or mesh draws                     |
| Ambient adapter         | Consumes leaf/debris instances independent of their former drawing API           |
| Film pipeline           | Explicit ordered shader passes and their temporary render targets                |
| Lighting layer          | Material defaults, bounded light inputs and shared coordinate conventions        |

Do not recreate the whole Canvas API as a compatibility layer. Keep a small
scene-oriented contract and migrate renderer families behind it. Avoid rebuilding
all Pixi objects every frame: reuse containers, geometry, buffers and materials;
update only their changing data. Batch compatible adjacent draws without
reordering transparent objects across the existing composition.

The frame contract must distinguish raw presentation time, slowed simulation
time and preview time. Rendering cannot consume gameplay RNG, advance combat,
spawn effects, trigger haptics or mutate saves. Cosmetic randomness needed for a
frame is prepared once, so comparison rendering does not double-update it.
Preserve reduced-motion/flashes handling and snapshot-menu suspension; use the
existing scheduler rather than an additional always-running Pixi ticker.

## Leaves and debris: parallel refactor boundary

The other agent owns the active leaves/debris implementation. Do not rewrite,
rename or freeze its current functions as part of this plan. Reconcile its final
catalog, renderer and settings before implementing the ambient adapter. It may
finish with traditional HTML/DOM rendering, an atlas, or another existing draw
path. All are acceptable starting points; migration effort differs.

The durable integration contract is the information describing a decorative
instance, not its current output element:

- Visual ID or atlas frame, anchor, dimensions and optional tint.
- Position in documented logical coordinates, scale, rotation and opacity.
- Back/front layer and optional logical depth; preserve interleaving with figures.
- Lifetime/age, animation phase, variant seed and any flip/frame selection.
- Ownership of movement, spawning, density limits, pause and reduced-motion policy.

Reuse the finished simulation and catalog where they provide these values. If
the final refactor encodes movement entirely in CSS animations, extract equivalent
time/transform data once; do not read DOM layout or computed styles every frame
to reconstruct it. Choose one update owner and one visible draw path per effect.

| Refactor result       | Pixi migration                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Sprite atlas          | Reuse image, frame rectangles, trim/pivot metadata and animation selection; create Pixi textures                         |
| Procedural Canvas art | Bake stable shapes to small textures during preparation, or use reusable geometry for shapes that truly change           |
| HTML/CSS elements     | Preserve visual/motion definitions; express transforms in the ambient frame and recreate artwork as textures or geometry |

DOM decoration can remain temporarily during a prototype, but cannot participate
directly in Pixi scene lighting, depth or film passes. It also cannot interleave
arbitrarily inside a single game canvas. The completed migration brings scene
leaves/debris into Pixi; menu-only decoration remains UI. No per-frame DOM
rasterization or screenshots are part of the design.

Normal maps are optional for these assets. Begin with unlit or simply lit
decoration; add normals only if the visual gain justifies the asset and texture
cost. Atlas padding must prevent neighbouring frame bleed. Normal maps must use
the same frame transforms, including mirrored or flattened tumbling leaves.

## Art and material pipeline

Keep original colour textures and stable equipment/asset IDs. Add metadata for
optional normal and material textures, plus an unlit fallback. Reuse the colour
atlas layout for auxiliary maps, or explicitly describe alternate UV mappings;
trimmed frames and pivots must align exactly.

Define conventions before producing maps: logical X/Y axes, normal-map Y sign,
normal space, light Z units, scene depth range and material-channel meanings.
Treat normals and masks as linear data, not sRGB colour. Handle premultiplied
alpha consistently, normalize decoded normals, and test transparent borders.
Rotate and mirror normals with their sprite parts; account correctly for
non-uniform transforms rather than rotating only the colour image.

Author broad surface forms with restrained response. Existing ink shading is
baked into colour artwork; converting brightness directly into normals would
interpret dark brushwork as grooves. Maintain strong ambient illumination and
limit specular response to selected surfaces. Preserve attack colours and glyph
contrast under the darkest and brightest allowed lighting.

First art sample: a rock, a robe/body part and a blade, with flat-normal/unlit
fallbacks beside authored maps. Compare under a moving light before commissioning
whole atlases. Asset notes record conventions and repository-relative provenance
according to [character art](../features/character-art.md) and
[environment assets](../features/environment-asset-library.md).

## Lighting, depth and post-processing

### First lighting implementation

Use forward lighting in a shared sprite/mesh shader: colour + normal + optional
material mask, ambient light, one directional light and a small bounded set of
local lights. Start the prototype with one local light. Express sprite positions,
normals and lights in the same coordinate space so camera shake, scaling and
layout changes do not detach illumination from artwork.

This avoids requiring full-scene normal/depth buffers just to light a few assets.
Keep unlit materials available for delicate artwork and readability-sensitive
markers. Match the current film treatment of markers first; any change to their
placement relative to post-processing is an explicit visual design change.

### Depth-aware effects

Start with authored layer depth and existing figure placement. Use it directly
for fog and attenuation. If a later effect needs screen-space depth, render an
explicit depth-data texture with a documented encoding, or use a verified
sampleable depth attachment. Logical depth need not change sprite draw order.

Opaque/cutout objects can use depth tests where useful, with alpha coverage
handled deliberately. Smoke, mist, feathered ink and translucent particles still
need ordered blending. A single nearest depth/normal cannot describe multiple
transparent layers; do not apply a general deferred solution blindly to them.

### Later extensions

Consider separate colour/normal/material/depth buffers only when a demonstrated
effect or larger light count needs them. This increases memory, bandwidth and
transparency complexity. Height-aware shadows require additional occlusion data
and algorithms; they are a separate milestone, not a free consequence of normals.

Port films into an explicit pass order. Combine compatible grading, grain and
vignette work where parity permits. Use separate source/destination targets for
distortion or feedback; never sample from the texture currently being written.
Canvas `color`, `overlay`, `soft-light` and sequential glitch copies need reference
comparisons rather than assumed equivalence to a Pixi blend mode.

## Implementation phases and exit criteria

| Phase                       | Deliverable                                                                                                                    | Exit criterion                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 0. Reconcile and specify    | Inspect completed ambient refactor; inventory surfaces, blends, clocks and assets; select pinned Pixi release                  | Agreed frame/ambient contracts, representative visual references and no duplicated refactor work |
| 1. Extract boundary         | Move render-side updates into presentation update; wrap existing Canvas backend; add backend selection before context creation | Existing appearance/timing, preview isolation and lifecycle checks pass                          |
| 2. Pixi vertical slice      | One stage, animated player/enemies, migrated leaves/debris, foreground ordering and one demanding film                         | Playable portrait/landscape comparison; UI unchanged; no full-scene Canvas upload each frame     |
| 3. Lighting sample          | Rock, robe and blade normal maps; bounded moving light; logical depth fog                                                      | Art review accepts ink appearance; rotation/flip and accessibility cases pass                    |
| 4. Complete renderer parity | All stages, Demon realm, equipment, deaths, weather, glyphs, films, tutorial and previews                                      | Representative matrix passes; no missing assets or broken layer/blend semantics                  |
| 5. Harden and roll out      | Device checks, context recovery, quality limits, capture integration where present, release documentation                      | Production checks pass; unsupported-device behavior is tested; rollout scope is explicit         |
| 6. Optional richer effects  | Selected additional normal maps, depth effects, shadows or extra lighting passes                                               | Each feature justified independently by art acceptance and device cost                           |

Phases 2 and 3 are the bounded proof of concept. Keep the Canvas backend as a
comparison and fallback during migration; decide its long-term maintenance or
retirement only after device coverage is established. Full scene parity is a
larger project than the sample: procedural effects, blend matching and auxiliary
surfaces are likely to dominate effort. Estimate implementation batches after
the sample reveals those costs rather than promising a fixed schedule now.

## Lifecycle, compatibility and resource policy

- Choose a backend before acquiring a canvas context. A canvas already holding
  a 2D context cannot simply become WebGL. Backend switching/fallback replaces
  the surface and rebinds input/resize ownership through the runtime.
- If WebGL initialization fails, use the retained Canvas backend without
  changing saves. Context loss pauses scene interaction safely; rebuild GPU
  resources on restoration and show the existing pause/resume flow. Fall back
  after unsuccessful restoration rather than silently resetting a run.
- Preserve startup image decoding and retry behavior. Prepare GPU textures and
  shader variants before first use where practical; lazy-load stage material
  maps without exposing half-prepared frames.
- Retain the current DPR cap initially. Bound texture caches and render-target
  sizes; dispose stage-specific resources, materials and temporary targets.
  Decoded assets may be shared, but GPU allocations are context-specific.
- Keep preview state isolated. Begin with a bounded number of explicit render
  surfaces and document ownership; avoid one WebGL context per equipment tile.
  If context sharing is later needed, design it deliberately rather than adding
  repeated GPU readback/copying to each preview frame.
- Preserve frame suspension, paused snapshots and resize invalidation. Repaint
  snapshots after a real resize or context restore without advancing gameplay.
- Audit actual screenshot/export consumers before changing capture. Capture
  a completed frame on demand; do not enable permanent drawing-buffer
  preservation or synchronous readback every frame as a convenience.

## Verification and performance evidence

Documentation-only planning needs link/evidence checks, not game test execution.
For implementation, follow [local development](../development/local-development.md):
strict TypeScript checks and focused unit/browser cases during iteration, broader
browser coverage for shared runtime changes, and production checks for startup,
bundling and release. `test:production` already builds and type-checks.

Tests should verify observable contracts, not merely whether a new class exists:

- Rendering a prepared frame twice does not advance state, trigger haptics or
  alter gameplay RNG; preview rendering cannot mutate the live run.
- Pause, hit-stop, slow motion, resume, hidden-tab suspension and snapshot menus
  preserve current timing. Real resize/DPR changes update targets and layout.
- Atlas anchors, tint/fog, flipped/rotated normals, alpha borders, blend modes,
  front/back leaves, death fragments, foreground occlusion and film ordering match
  selected references at fixed presentation time and seed.
- All equipment/material fallbacks draw; missing optional maps do not prevent a
  scene loading. Required asset failures follow the startup retry contract.
- Reduced motion/flashes and density settings work on both backends. Attack cues
  remain legible under light/film combinations.
- Repeated open/close, stage switches, disposal/remount and context loss/restore
  do not leave stale renderers or invalidate shared assets.
- Check portrait/landscape, previews and tutorial on browser and actual target
  Android WebView; browser emulation alone is not device validation.

Store disposable references, screenshots, logs and results under ignored `tmp/`;
use Playwright `testInfo.outputPath(...)`. Existing Canvas-specific state tests
remain useful for the fallback but do not prove Pixi visual parity. Add
backend-independent behavior checks and tolerant visual comparisons where needed.

Performance improvement is a hypothesis. Batching sprites and replacing repeated
Canvas compositing may reduce CPU work; normal maps, lights, transparent overdraw
and additional render targets add GPU and memory cost. Follow [WebGL best
practices][webgl-practices], especially batching and limiting texture uploads.

Performance testing remains opt-in under repository policy. This plan does not
authorize running or adding benchmarks automatically. When separately requested,
reuse and incrementally extend the [existing harness](../../tests/performance/README.md):
capture matched Canvas, unlit Pixi and lit Pixi runs at identical DPR, scene,
density and cadence. Compare ordinary combat, demanding films, dense decoration,
stage changes and previews. Report frame pacing, CPU submission, upload/draw
counts and memory estimates separately from any supported GPU timing. A 60 fps
cap can conceal headroom gains; neither desktop command time nor draw-call counts
alone demonstrate mobile battery or GPU improvement. Do not claim a speedup
without measured evidence.

## Decisions to settle during the prototype

1. Final leaves/debris adapter after the concurrent refactor finishes.
2. Exact Pixi release, required WebGL capabilities and supported device matrix.
3. Material conventions, first authored normal maps and acceptable lighting range.
4. Light count and quality limits; whether depth fog needs a screen-space texture.
5. Preview context/resource strategy and long-term Canvas fallback support.
6. Which visual differences are acceptable versus parity regressions.

These do not block documenting the architecture. Resolve them in phases 0–3 and
record the outcomes before broad migration. Update implemented architecture only
as code lands. Implementation releases follow the repository release skill,
SemVer and changelog rules; this planning document makes no version change.

[pixi-mesh]: https://pixijs.com/8.x/guides/components/scene-objects/mesh
[pixi-state]: https://pixijs.download/release/docs/rendering.State.html
[pixi-target]: https://pixijs.download/release/docs/rendering.RenderTarget.html
[pixi-lights]: https://github.com/pixijs-userland/lights
[webgl-practices]: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
