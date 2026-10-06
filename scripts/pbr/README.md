# PBR Forge CLI

The entry point is `cli.mjs`. Browser automation and control mappings live under
`pbr-forge/`. Material presets live in `presets/*.pbr.json`; they are data, not
JavaScript. The CLI opens PBR Forge through Playwright, loads each source image,
applies the selected preset and downloads its material pack.

## Quick start

Requires Node.js 22.12 or newer, the repository's installed dependencies, Microsoft
Edge, Python 3 with Pillow, and internet access to load PBR Forge. Set `PBR_PYTHON`
to the Python executable when it is not available as `python`.
Install dependencies once with `npm ci`
from the repository root if they are not already installed. Use `--channel chrome`
for installed Chrome or `--headed` to watch the browser.

1. Choose a source image or put images using the same material into one folder.
2. Pick a preset using `--list-presets` or the material descriptions below.
3. Use `--mode sprite` for transparent props and character atlases, or
   `--mode texture` for opaque surface textures. This overrides the preset's mode.
4. Run the CLI, then extract the ZIP and inspect the maps before integrating them.

From the repository root:

```powershell
node scripts/pbr/cli.mjs --input src/rendering/figures/assets/player-ronin-simple.png --output tmp/pbr/sumi --preset cloth
node scripts/pbr/cli.mjs --input tmp/my-images --output tmp/pbr/batch --preset metal
node scripts/pbr/cli.mjs --input tmp/my-images --output tmp/pbr/wood --preset wood
node scripts/pbr/cli.mjs --input tmp/my-images --output tmp/pbr/custom --preset scripts/pbr/presets/my-cloth.pbr.json
node scripts/pbr/cli.mjs --list-presets
node scripts/pbr/cli.mjs --help
```

For example, generate and extract a cloth pack:

```powershell
node scripts/pbr/cli.mjs --input src/rendering/figures/assets/player-ronin-simple.png --output tmp/pbr/sumi --preset cloth --mode sprite
Expand-Archive -LiteralPath tmp/pbr/sumi/player-ronin-simple.png_cloth_pbr_pack.zip -DestinationPath tmp/pbr/sumi/maps -Force
```

Quote paths containing spaces. Choose the preset for the dominant material in an
image; one invocation applies one preset to the entire image or batch. Split
different materials into separate inputs when they need different settings.

## CLI options and outputs

| Option                         | Purpose                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| `--input PATH`                 | Required source image or folder                                    |
| `--output PATH`                | Required export folder, created if needed                          |
| `--preset NAME_OR_FILE`        | Built-in name or custom JSON path; defaults to `default`           |
| `--mode auto\|sprite\|texture` | Override mode; `auto` lets PBR Forge choose                        |
| `--engine opengl\|directx`     | Override the normal-map convention; presets use OpenGL             |
| `--force`                      | Regenerate an existing matching export                             |
| `--headed`                     | Show browser automation                                            |
| `--channel NAME`               | Browser channel; defaults to `msedge`, supports installed `chrome` |
| `--list-presets`               | List available built-in presets                                    |
| `--help`                       | Show command usage                                                 |

Input accepts one PNG/JPG/JPEG/WebP or a folder of those images. Folder processing
is non-recursive and sorted. Each source gets a separate ZIP and `.zip.json`
manifest containing the requested preset, applied settings, actual processing
mode and source/configuration hashes. Source filenames retain their extensions
in output names to distinguish `texture.png` from `texture.jpg`.

Matching completed outputs skip automatically. Editing a preset or source image
regenerates its export. `--force` regenerates even matching outputs. Downloads
use temporary files and replace completed ZIPs only after a successful download.
Failures do not stop the remaining files and cause exit code 1. Exit code 0 means
every file was converted or skipped successfully. A failure screenshot is retained
when the browser can capture one.

The CLI exports into the requested folder. It does not install maps, change game
assets, edit shader settings or write player saves.

After export, `map_cleanup.py` removes zero-emission images and safely constant
roughness/metallic/AO images from the ZIP. The manifest records exact replacements
in `omittedMaps`; zero scalar values retain their material meaning. Matching cached
exports receive the same cleanup without launching Forge again. Nonzero emission
and varying scalar data remain stored. Diffuse and normal images remain intact.

