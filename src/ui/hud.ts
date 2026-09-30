import type { RunState, Screen } from '../game/run-state.ts';
import { comboMultiplier } from '../game/progression/scoring.ts';
import { TIER, BLESS_BY } from '../game/content/blessings.ts';
import { availableWards } from '../game/shrine/triggered.ts';

export const SCREENS: readonly Screen[] = [
  'title',
  'over',
  'paused',
  'armory',
  'stats',
  'share',
  'setup',
  'shrine',
  'template',
  'admin',
  'trials',
  'support',
];
type HudState = Pick<
  RunState,
  | 'zen'
  | 'hard'
  | 'maxLives'
  | 'lives'
  | 'mode'
  | 'blade'
  | 'bless'
  | 'score'
  | 'combo'
  | 'maxCombo'
  | 'm'
  | 'wardUsed'
  | 'runWards'
  | 'blessingTriggers'
> &
  Partial<Pick<RunState, 'knives' | 'maxKnives' | 'upgradesEnabled'>>;

export function createHud(root: HTMLElement) {
  const doc = root.ownerDocument;
  const element = (id: string) => {
    const node = root.querySelector<HTMLElement>('#' + id);
    if (!node) throw new Error('Missing HUD element ' + id);
    return node;
  };
  const hud = element('hud'),
    lives = element('lives'),
    badges = element('badges');
  const score = element('score'),
    combo = element('combo'),
    bossHp = element('bossHp');
  const banner = element('banner');
  const screens = SCREENS.map((id) => ({ id, node: element(id) }));

  function health(container: HTMLElement, maximum: number, current: number): void {
    container.replaceChildren();
    for (let i = 0; i < maximum; i++) {
      const pip = doc.createElement('i');
      if (i >= current) pip.className = 'gone';
      container.append(pip);
    }
  }

  function renderLives(run: HudState): void {
    health(lives, run.zen || run.hard ? 0 : run.maxLives || 2, run.lives);
    const wards = availableWards(run);
    lives.classList.toggle('warded', wards > 0);
    lives.setAttribute(
      'aria-label',
      wards
        ? `${run.lives} lives, ${wards} ${wards === 1 ? 'ward' : 'wards'} ready`
        : `${run.lives} lives`,
    );
  }

  function render(run: HudState, visible: boolean): void {
    renderLives(run);
    hud.classList.toggle('on', visible);
    badges.replaceChildren();
    const badge = (text: string, className: string) => {
      const span = doc.createElement('span');
      span.className = className;
      span.textContent = text;
      badges.append(span);
    };
    if (run.mode === 'ronin') badge('浪人', 'badge');
    if (run.blade) badge('刃', 'badge');
    if (run.zen) badge('無限', 'badge');
    if ((run.maxKnives ?? run.knives ?? 0) > 0) badge(`Knife ×${run.knives ?? 0}`, 'badge knives');
    if (run.upgradesEnabled === false) badge('Upgrades off', 'badge');
    for (const id of run.bless) {
      const blessing = BLESS_BY[id];
      if (blessing) badge(blessing.k, `chip ${TIER[blessing.t]}`);
    }
  }

  function renderScore(run: HudState): void {
    score.textContent = run.zen ? `${run.combo} 連` : run.score.toLocaleString();
    combo.textContent = run.zen
      ? `Longest ${run.maxCombo}`
      : run.combo >= 2
        ? `${run.combo} 連  ×${comboMultiplier(run.combo, run.m)}`
        : '';
  }

  function showBanner(glyph: string, label: string): void {
    const kanji = banner.querySelector('.k'),
      text = banner.querySelector('.l');
    if (!kanji || !text) throw new Error('Missing banner labels');
    kanji.textContent = glyph;
    text.textContent = label;
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
  }

  return {
    render,
    renderLives,
    renderScore,
    showBanner,
    showScreen(id: Screen | null) {
      for (const screen of screens) screen.node.classList.toggle('on', screen.id === id);
    },
    get activeScreen(): Screen | null {
      return screens.find((screen) => screen.node.classList.contains('on'))?.id ?? null;
    },
    renderBossHealth(boss: { maxHp: number; hp: number } | null) {
      if (boss) health(bossHp, boss.maxHp, boss.hp);
    },
  };
}
