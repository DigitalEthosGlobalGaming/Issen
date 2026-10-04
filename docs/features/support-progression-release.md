# Support and progression release validation

Release: **1.58.1**, validated on 2026-10-04. Implemented behavior and ownership
are described in [support and progression](support-progression.md).

| Feature set | Develop release | Evidence |
| --- | --- | --- |
| Support screen, temporary tester Premium, Tutorial in Options | 1.52.0 | `support-progression.spec.ts`, `tester-premium.test.mjs` |
| Second Wind and Ember rewards | 1.53.0, refined through 1.56.3 | `support-rewards.spec.ts`, `support-tally.spec.ts`, `rewarded-support.test.mjs` |
| Temple collections and post-purchase challenges | 1.54.0 | `collections.spec.ts`, `collections.test.mjs` |
| Awakening purchases and spending confirmations | 1.55.0 | `ember-confirmations.spec.ts`, `awakening-purchases.test.mjs` |
| Boss identity variety and final sword cut | 1.56.0 | `boss-variety.spec.ts`, `boss-variety.test.mjs`, `audio.test.mjs` |
| Seven Dawns login crest | 1.57.0 | `daily-login.spec.ts`, `daily-login.test.mjs` |
| Armoury loadout presets and Temple slots | 1.58.0 | `presets.spec.ts`, `presets.test.mjs` |

Each feature set was committed and deployed to the develop preview. Later patches
include the requested shorter Temple copy, single Thanks acknowledgement,
**Yes -X Embers** spending button, and **Watch Ad · 2x embers (+X)** reward
button. Second Wind uses the scroll menu and grants at most one support revive per
run. The optional Ember action follows the tally and appears only for a positive
extra reward. Daily runs and Trials remain outside support rewards.

Final validation:

- `npm test`: **236 passed**.
- `npm run test:browser`: **189 passed**, two workers.
- `npm run test:production`: checked production build and **4 passed**.
- Develop deployment of 1.58.1 succeeded and its published changelog was verified.
- Mobile captures cover scroll menus, collection tiles, the login crest, reward
  choices and preset management; landscape Armoury tile visibility was corrected
  and its existing layout checks pass.

The broad run exposed old test assumptions about Tutorial placement, direct
donations, catalog size and result advancement. Tests now exercise the actual
Options, confirmations, full catalog and separate Continue flow. A startup wait
was added before the profile-switch test. The entire browser suite subsequently
passed. The crest's thumbnail and live canvas drawing share one vector source
without a bundler-specific import in gameplay test modules.

No live advertising or store checkout is enabled. Real purchase/ad integration
and physical-device transactions remain later work. Subsequent performance
changes are a separate delivery stage on develop and must not be integrated into
main as part of this feature release.
