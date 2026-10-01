# Editions, haptics and mastery rewards

Status: implemented in 1.13.0 on 1 October 2026. This document preserves the
discussion-stage proposals; [implemented rules](editions-and-mastery.md) resolve
the choices. Android packaging/device verification is deferred. This plan
complements [feature plan 07](feature-plan-07.md).

## Scope and decisions

Introduce Free, Premium and Web editions, distinct combat vibration, three kill
effects, two Temple upgrades, a charm and two Trials. Keep the existing combat
actions and encounter flow; additions should use existing progression, equipment,
Shrine and Trial systems where possible.

The user selected Falling Leaves, Ember Ash and Ink Wash for this release.
Dissolve was an earlier idea with a 300-lifetime-perfect-cut requirement, but is
not in the selected batch. Do not transfer that requirement to another effect
without a decision. Other brainstormed cosmetics, upgrades and charms are outside
this plan.

## Editions and feature access

| Edition | Intended behavior |
| --- | --- |
| Free | Default mobile edition. Existing free content remains available; new Premium content is visible with a clear Premium lock. |
| Premium | Paid mobile access, or a deliberately configured Premium build for beta/testing distribution. |
| Web | All edition gates open; no Premium purchase required. |

Use one feature-access policy rather than scattered platform checks. Proposed
build setting: `VITE_GAME_EDITION=free|premium|web`. Validate its value and document
the effective edition in build instructions. Mobile defaults to Free; web release
scripts should explicitly select Web. A Premium build grants access without a
purchase, allowing a Premium beta to ship directly. This is an intentional build
configuration, not a flag restored from player saves.

A Free mobile build can gain Premium access through the existing verified purchase
entitlement. Keep build-granted access separate from purchase ownership: a beta
build must not fabricate an entitlement or persist a purchased status. Switching
back to a Free build restores the normal purchase-based access rules.

Proposed interpretation of the user's Web requirement: Web removes edition locks
but retains ordinary earned unlocks, Trial access milestones and Temple costs.
Confirm whether “nothing locked” instead means all gameplay unlocks are immediately
available before implementation.

| Feature | Free | Premium | Web |
| --- | --- | --- | --- |
| Combat vibration and vibration settings | Available on supported devices | Available | Available on supported devices |
| Existing free gameplay and rewards | Existing rules | Existing rules | Existing rules |
| Falling Leaves, Ember Ash, Ink Wash | Visible, Premium locked | Earn/equip under agreed unlock rules | Same earned rules, no edition lock |
| Precision and Discernment Temple upgrades | Visible, Premium locked | Purchase with Embers | Purchase with Embers |
| Pilgrim's Bead charm | Visible, Premium locked | Unlock/equip | Unlock/equip |
| Quiet Blade and Duel Master Trials | Visible, Premium locked | Existing Trials access milestone | Existing Trials access milestone |
| Duel Master reward charm | Visible, Premium locked | Earn by completing Duel Master | Earn by completing Duel Master |

This matrix records the proposed access grouping from the discussion. Existing
Supporter Print is governed by the current Premium implementation; decide explicitly
whether Web also receives it when applying the policy to the full catalog.

Show both access and gameplay requirements where applicable, e.g. “Requires
Premium” and the relevant challenge progress. Provide isolated previews for locked
cosmetics. Proposed: accumulate eligible ordinary mastery progress in Free so a
purchase does not require repeating completed work. Preserve progress and Temple
ranks if access is lost; suppress unavailable selections/modifiers and use a safe
fallback without deleting ownership. Trial completion must not bypass edition
checks when equipping its reward.

## Combat vibration

Provide distinguishable feedback for three events:

| Event | Intended sensation |
| --- | --- |
| Enemy sliced | Strong, short impact; full vibration feel |
| Perfect parry | Two crisp taps |
| Player hit | Longer, rougher pulse |

Exact durations and native strength values require physical-device tuning. Add
Off, Light and Full options, coordinated with feature plan 07's Options work.
Prevent dense kills from building a vibration backlog; proposed priority is player
damage, then perfect parry, then slice. Stop active feedback on pause/disposal.
Unsupported devices must continue normally and display support honestly.

Current `src/platform/haptics.ts` is an optional browser `navigator.vibrate`
adapter, and `game.ts` already calls it. This is an extension/replacement of current
cues, not the first haptics implementation. Native device feedback needs separate
verification; browser tests cannot establish its feel or native support.

## Kill effects

| Effect | Visual direction | Unlock requirement |
| --- | --- | --- |
| Falling Leaves | Enemy breaks into drifting dark leaves | To be decided; earlier proposal: 1,000 lifetime kills |
| Ember Ash | Enemy burns away into restrained glowing embers and ash | To be decided; earlier proposal: 50 lifetime boss defeats |
| Ink Wash | Silhouette bleeds into an ink stain, then fades | To be decided; earlier proposal: 100 perfect cuts in one run |

These thresholds remain suggestions. Effects occupy the existing kill-effect
selection and must retain readable cut direction, bounded particles and complete
body/shadow cleanup. Coordinate with feature plan 07's death animation work.
Effects must not change kill credit, score, encounter progression or gameplay RNG.
Apply quality, motion and flash preferences, including Armoury previews. Decide
boss, automatic-kill and Bonk compatibility explicitly rather than assuming every
death can use the same presentation.

## Temple upgrades

