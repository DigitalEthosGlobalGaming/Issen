# Daily runs and world UI

Version 1.41.0 implements the four requested feature sets.

## Daily run

Draw your blade has a prominent Daily run entry with the UTC date and a compact
blade/outfit/charm preview, followed by custom-run settings. Arrows and Temple
power use native checkbox switches. Mode, difficulty and lives retain their
progression gates and segmented choices; touch actions remain at least 44 pixels.

`src/game/progression/daily.ts` owns the date/seed/preset. FNV-1a hashes
`issen.daily.v1:YYYY-MM-DD`; its RNG chooses free base gear from a fixed catalog.
All remaining equipment slots, Normal Waves, Normal lives and arrows are fixed;
Temple powers and awakened forms are off. No ownership gate changes these presets.
A run keeps its date across midnight, reload and retry. The v1 checkpoint's optional
`dailyDay` is checked against its seed, preserving ordinary save compatibility.

The runtime uses disposable statistics and a separate equipment object, suppresses
ordinary teaching holds, unlocks, awakening challenges and Embers, and keeps daily
records in profile-scoped `issen.daily`. Up to 32 dates retain score/combo/wave maxima.
Personal gear, setup and progression survive daily start, recovery and exit.

## Visual states and disclosure

Armoury unviewed underlines are one pixel; equipped selection stays visible without
a redundant Equipped label. Completed Temple tiles have a diagonal stroke;
unaffordable tiles are muted and affordable tiles use normal ivory text. Stable
completed-last ordering remains unchanged. The share screen, renderer, platform
sharing adapter and result action are removed.

The title links only to privacy. `public/privacy/index.html` links to the separate
`public/ai-disclosure/index.html`, describing AI-assisted development/artwork and
bundled gameplay without live AI requests.

## Materials, crests and death effects

[World UI atlas](../../src/ui/assets/world-ui-atlas.md) contains five grayscale
nine-slice materials, seven calligraphic crests and scroll parts in one packed sheet.
`src/rendering/ui-art.ts` lazily loads the atlas and keeps a bounded tint cache;
Canvas seals use nine-slice drawing and DOM seal surfaces receive tinted image URLs.
Text and timing cues remain independent. Crests replace procedural figure symbols
and appear on Armoury tiles. Material crops are reproducible exports of the same atlas.

[Death effects](death-effects.md) describes Scattered Armour, including real puppet
parts, cosmetic deterministic trajectories and reduced-motion fallback.

## Scroll menus

Options → Display → Menus offers Classic (default) or Scrolls. The validated
`issen.settings.menuStyle` field follows the active player/test profile. Scrolls
hang over the scene using textured paper and rollers, with unroll/roll transitions.
`src/ui/scroll-menus.ts` observes menu visibility; navigation and gameplay callbacks
remain synchronous. Exiting paint is inert and timers/observers clean up on disposal.
Reduced motion retains the artwork and skips transitions; forced colors retains
system borders. Switching back or restoring Display defaults clears pending rolls.

## Presentation guidance

[Player presentation skill](../../.agents/skills/player-presentation/SKILL.md)
keeps feature copy concise and prefers existing visual states to redundant labels.
Runtime ownership remains in gameplay modules and explicit-canvas renderers.
