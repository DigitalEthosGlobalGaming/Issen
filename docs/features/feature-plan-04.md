# Feature plan 04 — guided mechanics and end-of-run progression

Status: **implemented**. The brief below records the requested design; the
implementation record at the end describes the resulting rules.

The 1.1.1 polish pass removes the separate dismissible teaching message and
duplicate front/boss hints. Ordered cuts enter paused practice immediately;
bosses approach at normal speed and pause only on the first parry glint.
The standalone tutorial is now optional from the menu, including on first play.
Unread Armoury labels use an underline instead of a coloured `NEW` badge.

## Goal

Make new mechanics easier to learn, make a completed run feel rewarding, and keep
progression and mode choices understandable on a phone. This plan also addresses
several audio, reward-balance, and unlock defects. It changes no existing player
save retroactively.

## 1. Teach mechanics in the moment

When a player first encounters an important mechanic, slow the scene into a
readable teaching moment. Show a short instruction over the actual encounter,
pause hazards and countdowns while it is being read, and then let the player
perform the required action in a controlled slow-motion window. Resume normal
speed only after the action succeeds. Examples include the first front/order
mechanic and the first boss tap-to-parry; apply the same pattern only to other
mechanics whose introduction needs practice, not to every new enemy.

The prompt must identify the action clearly for touch and keyboard. A tap used
to dismiss text must not accidentally count as the combat action. A failed
practice action can retry safely without damage or an expired timer. Track which
lessons have been completed so they do not interrupt every run, while keeping
the existing skippable opening tutorial. A skipped tutorial does not silently
mark later, encounter-specific lessons complete.

**Implemented interpretation:** “front” means the first front/order encounter.

## 2. Settle progression when the run ends

Gameplay can continue to count kills, boss victories, secret conditions, and
potential Ember earnings during a run, but it must not grant persistent items,
mode access, or Embers mid-run. When the run ends, take one immutable result
snapshot and settle rewards and newly eligible unlocks exactly once. Boss
milestones, equipment/Awakenings, and secret unlocks all use this boundary.

An *ended run* means death, victory, or an explicit in-game **End run** action,
including endless mode. Closing the app or refreshing before that point does not
pay out. This rule avoids making an ordinary quit silently lose a completed
result. The practice tutorial and test profile keep
their current reward restrictions. Previously earned currency and unlocks stay
earned; this change is not a retroactive reset.

Use this mobile-first result sequence:

1. Freeze gameplay and settle the run once, before showing the first result
   screen. Record the pre-award Ember balance, the gain, the new balance, and
   newly granted unlocks as a stable snapshot.
2. Show an Ember tally: current balance first; earned Embers travel toward the
   number; the number counts up with a brief flame effect. A zero-reward run has
   a concise, truthful state rather than a fake gain.
3. Reveal each new unlock with a small entrance animation and its name, type,
   and useful one-line description. This includes newly available modes. If
   there are no unlocks, omit this part.
4. Move into the existing run-summary screen with its normal actions.

One tap during an animation completes that animation; the next tap advances.
This makes it possible to see the final number or item before skipping onward.
Provide keyboard equivalents, readable contrast, reduced-motion behavior, and
tap targets suited to portrait screens. The sequence is presentation of an
already-committed result: replaying or skipping it can never pay twice.

Reduce future Ember income to approximately **half** the current rate without
changing historical balances. Apply the reduction to the whole run's calculated
reward, rather than flooring each one-Ember kill to zero. Specify deterministic
rounding and preserve fractional bonuses (including equipment bonuses) so many
small rewards still add up correctly. Test normal, boss rush, endless, and
bonus-equipped runs against the current economy before locking the exact rate.

## 3. Make progression visible in menus

- In each Armoury tab, show owned/unlocked gear before locked gear. Preserve
  catalogue order within each group; keep genuinely secret entries hidden until
  their reveal condition is met.
- Put a `NEW` mark on the Armoury entry point, the relevant tab, and each new
  gear tile. Selecting a tile and viewing its detail clears that tile's mark;
  opening the tab alone does not. The tab and Armoury marks clear when no new
  gear remains. Persist seen item IDs across sessions. On migration, treat
  pre-existing owned items as seen to avoid marking the entire collection new.
- Hide **No lives** and **Endless** until the player purchases the first
  Vitality/life upgrade in the Temple. If an old or edited setup asks for one
  without that upgrade, fall back to a legal normal-lives setup. This access
  rule applies to new selections, not to removing already-earned progress.
- Interpret “Arrows shown option” as the whole **Arrows** choice in setup: the
  normal shown-arrows behavior stays implicit until Blade Only is unlocked;
  only then show the **Shown / Blade only** control. This avoids displaying a
  one-choice control. No separate arrows-visibility unlock was introduced.

New gear marks are distinct from the run-end reveal: a player can skip reveal
animations and still find the unviewed item in the Armoury later.

## 4. Clean up boss rush blessings and curses

Only offer effects that can matter in boss rush. Audit every blessing and curse
against actual boss-rush combat and scoring, then give offers explicit
mode-eligibility rules. Likely exclusions include wave-clear, next-enemy,
attacker-order, and stage/weather-only effects such as Harvest, Swallow cut,
Patience, and Stormborn; confirm each against the code rather than relying on
its description. Keep boss-relevant parry, duel, life, score, and combat effects.

