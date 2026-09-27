---
name: repo-knowledge-maintainer
description: Create, audit, and maintain Issen's repository knowledge, including architecture, gameplay rules, development guidance, ADRs, and AGENTS.md navigation. Use for documentation setup, drift audits, or documentation updates accompanying meaningful code changes.
---

# Repo Knowledge Maintainer

Keep Issen's repository knowledge concise, navigable, and grounded in the code.

Code is evidence. Documentation is the map. `AGENTS.md` is the navigation system.

## Evidence and scope

- Treat executable code and observed behavior as evidence; do not invent architecture, intent, or guarantees.
- Inspect only the files and code paths relevant to the documentation task. Expand the search when a claim crosses system boundaries or evidence conflicts.
- Distinguish confirmed facts from reasonable inference. Mark unresolved questions instead of presenting guesses as facts.
- Document the implemented vanilla DOM/Canvas game and its current toolchain; do not introduce frameworks or refactor application code as a side effect of documentation work.
- Match the requested mode: an audit reports findings without editing; setup creates the smallest useful knowledge structure; maintenance updates only knowledge affected by the requested change. Skill invocation does not authorize unrelated implementation work.

## Repository model

- Root `index.html` loads `src/main.ts` through Vite. Startup mounts screen templates before starting the game.
- All application modules under `src/` are TypeScript. `src/game.ts` composes services and owns remaining encounter/presentation orchestration. Trace current imports to establish ownership rather than assuming proposed modules exist.
- `src/ui/` owns markup and screen controllers; `src/styles/` owns shared styles; gameplay, rendering, audio, input and browser adapters have separate folders as they are extracted.
- Root `index.html` is the only app entry. `src/styles/index.css` defines CSS import order. Legacy combined HTML/CSS references have been removed; `dist/` is generated output, not an editing target.
- `README.md` is the human-facing entry point and quick-start guide.
- Browser persistence uses `localStorage` keys beginning with `issen.`.

Use `docs/index.md` to find existing documentation and `docs/architecture/overview.md` for implemented ownership. The migration plan at `docs/architecture/typescript-migration.md` retains a historical proposal; it is not an inventory of existing files. Verify claims against source, `package.json`, compiler configuration and tests. Refresh this map when the implementation changes.

## Choose the documentation change

- For repository orientation or a documentation audit, create or maintain `docs/index.md` as the map to deeper documents.
- Put system boundaries, runtime flow, rendering, input, audio, persistence, and component relationships under `docs/architecture/`.
- Put gameplay concepts, rules, state transitions, scoring, progression, unlocks, and invariants under `docs/domain/` or `docs/features/`, choosing the location that best matches the subject.
- Put local serving, debugging, testing, and editing conventions under `docs/development/`.
- Put durable design decisions with meaningful alternatives and consequences under `docs/decisions/` as ADRs. Do not create an ADR for routine implementation detail.
- Update `README.md` only for onboarding facts users need immediately; link to deeper documentation instead of duplicating it.
- If asked to create or revise `AGENTS.md`, keep it short and use it to route agents to relevant documents conditionally.

Create only the directories and documents justified by the task. A small repository does not need an empty enterprise-style documentation tree.

## Workflow

1. Identify the audience and the question the documentation must answer.
2. Locate the implementation evidence using targeted search, then read enough surrounding code to understand boundaries and call flow.
3. Check existing documentation for the same subject and for claims that the new evidence invalidates.
4. Write the smallest useful document in the appropriate location. Prefer stable concepts, invariants, and navigation over exhaustive inventories of functions or line numbers.
5. Link the document from `docs/index.md`, `README.md`, or another natural parent when discoverability would otherwise be poor.
6. Verify every important claim against the implementation. Check relative links and explicitly report code/documentation drift. Keep proposed architecture separate from implemented behavior.

For initial setup, prioritize a short `AGENTS.md`, `docs/index.md`, an implemented architecture overview, and local-development/testing guidance when missing. Add gameplay or feature documents where important rules cannot be inferred safely from those entry points. Inspect existing files first and preserve useful guidance; do not replace them wholesale with a template.

For maintenance after code changes, inspect the affected code paths and update the documents describing their behavior, ownership, or verification. A wording fix or internal refactor with no documented contract change does not require a new document or ADR. Record a decision's rationale only when supported by code comments, existing records, or the user; otherwise identify it as unknown.

## Verification guidance

- Read package scripts before documenting commands. Checks include `npm run typecheck`, `npm run build`, `npm test`, `npm run test:browser`, and `npm run test:production`; browser tests use installed Microsoft Edge through Playwright.
- Check compiler coverage before claiming type safety: application modules are included by `src/**/*.ts`, while tests run through their respective runners. Preserve strict checking and do not describe transpilation alone as type checking.
- Describe what tests actually exercise, not what their names suggest. Distinguish passing results observed during this task from older recorded results and checks not run. Documentation-only changes need link and evidence checks, not an automatic full game test run.
- For persistence documentation, verify key names, defaults, validation and compatibility in the save adapters and their callers. Never clear real player saves to validate documentation.
- For gameplay or rendering changes, trace the relevant state transitions and consumers; examples include timing, modifier composition, viewport geometry and preview isolation. Do not present intended boundaries as existing guarantees.

## Audit output

When the user asks for an audit rather than direct edits, report findings by impact:

- knowledge missing that is likely to cause incorrect changes;
- documentation contradicted by code;
- navigation gaps that make correct information hard to find;
- lower-value opportunities.

For each finding, cite the relevant repository path and propose the smallest corrective document or edit. Do not manufacture a backlog merely to fill categories.

## Writing standard

- Use plain language and descriptive headings.
- Explain why a boundary or invariant matters, not only where code lives.
- Prefer repository-relative links and stable symbol names over fragile line-number references.
- Avoid copied source listings, speculative roadmaps, generic web-development advice, and prose that simply restates filenames.
- Keep code examples short and verify them before including them.

## Completion

Finish when the requested knowledge is accurate, discoverable, internally linked where useful, and proportionate to this repository. Summarize files created or updated, evidence checked, unresolved questions, and any detected drift.
