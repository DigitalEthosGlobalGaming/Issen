import { renderSupport } from '../screens/support.ts';
import { renderTemplate } from '../screens/template.ts';
import { renderTrials } from '../screens/trials.ts';
import { renderStatistics } from '../screens/stats.ts';
import { premium } from '../../platform/purchases.ts';
import { PREMIUM_FILM } from '../../platform/premium.ts';
import { testerPremiumActive } from '../../platform/tester-premium.ts';
import { trialsUnlocked } from '../../game/progression/trials.ts';
import type { RunState, Screen } from '../../game/run-state.ts';
import type { Statistics } from '../../game/progression/statistics.ts';
import type { MetaProgress } from '../../game/progression/meta.ts';
import type { Item } from '../../game/content/items.ts';
import type { PreviewFrame } from '../../rendering/armory-preview.ts';

export interface PanelViews {
  readonly $: { (id: 'supportPreview'): HTMLCanvasElement; (id: string): HTMLElement };
  readonly G: RunState;
  readonly ST: Statistics;
  readonly playerStats: Statistics;
  readonly META: MetaProgress;
  readonly UNL: ReadonlySet<string>;
  readonly ITEMS: readonly Item[];
  readonly hudView: { readonly activeScreen: Screen | null };
  readonly supportPreview: { draw: (frame: PreviewFrame) => void };
  readonly previewFrame: (
    film: string,
    effects: boolean,
    target: HTMLCanvasElement,
  ) => PreviewFrame;
  readonly testerPremium: Parameters<typeof testerPremiumActive>[0];
  readonly TRIAL_PROGRESS: Parameters<typeof renderTrials>[1];
  readonly trialResult: Parameters<typeof renderTrials>[3];
  readonly startTrial: Parameters<typeof renderTrials>[4];
  readonly showScreen: (id: Screen | null) => void;
  readonly premiumAccess: () => boolean;
  readonly saveMeta: () => void;
  readonly clearTrialResult: () => void;
  readonly showAdmin: () => void;
  readonly renderArmory: () => void;
  readonly renderSetup: () => void;
  readonly renderStats: () => void;
  readonly setBestLine: () => void;
}

/** Panel callbacks read current run/profile views; they preserve the existing ports. */
export function createPanelWiring(readViews: () => PanelViews) {
  function setBestLine() {
    const { $, playerStats, ST } = readViews();
    $('bTrials').hidden = !trialsUnlocked(playerStats.roninWave);
    $('tBest').textContent =
      (ST.bestScore ? `Best ${ST.bestScore.toLocaleString()}` : '') +
      (ST.bestRonin ? `   Ronin best ${ST.bestRonin.toLocaleString()}` : '');
  }
  function openPanel(id: Screen) {
    const {
      $,
      G,
      hudView,
      supportPreview,
      previewFrame,
      testerPremium,
      renderArmory,
      renderStats,
      renderSetup,
      META,
      saveMeta,
      premiumAccess,
      showAdmin,
      TRIAL_PROGRESS,
      playerStats,
      trialResult,
      startTrial,
      showScreen,
      clearTrialResult,
    } = readViews();
    G.panelFrom = hudView.activeScreen || 'title';
    G.panel = id;
    if (id === 'support') {
      supportPreview.draw(previewFrame(PREMIUM_FILM, false, $('supportPreview')));
      renderSupport($('support'), premium.state, testerPremiumActive(testerPremium));
      void premium.refresh();
    }
    if (id === 'armory') {
      renderArmory();
      void premium.refresh();
    }
    if (id === 'stats') renderStats();
    if (id === 'setup') renderSetup();
    if (id === 'template') renderTemplate($('templateContent'), META, saveMeta, premiumAccess());
    if (id === 'admin') showAdmin();
    if (id === 'trials')
      renderTrials(
        $('trials'),
        TRIAL_PROGRESS,
        playerStats.roninWave,
        trialResult,
        startTrial,
        () => {
          clearTrialResult();
          G.panel = null;
          showScreen('title');
        },
        premiumAccess(),
      );
    showScreen(id);
  }
  function closePanel() {
    const { G, setBestLine, showScreen } = readViews();
    G.panel = null;
    if (G.panelFrom === 'title') setBestLine();
    showScreen(G.panelFrom);
  }
  function renderStats() {
    const { $, ST, UNL, ITEMS, META } = readViews();
    renderStatistics($('statGrid'), ST, UNL.size, ITEMS.length, META.earned);
  }

  return { setBestLine, openPanel, closePanel, renderStats };
}
