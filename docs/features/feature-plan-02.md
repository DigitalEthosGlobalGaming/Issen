# Feature set 02 — environments, upgrades and awakenings

Status: implemented and regression-tested in the working tree.
This record supersedes the earlier draft and records the selected rules. Acceptance
notes below remain useful for future changes and subjective playtesting.
The [first feature record](next-feature-plan.md) supplies the earlier baseline.

## 1. Trees and the low-life warning

The existing procedural ink style remains. Pine shapes now have small deterministic
variations in lean and canopy proportions, including shore lean; stage scenery
retains the existing composition. No asset pipeline or new tree system was added.

At one remaining life, the visual edge pulse remains and its heartbeat sound is
removed. The brief vibration remains. Combat audio and the existing edge-warning
visibility rules are unchanged; no new heartbeat sound is scheduled.

Acceptance: compare representative stages in portrait and landscape; enemies,
rings and blade directions must stay clear. Verify the silent pulse with all
Normal starting-life counts and after healing, pausing and dying.

## 2. Browsable Temple collection

Temple (formerly labelled Template) has seven selectable illustrated tiles and a details panel.
Portrait layouts use smaller readable copy and a centred icon above the details.
Tiles show numeric prices, without affordability shortfalls. The Temple shows the
current balance; lifetime Ember earnings are shown in Stats.
Selection never purchases. Details show owned rank, current/next effects, cost,
prerequisites and maximum state. Purchasing preserves selection and updates the
balance. Donations are final and benefits are captured at the next eligible run.

| Upgrade | Effect | Rank costs in Embers | Maximum rank |
| --- | --- | --- | --- |
| Vitality | +1 Normal starting life/rank | 100, 200, 350 | 3 |
| Focus | +5% parry window/rank | 75, 150, 225 | 3 |
| Offerings | +1 choice; rank 2 adds +20 percentage points rare chance; rank 3 adds 1 guaranteed rare | 150, 250, 400 | 3 |
| Awakening Access | Rank 1: weapon challenges; rank 2: outfit challenges | 200, 300 | 2 |
| Throwing Knife | Unlock knives, then +1 capacity per rank, to 3 | 125, 150, 250 | 3 |
| Composure | Protect one otherwise unprotected combo break/rank/run | 175, 300 | 2 |
| Recovery | Heal every six cleared waves; every three at rank 2 | 200, 350 | 2 |

Template combat bonuses remain restricted to Normal Waves with arrows shown,
Normal lives and upgrades On. Challenge modes do not receive these bonuses.
Awakening Access is an ownership gate and remains visible in the Armoury; earned
equipment forms can be selected independently of the Template combat eligibility.
Composure is spent after existing equipment/blessing protection. Recovery heals
only after cleared-wave milestones and never exceeds the current life cap.

Offerings ranks are cumulative. The extra choice adds to equipment choice bonuses
(for example, a five-choice robe plus Offerings produces six choices). Rare-roll
bonuses add to the base 30% chance and clamp to 0–100%. Each rare-guarantee source
adds one guaranteed rare choice, limited by the offer count and remaining eligible
rare blessings. Guarantees replace non-rare offers without duplicating blessings.

Acceptance: selection, affordability, prerequisite and max-rank states must be
clear in narrow/wide layouts. Rejected purchases cannot charge; reload preserves
balance, ranks and the chosen eligible next-run effects.

## 3. Throwing knives

During ordinary waves a tap (Space on keyboard) consumes one charge to defeat a
random living targetable enemy. No target/no charges means no charge or punishment.
The HUD shows charges and a brief projectile/hit effect explains the result.
Charges reset on each run to the Throwing Knife rank (1–3). Schema version 4
merges old Knife plus Pouch purchases into the same capacity without charging.

