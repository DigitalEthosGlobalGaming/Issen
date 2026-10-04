---
name: release-feature-sets
description: Implement and validate coherent feature batches on a chosen working branch, with branch preview deployments and release notes. Use for feature-set development or an explicitly requested release; a preview deployment does not imply production promotion.
---

# Release Feature Sets

Treat requested changes as independently reviewable feature sets. Follow the repository's AGENTS.md, ownership guidance, tests and release conventions.

## Choose the working branch

Inspect the current branch, worktree changes, remotes, build scripts, workflows and configured targets before editing. Preserve unrelated work.

- Use a branch explicitly selected by the user. Otherwise continue on the current non-production source branch; do not move existing work to `develop` automatically.
- If starting on production (`main` in Issen), use `develop` for ordinary integration unless the user selects another branch. Create a missing branch from the intended base without resetting or discarding work. For complex experiments, use the user's selected feature branch.
- With a detached HEAD, resolve the intended source branch before committing or pushing. Never use `gh-pages` as a source branch: it stores generated deployment snapshots.
- Keep every feature set on the selected branch until the user asks for a different integration target. Do not merge experimental branches into `develop` or `main` by default.

For Issen, read [local development](../../../docs/development/local-development.md) for Pages commands, naming, environment requirements and verification. Other repositories should use their own established topology and build commands.

## Determine feature sets and targets

Honor explicit `Feature Set` sections as boundaries. Otherwise group the requested changes into coherent batches that can be implemented and checked independently. Make routine engineering choices without inserting an approval checkpoint unless requested.

Detect supported platforms from repository evidence. Build or release the targets relevant to the request; platform configuration alone does not authorize publishing to a store or deploying production.

## Execute each feature set

1. Implement the complete feature set on the selected branch, including required documentation, version metadata and concise player-facing release notes.
2. Run checks proportionate to the changed surface: strict type checking, relevant unit/browser tests and the affected build. Follow repository requirements; do not rerun the full regression suite after every small edit.
3. Diagnose ordinary failures and rerun affected checks until they pass or a concrete external blocker remains.
4. When the user requested commits/publishing or an autonomous release workflow, commit each completed set as a logical change, excluding unrelated work, and push the selected source branch when authorized. Otherwise leave changes reviewable in the worktree.
5. For an authorized preview deployment, use that branch's deployment process and verify CI and the published URL. Capture release-note material and continue to the next set without waiting for manual testing unless the user requested a checkpoint.

In Issen, `npm run build:branch` detects the current branch and builds its Pages path. `npm run build:branch -- --branch <name>` selects an explicit target, including detached CI checkouts. `npm run build:develop` is a convenience command only. Pushes to source branches with the updated Pages workflow publish previews; `main` publishes production. A successful local build is not evidence of a live deployment.

## Temporary verification artifacts

In Issen, keep disposable builds, screenshots, logs and reports under ignored
`tmp/`, never in repository-root `.verification*` or test-results folders.
Use `npm run build:verification` or `npm run test:production` for the default
`tmp/.verification-build-production/` build. For a named build, set
`ISSEN_PREVIEW_DIR=tmp/.verification-build-<task>` for both build and preview/test
commands. Branch preview checks use
`npm run build:branch -- --outDir tmp/.verification-build-pages`. Playwright
configs write results to `tmp/test-results/<suite>/`; test captures use
`testInfo.outputPath(...)`. Put optional HTML/blob/coverage reports under `tmp/`
as well. Keep deployment outputs in their established locations.

## Finish or promote

After all sets pass, report the selected branch, changes, checks and preview status. If production release was explicitly requested, perform the repository's full release validation, builds for the requested release targets, release notes/version synchronization and promotion to the designated production branch. Otherwise stop with the feature branch ready for review/testing.

Respect user controls on platforms, testing intensity, checkpoints, pushing and deployment. Escalate only concrete blockers such as missing credentials, unavailable services or an unresolved product decision. Explain the attempted action and smallest next step. Never claim a commit, push, build, merge, test or deployment succeeded without confirming evidence.