The ZIP contains the nonredundant maps produced for the selected mode. Review
normal strength, roughness and metallic response with lighting before copying
the needed maps into the owning asset directory. The adjacent manifest records
the settings used, including Sprite-only controls skipped in Texture mode.

If conversion fails, check the printed `FAIL` message and any `.failure.png`
beside the export. Confirm the browser is installed, dependencies are available
and PBR Forge is reachable. Retry with `--headed` to inspect the website. Rerun
the same batch to retry failed images while skipping completed matching exports.

## Inventory pack generation

The [asset pack catalog](asset-packs.json) records the inventory's 80 previously
missing raster packs, their presets, processing modes and installation folders.
It includes retained sources and UI references. It does not change renderer
coverage. Existing blade, Sumi and enemy packs are kept separately.

```powershell
node scripts/pbr/generate-packs.mjs
node scripts/pbr/generate-packs.mjs --source outfit-headwear-atlas
node scripts/pbr/generate-packs.mjs --force
```

The generator uses the same CLI conversion pipeline, reuses one browser, and
exports ZIPs/manifests under ignored `tmp/pbr-inventory/`. Matching exports skip.
The optional `--source` substring selects catalog source paths. For mixed sheets,
every preset needed by the catalog's frame compositions is exported.

Install the validated six-map packs with Python 3 and Pillow available:

```powershell
python scripts/pbr/install-packs.py
```

Installation also runs `pack-surfaces.mjs` using the installed Playwright browser
(Edge by default; `PBR_BROWSER_CHANNEL` can override it). Each `_surface.png`
packs roughness, metallic and AO into RGB with opaque alpha. The tool verifies
every pixel against the former browser packing path. The six exported maps remain
available for editing; runtime owners load the packed surface instead of decoding
and combining three scalar maps during scene changes.

Installation accepts omission metadata, reconstructs constants transiently for
mixed-material compositions, classifies the final maps again, and deletes stale
redundant installed PNGs. It writes per-family `*.material.json` metadata and
regenerates the runtime catalog. `pack-surfaces.mjs` bakes omitted scalar constants
directly into the surface channels. Missing files without omission metadata fail.

To apply the same policy to existing installed catalog packs:

```powershell
python scripts/pbr/clean-installed.py
node scripts/pbr/update-runtime-catalog.mjs
```

The cleanup report stays under ignored `tmp/pbr-inventory/`. Cleanup restricts
deletion to catalogued generated map files; original colour artwork is retained.

To refresh packed textures after manually editing any scalar map:

```powershell
node scripts/pbr/pack-surfaces.mjs
node scripts/pbr/update-runtime-catalog.mjs
```

The installer checks source hashes, ZIP checksums, dimensions, diffuse alpha,
applied settings, processing mode and normal convention before installing each
pack. Catalog frame compositions are applied to all six maps. Each destination
gets a README and `generation.json` with repository-relative provenance. Failed
jobs are reported and return exit code 1; reports remain under `tmp/`. Installation
adds map files without changing source artwork or connecting renderer lighting.
Remaining mixed sheets use a dominant-material starting point and need visual
review before integration. Atmospheric artwork and UI references are generated
for completeness; a map pack does not make them physical shader surfaces.

## Preset files

Copy a preset and change its `name` and `settings`. Use the built-in name without
the extension, or pass a custom file path. Built-in presets resolve relative to
the CLI, independently of the current directory; custom paths resolve relative
to the working directory. Names use lowercase letters, numbers and hyphens.

```json
{
  "version": 1,
  "name": "my-cloth",
  "description": "Soft cloth lighting",
  "mode": "sprite",
  "engine": "opengl",
  "settings": {
    "normalIntensity": 0.6,
    "roughnessBase": 0.85,
    "metallicOffset": -0.5,
    "metallicContrast": 0,
    "emissiveIntensity": 0
  }
}
```

These are PBR Forge **Engine Settings**, which affect exported maps. Preview
lighting/displacement controls are not exported. Unspecified settings retain
PBR Forge defaults. Unknown fields, unknown settings, out-of-range values and
values outside slider increments fail before a browser launches.

