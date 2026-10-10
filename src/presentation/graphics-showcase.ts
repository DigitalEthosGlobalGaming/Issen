import type { SceneDrawing } from '../rendering/scene-drawing.ts';
import { transformSceneLight, type LightFrame } from './light-sources.ts';

type ShowcaseViews = {
  active(): boolean;
  readonly width: number;
  readonly ground: number;
  readonly figureHeight: number;
  readonly time: number;
  reducedMotion(): boolean;
  particleDensity(): number;
  gustLeaves(count: number): void;
};

/** Cosmetic showcase additions share the live drawing/light paths, never run state. */
export function createGraphicsShowcase(read: () => ShowcaseViews) {
  let elapsed = 0,
    nextGust = 2;
  const embers = Array.from({ length: 18 }, (_, index) => ({
    phase: index / 18,
    sway: ((index % 5) - 2) * 0.12,
  }));
  return {
    update(dt: number) {
      const views = read();
      if (!views.active()) {
        elapsed = 0;
        nextGust = 2;
        return;
      }
      elapsed += dt;
      if (elapsed >= nextGust) {
        nextGust += 6;
        if (!views.reducedMotion()) views.gustLeaves(36);
      }
    },
    lights(frame: Readonly<LightFrame>) {
      const views = read();
      if (!views.active()) return [];
      const h = views.figureHeight;
      const flicker = views.reducedMotion() ? 1 : 1 + Math.sin(views.time * 3.1) * 0.04;
      return [
        {
          id: 'lantern',
          light: transformSceneLight(
            {
              x: views.width * 0.3,
              y: views.ground - h * 0.95,
              z: h * 0.45,
              radius: h * 2,
              intensity: 1.8 * flicker,
              color: [1, 0.64, 0.3],
            },
            frame,
          ),
        },
      ];
    },
    draw(g: SceneDrawing) {
      const views = read();
      if (!views.active()) return;
      const h = views.figureHeight,
        x = views.width * 0.3,
        y = views.ground - h * 0.95;
      g.save();
      g.fillStyle = '#191714';
      g.fillRect(x - h * 0.015, y, h * 0.03, h * 0.95);
      g.fillRect(x - h * 0.08, y - h * 0.12, h * 0.16, h * 0.2);
      g.fillStyle = '#f1bb73';
      g.fillRect(x - h * 0.055, y - h * 0.095, h * 0.11, h * 0.15);
      g.fillStyle = '#352a1d';
      g.fillRect(x - h * 0.1, y - h * 0.14, h * 0.2, h * 0.035);
      g.fillStyle = '#efaa64';
      const time = views.reducedMotion() ? 0 : views.time;
      const count = Math.round(embers.length * views.particleDensity());
      for (let index = 0; index < count; index++) {
        const ember = embers[index]!;
        const age = (time * 0.18 + ember.phase) % 1;
        g.globalAlpha = Math.sin(age * Math.PI) * 0.7;
        g.fillRect(
          x + Math.sin(time + index) * h * 0.05 + age * h * ember.sway,
          y - age * h * 0.65,
          h * 0.008,
          h * 0.012,
        );
      }
      g.restore();
    },
  };
}
