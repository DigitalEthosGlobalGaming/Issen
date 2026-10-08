import type { PixiScenePainter } from '../rendering/pixi/scene-painter.ts';
import { createSceneComposer } from './scene-composer.ts';
import { createLightSources } from './light-sources.ts';
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
  readonly nativeScene: Pick<
    PixiScenePainter,
    'begin' | 'geometryPass' | 'lightPass' | 'flush' | 'lightingTargets'
  >;
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
interface ComposedFrame extends PresentationFrame {
  demonRealm: boolean;
  inkEnvironment: boolean;
  boss: RunState['boss'];
}

export function createRuntimeScene(
  readViews: () => SceneViews,
  lightSources = createLightSources(),
) {
  const composer = createSceneComposer<ComposedFrame, SceneViews>([
    {
      name: 'environment',
      draw(frame, views) {
        const {
          g,
          W,
          H,
          time,
          reducedMotion,
          activeTrial,
          cinematic,
          previewDemon,
          demonRealmRenderer,
          stageSeed,
          environmentRenderer,
          DPR,
          G,
          reducedFlashes,
          density,
          cvs,
        } = views;
        const demonRealm = (frame.demonRealm =
          activeTrial?.realm === 'demon' || (cinematic.active && previewDemon));
        const inkEnvironment = (frame.inkEnvironment = demonRealm
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
            }));
        cvs.dataset.renderer = 'ink';
        cvs.dataset.scene = String(
          demonRealm ? STAGES.length : (environmentRenderer.snapshot().stage ?? G.stage),
        );
        cvs.dataset.rendererBackend = demonRealm ? 'demon-realm' : environmentRenderer.backend;
        cvs.dataset.artwork = 'ink';
      },
    },
    {
      name: 'midground',
      draw(frame, views) {
        const { g, mistSprite, mists, blades, mid, time, G, cinematic, drawStains, drawLeaves } =
          views;
        const { demonRealm, inkEnvironment } = frame;
        if (mistSprite)
          for (const m of mists) {
            g.globalAlpha = m.a;
            g.drawImage(mistSprite, m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);
          }
        g.globalAlpha = 1;
        blades(mid, time, !demonRealm && inkEnvironment && G.stage === 5, demonRealm);
        if (!cinematic.active) drawStains();
        drawLeaves(false);
      },
    },
    {
      name: 'rear-enemies',
      draw(frame, views) {
        const { g, sceneLoading, G, drawEnemy, W, H, L } = views;
        const b = (frame.boss = sceneLoading ? null : G.boss);
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
      },
    },
    {
      name: 'combat',
      draw(frame, views) {
        const {
          sceneLoading,
          G,
          cinematic,
          drawBoss,
          drawEnemy,
          drawPlayer,
          drawPet,
          drawFoxfire,
          drawFx,
          drawFx2,
        } = views;
        const b = frame.boss;
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
      },
    },
    {
      name: 'foreground',
      draw(frame, views) {
        const {
          environmentRenderer,
          g,
          W,
          H,
          DPR,
          time,
          G,
          reducedMotion,
          reducedFlashes,
          density,
          blades,
          fg,
        } = views;
        const { demonRealm, inkEnvironment } = frame;
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
      },
    },
    {
      name: 'atmosphere',
      draw(frame, views) {
        const { cinematic, drawGlyphs, drawSmoke, drawLeaves, drawWeather, drawPops } = views;
        const { demonRealm } = frame;
        if (!cinematic.active) drawGlyphs();
        if (!demonRealm) {
          drawSmoke();
          drawLeaves(true);
          drawWeather();
        } else drawLeaves(true);
        if (!cinematic.active) drawPops();
      },
    },
    {
      name: 'post',
      draw(frame, views) {
        const { g, cinematic, drawStamps, drawPost } = views;
        g.restore();
        if (!cinematic.active) drawStamps();
        drawPost(frame.post);
      },
    },
    { name: 'geometry', draw: (_frame, views) => views.nativeScene.geometryPass() },
    { name: 'lights', draw: (_frame, views) => views.nativeScene.lightPass() },
    { name: 'forward-composite', draw: (_frame, views) => views.nativeScene.flush() },
  ]);
  return Object.assign(
    function drawScene(frame: PresentationFrame) {
      const views = readViews();
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
        cvs,
      } = views;
      nativeScene?.begin();
      lightingDebug.refresh();
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.save();
      g.translate(frame.cameraX, frame.cameraY);
      if (zoom > 1.001 && !reducedMotion()) {
        g.translate(zoomX, zoomY);
        g.scale(zoom, zoom);
        g.translate(-zoomX, -zoomY);
      }
      const transform = g.getTransform();
      setSceneLighting(
        g,
        lightSources.lighting(
          {
            width: W * DPR,
            height: H * DPR,
            time: views.time,
            transform: {
              a: transform.a,
              b: transform.b,
              c: transform.c,
              d: transform.d,
              tx: transform.e,
              ty: transform.f,
            },
          },
          lightingRig.lighting(W * DPR, H * DPR),
        ),
      );
      composer.draw({ ...frame, demonRealm: false, inkEnvironment: false, boss: null }, views);
      cvs.dataset.graphicsBackend = 'pixi';
    },
    { composer, lightSources, dispose: lightSources.dispose },
  );
}
