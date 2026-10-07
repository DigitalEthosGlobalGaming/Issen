import { TAU } from '../shared/math.ts';
import { rng, type Random } from '../shared/random.ts';
import type { SceneDrawing } from '../rendering/scene-drawing.ts';

export interface PostArtworkViews {
  readonly W: number;
  readonly H: number;
  readonly R: Random;
  readonly mainG: SceneDrawing;
  readonly context2d: (canvas: HTMLCanvasElement) => CanvasRenderingContext2D;
}

/** Cached cosmetic artwork; prepare in Canvas, submit textures through the native painter. */
export function createPostArtwork(doc: Document, readViews: () => PostArtworkViews) {
  const grainCanv: HTMLCanvasElement[] = [];
  const grainPats: (CanvasPattern | null)[] = [];
  let vig: HTMLCanvasElement | null = null;
  let inkEdge: HTMLCanvasElement | null = null;
  function buildPost() {
    const { W, H, R, mainG, context2d } = readViews();
    if (!grainCanv.length) {
      for (let k = 0; k < 3; k++) {
        const c = doc.createElement('canvas');
        c.width = c.height = 180;
        const x = context2d(c);
        const id = x.createImageData(180, 180);
        for (let i = 0; i < id.data.length; i += 4) {
          const v = R() < 0.5 ? 0 : 255;
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
          id.data[i + 3] = R() * 36;
        }
        x.putImageData(id, 0, 0);
        grainCanv.push(c);
        grainPats.push(mainG.createPattern(c, 'repeat'));
      }
    }
    vig = doc.createElement('canvas');
    vig.width = Math.max(1, Math.round(W));
    vig.height = Math.max(1, Math.round(H));
    const v = context2d(vig);
    const gr = v.createRadialGradient(
      W / 2,
      H * 0.46,
      Math.min(W, H) * 0.25,
      W / 2,
      H * 0.46,
      Math.max(W, H) * 0.78,
    );
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.55, 'rgba(0,0,0,.16)');
    gr.addColorStop(1, 'rgba(0,0,0,.72)');
    v.fillStyle = gr;
    v.fillRect(0, 0, W, H);
    inkEdge = doc.createElement('canvas');
    inkEdge.width = vig.width;
    inkEdge.height = vig.height;
    const k = context2d(inkEdge),
      m = Math.min(W, H),
      r2 = rng(99);
    const fr = k.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.32,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.72,
    );
    fr.addColorStop(0, 'rgba(14,5,4,0)');
    fr.addColorStop(1, 'rgba(14,5,4,.85)');
    k.fillStyle = fr;
    k.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const sd = (r2() * 4) | 0,
        t = r2(),
        rad = m * (0.05 + r2() * 0.14);
      const x = sd === 0 ? t * W : sd === 1 ? W + rad * 0.3 : sd === 2 ? t * W : -rad * 0.3,
        y = sd === 0 ? -rad * 0.3 : sd === 1 ? t * H : sd === 2 ? H + rad * 0.3 : t * H;
      const rg = k.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, 'rgba(12,4,3,.95)');
      rg.addColorStop(0.6, 'rgba(12,4,3,.6)');
      rg.addColorStop(1, 'rgba(12,4,3,0)');
      k.fillStyle = rg;
      k.beginPath();
      k.arc(x, y, rad, 0, TAU);
      k.fill();
    }
  }

  return {
    buildPost,
    get grainPats() {
      return grainPats;
    },
    get vig() {
      return vig;
    },
    get inkEdge() {
      return inkEdge;
    },
  };
}
