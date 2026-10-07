import { mountStartupLoading } from '../../ui/startup-loading.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';
import type { createFrameLoop } from '../../platform/frame-loop.ts';
import type { createNativeServices } from '../../presentation/native-services.ts';
import type { RunState } from '../run-state.ts';
import type { RunCheckpoint } from '../../platform/run-checkpoint.ts';
import type { createAudio } from '../../audio/audio.ts';
type Disposable = { dispose(): void };
type NativeStartup = Pick<
  ReturnType<typeof createNativeServices>,
  'inkCharm' | 'inkCompanion' | 'inkEnemy' | 'inkPlayer' | 'inkSword' | 'environmentRenderer'
>;
export interface RuntimeStartupViews extends NativeStartup {
  readonly lifecycle: ReturnType<typeof createLifecycle>;
  readonly frameLoop: ReturnType<typeof createFrameLoop>;
  readonly G: RunState;
  readonly cinematic: { readonly restores: boolean; restore(): void };
  readonly savedRun: RunCheckpoint | null;
  readonly setupScreen: Disposable;
  readonly tutorial: Disposable;
  readonly armory: Disposable;
  readonly notifications: Disposable;
  readonly guided: Disposable;
  readonly runResults: Disposable;
  readonly audio: ReturnType<typeof createAudio>;
  readonly driftRenderer: { prepare(): Promise<unknown>; readonly ready: boolean };
  readonly stageSeed: number;
  readonly W: number;
  readonly H: number;
  readonly DPR: number;
  readonly presentationState: { readonly time: number };
  reducedMotion(): boolean;
  reducedFlashes(): boolean;
  density(): number;
  computeMods(): unknown;
  applySeal(): void;
  resize(): void;
  setupAttract(): void;
  restoreCheckpoint(record: RunCheckpoint): unknown;
  showPauseScreen(): void;
  showOver(): void;
  recoverSupportReward(): void;
  setMuteIcon(): void;
  refreshArmoryNew(): void;
  setBestLine(): void;
  updateSavedRunButtons(): void;
  disposePointer(): void;
  disposeKeyboard(): void;
  markArtworkReady(): void;
}
/** Starts one prepared runtime and owns startup artwork/error/disposal lifetime. */
export function startRuntime(readViews: () => RuntimeStartupViews) {
  const {
    lifecycle,
    frameLoop,
    G,
    cinematic,
    savedRun,
    setupScreen,
    tutorial,
    armory,
    notifications,
    guided,
    runResults,
    audio,
    driftRenderer,
    reducedMotion,
    reducedFlashes,
    density,
    computeMods,
    applySeal,
    resize,
    setupAttract,
    restoreCheckpoint,
    showPauseScreen,
    showOver,
    recoverSupportReward,
    setMuteIcon,
    refreshArmoryNew,
    setBestLine,
    updateSavedRunButtons,
    disposePointer,
    disposeKeyboard,
    markArtworkReady,
    inkCharm,
    inkCompanion,
    inkEnemy,
    inkPlayer,
    inkSword,
    environmentRenderer,
  } = readViews();
  computeMods();
  applySeal();
  resize();
  if (cinematic.restores) {
    G.state = 'title';
    setupAttract();
    cinematic.restore();
  } else if (savedRun?.status === 'active') {
    const active = savedRun;
    restoreCheckpoint(active);
    G.pausedFrom = G.state;
    G.state = 'paused';
    showPauseScreen();
  } else if (savedRun) {
    const terminal = savedRun;
    restoreCheckpoint(terminal);
    showOver();
  } else {
    setupAttract();
    recoverSupportReward();
  }
  setMuteIcon();
  refreshArmoryNew();
  setBestLine();
  updateSavedRunButtons();
  if (document.fonts && document.fonts.load)
    document.fonts.load(`800 20px "Shippori Mincho B1"`, '一二三四五閃').catch(() => {});
  lifecycle.add(() => {
    frameLoop.stop();
    disposePointer();
    disposeKeyboard();
    setupScreen.dispose();
    tutorial.dispose();
    armory.dispose();
    notifications.dispose();
    guided.dispose();
    runResults.dispose();
    void audio.dispose()?.catch(() => {});
  });
  let artworkDisposed = false;
  const artworkLoading = mountStartupLoading(() => location.reload());
  lifecycle.add(() => {
    artworkDisposed = true;
    artworkLoading.remove();
  });
  const { stageSeed, W, H, DPR, presentationState } = readViews();
  void Promise.all([
    inkCharm.prepare(),
    inkCompanion.prepare(),
    inkEnemy.prepare(),
    inkPlayer.prepare(),
    inkSword.prepare(),
    environmentRenderer.compose({
      stageSeed,
      width: W,
      height: H,
      dpr: DPR,
      time: presentationState.time,
      stage: G.stage,
      reducedMotion: reducedMotion(),
      reducedFlashes: reducedFlashes(),
      lowQuality: density() <= 0.3,
    }),
    driftRenderer.prepare(),
  ]).then(() => {
    if (artworkDisposed) return;
    const failed = [
      inkCharm.snapshot().state !== 'ready' ? 'charms' : null,
      !inkCompanion.ready ? 'companions' : null,
      !inkEnemy.snapshot().ready || inkEnemy.snapshot().loaded.length < 4 ? 'enemies' : null,
      !inkPlayer.snapshot().ready || inkPlayer.snapshot().outfits.outfits.length < 20
        ? 'outfits'
        : null,
      !inkSword.ready ? 'weapons' : null,
      environmentRenderer.backend !== 'layered' ? 'scene' : null,
      !driftRenderer.ready ? 'drifting debris' : null,
    ].filter((name): name is string => !!name);
    if (failed.length) {
      artworkLoading.update({ loaded: 7 - failed.length, total: 7, pending: 0, failed });
      return;
    }
    artworkLoading.remove();
    markArtworkReady();
  });
}
