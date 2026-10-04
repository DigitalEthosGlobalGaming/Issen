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

The batch also includes seven-day login progression and Armoury loadout presets.

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

## 1.56.1 — Second Wind and simpler reward choices

Second Wind replaces the earlier per-death support offer: one support revive per
run for free and Premium players. The offer uses nine-slice scroll artwork and
“Watch an ad to revive at half health.” **No thanks** ends the run. The support
acknowledgement has a single **Thanks** button.

Free players see **2× Watch Ad** only after the Ember tally, with **Continue**
underneath. Base rewards settle first; the optional bonus uses a claim marker saved
atomically with currency in metadata. `issen.supportReward` retains an unclaimed
offer for recovery after reload without recording the run again. Premium continues
to double automatically. The bonus doubles the current run's contribution, including
fractional Embers. A completed bonus cannot credit again.

Ember confirmations now show **Are you sure?**, **Cancel**, and
**Confirm | -X Embers**, replacing the longer balance explanation. Reward dialogs
live inside the app so their controls receive the shared brush frames. Their
decoration stays inside the dialog to avoid overflow scrollbars.

## 1.56.2 — Ember ad reward amount

The post-tally action reads **Watch Ad | 2x embers (+X)**, where X is the
actual extra whole Embers, including fractional carry and the currency cap.
The option appears only when it can credit at least one Ember. Continue remains
below it; runs with no extra reward proceed through the usual results flow.

## 1.56.3 — Quieter Temple and button copy

Weapons, Outfits, Blessings and Curses show a short description without listing
next-pack names, progress timing or Current/Next summaries. Purchase rules and
challenge tracking stay the same. Spending confirmations use **Yes -X Embers**
alongside Cancel. The reward button reads **Watch Ad · 2x embers (+X)**.

## 1.57.0 — Seven Dawns

Visit on seven consecutive local calendar days to earn the Seven Dawns crest.
A profile counts once per day at startup or when returning to the foreground.
Missing a day resets the streak; earning the crest is permanent. The Armoury
shows the locked crest and its current streak. Day seven gives an unlock toast
and the normal new-item cue.

`progression/daily-login.ts` validates `issen.dailyLogin`, advances calendar dates
without elapsed-hour assumptions, and merges the most recent streak while keeping
permanent ownership. Each profile has its own record. Save transfer and run
checkpoint recovery retain the grant. The shared calligraphic SVG at
`ui/assets/crest-seven-dawns.svg` supplies both its Armoury image and canvas paths.
