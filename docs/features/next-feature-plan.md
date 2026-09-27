# Next features and changes

Status: proposed feature outline, September 2026. This document captures the next
set of changes for discussion and implementation planning. It does not describe
completed work. Suggested details and unresolved decisions are labelled below.

## 1. Improve the sword landing sound

The current sword landing sound feels wrong. Replace or retune it so the impact
sounds satisfying and fits the game's atmosphere.

- First identify the exact landing cue in gameplay and reproduce it reliably.
- Try a short, grounded impact with a restrained metallic accent; this is an
  initial sound direction to audition, not a final specification.
- Check its volume and character alongside cuts, parries and other combat audio.

Done when the replacement has been auditioned in context and approved, without
unwanted ringing, clipping or distracting repetition. Audio work belongs in
`src/audio/audio.ts`, with its trigger checked in the runtime.

## 2. Fix lingering shadows from slain enemies

Slain enemies sometimes leave shadows visible for too long. Investigate the
enemy death animation, shadow rendering and cleanup timing before choosing a fix;
the underlying cause is not yet confirmed.

The shadow should fade with the dying figure and disappear by the end of its
intended death effect. It must not remain after the figure has been removed or
carry into a new encounter.

Verify ordinary kills, rapid consecutive kills, slow motion, pause/resume and
encounter transitions. Check boss deaths if they use the same rendering path.
Relevant ownership is combat state, figure rendering and runtime transitions.

## 3. Secret admin/testing menu

Add a hidden menu that makes it quick to reproduce situations and test future
features. It should be reachable deliberately without cluttering normal menus.
The activation gesture or shortcut is still to be decided.

Proposed first version:

- Choose a stage, wave or boss encounter and jump into a valid playable state.
- Grant or remove items and awakenings; equip a test loadout and inspect its effects.
- Adjust lives and other useful run values, and restart the current encounter.
- Grant or remove the new currency and reset purchased Template upgrades for testing.
- Set mode unlocks and tutorial state; replay tutorial and unlock reveal animations.

Suggested follow-ups include invulnerability, simulation speed controls and
repeatable encounter presets. These are optional extensions, not requirements
for the first version.

Recommended behavior: show clearly when testing is active, use an isolated test
profile by default, and keep test results out of normal records and progression.
Removing an equipped item must leave a valid loadout. Stage jumps must use normal
transition rules so old enemies, effects or timers do not remain active.

Decide whether the menu ships in the public build or is available only in
development. A hidden client-side menu is a convenience, not an authorization
boundary. Any profile reset should explicitly identify the data being reset.

Done when a tester can reach a chosen encounter, change a loadout and reproduce
progression states without manually editing saves or losing their real profile.

## 4. Document important gameplay types in the TypeScript source

Add developer-facing documentation beside selected gameplay types and their
owning code. A developer reading a type should understand what the concept
represents in the game, how it fits into the surrounding systems and how to
work with it. This is targeted source documentation, not an exhaustive pass over
every type or a player-facing guide.

Use `Awakening` in `src/game/content/awakenings.ts` as the initial example.
Planned JSDoc on the interface or its module should explain that an awakening
is an unlockable variant of a blade, earned through blade-specific progress,
with a gameplay benefit, a tradeoff and optional visual changes. Explain how
the catalog relates to progress tracking, unlock eligibility and modifier
application, with references to the relevant owning modules.

Document fields where their meaning is not obvious, particularly abbreviated
names and the `need` tuple: what each value represents, how the requirement is
evaluated and how the gameplay modifiers and visual settings are consumed.
Include concise guidance for adding or changing an awakening, grounded in the
actual implementation and its conventions.

Apply the same approach selectively to other important domain types, such as
blessings, equipment and progression state, where the type shape alone does not
explain the gameplay meaning. Avoid comments that merely repeat TypeScript
syntax or duplicate large catalogs.

Done when a developer can read the documented type in their editor and understand
its purpose, relationships and extension points without reconstructing the
concept from its call sites. Source changes are deferred until implementation;
this section only records the planned documentation work.

## 5. Persistent currency and a permanent-upgrade Template

Earn a persistent currency through playing. Spend it by donating at a new
**Template** menu, accessible alongside Stats and Armoury, to receive special
permanent boosters that carry across runs.

