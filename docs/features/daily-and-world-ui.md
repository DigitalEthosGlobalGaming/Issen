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

Scrolls are the sole menu presentation. Existing Classic or absent preferences
migrate to Scrolls, and Display reset retains them. There is no menu-style selector.
Scrolls hang over the scene using textured paper and rollers, with unroll/roll
transitions. Navigation and gameplay callbacks stay synchronous. Exiting paint
is inert and timers/observers clean up on disposal. Reduced motion retains the
artwork and skips transitions; forced colors retains system borders.

## Presentation guidance

[Player presentation skill](../../.agents/skills/player-presentation/SKILL.md)
keeps feature copy concise and prefers existing visual states to redundant labels.
Runtime ownership remains in gameplay modules and explicit-canvas renderers.

Version 1.42.0 reduces the Armoury player scale, preview height, scroll-top padding and equipment tile spacing.

Version 1.43.0 gives the Armoury a wider, shorter room preview and caps the detail
area so the equipment grid stays available on small screens, including Large
text and Scrolls. The header and category strip remain visible while their detail
and collection areas scroll independently. Category arrows expose the overflowing
strip; ownership counts remain secondary. Owned flavour text and completed unlock
conditions are under **Details**; locked requirements remain visible.

Tiles use one equipped marker and a small selected-form emblem, with accessible
equipped, form and unviewed states. Explicit **Normal / Awakened / Third** controls
replace repeat-tap cycling. Steel's Third control appears after the first Awakening
is owned and stays disabled until the third form is earned. Active Awakening effects
use separate benefit/tradeoff lines without repeated activation instructions. The
saved equipment fields and isolated preview renderer are unchanged.

Focused mobile, disclosure, category navigation, keyboard, scroll preservation and
unearned-form checks are in `tests/browser/armoury-mobile.spec.ts`; blade/outfit
activation and suppression remain covered by `ui.spec.ts`, `feature-plan-06.spec.ts`
and `outfit-awakenings.spec.ts`.

Version 1.47.0 preserves Armoury Details across item/category selection, replaces
category arrows with native scrolling, and gives form controls a silk nine-slice
surface with gold selection and explicit keyboard focus. Run-result captions
use opaque ivory for clearer contrast against the scroll surface.