Boss taps only parry and never spend knives; standoffs retain their existing
timing rules. UI, tutorial and pause interactions do not spend charges. A pointer
gesture resolves as a tap or a swipe, never both. Knife hits award ordinary kill
score and currency and count as general kills; they do not increment the combo,
perfect-cut counters or equipment kill/perfect/combo challenge actions. Their score
still contributes to the aggregate end-of-run score challenge.

Acceptance: test random valid target selection, no-target/empty behavior, ordered
waves, bosses, standoffs, pauses, keyboard and swipes. A knife must not complete an
ordered swipe chain or open a boss.

## 4. Upgrades toggle and life rules

Setup offers **Temple upgrades: On / Off**. Its summary shows life totals above
the two-life baseline and nonzero knives or combo protections; it omits empty
baseline text. Difficulty appears after Ronin unlocks, and Lives appears after
Vitality rank 1 unlocks its special options. The choice is saved and captured at
run start. Off leaves equipment and mode choices intact, but suppresses Temple
bonuses, consumable abilities and awakened equipment powers. Purchases, access,
unlocks and selected forms remain owned. Armoury shows base stats and an explicit
suppression message.
Eligible challenge progress still accrues after access with upgrades Off.

**Normal lives** starts at two. Vitality raises the baseline to three, four and
five. Equipment adds its life modifier with a minimum of one and no total cap.
Jinbaori adds two lives, so max Vitality plus Jinbaori starts at seven. Shrine
life increases can raise the maximum further; healing stops at that run maximum.
Monk Hood adds one shrine choice (two when awakened), stacking with Offerings.
Yoroi replaces its life bonus with +10% earned Embers; awakened Yoroi grants +20%
and retains its ward. These bonuses apply to kill, wave and boss rewards. Fractional
bonuses carry between rewards and reloads using `issen.meta.emberRemainder`.
One-hit-death and Endless remain separate. The saved Normal-life identifier remains
`'3'` for compatibility; player text no longer promises a fixed three.

Existing Vitality rank 1 migrates once to rank 2 in metadata schema version 2,
preserving the old four-life starting benefit. Unpurchased profiles adopt the
two-life baseline. Existing score keys are retained; upgrades-off runs use new
`-base` suffixed record keys and an explicit upgrades-off label.

Acceptance: validate fresh lives, all ranks, negative equipment modifiers, stacking,
healing and migration. Changing setup or buying during a run must not refill
consumables or apply permanent power mid-run.

## 5. Access, challenge, activation

Awakening Access gates both progression and Armoury presentation per category.
Rank 1 unlocks weapon challenges; rank 2 unlocks outfit challenges. Before the
required rank there are no badges, requirements, progress gains or powers for that
category. After purchase, owned equipment shows requirements/progress. Completed challenges show activation
instructions; their power text remains hidden until explicit activation.
Selecting/equipping a tile then tapping it again activates the form. Returning
to normal hides its powers again.

Active benefit and tradeoff replace the base stats in yellow, without a separate
active-state label. Blade and outfit choices are independent. Activated modifiers
replace their category's base source before the ordinary modifier composition.
Off suppresses both forms' gameplay effects and visuals.

`issen.awakening` stores separate blade and outfit challenge records. New play
before access never enters these records; general lifetime statistics continue.
Migration copies existing blade progress once, and pre-version-2 awakened unlocks
grant access. A version-2 access reset remains reset on reload. Existing progress without a completed awakening remains preserved
behind the purchase gate. No general lifetime totals are retroactively converted
to new challenge progress. Secret equipment must be owned before its challenge
or identity is shown.

Schema version 3 preserves an existing purchased combined awakening upgrade as
rank 2, without charging again. New rank-1 purchases stay rank 1 on reload.
Existing Vitality ranks and explicit access resets remain unchanged.

The admin **Clear test profile** action requires confirmation, removes only
`issen.testing.*` saves and reloads into a fresh test profile. Queued saves from
the departing runtime are suppressed; player saves are never removed.

