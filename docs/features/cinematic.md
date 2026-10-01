# Cinematic scene viewer

Version 1.15.0 adds a title-screen scene viewer. Triple-click or triple-tap the
large Issen logo to open it. The focused logo also accepts Enter or Space.

The viewer keeps the background and standing title enemies while hiding the
normal menu and gameplay interface. Swipe left for the next scene or right for
the previous one; the arrow buttons do the same. Keyboard navigation uses the
existing left/right bindings, initially arrows and A/D. Rebind these in
Options → Controls. Scene navigation wraps around the stage list.

Exit is in the top-right corner. Escape or the configured pause key also exits.
The active viewer, selected scene, artwork, and film are stored in sessionStorage, so a refresh
in the same tab restores them. Exiting clears that session preference. Storage
failure does not prevent browsing.

Artwork and Film selectors compare the available rendering modes and owned film
looks without changing saved equipment or artwork preferences. Later Ink stages
still use the existing prototype art; scene browsing does not create new stage
assets.

## Ownership and isolation

The UI, input interception, and session preference belong to
src/ui/screens/cinematic.ts and cinematic.css. The runtime in src/game.ts connects
them to existing scene composition, with presentation-only scene rebuilding.
The viewer runs from title state and does not start encounters. Saved-run
checkpoints remain available through Continue after leaving the viewer.

Focused interaction coverage lives in tests/browser/cinematic.spec.ts. Use the
active worktree's dev server when checking the feature; a server from another
checkout will not contain these changes.