| Setting              | Range    | Increment | Notes                             |
| -------------------- | -------- | --------- | --------------------------------- |
| `normalIntensity`    | 0.1–10   | 0.1       | Lower means gentler normals       |
| `bevelWidth`         | 0–50     | 1         | Sprite mode only                  |
| `bevelHeight`        | 0.1–3    | 0.1       | Sprite mode only                  |
| `detail`             | 0–1      | 0.1       | Sprite mode only                  |
| `smoothing`          | 0–10     | 0.5       | Softens detail                    |
| `roughnessBase`      | 0–1      | 0.05      | Higher means more matte           |
| `roughnessVariation` | 0.1–5    | 0.1       | Texture contribution              |
| `roughnessBlur`      | 0–10     | 0.5       | Map smoothing                     |
| `metallicOffset`     | -0.5–0.5 | 0.05      | Offset, not a metallic percentage |
| `metallicContrast`   | 0–3      | 0.1       | Cloth uses 0 with offset -0.5     |
| `emissiveIntensity`  | 0–5      | 0.1       | 0 disables glow                   |

`cloth` uses gentler normals (0.6), high roughness (0.85), no metal response and
no glow. `metal` uses stronger normals (1.5), lower roughness (0.25) and positive
metallic offset. `stone` uses Texture mode, moderate normals (1.2), roughness
0.8 and no metal response. `wood` uses Texture mode, gentle grain normals (0.8),
matte roughness (0.7), no metal response and no glow. For transparent wooden
props, use `--preset wood --mode sprite`. `default` applies no generation overrides.

Additional material starting points:

| Preset          | Mode    | Normal intensity | Roughness base | Metallic settings (offset / contrast) | Uses                               |
| --------------- | ------- | ---------------- | -------------- | ------------------------------------- | ---------------------------------- |
| `leather`       | Sprite  | 0.7              | 0.75           | -0.5 / 0                              | Belts, boots, grips and straps     |
| `painted-metal` | Sprite  | 1.0              | 0.5            | -0.25 / 0.5                           | Coated armour and painted fittings |
| `bone`          | Sprite  | 0.6              | 0.65           | -0.5 / 0                              | Charms, horns and ornaments        |
| `polished-wood` | Texture | 0.6              | 0.3            | -0.5 / 0                              | Lacquered scabbards and handles    |
| `rusted-metal`  | Texture | 1.6              | 0.8            | -0.1 / 0.6                            | Weathered weapons and fittings     |

All five disable emission. Override the mode to suit the source image, such as
`--preset polished-wood --mode sprite` for a transparent scabbard atlas.
Presets tune maps inferred from the image; they do not add grain, paint chips
or rust patterns. Metallic offset and contrast adjust the inferred map rather
than specifying a fixed metallic percentage or identifying exposed metal.

Modes: `auto`, `sprite`, `texture`. Engines: `opengl`, `directx`.
`--mode` and `--engine` override those preset fields for a single invocation.
Sprite-only controls are omitted in Texture mode and recorded as skipped in
the manifest. Applying roughness settings also ensures roughness output is not
inverted to smoothness. PBR Forge is a live website: controls and unspecified
defaults may change; a preset records selected values rather than pinning the
whole application version.

## Tests

After installing or adding packs, refresh the shader catalog:

```powershell
node scripts/pbr/update-runtime-catalog.mjs
```

The catalog includes the 80 generated inventory packs and six previously installed
packs listed under `installed` in `asset-packs.json`. Those six are catalog
records, not new generation jobs. Open the tilde Lighting panel and choose
Material preview to inspect any pack under the shared light, including retained
source art that is not placed in gameplay.

```powershell
node --test scripts/pbr/tests/cli.test.mjs
```

The focused tests cover JSON loading/validation, individual files, input filtering,
cache invalidation, forced regeneration and continuing after failed conversions.
They use a fake converter and do not require network access. Live verification
on 5 October 2026 exercised Cloth/Sprite, Metal/Sprite through a custom JSON path,
Stone/Texture with a two-image folder, Wood/Texture, archive integrity and matching-output skips.
Leather, Painted Metal and Bone also exported in Sprite mode; Polished Wood and
Rusted Metal exported in Texture mode. All five archives passed integrity checks
and their manifests confirmed that every requested setting was applied.
Those exports remain under ignored `tmp/`; game integration is deferred.