**Precision** (working name): widen the perfect-action window by 5%, 10%, then
15% at ranks 1–3. These are relative increases to the base window, not percentage
points. Proposed scope includes both perfect cuts and perfect parries; confirm
this interpretation of “perfect act.” Define stacking with existing equipment
timing modifiers before implementation. Rank prices remain open.

**Discernment**: grant one Shrine reroll per run. Replace the current choices
using the same eligible pool, rarity curve, guaranteed choices and curse rules.
No new combat input is required. Proposed as a single-rank upgrade; cost remains
open. Define reroll handling for forced offers and Boss Rush. Record spending and
the replacement offer in checkpoints so reload cannot restore the reroll or old
choices. A reroll must not repeat one-time immediate rewards.

Both upgrades follow the existing Temple applicability and upgrades-Off rules;
they must not leak into preset Trials or silently expand Temple support to modes
that currently exclude it.

## Pilgrim's Bead

Working name follows the original proposal; the user's “Pilgrim's Bear” may be an
intended rename and should be confirmed before final player-facing copy.

Charm tradeoff: more Embers from bosses, fewer from ordinary enemies. Exact
multipliers and unlock condition are open. Apply the modifier to the existing
run-local Ember ledger and end-run settlement, preserving fractional accounting,
one-time payout and abandoned-run behavior. Specify automatic-kill eligibility
and stacking with existing Ember modifiers. Trials grant no ordinary Embers.

## Trials and Duel Master reward

**Quiet Blade**: fixed encounters, arrows disabled, preset equipment. Read enemy
poses to complete the challenge. Enemy count, feints, timings and reward remain
open. The existing Read the Blade Trial already tests arrowless enemies including
feints: give Quiet Blade a distinct encounter pattern/objective or deliberately
revise that Trial instead of adding a duplicate.

**Duel Master**: a duel requiring 20 consecutive correct counter-and-directional-
slash exchanges. Counter the attack to expose the opening, then slash correctly.
Each completed exchange accelerates the next, up to a readable speed limit. Show
progress such as “12 / 20”; defeat the boss on the twentieth successful exchange.

Starting timing, acceleration curve, minimum timing, boss identity and mistake
handling remain open. The earlier suggestion was to reset the streak on a mistake,
but existing Trials fail on hits and some missed openings. Resolve whether any
nonfatal mistake can reset the streak or every mistake ends the attempt. Do not
document streak-reset behavior as confirmed. Pausing must not advance challenge
timers. Use isolated Trial state, no ordinary rewards or progression, and grant
the completion reward once through the Trial system.

**First Strike** (working name), earned by completing Duel Master: a charm that
rewards faster valid enemy slashes rather than waiting for the usual perfect-timing
score bonus. Proposed scoring origin is the moment an ordinary enemy becomes
attackable, or the moment a counter exposes a boss opening. Confirm applicability
to ordinary enemies and bosses, and define the score curve, minimum/maximum bonus
and timer origin against actual combat behavior.

Replace the relevant slash timing bonus rather than stacking a second bonus.
Keep perfect classification, parry scoring and combat consequences unchanged;
invalid or premature slashes earn nothing. Clarify player-facing language: perfect
cuts and perfect parries are separate actions, even though the initial description
referred to scoring closer to a perfect parry. Test interaction with Precision and
existing scoring modifiers so wider timing windows do not inflate the speed bonus.

## Implementation boundaries and sequence

Current ownership is described in [implemented architecture](../architecture/overview.md).
Proposed edition policy belongs in `src/platform/`, alongside Premium integration.
Content belongs in `src/game/content/`; progression, Trial completion, Temple ranks
and scoring belong in their existing game modules. Use the runtime to connect
events to haptics and effects. Keep renderers on explicit canvases with independent
preview state. Preserve `issen.*` compatibility and testing-profile isolation.

1. Resolve open access interpretations, names, challenge thresholds and balance rules.
2. Add central edition policy, build configuration and visible lock states.
3. Extend haptics and connect Options preferences.
4. Add kill effects and their selected earned requirements.
5. Add Precision, Discernment and Pilgrim's Bead with validated persistence.
6. Add a distinct Quiet Blade challenge, Duel Master and its scoring charm.
7. Verify combined behavior and update implemented docs before release.

## Acceptance and verification

- Exercise Free, purchased Premium, build-granted Premium and Web. Check locked
  labels, earned requirements, purchase restoration, access loss and safe fallbacks.
- Verify haptic event mapping and preference suppression with unit tests; assess
  intensity, distinction and overlapping events on actual mobile hardware.
- Review all kill effects in isolated previews and live combat; check expiration,
  shadow cleanup, reduced presentation settings and unchanged gameplay randomness.
- Test timing ranks and stacking, reroll availability/consumption/checkpoint restore,
  Ember settlement and malformed/legacy save defaults in the testing namespace.
- Test Duel Master's 20-exchange completion, acceleration limit, failure/reset rule,
  pause behavior, isolated progression and one-time charm reward.
- Test First Strike's early/late boundaries, invalid inputs and scoring composition.
  Verify Quiet Blade adds a distinct challenge to Read the Blade.
- During implementation run strict TypeScript and focused unit/browser checks;
  broaden checks before release because access and scoring cross runtime boundaries.
  Use the normal two Playwright workers. Production verification already builds and
  checks types. Never edit generated `dist/` or clear real player saves.

Planning-only changes do not bump the app version. Implementation requires an
appropriate minor SemVer bump, synchronized across package.json, package-lock.json
and the title-screen version. Coordinate the final release number with feature
plan 07 rather than assuming either plan has shipped.
