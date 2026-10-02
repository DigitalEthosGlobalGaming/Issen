# Cinematic scene viewer

Version 1.15.0 adds a title-screen scene viewer. Triple-click or triple-tap the
large Issen logo to open it. The focused logo also accepts Enter or Space.

The viewer keeps the background and standing title enemies while hiding the
normal menu and gameplay interface. Swipe left for the next scene or right for
the previous one; the arrow buttons do the same. Keyboard navigation uses the
existing left/right bindings, initially arrows and A/D. Rebind these in
Options → Controls. Scene navigation wraps around the stage list.

Exit is in the top-right corner. Escape or the configured pause key also exits.
The active viewer, selected scene and film are stored in sessionStorage, so a refresh
in the same tab restores them. Exiting clears that session preference. Storage
failure does not prevent browsing.

The Film selector previews owned film looks without changing saved equipment.
The nine ordinary scenes use layered Ink artwork; Demon is a tenth scene composed from independent realm atlas parts. The former Artwork selector and
backtick rendering shortcut are removed; older session artwork fields are ignored.

## Ownership and isolation

The UI, input interception, and session preference belong to
src/ui/screens/cinematic.ts and cinematic.css. The runtime in src/game.ts connects
them to existing scene composition, with presentation-only scene rebuilding.
The viewer runs from title state and does not start encounters. Saved-run
checkpoints remain available through Continue after leaving the viewer.

Focused interaction coverage lives in tests/browser/cinematic.spec.ts. Use the
active worktree's dev server when checking the feature; a server from another
checkout will not contain these changes.

# Cinematic discovery reward

Browsing scenes refreshes both large midground landmarks and the standing
enemy lineup. Those cosmetic visit choices remain stable during resize and
film changes. They use presentation randomness, leaving combat RNG and saved
checkpoints unchanged. Exiting restores the title's original stage and scene
variation seed.

Version 1.31.0 adds four silhouettes per landmark family: woodland, snowy
woodland, stones, bamboo and cherry trees. Two landmarks frame each scene at
native aspect, with measured root anchors and fading ground contact. Regular
standing enemies combine three new clothing shapes and four complete heads;
authored bosses retain their own artwork. See the [asset library](environment-asset-library.md)
and [character art contracts](character-art.md) for reuse.

Entering the scene viewer permanently discovers the cosmetic Mystic Rock companion.
It is granted immediately, including session-restored entry, without ending a run.
The `cinematicVisits` profile flag repairs an interrupted ownership write on startup.
The floating sprite follows the player beside their feet and appears in the Armoury;
reduced-motion or reduced-flash settings freeze its gentle bob. It grants no combat
bonus. Scene/film browsing still leaves live gameplay and equipment unchanged.

Scene changes capture the previous canvas and sweep it away with an irregular edge over 650 ms. Reduced motion changes scenes immediately. Navigation remains responsive during a swipe; closing or disposing cancels the overlay. Demon preview uses a separate presentation flag instead of adding a gameplay stage index, preserving checkpoint stage compatibility. Realm layouts vary by preview visit seed; Trial waves vary by trial seed and wave. Resize keeps the layout stable. Short ash-coloured grass covers the Demon scene; it reuses ordinary midground/foreground grass with reduced height and sparser foreground clumps. The stone floor and perspective plates are removed.
