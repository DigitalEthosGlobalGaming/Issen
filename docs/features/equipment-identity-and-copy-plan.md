# Feature plan 03 — equipment identity and copy consistency

Status: phase 1 implemented for v1.0.0; phases 2 and 3 remain proposed.

## Goal

Make every blade, outfit and Temple upgrade easy to understand and worth remembering.
Preserve the intentionally neutral starting equipment, but describe it as a deliberate
baseline rather than an absence of design. Give earned Awakenings a stronger identity
than “the same numbers, only larger,” and make equivalent rules use equivalent words.

This plan covers:

- the 20 base blades and 20 base outfits in `src/game/content/items.ts`;
- their forms in `src/game/content/awakenings.ts` and
  `src/game/content/robe-awakenings.ts`;
- the seven permanent Temple upgrades in `src/game/progression/meta.ts` and their
  rank summaries in `src/ui/screens/template.ts`;
- Armoury presentation in `src/ui/screens/armory.ts`.

Charms, Shrine blessings and cosmetic-only categories are not rebalanced here. Their
copy should adopt the same glossary when they are next revised.

## Audit findings

### 1. The base catalogs are broader than they first appear

Most blades already express a recognisable decision: duel safety, perfect-cut scoring,
combo growth, short swipes, boss damage, healing or chained kills. Outfits are even
more varied, adding Shrine control, weather resistance, wards, lives, standoffs,
feint information, hidden-arrow play and Ember income.

The deliberately plain Tamahagane and Sumi are useful reference loadouts and should
remain mechanically neutral. Their current copy (“No tricks” and an unqualified
visual description) can make “neutral” read as “unfinished,” however. Present both
as **Balanced** or **No modifiers** so that the choice feels intentional.

The least distinctive base effects are the purely numeric pairs:

- Oboro and Muramasa both trade more danger for an all-score multiplier;
- Bokken trades most score for slower attacks;
- Ash trades slower attacks for a shorter parry window;
- Shiro trades faster attacks for more score;
- Oni mask and Tengu mask are clean timing-versus-score/opening exchanges.

These are not automatically bad. They are legible early-game choices. They become
repetitive when their Awakenings only increase the same two numbers.

### 2. Blade Awakenings need the main identity pass

Almost every blade Awakening is a stronger version of its base benefit and tradeoff.
That keeps the rules learnable, but an earned form often changes magnitude rather than
play. Steel is the clearest example: its first earned form is another generic score
multiplier with faster enemies. Kurogane, Beni, Tsukikage, Oboro, Muramasa, Raijin,
Bokken, Kodachi, Kiku-ichimonji, Orochi, Onikiri and Tsubame-gaeshi follow the same
amplification pattern.

The best blade forms already hint at the target: Kage adds hidden duel arrows,
Dōjigiri adds a life cost, Kōken changes its visual identity, the Frying pan combines
parry and boss effects, and Yuki extends a triggered freeze. Future revisions should
add one new behaviour or constraint, not merely another modifier.

### 3. Outfit Awakenings are in better shape

Most awakened outfits add a complementary second idea: Akabane gains combo
protection, Wanderer improves standoffs, Shiro gains recovery, Monk hood guarantees a
rare, Straw cape adds spacing, Kitsune mask makes feints safe, and Yoroi adds a ward.

Ash, Oni mask, Kabuto and Scarecrow remain mostly larger numeric versions. Keep them
on the playtest shortlist, but do not rewrite the full outfit set merely for symmetry.
Its current variety is a useful benchmark for the blade pass.

### 4. Temple upgrades mix foundations with play-changing powers

Vitality and Focus are intentionally simple account foundations. Offerings, Throwing
Knife, Composure and Recovery alter decisions or create visible moments. Awakening
Access is only a permission gate, so its purchase can feel administrative despite
unlocking the deepest equipment system.

Keep Vitality and Focus simple. Improve their flavour and rank summaries instead of
adding hidden side effects. Make each Awakening Access purchase immediately show the
new Armoury challenges it opened; do not add another combat bonus solely to make the
tile look busier.

