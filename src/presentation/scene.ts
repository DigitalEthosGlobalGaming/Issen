import { clamp } from '../shared/math.ts';
import { STAGES } from '../game/content/stages.ts';
import { setSceneLighting } from '../rendering/scene-material.ts';
import type { SceneDrawing } from '../rendering/scene-drawing.ts';
import type { createLightingRig } from '../rendering/lighting-rig.ts';
import type { createEnvironmentRenderer } from '../rendering/environment/index.ts';
import type { createDemonRealmRenderer } from '../rendering/environment/demon-realm.ts';
import type { createLayout } from '../rendering/layout.ts';
import type { GrassBlade } from '../rendering/scene/ambient.ts';
import type { PostFrame } from '../rendering/effects/post-frame.ts';
import type { Enemy } from '../game/combat/enemy.ts';
import type { RunState } from '../game/run-state.ts';

export interface PresentationFrame {
  readonly cameraX: number;
  readonly cameraY: number;
  readonly post: PostFrame;
}

/** Read-only scene inputs and explicit presentation drawing ports. */
export interface SceneViews {
  readonly nativeScene: { begin(): void; flush(): void };
  readonly lightingDebug: { refresh(): void };
  readonly g: SceneDrawing;
  readonly lightingRig: ReturnType<typeof createLightingRig>;
  readonly W: number;
  readonly H: number;
  readonly DPR: number;
  readonly time: number;
  readonly zoom: number;
  readonly zoomX: number;
  readonly zoomY: number;
  readonly reducedMotion: () => boolean;
  readonly reducedFlashes: () => boolean;
  readonly density: () => number;
  readonly activeTrial: { realm?: string; seed: number } | null;
  readonly cinematic: { readonly active: boolean };
  readonly previewDemon: boolean;
  readonly stageSeed: number;
  readonly demonRealmRenderer: Pick<ReturnType<typeof createDemonRealmRenderer>, 'draw'>;
  readonly environmentRenderer: Pick<
    ReturnType<typeof createEnvironmentRenderer>,
    'draw' | 'drawForeground' | 'snapshot' | 'backend'
  >;
  readonly G: Readonly<
    Pick<RunState, 'stage' | 'enemies' | 'boss' | 'attacker' | 'event' | 'state'>
  >;
  readonly cvs: HTMLCanvasElement;
  readonly mistSprite: HTMLCanvasElement | null;
  readonly mists: readonly { a: number; x: number; y: number; w: number; h: number }[];
  readonly mid: GrassBlade[];
  readonly fg: GrassBlade[];
  readonly blades: (
    list: GrassBlade[],
    time: number,
    snowTips?: boolean,
    demonic?: boolean,
  ) => void;
  readonly drawStains: () => void;
  readonly drawLeaves: (front: boolean) => void;
  readonly sceneLoading: boolean;
  readonly drawEnemy: (enemy: Enemy) => void;
  readonly L: Pick<ReturnType<typeof createLayout>, 'horizonY' | 'groundY' | 'eH'>;
  readonly drawBoss: () => void;
  readonly drawPlayer: () => void;
  readonly drawPet: () => void;
  readonly drawFoxfire: () => void;
  readonly drawFx: () => void;
  readonly drawFx2: () => void;
  readonly drawGlyphs: () => void;
  readonly drawSmoke: () => void;
  readonly drawWeather: () => void;
  readonly drawPops: () => void;
  readonly drawStamps: () => void;
  readonly drawPost: (frame: PostFrame) => void;
}

