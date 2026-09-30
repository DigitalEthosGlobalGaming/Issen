# Mobile and app-store release plan

Status: Android prototype APK built; physical-device acceptance
and later milestones remain open. Researched 30 September 2026.
Store and SDK requirements must be checked again before submission.

## Release priority confirmed

The user confirmed Android as the first target on 30 September 2026 and owns an
Android phone for physical testing. Keep the current GitHub Pages deployment as
it is, with web monetization deferred. Build, test and release Android first;
iPhone follows once macOS/Xcode and iPhone testing access are available.

The milestones below apply to Android for the first release. References to both
stores/platforms describe the eventual mobile scope; repeat the applicable gates
for iOS later. iOS tooling, purchases, testing and store review do not block the
Android release. Android success does not establish iPhone readiness.

### Android delivery path

1. Install Android Studio/SDK tooling on Windows and add the Capacitor Android
   project. Build/copy the local game assets and sync the native project.
2. Enable Developer options and USB debugging on the user's phone, connect a
   data-capable USB cable and accept the phone's debugging prompt. Open the
   Android project in Android Studio, select the phone and Run. This installs a
   debug app directly; no Google Play listing is needed for this development path.
   [Physical-device setup](https://developer.android.com/studio/run/device)
3. Produce an APK for direct installation when a USB development session is not
   convenient. An APK is installable; an AAB is a store upload artifact rather
   than a file to tap-install. Keep QA/test-profile data separate from real saves.
4. For Google Play, generate a signed release Android App Bundle (AAB), keep the
   upload keystore/password outside Git and configure Play App Signing. A debug
   APK and the Play-installed app can have different signing certificates; use a
   separate debug application ID to avoid uninstalling an existing player app.
   [Android signing](https://developer.android.com/studio/publish/app-signing)
5. Create the Play Console app, upload the AAB to Internal testing, add the user's
   Google account as a tester and install through the opt-in/Play link. Use this
   release build for Play Billing sandbox tests with a license tester; RevenueCat
   Test Store keys remain limited to local debug builds.
6. Complete the listing, privacy/Data safety, ads/audience/content-rating forms,
   product setup and required testing. Qualifying new personal developer accounts
   require the closed-test gate described below before production access.
7. Submit for production review, then release after approval. Increment Android
   `versionCode` for each uploaded update and keep the application ID/signing
   identity stable so users can update without losing local progress.

The first deliverable is an offline debug app running on the user's Android phone.
Google Play enrollment, monetization SDKs and release signing follow that prototype.
Start with manual Android Studio/Play Console releases; automate signed builds and
uploads only after that path is verified. See [Android development](../development/android.md)
for the implemented commands, tooling, signing and phone test checklist.

### Prototype implementation recorded

- User confirmed `com.digitalethosglobalgaming.issen` as the permanent Android
  application ID and intends to test on their latest Pixel (exact model/OS pending).
- Version 1.10.0 adds Capacitor core/CLI/Android 8.4.3, a maintained `android/`
  project, isolated `.mobile-build/` output and local licensed font assets.
- Debug builds use `.debug` as an ID suffix. APK/sync/run and signed AAB commands
  are available, along with a manual GitHub Actions debug-APK workflow.
- Desktop touch-browser checks cover compiled offline startup, font availability,
  navigation, landscape pause layout and checkpoint recovery. Physical WebView
  performance, lifecycle, storage durability and signing require separate evidence.
- Local debug APK compilation and APK signature verification passed. Its manifest
  reports the debug package ID, version 1.10.0-debug, minimum API 24 and target
  API 36. No USB debugging device was connected; installed-app acceptance is pending.
- GitHub Pages behavior is retained. No ads/purchases or iOS project are enabled.

## Outcome and agreed scope

Ship Issen as an installable Android game on Google Play and an iPhone game on
the Apple App Store, retaining the existing browser version and shared gameplay.
The user selected a free release with ads or in-app purchases and currently has
no Mac available. Exact ad placements, products, prices and publisher identity
are still decisions; the recommendations below are proposals.

The stores distribute signed app packages. The installed game should contain its
own assets and work offline; it should not load the GitHub Pages site to play.
Public support and privacy pages need web hosting. Ads and purchases need online
services, but ordinary gameplay does not need a game server.

## Recommended approach

Use Capacitor to package the existing Vite/TypeScript/Canvas game in Android and
iOS native projects. Keep rules, progression and rendering in their current
owners; put native integrations behind `src/platform/` adapters. Capacitor can
be added to an existing web application and supports both platforms.
[Capacitor overview](https://capacitorjs.com/)

This is a recommendation based on the current code, not proof that a WebView will
meet Issen's timing requirements. The first milestone must test swipe/parry
responsiveness, audio and sustained rendering on real Android and iPhone devices.
Only proceed if that prototype feels right. Investigate measured bottlenecks
before considering a rendering or engine rewrite.

| Option | Fit for Issen | Decision |
| --- | --- | --- |
| Capacitor with bundled web assets | Reuses gameplay, menus, procedural art and tests; adds native capabilities | Recommended, subject to device prototype |
| Browser/PWA distribution | Useful for testing and retaining the web audience; does not deliver the requested pair of store releases by itself | Keep the browser release |
| Native/game-engine rewrite | Much larger implementation and parity effort | Revisit only if measured performance blocks the wrapper |

## Current evidence and gaps

| Existing evidence | Work needed for store readiness |
| --- | --- |
| `src/main.ts` mounts the DOM shell and starts `src/game.ts`; `package.json` uses Vite and strict TypeScript | Add maintained native projects, build configuration and signed release workflows |
| `src/input/pointer.ts` maps swipes and taps through Pointer Events, including cancellation | Test physical gestures, multi-touch interruptions, OS edge gestures and touch-to-action latency |
| `index.html` has a mobile viewport; styles use safe-area insets and scrollable menus | Audit all screens for notches, home indicators, Android edge-to-edge layout, short landscape screens and readable touch targets |
| Runtime pauses on document visibility changes and window blur | Integrate native app lifecycle, Android Back, external dialogs and audio interruptions |
| Canvas pixel ratio is capped at 2; visual quality adapts to frame timing | Measure long sessions, battery/thermal behavior and low-end devices; keep gameplay timing independent of cosmetic quality |
| Saves use synchronous browser `localStorage` through `src/platform/storage.ts`; checkpoints validate encounter snapshots | Add durable native persistence and verify update/recovery behavior |
| Haptics use optional `navigator.vibrate`; sharing uses browser/host APIs | Add native haptics and native PNG sharing with browser fallbacks |
| `index.html` fetches Shippori Mincho B1 from Google Fonts | Bundle licensed font files and required glyphs; eliminate runtime font dependency |
| Desktop Playwright covers touch emulation, layouts and sharing mocks | Add installed-app checks and real-device play sessions |
| Capacitor 8.4.3 and Android project now package offline assets | Validate the installed prototype on the Pixel; browser support does not certify native behavior |

The existing `issen.*` schemas and `issen.testing.*` isolation remain compatible.
Browser saves belong to their origin: installing an app will not automatically
copy progress from GitHub Pages or Safari/Chrome. Recommend separate app progress
for release one with a clear support explanation; consider validated export/import
later if transferring existing web progress becomes a launch requirement.

## Proposed first-release monetization

### Android and iOS AdMob setup recorded

The publisher has created Android and iOS AdMob apps and interstitial ad units, as
reported on 30 September 2026:

| Configuration | Value |
| --- | --- |
| AdMob app name/platform | Issen / Android |
| Android AdMob App ID | `ca-app-pub-4051245904427229~7900108029` |
| Interstitial ad unit name | `issen_android_between_runs` |
| Android interstitial Ad unit ID | `ca-app-pub-4051245904427229/8461457219` |
| iOS AdMob app name | issen-ios |
| iOS AdMob App ID | `ca-app-pub-4051245904427229~8069655101` |
| iOS interstitial ad unit name | `issen_ios_between_runs` |
| iOS interstitial Ad unit ID | `ca-app-pub-4051245904427229/1896048868` |

These are SDK configuration identifiers, not signing credentials. The App ID
identifies the AdMob app; the Ad unit ID identifies the ad placement. They are
separate from the Android application/package ID and iOS bundle ID. Keep each
platform's identifiers in its own configuration.
[AdMob identifier guidance](https://support.google.com/admob/answer/7356431?hl=en)

During native integration, configure the Android App ID in the native manifest
and use the interstitial Ad unit ID for the production placement. Development
uses Google's sample interstitial unit or explicitly configured test devices,
not ordinary live ad traffic.
[AdMob test ads](https://developers.google.com/admob/android/test-ads)

The unit's creation does not integrate ads into the current browser game or
establish app approval/ad-serving readiness. Native packaging and consent/testing
work remain pending. Both platforms' AdMob identifiers are now recorded;
Remove ads purchase products are still pending.

### RevenueCat Test Store setup recorded

The publisher supplied the RevenueCat Test Store SDK key on 30 September 2026:
`test_zJQiMzlfqLBNCRmWZVGpJdmnnGl`.
This records the supplied configuration; the key has not been validated by a
running SDK. No purchase integration or live-store connection is implemented.

Use this key only in native debug builds. TestFlight and Google Play test-track
builds use platform SDK keys and platform sandbox purchases, just like release
builds. RevenueCat deliberately rejects Test Store keys in release builds.
The documented minimum RevenueCat Capacitor SDK for Test Store is 11.2.6;
verify compatibility with the chosen Capacitor version when installing.
[RevenueCat Test Store guidance](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store)

Proposed catalog: permanent/non-consumable product `issen_remove_ads`, entitlement
`remove_ads`, offering `default` and a Lifetime package. The publisher has not yet
confirmed creation/linking of these entries or the final price. Android/iOS
RevenueCat SDK keys, native app identifiers and real-store product/credential
setup remain pending. The AdMob identifiers above are not purchase identifiers.

### Recommended behavior

Recommend occasional interstitial ads at a completed-run boundary and a one-time,
non-consumable **Remove ads** purchase. Set the price after market and revenue
review. Keep all current gameplay and earned unlocks available to free players.
Do not introduce currency sales or paid revives in the first release: they would
change progression, challenge eligibility and checkpoint settlement rules.

Suggested initial placement: after the result screen, when the player chooses
to leave or start another run, at most once per three completed ordinary runs and
with a three-minute minimum gap. Suppress ads during first-play teaching, Trials,
combat, Shrine choices and purchase/restore flows. Treat those caps as starting
product settings to validate in beta, not promises about revenue. No gameplay
banners. Optional rewarded ads can be a later feature with an explicit reward
design and exactly-once granting; do not silently attach rewards to existing
Ember or revival rules.

Implementation requirements:

- Native mobile ad SDK through a maintained, version-compatible bridge; evaluate
  AdMob as the first candidate. Check support for both platforms, consent,
  lifecycle callbacks and current native SDK requirements before choosing it.
- Native StoreKit and Google Play Billing for the first-release purchase. This
  avoids depending on regional alternative-payment programs. Evaluate either a
  maintained purchase bridge with a small verification service or a managed
  entitlement service; select one before implementing billing.
- Product IDs map to a separate entitlement, never an editable profile flag.
  Verify transactions, support Restore purchases, cancellation, pending payments,
  duplicate callbacks, refunds/revocation and reinstalls. A verified cached
  entitlement keeps ads disabled offline. Profile reset must not delete ownership.
- Grant entitlement only for completed verified payments, then complete the store
  transaction. Google purchases must be acknowledged within three days of reaching
  the purchased state to avoid automatic refund/revocation.
  [Google Billing integration](https://developer.android.com/google/play/billing/integrate)
- Pause gameplay/audio before native dialogs; return safely without an automatic
  live-combat resume. Ad load failure, no fill, offline state or purchase-service
  failure must leave the game playable. Use test ads and sandbox purchases in QA.
  [AdMob test ads](https://developers.google.com/admob/android/test-ads)
- Web builds use unavailable/no-op monetization adapters. Do not assume purchases
  transfer between Apple, Google and web accounts; that needs a separate identity
  and entitlement design.

The native billing recommendation follows the ordinary digital-goods rules.
[Apple purchasing guidelines](https://developer.apple.com/app-store/review/guidelines/),
[Google Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en)

## Delivery milestones

### 0. Publisher and tooling preparation

Owner: publisher for accounts/hardware; implementation owner for tooling.

- Choose individual versus organization publishing and the public seller name;
  complete identity verification and any required business verification.
- Reserve a stable Android application ID and iOS bundle ID based on the chosen
  publisher identity. Confirm branding and asset/font rights.
- Arrange Android Studio and the user's Android test phone for the first gate.
  Arrange macOS/Xcode and iPhone access before starting the later iOS prototype.
- With no current Mac, start Android locally on Windows and use a borrowed or
  rented Mac for interactive iOS debugging. A hosted macOS runner can build/sign
  releases, but still needs certificate/provisioning setup and physical iPhone
  testing. Select the service and spending limit before buying hardware or hosting.
- Select and pin a stable Capacitor release and matching official plugins;
  verify third-party ad/billing compatibility. Do not select a prerelease simply
  because it appears in search results.
- Define supported OS/device range, orientations, launch territories and target
  audience. Recommend phones first, with portrait and landscape retained if both
  pass QA. Decide iPad/tablet support explicitly rather than accidentally listing
  untested form factors.

Capacitor's documented v8 environment needs Node 22+, Xcode 26+ on macOS and
Android Studio 2025.2.1+; the repository's documented Node 24 workflow is suitable.
Check these against the version actually selected.
[Capacitor environment setup](https://capacitorjs.com/docs/getting-started/environment-setup)

Exit: publisher decisions recorded, build access available, test devices arranged
and monetization scope selected. Account setup can overlap the prototype.

### 1. Installed-game prototype

Owner: implementation owner; publisher/device testers validate feel.

- Add Capacitor configuration and the `android/` project first; add `ios/` in the
  later iPhone phase. Use an isolated
  mobile build output, for example `.mobile-build/`, configured as `webDir`.
  Keep the `/Issen/` Pages build separate; choose and test a mobile asset base.
  Copy compiled assets with Capacitor sync. Release configuration must not contain
  a development server URL or depend on a LAN machine.
- Bundle the font and licenses, verify all runtime assets resolve locally, and
  cold-launch the installed game in airplane mode.
- Run the tutorial, ordinary waves and bosses on Android first; record device,
  OS, WebView/build version, frame pacing, memory and gesture/audio observations.
- Aim for sustained 60 fps on the agreed baseline devices during a 20–30 minute
  demanding session, with responsive parries and no thermal collapse. Decide the
  measurable latency budget and minimum devices from this evidence. A cosmetic
  quality reduction must never alter combat rules or input windows.

Exit: a repeatable installed Android prototype with acceptable game
feel; repeat this gate on iPhone in its later phase. If the gate
fails, document the cause and optimization/rewrite decision before further work.

### 2. Native reliability and mobile polish

Owner: implementation owner.

- Extend platform adapters for App lifecycle/Back, Haptics and Share; connect
  transitions through `game.ts`. Remove native listeners through the existing
  lifecycle disposer. Android Back closes the top dialog, navigates menus or
  pauses combat before an intentional exit.
  [Capacitor App API](https://capacitorjs.com/docs/apis/app)
- Handle background/foreground, screen lock, phone/audio interruption, ad sheets
  and purchase sheets. Returning to active combat requires Continue; reset the
  frame clock and recover the audio context without duplicate loops.
- Use native Preferences or another suitable durable store for profile records.
  Capacitor warns that mobile OSs can clear WebView `localStorage`.
  [Preferences documentation](https://capacitorjs.com/docs/apis/preferences)
- Resolve the async storage boundary deliberately: hydrate a validated in-memory
  profile before `startGame()`, serialize native writes and await durable writes
  at critical checkpoint/reward boundaries. Do not drop an asynchronous plugin
  into the current synchronous `store` interface and report success before commit.
  Define recovery for partial writes so a crash cannot double-pay run rewards.
- Preserve key names/schemas, test namespaces and reset scope. Migrate legacy
  data without deleting the source until persistence is confirmed; test upgrades
  with disposable profiles. Restored checkpoints retain current encounter-boundary
  semantics rather than promising frame-perfect recovery.
- Audit safe areas, resize/orientation, scrollable menus, touch targets, readable
  text and control hints. Ensure pause/help/privacy/restore controls are reachable
  by touch. Provide a haptics toggle.
- Share generated PNGs through a temporary app-cache file and native share sheet;
  clean up files. Avoid unnecessary photo-library permissions.
- Omit testing/admin entry points from public native release builds. Preserve
  isolated QA tools in dedicated test builds; also use a release-equivalent beta
  build before submission.

Exit: offline play, resume, saves, app updates and sharing pass on Android first
and on iOS during its later phase;
browser controls and save compatibility remain intact.

### 3. Monetization and privacy integration

Owner: implementation owner for integrations; publisher for products/disclosures.

- Add separate ad, purchase and consent adapters and a touch-accessible settings
  surface for Remove ads, Restore purchases, privacy choices and support.
- Set up ad units and matching non-consumable products in both store consoles.
  Confirm paid-app agreements, tax/banking and ad-network payment details.
- Add verification/entitlement reconciliation, frequency caps and safe callbacks.
  Test the exact ad and purchase flows in the proposed monetization section.
- Inventory every SDK's collected/shared data, permissions and network endpoints.
  Publish privacy and support pages and link the privacy policy in the app.
  Complete Google Data safety and Apple App Privacy declarations from the actual
  shipped SDK behavior. Do not claim no data collection once advertising SDKs are
  included. [Google Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- For AdMob, implement its required regional consent flow and a way to reopen
  privacy choices. Non-personalized ads do not automatically eliminate consent
  requirements. [AdMob ad-serving and consent guidance](https://developers.google.com/admob/android/privacy/ad-serving-modes)
- On iOS, request ATT permission if the configured SDK behavior tracks across
  companies' apps/sites or accesses the advertising identifier. Denial must not
  block play; test all authorization states. Prefer a configuration that minimizes
  tracking, but verify the actual SDK behavior.
  [Apple privacy and ATT guidance](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- Add required Apple privacy manifests/reason declarations for the chosen plugins
  and SDKs. Set audience and age-rating answers from the game's combat and ads;
  evaluate child-directed requirements if that is the intended audience.

Exit: sandbox transactions and test ads pass for the target store; privacy disclosures
match the signed candidate. Core gameplay still works without network access.

### 4. Beta and store preparation

Owner: implementation owner for signed builds; publisher/testers for beta/listings.

- Android: create a signed Android App Bundle (AAB), configure Play App Signing,
  back up the upload key securely, upload to internal testing and then closed
  testing as required. Inspect Play's pre-launch report and native compatibility.
- iOS: configure signing/provisioning, archive with Xcode, upload to App Store
  Connect and distribute through TestFlight. External testing may need beta review.
  [TestFlight workflow](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
- Prepare icon, launch screen, actual-device screenshots, Play feature graphic,
  descriptions, categories, support/privacy URLs, ads/IAP disclosures, age ratings,
  export-compliance answers and review notes. Explain swipe/parry controls and
  offline gameplay; give reviewers a reachable way to test the purchase/restore UI.
- Run complete ordinary playthroughs and every shipped mode, Trials, equipment,
  Temple, teaching and results flows. Include older supported and recent devices,
  small/notched phones, both orientations, OS minimum/latest and current WebViews.
- Test clean install, app update with progress, process death, corrupted data,
  interrupted result settlement, rapid suspend/resume, permission/consent refusal,
  offline launches, ad failure and canceled/duplicate/pending/restored purchases.

Exit: no unresolved launch-blocking crashes, lost progress, reward duplication,
failed entitlements, clipped essential controls or timing regressions. Keep a
device/build evidence checklist with beta feedback and resolved issues.

### 5. Submission, launch and maintenance

Owner: publisher submits/releases; implementation owner fixes findings.

- Submit the signed candidates and IAP for review. Allow time for rejections and
  resubmission; approval and review duration cannot be guaranteed.
- Use controlled initial availability and monitor crash/ANR reports, save reports,
  purchase failures and ad complaints. Expand after the initial evidence is sound.
- Archive source revision, lockfile, build environment, signed artifacts and debug
  symbols for each release. Keep signing secrets outside Git and protect releases
  in CI. A store hotfix uses a new signed build; shipping the website does not
  update installed apps.
- Maintain SDK/store deadlines, billing and ad dependencies, certificate access,
  privacy disclosures and support. If a release regresses, halt further rollout
  where possible and ship a forward fix; users cannot be assumed to downgrade.

Exit: the target store listing is live, installable and supported, with a reproducible
update process and a named person responsible for publisher accounts and support.

## Store requirements and costs checked for this plan

| Item | Planning requirement |
| --- | --- |
| Apple account | USD 99 per membership year; local pricing may differ. Individual/organization choice affects seller identity. [Enrollment](https://developer.apple.com/programs/enroll/) |
| Google account | USD 25 one-time registration fee plus identity/account setup. [Play Console registration](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en) |
| New personal Google account | Accounts created after 13 November 2023 require at least 12 opted-in testers continuously for 14 days, followed by an application for production access. Meeting the test threshold is not automatic approval. [Testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en) |
| Android target | New mobile submissions/updates currently require Android 16/API 36 or higher from 31 August 2026. This target is separate from the oldest supported Android version. [Target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-gb) |
| Android native libraries | Inspect bundled SDK libraries and test 16 KB page-size compatibility before submission. [Android compatibility guidance](https://developer.android.com/guide/practices/page-sizes) |
| Apple build SDK | Since 28 April 2026, uploads require Xcode 26+ and the iOS 26 SDK or later. This does not mean every player needs iOS 26; deployment target is a separate choice. [Apple SDK requirements](https://developer.apple.com/news/upcoming-requirements/?id=04282026a) |
| Apple review | Deliver lasting entertainment and a polished app experience; packaging alone does not ensure acceptance under minimum-functionality review. [Review guidelines](https://developer.apple.com/app-store/review/guidelines/) |

Budget separately for macOS access, test devices, entitlement hosting/service,
support hosting/domain if needed, store revenue deductions and ongoing maintenance.
Confirm current regional commercial terms before setting prices or projecting net
revenue. No hardware purchase, enrollment, service signup or submission is
authorized or performed by this planning document.

## Verification and versioning

During implementation, target changed storage/input/lifecycle/purchase tests first
and run strict TypeScript checks. Add useful tests for failure/recovery boundaries,
not tests that merely duplicate adapter calls. Native device tests supplement the
existing browser suite; desktop emulation cannot certify native dialogs or timing.

Before release, run unit tests, the full browser suite and production verification.
`test:production` already builds/type-checks; do not repeat those immediately
beforehand. Follow the isolated-output alternative in
[local development](../development/local-development.md) when verification must
avoid touching generated `dist/`. Also build/sign the Android release candidate
and run installed-app smoke tests after Capacitor sync. Repeat native release
verification for iOS when that phase starts.

The planning document originally left version **1.9.0** unchanged. Approved
Android prototype implementation advances the app to **1.10.0**.
Keep `package.json`, `package-lock.json`, the title screen and native
marketing versions aligned. Android `versionCode` and iOS build numbers increase
for every uploaded candidate, including repeat builds of the same marketing version.

## Sequence, effort and remaining decisions

Suggested sequence: Android tooling/accounts -> Android prototype -> persistence
and lifecycle -> mobile polish -> ads/IAP/privacy -> Play beta -> store review ->
Android launch -> iPhone prototype and release work.
Recruit Google closed-test participants early. Mac access is a dependency for the
later iPhone phase rather than the Android launch.

Initial planning estimate: **4–8 engineering weeks**, with **6–10+ elapsed weeks**
assuming one developer working full time and prompt hardware/account access.
Treat these as rough estimates, not a
deadline; part-time work, monetization services, failed performance gates, required
closed testing and review can extend the calendar substantially. Re-estimate after
the installed prototype, using measured gaps rather than this initial range.

Decisions to record before the related implementation:

1. Publisher identity/account type, app identifiers, launch regions and audience.
2. Borrowed/rented/owned Mac or hosted macOS workflow, spending limit and real
   iPhone access.
3. Minimum device/OS range, orientation behavior and tablet availability.
4. Approval of proposed between-run ads + Remove ads model, frequency and price;
   selected ad bridge and entitlement verification/service.
5. Whether browser-progress transfer is required at launch; otherwise explain
   separate progress and the limits of uninstall/reinstall recovery.

The current implementation-sized task is completing milestone 1: an installable
offline Android build on the user's phone, with performance and input evidence. Complete it before
adding commercial SDKs so the technical route is proven early. Keep GitHub Pages
deployment and web monetization scope unchanged during this Android phase.