### 5. Copy had several avoidable inconsistencies

- Rags previously said “Start with 2 lives” despite its `lives: -1` modifier. That
  wording was corrected to **One fewer starting life** before this phase began.
- The UI mixes **weapon awakening**, **blade awakening** and **equipment form**.
  Armoury calls the category **Blades**, so use **Blade Awakening** and **Outfit
  Awakening** in player-facing copy. Keep saved IDs unchanged.
- Equivalent score rules use `×0.5`, “halved,” “double,” “triple” and “cut to a
  fifth.” Use multiplier notation for all numeric score changes.
- Feint modifiers alternate between “more,” “far more,” “fewer,” a probability
  multiplier and percentage-point offsets. State the exact rule: for example,
  **Feints 10 percentage points more likely** or **Half as many feints**.
- Use **Duel openings 20% longer/shorter**, not “last 20% longer.”
- Use **Restore 1 life** for healing and **+N / one fewer starting life** for loadout
  changes.
- Use **+N Shrine choices** rather than a total number because equipment and Temple
  sources stack. Use **1 guaranteed rare blessing when available** for guarantees.
- `Focus` is the only Temple catalog description without terminal punctuation.
- Existing feature documentation promised an explicit “Awakened active” label, while
  the UI relied on colour and `真`. Phase 1 added the visible label and updated its
  browser check.

## Proposed implementation

### Phase 1 — truthful, consistent copy

Implemented for v1.0.0. This phase did not change balance, unlock conditions, saved
IDs or modifier values.

1. Add a short shared writing glossary to this document and revise the three catalogs
   against it.
2. Correct Rags and the terminology, score, feint, opening, life and Shrine wording
   listed above.
3. Give Tamahagane and Sumi a visible **Balanced · no modifiers** treatment in the
   Armoury details. Prefer a small optional catalog label over pretending they have a
   perk/tradeoff.
4. Rewrite flavour only where it merely repeats the illustration. Keep the existing
   restrained one-line voice: concrete image first, no lore paragraph.
5. Align Temple descriptions with their rank summaries. Each details card should
   answer what changes now, what the next rank changes and where the power applies.
6. Resolve the “Awakened active” documentation/UI mismatch. Prefer a small visible
   label because colour and `真` alone should not carry state.

Recommended player-facing glossary:

| Rule | Wording pattern |
| --- | --- |
| Attack duration | Enemies strike N% faster/slower |
| Parry duration | Parry window N% longer/shorter |
| Boss opening duration | Duel openings N% longer/shorter |
| Perfect threshold | Perfect arc N% larger/smaller |
| Score factor | Score ×N; Perfect/Duel score ×N |
| Feint additive chance | Feints N percentage points more/less likely |
| Feint multiplier | Half as many feints |
| Swipe threshold | Swipes register at N% distance |
| Starting life modifier | +N starting lives / One fewer starting life |
| Healing | Restore 1 life every/after N |
| Protection | First N mistakes per wave/run are forgiven |
| Shrine offer count | +N Shrine choices |
| Rare guarantee | 1 guaranteed rare blessing when available |

### Phase 2 — blade Awakening identity prototypes

Do not rebalance all 20 forms in one pass. Prototype four contrasting cases, playtest
them together with an outfit, then use the result as the pattern for the remainder.

| Blade | Current weakness | Prototype brief |
| --- | --- | --- |
| Tamahagane | Generic score-for-speed Awakening on the neutral blade | Reward clean fundamentals: a visible precision streak that improves score and resets on a mistake. Avoid duplicating Sakura's combo-step rule. |
| Oboro | The base and awakened forms are both score for more feints | Make correctly reading a feint empower the next cut or briefly expose the real direction. Keep mist/deception as the risk. |
| Raijin | Larger opening versus smaller parry window is only a numerical exchange | Make a successful parry create a visible lightning payoff during the opening, while retaining a demanding parry. |
| Kōken | A hidden blade has a conventional arc bonus | Give light a utility identity, such as preventing arrow fade or revealing an otherwise obscured cue, with an aggressive timing cost. |