Admin **Unlock all** grants all Armoury items, including secret items and awakened
forms, and removes their test revocations. It also grants at least Vitality rank 1
to expose Endless and No lives. It does not alter other Temple ranks, currency,
equipped gear or player-profile saves. Awakening-access ranks still gate the forms.

Acceptance: verify all four access/challenge/activation states, independent forms,
new-profile no-access play, migration, upgrades Off, and secret-item protection.

## 6. Every outfit awakens

All 20 robes, including Sumi and the two secret outfits, have distinct challenges,
benefits, tradeoffs and visual accents. The [outfit content sheet](outfit-awakenings.md)
documents every entry. Progress is tracked while wearing the outfit using
independent counters; it is not borrowed from the equipped blade.

Fabric accents and a restrained body aura identify active outfits in the live
figure and isolated Armoury preview. The aura is independent of sword aura and
particle state, and respects figure/death opacity.

Acceptance: every catalog robe has an earnable definition, all challenges unlock,
each active preview differs, and simultaneous blade/robe effects compose while
respecting life limits and upgrades Off.

## Ownership and verification

- `src/game/progression/meta.ts`: versioned metadata, catalog, prices,
  prerequisite checks, eligible modifiers and consumable snapshots.
- `src/game/progression/awakening-progress.ts` and `unlocks.ts`: independent
  gated challenge records and awakening eligibility.
- `src/game/progression/run-powers.ts`: run-local combo protection and healing cadence.
- `src/game/content/robe-awakenings.ts`: all outfit challenge/effect/visual data.
- `src/game/combat/knife.ts`: target selection and charge spending.
- `src/ui/screens/template.ts`, `setup.ts`, `armory.ts`: selection and presentation.
- `src/rendering/scene/background.ts`: modest procedural tree variation.
- `src/rendering/figures/types.ts`, `figure.ts`: independent robe aura.
- `src/game.ts`: event wiring, life changes, equipment appearance,
  consumable effects, HUD and persistence.

Use strict TypeScript, relevant rule/save tests and browser flows. Focused tests
include `robe-awakenings.test.mjs` (complete catalog), `robe-aura.test.mjs`
(stateless opacity-preserving visuals) and `outfit-awakenings.spec.ts` (Armoury
gates, activation, suppression and secret protection). Broader integration checks
must cover knife input, metadata migration, Template browsing and run initialization.
Visual review must include multiple stages and orientations. Audio review must
confirm the low-life warning is silent.

Use isolated test profiles; never clear player saves. Preserve existing
`issen.*` keys, keep previews independent and do not edit generated `dist/` files.

### Verified 2026-09-27

- Strict TypeScript and all 89 unit tests passed.
- All 48 browser tests passed serially, including real-runtime knife boss exclusion,
  Template prerequisites, upgrades-off records and independent outfit activation.
- Production bundle built into ignored `.verification-build-next-features/`;
  both production smoke tests passed. Generated `dist/` was left untouched.
- Source/test formatting and Git whitespace checks passed.
- Reviewed Template portrait layout and four representative stage backgrounds in
  portrait/landscape. The low-life heartbeat call is absent from the render loop;
  subjective balance and audio/visual feel remain playtesting concerns.

### Mobile Temple follow-up

The title and setup use compact portrait typography while retaining 44px touch
targets. Default unlocked setup and title fit at 360×640 and 390×844; natural
scrolling remains available for smaller screens, reveal cards and enlarged text.
Temple details use a centred top icon and omit challenge-mode/Off warnings and
lifetime earnings from this screen. The underlying eligibility rules are unchanged.
Player-facing naming is now **Temple**; internal `template` identifiers remain
stable. Lifetime Ember earnings are displayed in Stats.

Follow-up verification: strict TypeScript, formatting, 93 unit tests, 51 browser
tests and both production smoke tests passed. Portrait Temple/setup screenshots
were reviewed. No real player saves were cleared.
