# Initial 2D surface materials

The renderer can light selected 2D artwork without changing its geometry or
silhouette. `src/rendering/surface-maps.ts` prepares three small surface studies:
cloth folds, broad rock facets and a steel bevel. These are hand-specified
procedural forms, authored on 5 October 2026. They do not derive height from
colour brightness: dark brush strokes remain painted marks.

The colour images remain the existing player torso, foreground boulder atlas and
steel blade atlas. See [character art](character-art.md) and the
[environment asset library](environment-asset-library.md) for their provenance.
The cloth study remains on non-Sumi torso parts; steel and rock are samples
for reviewing future integration. Live modular blades and Sumi now use
[PBR Forge atlas maps](sword-lighting.md). Existing cached environment
layers retain their painted atmospheric treatment.

## Conventions

- Normal RGB encodes normalized XYZ from `[-1, 1]` to `[0, 1]`. X points right,
  Y points down, Z toward the viewer. A flat normal is approximately `(128,128,255)`.
- Material RGB encodes specular strength, gloss and emission. Cloth and rock
  remain matte. Steel's restrained specular response is limited to the selected blade.
- Auxiliary maps are opaque linear data. Colour alpha controls final coverage;
  decoded maps are normalized and premultiplied data is handled explicitly.
- The 128-square study maps cover the selected colour frame's normalized UVs.
  Future atlas maps can instead provide an explicit frame rectangle. Colour,
  normal and mask rectangles must describe the same visible part and padding.
- Light XY uses the renderer target's coordinates (backing pixels in the live
  painter). Transform logical camera coordinates by DPR/camera transforms before
  submitting point lights. Z, radius and material depth use those same units.
  Positive material depth is away from the viewer; positive light Z is toward it.
- Normal orientation follows the complete sprite transform, including mirroring
  and nonuniform scale. Transparent objects retain explicit painter order.

Use `drawMaterialStamp` for selected material draws and `setSceneLighting` for
ambient, directional and up to four local lights. The Canvas fallback draws the
colour image. Missing optional maps can be omitted: a lit flat normal or unlit
material remains valid. Do not make optional material art a startup dependency.

## Review and extension

The material study in `tests/browser/pixi-scenes.spec.ts` draws all three assets
with unlit, left-light, right-light and depth-fog variants and captures a review
sheet through Playwright's normal artifact output. The shader contract tests in
`pixi-backend.spec.ts` separately check mirrored normals and alpha coverage.

Review new maps beside unlit artwork before extending them to whole atlases.
Keep ambient illumination high and attack glyphs outside material lighting.
Normal maps do not create cast shadows, local height occlusion or a screen-space
depth buffer. Those remain separate extensions described in the
[migration plan](../architecture/pixijs-migration-plan.md).

No performance improvement is claimed. Bounded light counts and small maps limit
the initial scope; they do not replace separately requested device measurements.
