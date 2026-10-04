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