Apply the same filtered pool to ordinary offers **and** secondary grants such
as Twin blessing. Temple/equipment rare-offer bonuses should still operate on
eligible rare choices; if none remain, they must fall back gracefully instead
of producing an irrelevant reward. Cover ordinary mode and boss rush with
deterministic offer tests.

## 5. Fix pause audio and secret unlock reliability

Reproduce the ambient/background loop defect across pause, resume, weather
changes, app visibility, and repeated pauses. Keep one continuous ambience
source where possible; fade or suspend it on pause and crossfade once on resume
instead of stacking or restarting loop edges. Gameplay sounds should not fire
for a frozen teaching encounter unless they are part of its demonstration.

Audit each secret item's trigger, counter, persistence, eligibility predicate,
and reveal path. Add focused tests for the actual input/event sequence needed
for every secret, including cases where one new unlock enables another. At
run-end settlement, resolve dependent unlocks to a stable result, grant each
once, and include them in the reveal/new-item indicators. Do not change the
intended secret conditions merely to make tests pass; document any condition
that needs a design decision.

## Ownership and compatibility

Keep reward calculations and unlock eligibility in gameplay/progression
modules, not DOM screens. The runtime owns the transition from live run to a
single settled result; result and Armoury screens only render that snapshot and
viewed state. The tutorial/prompt UI controls presentation while combat timing
remains owned by the simulation. Keep existing `issen.*` saves compatible; any
new lesson, result, or viewed-item fields need safe defaults and a small
migration. Do not touch generated `dist/` or real player saves for testing.

Relevant starting points: `src/game.ts`, `src/game/progression/`,
`src/game/content/items.ts`, `src/game/shrine/blessings.ts`,
`src/game/content/blessings.ts`, `src/ui/screens/setup.ts`,
`src/ui/screens/armory.ts`, `src/ui/screens/game-over.ts`, and
`src/audio/audio.ts`. Verify final ownership against the live files before
implementation.

## Implementation sequence and acceptance

1. Define the end-run result snapshot, exact reward rounding, save defaults,
   and unlock-settlement contract. Add unit tests for no mid-run grant, all
   eligible end conditions, one-time settlement, existing saves, and half-rate
   earnings with bonuses.
2. Build the result sequence and new-item seen state. Test tap-to-complete,
   tap-to-advance, keyboard, reduced motion, no-unlock and zero-Ember cases on
   narrow portrait screens.
3. Add the guided-mechanic state and at least the first front/order and boss
   interactions. Verify time truly stops while reading, the prompted action
   can be completed safely, and replay does not re-teach completed lessons.
4. Gate modes and setup controls, sort the Armoury, and make boss-rush offer
   filtering explicit. Cover old setup values and shrine secondary grants.
5. Reproduce and fix ambient pause looping; audit all secret unlocks and add
   regression coverage for their real triggers and end-run reveal.

Run strict TypeScript checks and the relevant unit/integration tests, then
manually verify a fresh profile and an existing `issen.*` profile on a portrait
mobile viewport. No part of this plan is considered complete merely because an
animation plays: the underlying reward, unlock, audio, and input behavior must
meet the rules above.

## Implementation record

Title-screen gestures reserve touch input (including vertical mobile swipes) and
capture the active pointer. Finding or repeating an unclaimed title secret shows
an explicit instruction to end a run to claim the reward. A recorded trigger is
not treated as item ownership; these rewards still settle at run end. Browser
regressions use actual browser-generated touch input for the swipe sequence,
check the pending message, and verify the eventual item grant.

- `src/game/progression/run-rewards.ts` accumulates kill, wave, and boss rewards
  as hundredths of an Ember at half the old rate (0.5, 2.5, and 12.5 before
  bonuses). A completed run settles once, floors the combined total, and carries
  the fractional remainder in `issen.meta.emberRemainder`. Death and explicit
  End run settle; app closure does not. Zen/tutorial exclusions remain. Old
  balances are not reduced. `src/game.ts` defers boss milestones and equipment
  eligibility until that same boundary.
- `src/ui/screens/run-results.ts` renders the settled Ember tally and mode/item
  reveals before the summary. One tap finishes the current animation; the next
  advances. Keyboard activation and reduced-motion settings are supported.
  `src/game/progression/armory-seen.ts` persists explicit detail views under
  `issen.armorySeen`, with old collections seeded as already viewed.
- `src/game/onboarding/guided-state.ts` and `guided-lessons.ts` persist completed
  first ordered-cut and boss-parry lessons under `issen.guidedLessons`. Ordered
  cuts enter frozen practice directly. The boss approaches at normal speed and
  freezes at its glint until a successful parry. There is no separate dismissible
  reading card or duplicate encounter hint. The optional menu tutorial does not
  run automatically or mark either live lesson done.
- Setup sanitizes No lives and Endless without Vitality rank 1 and hides the
  Arrows control until Blade Only. Armoury sorts owned gear first and clears
  unread underlines only when the item's detail is selected. Boss-rush Shrine offers use an explicit
  duel-relevant pool, including Twin's secondary picks. Secret eligibility is
  resolved to a fixed point at run end; `secret-events.ts` records each trigger
  sequence, and the result-screen applause secret gets its own post-run reveal.
- `src/audio/audio.ts` fades a single ambience bus on pause and guided freezes,
  suppressing weather accents without restarting the background loop.

Automated verification includes strict TypeScript, unit tests for reward
settlement, eligibility and state machines, and browser tests for portrait
menus, live teaching encounters, end-run reveals, and existing mode flows.
