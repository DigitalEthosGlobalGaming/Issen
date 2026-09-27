import type { FinishedRun } from '../../game/progression/run-records.ts';
import type { ModeRecord } from '../../game/progression/statistics.ts';
import type { UnlockNotice } from '../../game/progression/unlocks.ts';
import type { RewardSettlement } from '../../game/progression/run-rewards.ts';
import type { ItemCategory } from '../../game/content/items.ts';
import { modeLabel } from '../../game/progression/modes.ts';
export const DEATH_REASONS: Record<string, string> = {
  late: 'Too slow. His blade found you first.',
  wrong: 'Your cut met only air, and his did not.',
  feint: 'Feinted. The blade turned and you did not.',
  early: 'You flinched before the glint.',
  lateBoss: 'The glint came and went.',
  quit: 'You sheathed your blade.',
};
export const ITEM_TYPE_LABEL: Record<ItemCategory, string> = {
  crest: 'crest',
  pet: 'companion',
  charm: 'charm',
  blade: 'blade',
  robe: 'outfit',
  fx: 'kill effect',
  film: 'film look',
  seal: 'seal colour',
};
export interface GameOverView extends FinishedRun {
  bossesSlain: number;
  hits: number;
  kills: number;
  perfects: number;
  newUnlocks: readonly UnlockNotice[];
}
export function gameOverText(run: GameOverView, stageName: string) {
  const quit = run.reason === 'quit',
    ronin = run.mode === 'ronin';
  const mode = modeLabel(run.mode, run.blade, run.zen, run.hard, run.rush);
  return {
    oK: quit ? '納刀' : '討死',
    oSub: run.zen
      ? 'Run ended'
      : quit
        ? 'You left the field'
        : ronin
          ? 'The ronin has fallen'
          : 'You have fallen',
    oReason: DEATH_REASONS[run.reason] || '',
    oScore: run.zen ? `${run.maxCombo} 連` : run.score.toLocaleString(),
    oContext: run.rush ? `${mode} · Duel ${run.wave}` : `${mode} · Wave ${run.wave} · ${stageName}`,
    oNew: run.zen ? 'New longest combo' : 'New best',
    bAgain: run.zen ? 'Go again' : 'Rise again',
  };
}
export interface GameOverUnlock {
  key: string;
  name: string;
  kind: string;
}
export function appendGameOverUnlocks(root: HTMLElement, unlocks: readonly GameOverUnlock[]): void {
  const list = root.querySelector<HTMLElement>('#oUnl');
  if (!list) throw new Error('Missing game-over unlock list');
  const doc = root.ownerDocument;
  for (const item of unlocks) {
    const row = doc.createElement('div');
    row.className = 'o-unlock';
    const seal = doc.createElement('span');
    seal.className = 'sealk';
    seal.textContent = item.key;
    const title = doc.createElement('span');
    title.textContent = `${item.name} ${item.kind} unlocked`;
    row.append(seal, title);
    list.append(row);
  }
}
export function renderGameOver(
  root: HTMLElement,
  run: GameOverView,
  record: ModeRecord,
  newBest: boolean,
  stageName: string,
  reward: RewardSettlement,
  upgradesEnabled: boolean,
): void {
  const element = (id: string) => {
    const el = root.querySelector<HTMLElement>('#' + id);
    if (!el) throw new Error(`Missing game-over element ${id}`);
    return el;
  };
  for (const [id, text] of Object.entries(gameOverText(run, stageName)))
    element(id).textContent = text;
  element('oNew').style.display = newBest ? 'inline-block' : 'none';
  const stats = element('oStats');
  stats.replaceChildren();
  const fields: [number, string][] = run.zen
    ? [
        [run.hits, 'Hits taken'],
        [record.combo, 'Longest combo'],
      ]
    : run.rush
      ? [
          [run.bossesSlain, 'Duels won'],
          [record.score, 'Best score'],
        ]
      : [
          [run.kills, 'Cuts'],
          [run.perfects, 'Perfect'],
          [record.score, 'Best score'],
        ];
  if (!run.zen && !run.rush && run.bossesSlain) fields.splice(2, 0, [run.bossesSlain, 'Duels won']);
  for (const [value, label] of fields) {
    const cell = root.ownerDocument.createElement('div');
    cell.className = 'o-stat';
    const amount = root.ownerDocument.createElement('strong');
    amount.textContent = value.toLocaleString();
    const caption = root.ownerDocument.createElement('span');
    caption.textContent = label;
    cell.append(amount, caption);
    stats.append(cell);
  }
  element('oEmberGain').textContent = `+${reward.gained.toLocaleString()} Embers`;
  element('oEmberTotal').textContent = `${reward.after.toLocaleString()} total`;
  const modifier = element('oModifier');
  modifier.hidden = upgradesEnabled;
  modifier.textContent = upgradesEnabled ? '' : 'Temple upgrades off';
  element('oUnl').replaceChildren();
  appendGameOverUnlocks(
    root,
    run.newUnlocks.map((item) => ({ key: item.k, name: item.n, kind: ITEM_TYPE_LABEL[item.type] })),
  );
}
