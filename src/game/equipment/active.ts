import { SPECIAL, STEEL_THIRD } from '../content/awakenings.ts';
import { ROBE_AWAKENINGS } from '../content/robe-awakenings.ts';
import { computeModifiers } from './modifiers.ts';
import type { RunState } from '../run-state.ts';
import type { Equipment, Setup } from '../../platform/saves.ts';
import type { MetaProgress, templateModifiers } from '../progression/meta.ts';
import type { Item } from '../content/items.ts';
import type { TrialDefinition } from '../content/trials.ts';

export interface ActiveEquipmentViews {
  readonly G: RunState;
  readonly SETUP: Readonly<Setup>;
  readonly META: Readonly<MetaProgress>;
  readonly EQ: Readonly<Equipment>;
  readonly UNL: ReadonlySet<string>;
  readonly ITEM_BY: Readonly<Record<string, Item>>;
  readonly activeTrial: TrialDefinition | null;
  readonly accessible: (id: string) => boolean;
  readonly runTemplate: ReturnType<typeof templateModifiers>;
}
/** Rules own active awakening selection and modifier composition. */
export function createActiveEquipment(readViews: () => ActiveEquipmentViews) {
  function powersEnabled() {
    const { G, SETUP } = readViews();
    return G.state === 'title' || G.state === 'over' ? SETUP.upgrades !== false : G.upgradesEnabled;
  }
  function isSp() {
    const { META, EQ, UNL } = readViews();
    return !!(
      META.upgrades.awakening &&
      powersEnabled() &&
      EQ.bladeSp &&
      SPECIAL[EQ.blade] &&
      UNL.has(EQ.blade + '+')
    );
  }
  function isSteelThird() {
    const { META, EQ, UNL } = readViews();
    return !!(
      META.upgrades.awakening &&
      powersEnabled() &&
      EQ.blade === 'steel' &&
      EQ.bladeThird &&
      UNL.has('steel++')
    );
  }
  function isRobeSp() {
    const { META, EQ, UNL } = readViews();
    return !!(
      META.upgrades.awakening >= 2 &&
      powersEnabled() &&
      EQ.robeSp &&
      ROBE_AWAKENINGS[EQ.robe] &&
      UNL.has(EQ.robe + '+')
    );
  }
  function bladeMods() {
    const { EQ, ITEM_BY } = readViews();
    return isSteelThird()
      ? STEEL_THIRD.m
      : isSp()
        ? SPECIAL[EQ.blade]!.m
        : (ITEM_BY[EQ.blade] || {}).m;
  }
  function computeMods() {
    const { G, activeTrial, EQ, ITEM_BY, accessible, runTemplate } = readViews();
    if (activeTrial) {
      G.m = computeModifiers([], new Set());
      G.m.hazard = 0;
      return;
    }
    G.m = computeModifiers(
      [
        bladeMods(),
        isRobeSp() ? ROBE_AWAKENINGS[EQ.robe]!.m : (ITEM_BY[EQ.robe] || {}).m,
        accessible(EQ.charm) ? (ITEM_BY[EQ.charm] || {}).m : undefined,
        G.fortune?.m,
        runTemplate,
      ],
      G.bless,
    );
  }
  return { powersEnabled, isSp, isSteelThird, isRobeSp, bladeMods, computeMods };
}
