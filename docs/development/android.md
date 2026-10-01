# Android development and release

The first native target is Android, using the shared game inside Capacitor 8.4.3.
Production application ID: `com.digitalethosglobalgaming.issen`. Debug installs
use `com.digitalethosglobalgaming.issen.debug` and the label **Issen (test)**.
Current version: 1.12.1; the native version name reads `package.json`.

## Tooling

Use Node 24, Java **21**, and Android SDK platform/build-tools **36**. The app
targets API 36 and currently permits Android 7/API 24 or later; the minimum is
provisional until device testing. Gradle may install its own compatible Build
Tools revision as well.
Android Studio is the easiest maintained setup: install the SDK, open `android/`, let
Gradle sync and select its Java 21 Gradle JDK. Set `ANDROID_HOME` to your SDK path
when using the command line, or let Studio write ignored `android/local.properties`.
Java 25 installed on this PC is incompatible with this Gradle wrapper.

The user authorized a portable Java/command-line SDK setup in ignored
`.android-tools/`. If available locally, configure the current PowerShell session:

```powershell
$env:JAVA_HOME = (Get-ChildItem .android-tools/java -Directory | Select-Object -First 1).FullName
$env:ANDROID_HOME = Join-Path (Get-Location) '.android-tools/sdk'
$env:GRADLE_USER_HOME = Join-Path (Get-Location) '.android-tools/gradle-cache'
$env:PATH = "$env:JAVA_HOME/bin;$env:ANDROID_HOME/platform-tools;$env:PATH"
```

Tools are local prerequisites, not shipped game assets. CI installs its own Java
and SDK. First builds need internet for Gradle/Maven dependencies.

## Build and install on the Pixel
Before publishing source, keep signing material and local tooling out of Git.
The root `.gitignore` excludes `.android-signing/`, `.android-tools/`, real
`.env` files, exported keys/credentials, build outputs and local IDE state.
Only sanitized `.env.example` / `.env.*.example` templates may be committed.
Android source, branding assets and the Gradle wrapper belong in Git.
Ignore rules do not remove files that are already tracked; check
`git ls-files -ci --exclude-standard` before publishing.


```powershell
npm ci
npm run android:apk
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`. This is a debug-signed
prototype, not a Play release. Copy it to the Pixel, open it and allow installation
from the app used to open the file. Alternatively enable Developer options and USB
debugging, connect by USB, accept the computer authorization on the phone, then:

```powershell
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

`npm run android:run` builds/syncs and runs on a connected device.
`npm run android:open` opens Android Studio. Record the exact Pixel model/Android
version when testing; “latest Pixel” is the current intended test device.

After code changes run `android:sync` before building directly in Studio.
Android assets live in `.mobile-build/`, with relative URLs, local font files and
the OFL license. The installed game contains no remote-server URL. Generated
native assets and build folders are ignored; never edit them as source.
Normal `build` and `build:pages` keep their existing web behavior.

The manual **Android test APK** GitHub Actions workflow can build a downloadable
APK after these changes are pushed. Open Actions, run the workflow and download
the `issen-android-debug` artifact. That workflow has not been dispatched by this
implementation and does not publish to Play. Its temporary runner debug key can
change between builds, so use local builds for repeated installs with one stable
debug signature; preserve saves before reinstalling an incompatible signature.

## Prototype acceptance

Observed on 30 September 2026: debug Gradle compilation and APK signature
verification passed; APK metadata matches the debug identity/version, API 24
minimum and API 36 target. The APK is approximately 28 MB and contains the local
entry, fonts and license. Strict type checking, 138 unit tests, two Android asset
tests and two existing production browser tests passed. An isolated Pages build
retains `/Issen/` asset URLs. No phone was connected; native device checks remain open.

`npm run test:android-web` verifies offline startup/fonts, touch menus, landscape
pause layout and encounter recovery against compiled Android assets. It runs in
desktop Edge, not an Android emulator or a physical WebView.

On the Pixel test airplane-mode cold launch, swipes/parries, first-run tutorial,
Armoury/Temple, portrait/landscape, screen edges, audio after background/resume,
Android Back, reload/relaunch recovery and at least a 20-minute session for heat
and timing. Check native WebView logs with `adb logcat` or Chrome remote inspection.
Do not clear real player saves to test recovery.

Saves still use `issen.*` WebView localStorage. The debug and release apps have
separate storage, also separate from GitHub Pages. Native durable persistence,
Back/lifecycle handling, share sheets and haptics remain the next milestone.
Splash resources use the checked-in [Issen master artwork](../../assets/branding/issen-splash-v1.png).
Run `./scripts/generate-android-splash.ps1` on Windows to regenerate all eleven
`drawable*/splash.png` resources at their existing sizes. The artwork is centered
and scaled to fit on charcoal padding, preserving its proportions in both orientations.
Launcher icons use the [transparent Issen foreground](../../assets/branding/issen-launcher-foreground-v1.png)
on a charcoal background. Run `./scripts/generate-android-icons.ps1` on Windows
to regenerate the fifteen legacy, round and adaptive foreground PNGs. Adaptive
foreground artwork fits inside the central 66dp safe circle of the 108dp layer.
Physical-device launch appearance and launcher masks remain to be verified. No AdMob or
RevenueCat SDK is enabled yet; physical-device acceptance precedes monetization.

## Signed bundle for Google Play

For the common listing's Feature graphic field, use
[issen-feature-graphic-1024x500.jpg](../../assets/play-store/issen-feature-graphic-1024x500.jpg).
It is a verified 1024x500 RGB JPEG, 61,207 bytes, exported from the existing splash
branding. This is separate from the square app icon and the 16:9 PC feature graphic.
`scripts/prepare-play-store-images.ps1` maintains the feature export.

The listing icon is [issen-play-store-icon-512.png](../../assets/branding/issen-play-store-icon-512.png),
a 512x512 full-square, opaque 32-bit PNG exported from the launcher master onto
the matching dark background. Regenerate only this listing asset with
`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-android-icons.ps1 -PlayStoreOnly`.
The export is separate from the APK's adaptive launcher resources; Play applies
the listing mask and shadow. The initial export is 92,921 bytes, below 1 MB.

Create a Play developer account/app and a private upload keystore. Keep the
keystore backed up outside Git; configure Play App Signing. Use the same package
identity and upload credentials for updates.

### Windows signing helper

To keep credentials locally inside this checkout, run from the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/android-signing.ps1
```