Template is the name of the new permanent-upgrade menu. The existing Shrine
remains the place for blessings during a run. Menu descriptions should make
the difference between permanent boosters and in-run blessings clear.

Proposed player flow:

1. Play a run and earn currency from eligible gameplay.
2. See the amount earned and the updated balance.
3. Open Template and inspect available boosters, effects, ranks and costs.
4. Donate to purchase an upgrade and receive clear feedback.
5. Start a later run with the purchased benefit applied.

Suggested earning direction: reward active play and milestones such as cleared
waves or defeated bosses. Exact sources, payout timing, currency name and amounts
are undecided. Decide how abandoned runs, tutorial play, Zen and other modes count.

Possible boosters to explore include a small starting-life bonus, a modest parry
window increase or improved blessing choices. These are examples only; the
catalog, strength, costs, rank limits and stacking rules still need design.

The menu should show the current balance, owned ranks, current and next effects,
costs and maximum-rank states. Purchases must persist without duplicate charges
or negative balances. Specify whether upgrades can be refunded and whether they
apply immediately or only when starting a new run.

Before balancing, decide how permanent power interacts with equipment,
awakenings, blessings, challenge modes and score records. Define any exclusions
explicitly so players understand when an upgrade applies.

Done when earning, donating, applying upgrades and reloading the game form a
complete, reliable loop with existing saves preserved.

## 6. Tutorial and gradual mode unlocks

Give new players a more complete introduction with a playable, skippable tutorial.
Introduce controls and core combat in short guided steps, then lead into normal
play. Suggested lessons are reading an attack, cutting in the required direction,
timing a cut and responding to a boss opening; final lessons should follow the
actual mechanics players need at the start.

Skip must be available throughout the tutorial. Completing or skipping it should
allow normal play without granting boss-based unlocks. Recommended additions are
a replay option and saved tutorial status so it does not restart on every visit.

Required mode progression:

| Milestone | Newly available option |
| --- | --- |
| Beat the first boss | Boss Rush |
| Beat the second boss | Ronin |
| Beat the third boss | Blade Only |

Locked options are absent from the start/setup menu. On the first visit to the
relevant menu after an option unlocks, give it a distinctive reveal animation and
a short explanation. Afterwards it remains available without repeating the
introduction. Persist unlock status separately from whether its reveal has been
seen; handle multiple pending reveals and provide a reduced-motion version.

Current setup treats Boss Rush as a run format, Ronin as a difficulty and Blade
Only as the no-arrow option. Preserve that distinction when presenting unlocks.
Validate selected settings as well as hiding controls so stale saved selections
cannot activate a locked option.

Open decisions:

- Do “first/second/third boss” mean positions in the normal journey, distinct boss
  identities, or cumulative victories? Suggested interpretation: successive boss
  milestones in the normal journey, rather than repeating the first boss.
- Must those milestones occur in one run, and which play settings qualify?
- How should existing players receive unlocks and tutorial status? Preserve earned
  progress wherever existing records support it; define a migration fallback
  where historical records cannot prove the new milestone.
- What animation direction best suits the menu? Suggested concept: an ink reveal
  with a brief blade glint and a restrained audio cue.

Done when a fresh profile can complete or skip the tutorial, earn each unlock,
see each reveal once and retain progress after reload. Also verify existing
profiles and a return to the menu with multiple unlocks pending.

## Suggested implementation order

1. Address the sound and lingering-shadow issues as small independent changes.
2. Build the core testing menu to support the remaining work.
3. Document key gameplay types in the source and settle the progression and currency decisions above.
4. Implement tutorial, mode milestones, save migration and unlock reveals.
5. Implement the currency and permanent Template upgrades, then balance their
   interactions with the existing game.

This order is a proposal, not a committed release schedule. Each feature can be
broken into smaller implementation tasks when its open decisions are resolved.

## Implementation constraints

Keep gameplay rules in their owning modules and connect presentation and
transitions through the runtime. Preserve existing `issen.*` save compatibility,
add defaults for new profile fields, and test migrations with isolated profiles.
Do not clear real player saves. Keep preview effects independent of live play.

Implementation changes need strict TypeScript checks and relevant tests, plus
in-game checks for audio, visual timing and menu animations. Update affected
documentation as proposed behavior becomes implemented behavior. See the
[architecture](../architecture/overview.md) and
[local development guide](../development/local-development.md) for ownership
and verification guidance.
