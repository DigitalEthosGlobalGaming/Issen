# Editions and mastery rewards

Implemented in **1.13.0** from the [feature plan](editions-and-mastery-plan.md).
Android packaging, store transactions and physical-device haptic tuning remain
unverified by the web/unit checks.

## Editions

`VITE_GAME_EDITION=free|premium|web` is validated by Vite. Android defaults to
Free; normal web and Pages builds default to Web. An explicit Premium override
permits a beta without purchases. It does not create/save a purchase entitlement.
`VITE_PREMIUM_ENABLED` separately controls native billing, defaulting off.

Free keeps existing free content and vibration. The new effects, charms, Temple
upgrades and Trials appear with **Requires Premium**. Verified purchase ownership
or a Premium build opens those edition gates. Web opens every edition gate,
including Supporter Print, while retaining earned unlocks and Ember costs.

`src/platform/editions.ts` owns restricted item/Trial IDs and access rules. The
runtime checks access independently of earned ownership at selection, combat
modifiers, Trial start, Temple purchase and checkpoint restoration. Losing purchase
access suppresses unavailable equipment/powers without deleting earned ownership
or ranks. A Premium Trial terminates if access is lost. Build-granted access is
independent of purchase revocation. Existing [billing setup](premium-supporter.md)
still applies for purchases.

The Armoury shows challenge progress and isolated effect previews while locked.
Eligible ordinary Free play accumulates mastery before purchase. Store ownership
does not come from a profile flag.

## Vibration and kill effects

All editions have optional supported-device vibration: slice is one 45 ms pulse;
parry is two 16 ms pulses separated by 35 ms; damage is 70 ms and 45 ms pulses
separated by 25 ms. Light shortens motor pulses to 45% of Full, controlling duration
rather than hardware amplitude. Options retains the vibration Off switch and adds
Light/Full. Existing preferences remain intact; strength defaults to Full.

Damage takes priority over parry, then slice. Repeated lower/equal-priority events
are suppressed during an active pattern; no queue accumulates. Pause, disposal
and switching vibration Off cancel feedback. Unsupported capability is nonfatal.

| Kill effect | Requirement | Presentation |
| --- | --- | --- |
| Falling Leaves | 1,000 lifetime kills | Dark leaves scatter along the cut and drift down |
| Ember Ash | 50 lifetime duel victories | Silhouette fades into embers and ash |
| Ink Wash | 100 perfect cuts in one ordinary run | Silhouette fades into spreading ink stains |

Selected effects give ordinary sliced enemies and standoff slices a typed dissolve
death. Bonk retains whole-body reactions; bosses retain split deaths with selected
particles. Automatic kills retain their existing presentation. Visual randomness
stays separate from combat RNG, density respects presentation preferences, and
bodies/shadows/stains expire. Previews have independent canvas/clock/particles and
clear the previous demo before another starts.

Validated `issen.stats.bestRunPerfects` records the best run's perfect-cut total;
Trials do not advance it or ordinary challenges. The earlier standalone Dissolve
reward is not included; dissolve is an internal presentation style for this batch.

## Temple and charms

Both additions use existing Temple eligibility: upgrades On, Normal difficulty,
guided Waves and Normal lives. They do not apply to Trials, Boss Rush or upgrades
Off. Schema-4 validated ranks preserve existing migrations.

| Upgrade | Costs | Effect |
| --- | --- | --- |
| Precision | 150 / 250 / 400 Embers | Perfect-cut and duel parry windows +5% / +10% / +15% |
| Discernment | One rank, 250 Embers | One Shrine reroll per run |

Precision widens the remaining perfect arc after equipment/blessing offsets,
bounded at a 0.5 normalized threshold. Parry duration multiplies with Focus and
equipment. Attack speed, direction rules and speed scoring remain unchanged.

Discernment snapshots a charge at run start. Reroll uses current seeded
rarity/eligibility/guarantee/curse rules, granting no blessing or immediate reward.
It spends nothing on an empty eligible pool. A successful reroll checkpoints the
remaining charge, RNG and replacement choices so reload cannot restore the charge
or old offer. This does not extend Temple eligibility to Boss Rush.

**Pilgrim's Bead**, unlocked at 10 lifetime duel victories, gives +50% boss Embers
and −25% ordinary-kill Embers. Wave rewards are unchanged. Its factor multiplies
existing bonuses before rounding to ledger hundredths; automatic ordinary kills
use the same kill factor. Existing exclusions, carry and one-time settlement stay.

**First Strike**, earned from Duel Master, replaces slash timing points with
900–120 base points, decreasing linearly across the opening duration. Ordinary
timing starts at entry completion (enemy lifetime minus 0.9 seconds); boss timing
uses elapsed stagger-opening time. Combo/global score modifiers remain; normal/
perfect-specific multipliers do not multiply replacement points. Boss defeats
also replace their ordinary defeat points. Parry scoring and perfect classification
remain unchanged. Chained automatic kills and knives retain ordinary points without
speed bonuses; invalid slashes grant nothing.

## Trials

Both retain Ronin wave-10 entry access and require Premium in Free builds. Preset
equipment and disposable stats prevent normal rewards/progression.

- **Quiet Blade:** 24 arrowless enemies, 65% feint chance, 1.35-second attacks;
  at least 18 perfect cuts, no mistakes. Reward: Quiet jade seal. Its perfect-cut
  target distinguishes it from Read the Blade.
- **Duel Master:** 20 consecutive counter-and-correct-directional-slash exchanges.
  Any mistake ends the attempt, including premature slashes after entry and missed
  openings. Reward: First Strike charm. HP tracks remaining exchanges; the objective
  displays progress. Each success tightens windup/flash/stagger/idle by 2.7% of the
  starting timings, bounded at 50% (minimum 0.23-second flash). It uses the first
  boss without feints or multi-swipe chains. Pause freezes the existing scheduler.

`issen.trials` completion stays idempotent and reconciles rewards on load. Reward
metadata now supports gameplay charms as well as cosmetics.

## Verification and favicon

`tests/unit/editions-mastery.test.mjs` covers edition gates, Temple rules, window
composition, speed scoring, acceleration, haptic priority and Ember settlement.
Existing effect tests include the new effects' finite particles/expiry.
`tests/browser/editions-mastery.spec.ts` covers editions, purchase revocation,
reroll reload, Duel Master success/failure/pause, Quiet Blade, speed scoring,
live dissolve and locked preview layouts. Test instrumentation is confined to
served modules; no testing hooks ship. Human difficulty and haptic feel still need
playtesting.

The favicon is a local vector sword mark, `public/favicon.svg`, linked through
Vite so Pages base paths are respected.

Verification on 1 October 2026: strict TypeScript and all 161 unit tests passed;
the complete two-worker browser suite passed all 117 tests. Compiled verification
passed three Web smoke tests and one edition-access check each for Free and
Premium builds. Isolated build directories preserved generated `dist/`. The Pages
build also verified the `/Issen/favicon.svg` link. Android build/device/store
verification was deferred at the user's request.