It prompts for a password of at least 12 characters. Save your chosen password in
your password manager for recovery. The helper creates `.android-signing/issen-upload.jks`
(a password-encrypted PKCS12 keystore) and `.android-signing/upload-password.clixml`
(Windows DPAPI-encrypted credentials). The folder is Git-ignored and its NTFS
permissions allow only the initializing Windows user and SYSTEM. Existing signing
files are never overwritten. It refuses linked signing directories and tracked
signing files. No password is printed or placed in keytool's command arguments.

For future signed builds with those stored credentials:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/android-signing.ps1 -Action Build -VersionCode 1
```

Increase the version code for subsequent uploads. The helper uses the portable
Java/SDK when present, otherwise the configured Java/SDK. It restores environment
variables after the build. The password is briefly decrypted in process memory
and child-process environment variables for signing.

DPAPI decryption requires the same Windows account on the same PC. Codex must run
the helper under that account (outside its separate sandbox identity when needed).
These credentials are not usable as GitHub Actions secrets in their encrypted
form. Back up the keystore securely and retain the password separately; copying
the XML alone does not provide recovery on a replacement PC. Git-ignore and
file permissions do not replace protection of the Windows account or disk.

### Explicit signing environment

Alternatively, supply your own existing keystore through environment variables:

```powershell
$env:ISSEN_UPLOAD_STORE_FILE = 'C:/private/issen-upload.jks'
$env:ISSEN_UPLOAD_KEY_ALIAS = 'issen-upload'
$env:ISSEN_ANDROID_VERSION_CODE = '1'
# Set ISSEN_UPLOAD_STORE_PASSWORD and ISSEN_UPLOAD_KEY_PASSWORD privately.
npm run android:bundle
```

All five variables are required. The keystore path must be absolute. The release
build fails without signing credentials; credentials are never shell arguments
or checked-in configuration. `versionCode` must increase for each Play upload
(positive integer up to 2100000000). `versionName` follows the app's SemVer.
Output: `android/app/build/outputs/bundle/release/app-release.aab`.

Upload the AAB to Play Console **Internal testing**, add your Google account as a
tester and install through Play's opt-in link. An AAB is not directly installable
like an APK. On 30 September 2026, the saved Windows signing credentials produced
`app-release.aab` successfully and `jarsigner -verify` passed. Its release manifest
uses `com.digitalethosglobalgaming.issen`, version 1.10.0, version code 1 and target
API 36. Play upload and installed-release validation remain pending.

Before production, finish the remaining native/monetization milestones, install
and test the signed release, complete the listing/screenshots, privacy policy,
Data safety, ads, audience/content rating and any closed-testing requirement.
Use real Google Play RevenueCat configuration for Play builds; a RevenueCat Test
Store key must stay debug-only. Refer to the [release plan](../features/mobile-store-release-plan.md)
for Premium product setup and launch gates.

Official references: [device setup](https://developer.android.com/studio/run/device),
[app signing](https://developer.android.com/studio/publish/app-signing),
[Capacitor Android](https://capacitorjs.com/docs/android).
## Premium purchase configuration

Version 1.11.0 adds an optional supporter purchase. See
[Premium supporter purchase](../features/premium-supporter.md) for the public SDK
key, non-consumable product/entitlement mapping, debug-only Test Store setting and
physical Google Play sandbox checks. Premium is paused for closed testing:
`VITE_PREMIUM_ENABLED` defaults to false and hides every paid feature. Keep it false
even if SDK keys are already configured. Missing configuration also disables checkout.
Use version code 2 or higher for an update to the first internal-testing upload.

## Options and device Back in 1.12

The Android activity forwards Back to the Options screen while it is open.
Back cancels binding capture, returns from a category to Options, then closes
Options to its opening screen. A run stays paused throughout. Outside Options,
Back retains the activity default. Validate this dispatcher on the Pixel, along
with vibration support, audio controls, Large text and portrait/landscape layouts.
Desktop browser dispatch tests cover the web handler, not the hardware gesture.
