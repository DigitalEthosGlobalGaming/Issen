# Release 1.12

Status: implemented in **1.12.0** on 1 October 2026, following 1.11.0.

This release makes rare blessings less common early in a run, removes lingering
death shadows, varies perfect-cut reactions, adds Options with controls and
accessibility submenus, and shortens Trial reward requirements in the Armoury.

## Blessing rarity

Previously each ordinary choice rolled a 30% rare chance, producing a 65.7%
chance of at least one rare in a three-choice first Shrine before bonuses.
The base chance now follows bosses defeated in the current run:

| Bosses defeated | Rare chance per ordinary choice | At least one rare in three ordinary choices |
| --- | --- | --- |
| 1 | 8% | 22.1% |
| 2 | 12% | 31.9% |
| 3 to 4 | 18% | 44.9% |
| 5 to 6 | 24% | 56.1% |
| 7 or more | 30% | 65.7% |

The last column is illustrative, excluding inserted curses, bonuses, guarantees,
extra choices and exhausted pools. A curse occupies one slot with the existing
40% roll from boss two. Equipment/Temple rarity bonuses remain additive and
clamped to 0–100%; guaranteed rares remain effective from the first Shrine.
Selection within a tier remains uniform, unique, mode-filtered and safe when
pools exhaust. Exhausted commons can force rare fallback. Waves and Boss Rush
share the curve; Boss Rush retains its curated pool, and Trials retain fixed rules.

[shrines](../../src/game/shrine/blessings.ts) own these rules. Offers use the
existing seeded gameplay stream. Checkpoints restore saved offer IDs exactly;
future Shrines use the new balance without changing the RNG algorithm or save
identities. The final curve uses the approved starting values; human progression
playtesting can inform a later adjustment.

## Enemy shadows and animation variety

[Death presentation](../../src/rendering/figures/death.ts) defines six typed
styles: split, kneel, stagger, disarm, directional fall and crumple. Ordinary
kills use weights of 25%, 15%, 15%, 15%, 20% and 10%, respectively. Perfect kills
use 60% split, 25% fall and 15% crumple while retaining perfect-cut sound, scoring
and impact feedback. Bonk uses kneel, stagger, fall and crumple, never splitting
or disarming. Knife kills retain stagger; standoff kills and bosses retain split.
The style is selected once using cosmetic randomness, independently of combat RNG.

The directional fall lays the body along the horizontal cut direction (vertical
cuts choose a cosmetic fall direction). Crumple compresses the body near its feet.
Split enemies expire after 0.9 simulation seconds, other enemy styles after 1.1;
boss split rendering remains 1.6. Shared definitions keep enemy expiry and poses
aligned. Reduced motion substitutes a restrained sinking/fading enemy reaction.

The runtime captures the original ground position at death and the explicit
[figure renderer](../../src/rendering/figures/figure.ts) draws one shadow there,
independently of body rotation or split fragments. Shadows fade immediately and
vanish after 0.4 seconds for enemies or 0.7 for bosses of unpaused elapsed time.
This separate raw-time timer prevents hit-stop/slow motion stretching the shadow.
Pause and guided freezes hold it; body and combat clocks keep their existing
behavior. Removal and encounter transitions remove the corresponding visual.
Resize reprojects the ground position. Armoury demo shadows use their own clock.

The previous tests established simulation-time expiry but could not rule out
real-time lingering or transformed shadows on non-split deaths. New browser
instrumentation verifies the actual grounded transform and absence of the shadow
while each of the six bodies remains visible under small slowed steps.

## Options and saved preferences

**Options** is available from the title and pause screens. Its root links to
**Audio**, **Controls**, and **Display and Accessibility**, with current summaries.
Each category has Back; the root has Done. Escape and browser/Android Back return
one level, with binding capture cancelled first. Opening from pause preserves the
encounter; Done returns to pause, and Continue remains a separate action.
Keyboard focus stays within Options and returns to its opening button on exit.

| Category | Settings | Default |
| --- | --- | --- |
| Audio | Master mute, sound effects volume, ambience volume | Existing mute preference; both channels 100% |
| Controls | Control reference, swipe sensitivity, keyboard bindings | Normal sensitivity, arrows/WASD, Space and P |
| Display and Accessibility | Reduced motion, reduced flashes, interface text, effects quality, vibration | System motion/flashes, Normal text, Auto quality, vibration enabled where supported |

