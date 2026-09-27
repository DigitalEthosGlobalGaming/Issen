# Issen repository guidance

Use [docs/index.md](docs/index.md) when unfamiliar with the repository.

- For ownership or feature placement, read [implemented architecture](docs/architecture/overview.md).
- For commands and verification, read [local development](docs/development/local-development.md).
- The [migration plan](docs/architecture/typescript-migration.md) includes a historical proposal; verify actual files before relying on that tree.

Keep gameplay rules and data in their owning modules; connect presentation and
transitions through the runtime. Pass explicit canvases to renderers and keep
preview effects independent of live gameplay. Preserve `issen.*` save compatibility.

Use strict TypeScript checks and relevant tests for implementation changes. Update
the affected documentation when ownership or behavior changes. Do not edit generated
`dist/` files or clear real player saves for testing.
