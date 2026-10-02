import { createInkCharmRenderer } from './figures/ink-charms.ts';
import { createInkCompanionRenderer } from './figures/ink-companions.ts';
import { createInkEnemyRenderer } from './figures/ink-enemy.ts';
import { createInkPlayerRenderer } from './figures/ink-player.ts';
import { createInkSwordRenderer } from './figures/ink-sword.ts';
import { createFigureRenderer } from './figures/figure.ts';
import { makeFig, EPOSE } from './figures/model.ts';
import type { Figure, FigureEnvironment } from './figures/types.ts';
import { createEffects } from './effects/state.ts';
import { createEffectSpawner } from './effects/spawn.ts';
import type { EffectSpawning } from './effects/spawn.ts';
import { createEffectRenderer } from './effects/draw.ts';
import { updateEffects } from './effects/update.ts';
import { applyFilm } from './effects/film.ts';
import { clamp } from '../shared/math.ts';
import { applyDeathPose, deathShadowOpacity } from './figures/death.ts';
import roomUrl from '../ui/assets/armoury-room.png';

export interface PreviewFrame extends Omit<FigureEnvironment, 'width' | 'height' | 'random'> {
  background: HTMLCanvasElement | null;
  appearance: Omit<Figure, 'x' | 'y' | 'h' | 'fog' | 'pose'>;
  pet: string;
  film: string;
  effectsVisible: boolean;
  font: string;
  seal: string;
  mistSprite: CanvasImageSource | null;
}

export interface PreviewServices {
  random: EffectSpawning['random'];
  now(): number;
  sounds: EffectSpawning['sounds'] & Record<'bonk' | 'slice' | 'clink', () => void>;
}

/** Each preview owns its animation clock and particles, independent of the game scene. */
export function createArmoryPreview(canvas: HTMLCanvasElement, services: PreviewServices) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Armory preview requires a 2D canvas context');
  const room = canvas.ownerDocument.createElement('img');
  room.decoding = 'async';
  room.src = roomUrl;
  const inkCharm = createInkCharmRenderer(canvas.ownerDocument);
  const inkCompanion = createInkCompanionRenderer(canvas.ownerDocument);
  const inkEnemy = createInkEnemyRenderer(canvas.ownerDocument);
  const inkPlayer = createInkPlayerRenderer(canvas.ownerDocument);
  const inkSword = createInkSwordRenderer(canvas.ownerDocument);
  const fx = createEffects();
  const dummy = makeFig(4242);
  let elapsed = 9,
    last = 0,
    dt = 0,
    cut = 0;
  let density = 1;
  let dissolving = false;
  const position = () => ({
    x: canvas.width * 0.8,
    y: canvas.height * 0.8,
    h: canvas.height * 0.62,
  });
  const scale = () => Math.max(canvas.width, canvas.height) / 900;

  function demo(effect: string, bonk: boolean): void {
    const p = position();
    elapsed = 0;
    dissolving = ['falling-leaves', 'ember-ash', 'ink-wash'].includes(effect) && !bonk;
    for (const particles of Object.values(fx)) particles.length = 0;
    cut = services.random() < 0.5 ? 0 : Math.PI / 2;
    const cx = p.x,
      cy = p.y - p.h * 0.55,
      length = p.h * 0.95;
    const dx = (Math.cos(cut) * length) / 2,
      dy = (Math.sin(cut) * length) / 2;
    const spawn = createEffectSpawner(fx, {
      scale: scale(),
      random: services.random,
      flash: () => {},
      sounds: services.sounds,
      density,
    });
    spawn.addSlash(cx - dx, cy - dy, cx + dx, cy + dy, Math.max(3, p.h * 0.03), 0.3);
    spawn.killFx(effect, cx, cy, cut + Math.PI / 2, p.h / 160);
    if (bonk) services.sounds.bonk();
    else services.sounds.slice();
  }

  function draw(frame: PreviewFrame): void {
    density = frame.effectDensity ?? 1;
    const g = context!;
    const width = canvas.width,
      height = canvas.height;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, width, height);
    if (room.complete && room.naturalWidth) {
      const zoom = Math.max(width / room.naturalWidth, height / room.naturalHeight);
      const dw = room.naturalWidth * zoom,
        dh = room.naturalHeight * zoom;
      g.drawImage(room, (width - dw) / 2, (height - dh) / 2, dw, dh);
    }
    const gradient = g.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(10,10,9,.1)');
    gradient.addColorStop(1, 'rgba(10,10,9,.5)');
    g.fillStyle = gradient;
    g.fillRect(0, 0, width, height);
    {
      void inkCharm.prepare();
      void inkCompanion.prepare();
      void inkEnemy.prepare();
      void inkPlayer.prepare();
      void inkSword.prepare();
    }
    const figures = createFigureRenderer(g, {
      ...frame,
      inkCharm,
      inkCompanion,
      inkEnemy,
      inkPlayer,
      inkSword,
      width,
      height,
      random: services.random,
    });
    if (frame.effectsVisible) {
      const now = services.now();
      dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      elapsed += dt;
      const p = position();
      const figure: Figure = {
        varied: true,
        ...p,
        fog: 0.2,
        alpha: 1,
        d: dummy,
        pose: EPOSE.guard,
        lean: 0,
      };
      if (elapsed < 0.9) {
        figures.drawGroundShadow(figure, deathShadowOpacity(elapsed));
        figure.noShadow = true;
        if (dissolving) {
          applyDeathPose(figure, 'dissolve', elapsed, 1, frame.reducedMotion);
          figures.drawFigure(figure);
        } else if (frame.reducedMotion) {
          applyDeathPose(figure, 'split', elapsed, 1, true);
          figures.drawFigure(figure);
        } else figures.drawSplit(figure, p, cut, elapsed, 0.9);
      } else {
        figure.alpha = clamp((elapsed - 1.1) / 0.4);
        if (figure.alpha > 0) figures.drawFigure(figure);
      }
    }
    figures.drawFigure({
      ...frame.appearance,
      x: width * 0.42,
      y: height * 0.94,
      h: height * 0.82,
      back: true,
      waiting: true,
      fog: 0,
      pose: { gx: 0.19, gy: -0.52, ang: 0.55 },
      noShadow: false,
    });
    if (frame.pet === 'shiba') figures.drawPetAt('shiba', width * 0.86, height - 4, height * 0.22);
    else if (frame.pet === 'cat') figures.drawPetAt('cat', width * 0.88, height - 4, height * 0.2);
    else if (frame.pet === 'mystic-rock')
      figures.drawPetAt('mystic-rock', width * 0.86, height - 4, height * 0.3);
    if (frame.effectsVisible) {
      updateEffects(fx, dt || 0.016, dt || 0.016, {
        scale: scale(),
        wind: frame.wind,
        time: frame.time,
        random: services.random,
        onSwordStuck: services.sounds.clink,
      });
      const renderer = createEffectRenderer(g, fx, {
        scale: scale(),
        time: frame.time,
        font: frame.font,
        seal: frame.seal,
        mistSprite: frame.mistSprite,
      });
      renderer.drawFx();
      renderer.drawFx2();
    }
    applyFilm(g, width, height, canvas, frame.film, frame.time, {
      reducedMotion: frame.reducedMotion,
      reducedFlashes: frame.reducedFlashes,
    });
  }

  return {
    demo,
    draw,
    dispose() {
      room.removeAttribute('src');
      inkCharm.dispose();
      inkCompanion.dispose();
      inkEnemy.dispose();
      inkPlayer.dispose();
      inkSword.dispose();
    },
  };
}
