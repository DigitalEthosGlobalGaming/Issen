# Next features and changes

Status: implemented in the working tree, September 2026. The decisions below
describe the implementation, followed by acceptance checks for all six features.
Strict TypeScript, formatting, all 75 unit tests, all 42 browser tests and both
production smoke tests passed. The production bundle was built in the isolated
verification directory without modifying `dist/`. Browser
verification includes isolated player/test saves, purchases and reloads, boss
rewards/unlocks, and integrated tutorial completion/replay. Portrait menu and
portrait/landscape tutorial layouts were visually inspected. Audio tests verify
the new cue's synthesis; its subjective sound character remains for listening.

## Implementation record

### Sound and death shadows

The landing `clink` in `src/audio/audio.ts` uses a dry earth impact with a brief,
restrained steel tick. Its existing runtime trigger is retained. Audio unit tests
check finite, short envelopes and cue parameters; listening alongside combat cues
is still required to assess the replacement's character.

`src/rendering/figures/figure.ts` draws one stationary ground shadow for a split
death. The falling fragments suppress their individual shadows. The ground shadow
shares the figure's death fade and disappears when it ends. Combat simulation
continues to own enemy expiry and the runtime owns encounter transitions.

### Testing tools

**Ctrl+Shift+A** toggles Testing tools, including in the public client. The player
profile exposes only **Enter test profile**. Switching reloads into separate
`issen.testing.*` storage and displays a test badge. **Return to player profile**
reloads the original state; existing player keys remain intact. This is a testing
convenience, not an authorization boundary.

The test profile supports stage/wave/boss jumps, encounter restart, item/awakening
grant/removal/equip, lives, Ember balance, Template rank reset, mode milestones,
tutorial status, tutorial replay and unlock-reveal replay. It also shows current
encounter values and resolved modifiers. Removing equipment restores a valid
loadout. Jumps initialize fresh run/encounter state through runtime transitions.
Test rewards and records remain in the test profile. Rank reset does not refund
donations; testers can set the balance separately. Invulnerability, speed controls
and presets remain optional future additions.

### Developer type documentation

JSDoc on `Awakening` explains its gameplay meaning, base-blade identity, `need`
tuple, saved unlock, visuals and extension requirements. Its modifiers replace
the base blade source before combining with other equipment and blessings.
Selected Item, Blessing, Modifiers, Statistics and BladeStats documentation
explains related concepts and abbreviated progress fields. This is source/editor
documentation; no player glossary was introduced.

### Currency and Template decisions

Historical behavior in this section was superseded by
[feature plan 04](feature-plan-04.md): Embers now settle at run end at half these
rates, and mode unlocks are revealed there rather than granted mid-run. The
permanent-upgrade menu is named **Temple** in the current UI.

The permanent-upgrade menu is named **Template**. **Shrine** remains the in-run
blessing system. Active non-Zen gameplay grants **1 Ember per enemy kill**,
**5 per cleared wave**, and **25 per boss victory**. Rewards save immediately,
so abandoned runs keep their earnings. Challenge modes can earn currency; Zen
and tutorial practice cannot. Test gameplay earns only in its isolated profile.
The result screen shows run earnings and balance; currency caps at one billion.

| Upgrade | Benefit | Costs in Embers | Maximum rank |
| --- | --- | --- | --- |
| Vitality | +1 starting life | 100 | 1 |
| Focus | +5% parry window per rank | 75, 150, 225 | 3 |
| Offerings | +1 Shrine blessing choice | 150 | 1 |

The menu shows balance, owned ranks, current/next effects and maximum states.
Purchases validate affordability/ranks before charging. Donations are final.
Ranks are captured at run start; buying during a run affects the next run only.
Power applies only to **Waves, Normal, arrows shown, three lives**. Boss Rush,
Ronin, Blade Only, one-life and Zen receive no Template power. Focus multiplies
with equipment/blessing factors; Offerings uses the modifier system's maximum
choice count. Existing normal score-record keys remain shared with older normal
runs; challenge records retain their existing keys and exclude Template power.

### Onboarding and mode decisions

First Begin launches a skippable practice scene: directional right cut, timed up
perfect cut, boss glint parry, then left cut during the opening. It owns its canvas,
clock and input, permits retries without death, and writes no gameplay rewards.
Completion or Skip (also Escape) continues to a run. Status persists, and the
title menu offers replay. Reduced motion removes the moving timing marker while
retaining the text and illuminated timing cue.

Boss positions 1, 2 and 3 unlock Boss Rush, Ronin and Blade Only respectively.
These are successive journey positions, not repeated first-boss victories.
Milestones persist across runs, but later positions require advancing through a
journey. Non-Zen Waves runs qualify; Boss Rush and tutorial practice do not.
Difficulty, arrow and life choices otherwise do not prevent milestone progress.
Locked setup options are hidden and disabled; setup rendering and run start
sanitize stale selections. Pending unlocks receive staggered reveal cards with
explanations and a glint cue; reduced-motion styling removes reveal movement.
Seen-reveal progress persists separately from unlock progress, including multiple
pending reveals on one visit.

### Persistence and verification

`src/game/progression/meta.ts` owns these progression rules and validates the new
`issen.meta` record. Existing `issen.*` saves and IDs remain compatible. Only
absent metadata triggers legacy migration: positive historical runs, duels or
best-wave progress preserves all old mode options, marks reveals seen and tutorial
skipped. Historical records cannot reliably prove boss positions, so this explicit
fallback avoids removing established access. Fresh metadata starts locked; present
metadata is validated rather than re-migrated. Invalid counters/ranks fall back or
are bounded.

Relevant automated coverage includes `tests/unit/meta.test.mjs` for rules and
migration, `tests/unit/audio.test.mjs` for synthesis, and
`tests/browser/tutorial.spec.ts` for playable lessons, skipping, replay, cleanup
and no save writes. This inventory does not assert every integration acceptance
check has passed. Retain the acceptance criteria below when auditing the result.

## Acceptance checklist

Use these checks to audit all six delivered features. A passing rule test alone
does not prove visual or audio acceptance.

- Audition landing sounds alongside cuts/parries and repeated landings; confirm
  there is no unwanted ringing, clipping or distracting repetition.
- Inspect ordinary, rapid and boss deaths, slow motion, pause/resume and encounter
  transitions; shadows must disappear with the effect and never carry over.
- Jump encounters, change/remove equipped items and awakenings, edit lives and
  progression, replay onboarding, then return to the player profile and confirm
  saves/records are unchanged.
- Read the documented domain types in an editor and verify purpose, fields,
  consumers and extension points against the implementation.
- Earn, donate, reload and begin a later run; verify balance/ranks, rejected
  purchases, next-run application and all challenge-mode exclusions.
- Complete and skip first-run practice; earn all three milestones; test multiple
  pending reveals, reduced motion, stale locked selections and reload persistence.
- Verify legacy migration preserves saves and established mode access.

Gameplay rules remain in owning modules, presentation/transitions in the runtime,
and renderers receive explicit canvases. Do not clear player saves or edit
generated `dist/` files. See [architecture](../architecture/overview.md) and
[local development](../development/local-development.md) for verification commands.