/** Synchronous presentation only; runtime orchestration owns scene-ready transitions. */
export function createRuntimeScene(readViews: () => SceneViews) {
  return function drawScene(frame: PresentationFrame) {
    const {
      nativeScene,
      lightingDebug,
      g,
      lightingRig,
      W,
      H,
      DPR,
      zoom,
      zoomX,
      zoomY,
      reducedMotion,
      activeTrial,
      cinematic,
      previewDemon,
      demonRealmRenderer,
      time,
      stageSeed,
      environmentRenderer,
      G,
      reducedFlashes,
      density,
      cvs,
      mistSprite,
      mists,
      blades,
      mid,
      drawStains,
      drawLeaves,
      sceneLoading,
      drawEnemy,
      L,
      drawBoss,
      drawPlayer,
      drawPet,
      drawFoxfire,
      drawFx,
      drawFx2,
      fg,
      drawGlyphs,
      drawSmoke,
      drawWeather,
      drawPops,
      drawStamps,
      drawPost,
    } = readViews();
    nativeScene?.begin();
    lightingDebug.refresh();
    setSceneLighting(g, lightingRig.lighting(W * DPR, H * DPR));
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.save();
    g.translate(frame.cameraX, frame.cameraY);
    if (zoom > 1.001 && !reducedMotion()) {
      g.translate(zoomX, zoomY);
      g.scale(zoom, zoom);
      g.translate(-zoomX, -zoomY);
    }
    const demonRealm = activeTrial?.realm === 'demon' || (cinematic.active && previewDemon);
    const inkEnvironment = demonRealm
      ? demonRealmRenderer.draw(
          g,
          W,
          H,
          time,
          reducedMotion(),
          activeTrial ? activeTrial.seed : stageSeed,
        )
      : environmentRenderer.draw(g, {
          stageSeed,
          width: W,
          height: H,
          dpr: DPR,
          time,
          stage: G.stage,
          reducedMotion: reducedMotion(),
          reducedFlashes: reducedFlashes(),
          lowQuality: density() <= 0.3,
        });
    cvs.dataset.renderer = 'ink';
    cvs.dataset.scene = String(
      demonRealm ? STAGES.length : (environmentRenderer.snapshot().stage ?? G.stage),
    );
    cvs.dataset.rendererBackend = demonRealm ? 'demon-realm' : environmentRenderer.backend;
    cvs.dataset.artwork = 'ink';
    if (mistSprite)
      for (const m of mists) {
        g.globalAlpha = m.a;
        g.drawImage(mistSprite, m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);
      }
    g.globalAlpha = 1;
    blades(mid, time, !demonRealm && inkEnvironment && G.stage === 5, demonRealm);
    if (!cinematic.active) drawStains();
    drawLeaves(false);
    const b = sceneLoading ? null : G.boss;
    if (b && ['windup', 'flash', 'feint'].includes(b.state)) {
      const k = b.state === 'flash' ? 1 : clamp(b.t / b.dur);
      g.fillStyle = `rgba(0,0,0,${0.2 * k})`;
      g.fillRect(-30, -30, W + 60, H + 60);
    }
    const back = (sceneLoading ? [] : G.enemies)
      .filter((e) => e !== G.attacker && e.state !== 'strike')
      .sort((a, c) => a.pos.y - c.pos.y);
    for (const e of back) drawEnemy(e);
    if (G.event === 'fog' && (G.state === 'playing' || G.state === 'dead')) {
      const y0 = L.horizonY,
        y1 = L.groundY + L.eH * 0.25,
        mc = STAGES[G.stage]!.mist,
        fg2 = g.createLinearGradient(0, y0, 0, y1);
      fg2.addColorStop(0, `rgba(${mc},0)`);
      fg2.addColorStop(0.3, `rgba(${mc},.88)`);
      fg2.addColorStop(0.85, `rgba(${mc},.88)`);
      fg2.addColorStop(1, `rgba(${mc},0)`);
      g.fillStyle = fg2;
      g.fillRect(-30, y0, W + 60, y1 - y0);
    }
    if (b) drawBoss();
    if (!sceneLoading)
      for (const e of G.enemies) if (e === G.attacker || e.state === 'strike') drawEnemy(e);
    if (!cinematic.active && !sceneLoading) {
      drawPlayer();
      drawPet();
      drawFoxfire();
      drawFx();
      drawFx2();
    }
    if (inkEnvironment && !demonRealm)
      environmentRenderer.drawForeground(g, {
        width: W,
        height: H,
        dpr: DPR,
        time,
        stage: G.stage,
        reducedMotion: reducedMotion(),
        reducedFlashes: reducedFlashes(),
        lowQuality: density() <= 0.3,
      });
    blades(fg, time, !demonRealm && inkEnvironment && G.stage === 5, demonRealm);
    if (!cinematic.active) drawGlyphs();
    if (!demonRealm) {
      drawSmoke();
      drawLeaves(true);
      drawWeather();
    } else drawLeaves(true);
    if (!cinematic.active) drawPops();
    g.restore();
    if (!cinematic.active) drawStamps();
    drawPost(frame.post);
    nativeScene?.flush();
    cvs.dataset.graphicsBackend = 'pixi';
  };
}
