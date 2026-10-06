# Issen repository guidance

Use [docs/index.md](docs/index.md) when unfamiliar with the repository.

Before starting a future work request, read
[current development status](current-development-status.md). While its status is
paused, briefly tell the user that the asset pipeline migration, performance
validation and lit-only integration are unfinished and saved in that document.
Do not resume that work or its benchmarks automatically; continue it only when
the user asks. This notice does not block unrelated requested work. Update the
handoff when the paused work resumes or finishes.

- For ownership or feature placement, read [implemented architecture](docs/architecture/overview.md).
- For commands and verification, read [local development](docs/development/local-development.md).
- For feature batches and branch preview releases, use [release feature sets](.agents/skills/release-feature-sets/SKILL.md).
- For symbols, emblems and menu illustrations, follow [calligraphic symbol art](docs/features/symbol-art.md): use bold brush strokes like the main Issen logo.
- For player-facing menus and feature copy, use [player presentation](.agents/skills/player-presentation/SKILL.md): prefer concise labels and visual states.
- For PBR material generation, use `scripts/pbr/cli.mjs` with the JSON material presets; follow the [PBR tool instructions](scripts/pbr/README.md). Keep trial exports under ignored `tmp/` and review the maps before integrating assets.
- Keep the [asset and PBR inventory](docs/features/asset-pbr-inventory.md) concise and current when assets, presets or renderer coverage change.
- The [migration plan](docs/architecture/typescript-migration.md) includes a historical proposal; verify actual files before relying on that tree.

Keep gameplay rules and data in their owning modules; connect presentation and
transitions through the runtime. Pass explicit canvases to renderers and keep
preview effects independent of live gameplay. Preserve `issen.*` save compatibility.

Use repository-relative paths and links for file references in committed content.
Do not record personal device details, absolute filesystem paths, or locations of
files stored outside the repository. Asset notes may retain generation provenance,
dates, tools, repository style references, prompts and validation details; omit
external original-output locations and filenames. Keep machine-specific settings
in environment variables or ignored local configuration.

Use strict TypeScript checks and the unit/browser tests relevant to an implementation
change. During iteration, target the affected test files or cases; do not run the
full browser or production suite after every small edit. Run broader checks when
shared runtime behavior changes, before release, or when focused checks reveal a
regression. Playwright uses two workers by default; use `--workers=1` only when
diagnosing timing-sensitive failures. `test:production` already builds and
type-checks, so avoid repeating those checks immediately beforehand. Update the
affected documentation when ownership or behavior changes.

Performance testing and profiling are opt-in: develop or run performance suites,
benchmarks, CPU/memory/graphics profiles, emulator/device performance captures,
or performance optimization investigations only when the user specifically asks.
Do not include them in routine verification, CI, or release checks by default.
When requested, reuse and incrementally extend the tools in
[tests/performance](tests/performance/README.md), record a repeatable baseline,
and use the measurements to guide fixes. This does not replace the ordinary
TypeScript, unit, and browser checks required for implementation changes.

Keep disposable verification builds, captures, logs and test results under ignored
`tmp/` (for example `tmp/.verification-build-<task>/` and `tmp/test-results/`).
Use `npm run build:verification` for a checked production verification build;
Playwright configs write results into `tmp/test-results/<suite>/`, and screenshots
should use `testInfo.outputPath(...)`. Do not edit generated `dist/` files or clear
real player saves for testing.

When implementing an approved feature plan, increase the app's SemVer version
appropriately (minor for new features, patch for fixes, major for breaking changes).
Keep `package.json`, `package-lock.json`, and the title-screen version in sync.
For every implementation change, add concise player-facing release notes to
`public/changelog/index.html` under the matching version. See
[changelog maintenance](docs/features/changelog.md) for update-indicator behavior.
Planning-only documents do not bump the version.
