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
