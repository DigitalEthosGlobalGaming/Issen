# Premium supporter purchase

Version 1.11.0 implements the Android purchase UI and RevenueCat bridge. Live
store configuration and physical sandbox transactions remain unverified. No
advertising SDK is included. GitHub Pages billing remains unavailable.

**Paused for closed testing:** `VITE_PREMIUM_ENABLED` defaults to `false`. The
closed-testing candidate hides Support Issen, purchase/restore controls, the
Premium badge and Supporter Print catalog entry. RevenueCat is not configured or
queried while disabled, even if a public SDK key is present. Saved paid-film IDs
fall back to Monochrome; existing free films remain available. The implementation
is retained for later, and RevenueCat/store setup work is paused.
Disabled builds also omit the configured SDK key from compiled web assets.

## Player experience

When explicitly enabled, the Android title screen offers **Support Issen**. One non-consumable purchase
grants **Supporter Print**, an exclusive warm-ivory/deep-ink film with restrained
grain, and a **Premium** title label. The support screen has an isolated canvas
preview, localized store price, restore and explicit film-selection buttons.
Purchasing does not automatically change the equipped film. Existing gameplay,
earned films and Trial rewards stay free; no subscriptions or repeat tips exist.

## Ownership and code boundaries

- `src/platform/purchases.ts` configures RevenueCat Capacitor 13.6.1 for Android,
  reads CustomerInfo, loads the `default` Lifetime package, buys and restores.
  RevenueCat handles the native transaction/acknowledgement flow.
- `src/platform/premium.ts` owns checkout serialization and entitlement state.
  Only active `premium` entitlement data returned by the SDK grants ownership.
  Trusted-entitlement verification is enabled; failed verification grants nothing.
- The SDK's native CustomerInfo cache supplies offline ownership. No localStorage
  Premium flag is trusted. Network failures retain ownership already obtained in
  the running session; later authoritative inactive data revokes access.
- `game.ts` reconciles the film into the live unlock set, strips paid grants from
  profile/checkpoint input and falls back to Monochrome on revoked access. Armory
  selection checks entitlement independently of the ordinary unlock set.
- Content lives in `game/content/items.ts`; the shared explicit-canvas effect is
  in `rendering/effects/film.ts`; support markup/controller live in `ui/screens/`.
  Grain uses no combat randomness and previews use their own canvas.
- Ownership is outside resettable profile storage. Reinstallation requires store
  restoration; neither browser progress nor Apple purchases transfer automatically.

## Store configuration still required

1. Create/activate Google Play one-time product `issen_premium`, configured as a
   permanent non-consumable unlock. Proposed Australian price is A$4.99; the app
   always displays the store-provided localized price.
2. Connect the RevenueCat Google Play app for `com.digitalethosglobalgaming.issen`
   and configure Play credentials securely in RevenueCat. Attach this product to
   entitlement `premium`, offering `default`, Lifetime package (`$rc_lifetime`).
3. Copy `.env.android.example` to ignored `.env.android.local`. Set
   `VITE_PREMIUM_ENABLED=true` only when resuming this feature, and set
   `VITE_REVENUECAT_ANDROID_KEY` to the **public** `goog_` SDK key. No server secret,
   service-account JSON or signing credential belongs in the app source.
4. Local debug testing may use the previously supplied public `test_` key with
   `VITE_PREMIUM_TEST_STORE=true`; its catalog must have the same identifiers.
   Release Gradle tasks reject Test Store keys found in synced web assets.
5. Build/sync again after configuration. Upload a signed AAB with a new version
   code (first release was code 1). Test through Google Play internal testing with
   a license tester. Do not use the `.debug` package to certify Play Billing.
6. Verify successful purchase, cancellation, pending approval, duplicate taps,
   cached offline ownership, restart, profile reset, reinstall/restore and refund
   reconciliation on the phone. Check the film in bright/dark stages and bosses.
7. Update Play Data safety for actual RevenueCat collection, including purchase
   history; review the privacy page and listing before publishing. Ads remains No.
   [RevenueCat Data safety guidance](https://www.revenuecat.com/docs/platform-resources/google-platform-resources/google-plays-data-safety)

No key means safe unavailable checkout, with free gameplay intact. SDK presence
alone does not establish a working store product. iOS integration is deferred.

## Verification

Unit tests exercise entitlement failure, revocation, network failure, cancellation,
unconfirmed payment, restore and duplicate checkout. Android browser tests cover
the disabled native UI, offline assets and forged profile data. These checks do not certify native billing sheets or live store connections.

Remaining native persistence, Back/lifecycle, performance and device QA gates in
the [release plan](mobile-store-release-plan.md) still apply before production.

Closed-testing candidate verified on 30 September 2026: version 1.11.0, Android
version code 2, signed AAB with Premium explicitly disabled. Type checking, 143
unit tests, four Android browser checks and two compiled-web production checks
passed. A build with a configured public Test Store key and Premium off omitted
that key and passed release signing. The broader browser run encountered startup
timeouts; it is not recorded as fully passing. Native phone QA remains required.
