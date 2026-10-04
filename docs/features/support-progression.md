# Support and progression

## 1.52.0 — Support screens and tester Premium

Support Issen occupies Tutorial's former title-menu position. Tutorial is now in
Options and starts from the title when no unfinished run is saved.

The support screen offers complimentary tester Premium and explains that it is
temporary, free and separate from a future purchase. `issen.testerPremium` stores
a validated campaign number in the active profile. `platform/tester-premium.ts`
owns the campaign and enabled switch; disabling it or changing its number retires
access without touching billing entitlements or earned ownership. Save transfer
validates and carries the campaign. Free, Web and Premium edition rules otherwise
retain their existing behavior.

`platform/purchases.ts` keeps the RevenueCat adapter but gates initialization behind
`PLACEHOLDER_SUPPORT`. No checkout or SDK listener starts during the placeholder
phase. The separate support screen activates tester access, never paid ownership.

Implementation of the remaining sets follows the
[feature plan](support-and-progression-plan.md).

## 1.53.0 — Support rewards

Every eligible fatal loss offers one optional support revive, restarting the wave
or duel with half maximum lives rounded up. Declining ends the run. A later death
can offer a new revive. Trials, daily runs, Zen and No Lives do not offer revives.
Phoenix and Daruma still resolve first and are not consumed by support revives.

Ordinary non-Zen results offer one Ember doubling before settlement. Trials and
daily runs are excluded. Paid Premium, Premium builds and active tester Premium
double automatically and acknowledge optional revives. Web collection access alone
does not grant support benefits. The multiplier applies only to pending run rewards,
preserving the previous fractional carry. Checkpoints retain the death-offer decision
and reward multiplier; settlement remains idempotent.

`platform/rewarded-support.ts` exposes an injectable async provider returning a
verified completion boolean. The current placeholder grants only after completing
the separate support acknowledgement. Cancellation/failure grants nothing. Screen
events are isolated from gameplay input; keyboard combat is gated while it is open.

## 1.54.0 — Temple collections

Weapons and Outfits each have three five-item packs costing 100, 200 and 350 Embers.
Blessings has four five-item packs costing 100, 200, 350 and 500; Curses has one
five-item pack at 100. Starter and pack membership follow the feature plan.
`content/collections.ts` owns membership and challenge progress labels. The Temple
shows the next pack's contents; Armoury details show its access requirement or
eligible counters. Existing owned equipment and secret discovery routes remain.

`issen.collections` holds validated per-pack statistics. Cumulative events use
post-purchase deltas; bests use the current run rather than lifetime records.
Checkpoints include these records to avoid duplicate progress after recovery, and
save import merges them by maxima. Each newly purchased pack begins at zero.
`unlocks.ts` receives each item's eligible statistics explicitly.

Ordinary runs capture unlocked Shrine IDs at run start. Offer eligibility and
secondary grants share the filter; daily and Trial presets remain independent.
The new collection emblem sheet is editable calligraphic SVG artwork at
`src/ui/assets/collection-symbols.svg`.

## 1.55.0 — Awakening purchases and Ember confirmations

Awakening Access opens challenges as before. Completing a challenge now enables an
Armoury purchase: 150 Embers for blade or outfit forms and 300 for Tamahagane's
third form. The first form is required before buying its third. Previously owned
forms remain owned; run-end and save-import reconciliation do not grant unpaid
forms. Purchases validate category access, base ownership, independent challenge
progress, prerequisite forms and affordability.

Every Temple and Awakening purchase opens a confirmation with the cost and remaining
balance. Cancel/Escape spends nothing; confirmation rechecks the owning purchase
rules. Buying an Awakening equips it through the normal Armoury form flow.
`progression/awakening-purchases.ts` owns the purchase rules; `ui/confirm-action.ts`
provides the shared accessible screen-owned dialog.

## 1.56.0 — Boss variety and the final cut

Each ordinary boss archetype has three themed name/palette variants. Boss figure
seeds also vary clothing cuts and proportions through the existing Ink enemy
artwork, retaining the archetype's headwear and combat tells. Identity uses a
separate stream derived from run seed and boss ordinal, so revival and checkpoint
recovery preserve it without consuming combat randomness. Trial presets continue
to apply their curated definitions.

The killing stroke uses a short synthesized cutting rush, bright metallic edge
and ringing steel tail. The cue respects effects volume, mute and activity gates.
