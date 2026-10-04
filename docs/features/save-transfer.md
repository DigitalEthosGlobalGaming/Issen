# Save transfer

Options → Profile Management offers Download save, Import save and Previous backup. A versioned JSON
envelope records the app version and profile type; raw legacy `issen.*` maps are
also accepted. Downloads contain only the active player or testing profile.

Imports merge progression by maxima and earned IDs by union, never by addition.
Existing parsers migrate Temple and Awakening records. Trial rewards, ordinary
unlock predicates and the cinematic companion are reconciled after recovery.
Equipment and settings follow the imported selection after validation. Missing
or damaged sections retain local progress. Unknown sections and reward IDs are
archived for later exports rather than equipped as unavailable content. The
archive retains unfamiliar nested arrays and their original values; progression
merge rules apply only to understood progress records.

The confirmation shows recovered progress and warnings and offers a current
backup download. Every successful import also stores a Previous backup locally.
`platform/storage.ts` journals original raw values before writing, verifies each
write, rolls back failures, and recovers interrupted writes before startup reads.
Runtime writes are blocked until reload replaces the old profile objects.

Checkpoints are validated separately; incompatible runs are dropped without
discarding permanent progress. Compatible imported checkpoint profile snapshots
use the merged progression so startup cannot rewind earned rewards.

Main and branch Pages previews share an origin and browser storage. Files allow
transfer to another device, browser or origin. An older deployment without profile
export needs this feature deployed there, or export through an updated preview
on the same origin. This feature does not enable paid access through an import.

Verification: `tests/unit/save-transfer.test.mjs`, transaction/recovery checks in
`tests/unit/storage.test.mjs`, and `tests/browser/save-transfer.spec.ts`.

Named player profiles use `issen.profile.<id>.*`; the original Player retains
`issen.*` and Testing retains `issen.testing.*`. The registry and active selector
are device-local and excluded from downloads. New profiles start empty; changing
profiles reloads the runtime. Rename preserves IDs and saves. Deleting a named
profile returns to Player; resetting Player or Testing clears only its progress.
