import type { FinishedRun } from '../../game/progression/run-records.ts';
import type { ModeRecord } from '../../game/progression/statistics.ts';
import type { UnlockNotice } from '../../game/progression/unlocks.ts';
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
export function gameOverText(run: GameOverView, record: ModeRecord, stageName: string) {
  const quit = run.reason === 'quit',
    ronin = run.mode === 'ronin';
  const duel = run.bossesSlain
    ? `, ${run.bossesSlain} duel${run.bossesSlain > 1 ? 's' : ''} won`
    : '';
  const tail = run.zen
    ? ` ${run.hits} hit${run.hits === 1 ? '' : 's'} taken. Longest ever ${record.combo}.`
    : ` Best ${record.score.toLocaleString()}.`;
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
    oNew: run.zen ? 'New longest combo' : 'New best',
    bAgain: run.zen ? 'Go again' : 'Rise again',
    oStats: run.rush
      ? `${mode}. ${run.bossesSlain} duel${run.bossesSlain === 1 ? '' : 's'} won, fell in duel ${run.wave}.${tail}`
      : `${mode}. Wave ${run.wave} in the ${stageName.toLowerCase()}. ${run.kills} cut, ${run.perfects} perfect${duel}.${tail}`,
  };
}
export function renderGameOver(
  root: HTMLElement,
  run: GameOverView,
  record: ModeRecord,
  newBest: boolean,
  stageName: string,
): void {
  const element = (id: string) => {
    const el = root.querySelector<HTMLElement>('#' + id);
    if (!el) throw new Error(`Missing game-over element ${id}`);
    return el;
  };
  for (const [id, text] of Object.entries(gameOverText(run, record, stageName)))
    element(id).textContent = text;
  element('oNew').style.display = newBest ? 'inline-block' : 'none';
  const list = element('oUnl'),
    doc = root.ownerDocument;
  list.replaceChildren();
  run.newUnlocks.forEach((item, index) => {
    if (index) list.append(doc.createElement('br'));
    const seal = doc.createElement('span');
    seal.className = 'sealk';
    seal.textContent = item.k;
    list.append(seal, doc.createTextNode(`${item.n} ${ITEM_TYPE_LABEL[item.type]} unlocked`));
  });
}