Audio changes apply immediately. The HUD mute button agrees with Options and
muting retains channel volume choices. The game has environmental ambience rather
than a separate music channel, so no inactive music slider is shown.

Controls can remap each cut, tap/parry/knife and pause/resume action. Capture
rejects conflicts and reserved menu/modifier keys; Escape always remains available.
Restore default bindings changes bindings only. Low sensitivity uses 1.35 times
the original distance threshold; High uses 0.75. Equipment threshold modifiers
remain effective, and combat timing/directions are unchanged.

Reduced motion suppresses camera shake/zoom, moving decorative figure details,
film movement and excessive particles, and softens enemy death motion. Reduced
flashes limits screen flashes and fast cosmetic flicker, retaining readable boss
glints and attack cues. System follows the OS reduced-motion preference, while
On/Off override it. Gameplay hit-stop, slow motion, hazards and timing stay intact.
Large text enlarges interface copy and uses responsive/scrollable layouts.
Auto effects density retains the frame-budget adaptation; Low fixes density at
0.3 and High at 1. Reduced motion caps cosmetic density at 0.3. Unsupported
vibration is indicated with a disabled control. Previews receive presentation
preferences explicitly without borrowing gameplay particle/random state.

Each category has Restore defaults and explains that only that category changes.
Labeled native controls show slider values, visible focus and touch targets.
[Options](../../src/ui/screens/options.ts) owns category navigation, capture,
focus and browser history. Android's activity forwards Back only while Options
is open, preserving the activity default elsewhere.

[Settings validation](../../src/platform/settings.ts) uses schema version 1 in
`issen.settings`, through the profile-aware storage adapter. It migrates
`issen.muted` and synchronizes that legacy key on changes. Missing or malformed
fields receive defaults; volumes clamp to valid ranges, and incomplete/conflicting
binding maps fall back to defaults. Storage failures remain non-fatal. Testing
uses `issen.testing.settings`, and profile reset includes the new record.
Preferences apply to the runtime without replacing checkpoint loadouts or offers.

## Armoury requirements

[Trial reward catalog copy](../../src/game/content/trials.ts) now reads
`Complete the <trial name> trial.` Locked and owned item requirements and shared
reward reveals no longer append `Trials unlock at Ronin wave 10.` Reward IDs,
ownership, completion rules and the actual Ronin wave 10 mode gate are unchanged.

## Verification and release

Focused checks cover rarity boundaries and samples across 5,000 seeds per boss
band, modifier/guarantee stacking, pool exhaustion, death selection and expiry,
raw-time shadow fading, settings validation, audio mixing and haptics gating.
Browser coverage includes actual shadow transforms, pause-state and RNG isolation,
legacy mute, sliders, reload, binding conflicts/cancellation, category defaults,
Back/history behavior, focus, profile isolation and layout overflow.

The implementation bumps package.json, both lockfile version entries and the title
screen to 1.12.0. Android versionName follows package.json; a Play upload still
needs a versionCode greater than the last uploaded build.

Automated release checks passed: 153 unit tests, 106 browser tests, two production
asset tests and five offline Android asset tests, along with strict TypeScript
and formatting checks. The Android debug APK compiled successfully with the final
release assets. Visual review
includes Options and Large-text Armoury in portrait/landscape and a contact sheet
of all six death styles. Physical Android Back/vibration, audio comfort and the
feel of the rarity curve still require a device/human playtest. No player saves
were cleared, no generated dist files were edited, and no release was published.

## Follow-up fix in 1.12.1

Killed enemies also spawned a dark ink ground mark independently of the figure
shadow. These marks previously remained for six simulation seconds (eight for
bosses), making them linger further during slow motion. They now fade immediately
and expire after 0.4 unpaused seconds for enemies or 0.7 for bosses, using the
unscaled effects clock. Regression coverage exercises an actual kill and checks
that both dark ground effects disappear while the death body remains visible.

Follow-up verification: strict TypeScript and five effect unit tests passed.
The 107-case browser run passed 105 cases initially; the two timing failures
passed on a focused rerun. Both death-rendering regressions and all five offline
Android asset tests passed. The debug APK compiled successfully.