Each prototype needs:

- one sentence describing the behaviour without combining unrelated clauses;
- an observable combat or presentation cue;
- a complete replacement modifier source, since Awakenings do not inherit base stats;
- an explicit owner for any new state or rule under `src/game/`;
- deterministic unit coverage and a browser check for Armoury activation/suppression;
- comparison in Normal Waves, Ronin and Blade Only so an effect is not useless or
  contradictory in its likely mode.

After playtesting, classify the remaining blade forms:

- **amplify** when magnitude is the identity and the choice remains interesting;
- **extend** when the base effect needs one complementary behaviour;
- **replace** only when the base fantasy and current mechanics do not meet.

Avoid adding a unique subsystem to every blade. Reuse supported concepts such as
wards, feint knowledge, opening damage, arrow visibility, freeze, matching-direction
chains and clean-cut recovery before adding a new modifier field.

### Phase 3 — targeted outfit and Temple follow-up

1. Playtest Ash, Oni mask, Kabuto and Scarecrow after the blade prototypes. Change an
   Awakening only if it produces the same decisions as its base form in practice.
2. Add immediate post-purchase navigation or a reveal message for Awakening Access:
   rank 1 points to Blade challenges; rank 2 points to Outfit challenges.
3. Keep Vitality and Focus mechanically plain, but make their details contextual:
   resolved starting lives and resolved boss parry bonus should be visible before a
   purchase.
4. Review early unlock pacing. A mechanically sound item can still feel boring if a
   nearby unlock offers the same decision sooner or more cheaply.

## Ownership and compatibility

- Catalog copy and base modifiers stay in `src/game/content/items.ts`.
- Blade and outfit replacement forms stay in their existing Awakening catalogs.
- Shared modifier defaults and composition belong in
  `src/game/equipment/modifiers.ts`; triggered behaviours belong with their gameplay
  consumer, not in the UI.
- Armoury state and wording belong in `src/ui/screens/armory.ts`; isolated previews
  must continue to receive explicit canvases and independent effect state.
- Temple data belongs in `src/game/progression/meta.ts`; tile/detail presentation
  belongs in `src/ui/screens/template.ts`.
- Preserve every existing item ID, `id + '+'` Awakening identity, equipment save field,
  metadata rank and `issen.*` key. Copy changes require no save migration.
- Do not edit generated `dist/` files.

## Verification and acceptance

### Automated

- `npm run typecheck`
- `npm test`, including catalog completeness, modifier composition and any new
  triggered behaviour
- focused browser coverage for neutral labels, active Awakening state, access rank
  reveals and upgrades-Off suppression
- `npm run test:browser` after the prototype set stabilises
- `npm run build` or the documented isolated production build before completion

Do not add brittle tests for every punctuation mark. Test player-visible state and
factual effect text where a mismatch would mislead play, such as Rags' life modifier
or stacked Shrine choices.

### Manual

- Read every base and active details card at narrow and wide layouts.
- Verify that a player can explain each prototype's benefit, risk and trigger after
  seeing it once.
- Compare each prototype with its base form and with the closest competing item.
- Confirm numerical descriptions against the composed run values, including stacked
  Temple and outfit bonuses.
- Exercise upgrades Off: ownership and selection remain, active powers and visuals are
  suppressed, and the explanation remains explicit.
- Use the isolated test profile; never clear real player saves.

## Completion criteria

- No player-facing description contradicts its implemented effect.
- One glossary covers equivalent blade, outfit and Temple rules.
- Neutral starter equipment reads as an intentional balanced choice.
- The four prototype blade Awakenings create observable decisions beyond larger
  versions of their base numbers.
- Any subsequent outfit changes are justified by playtesting, not catalog symmetry.
- Documentation, tests and the Armoury agree on active/suppressed Awakening language.
- Save compatibility and existing unlock ownership are preserved.
