import { Container, Matrix, Sprite, WebGLRenderer } from 'pixi.js';
import type { SceneBackend, SceneFrame } from '../scene-frame.ts';
import { SceneTextureStore } from './texture-store.ts';
import { createMaterialMesh } from './material.ts';

export interface PixiBackendOptions {
  onContextLost?(): void;
  onContextRestored?(): void;
}

/** An explicit target and no ticker: the runtime remains the only frame scheduler. */
export async function createPixiBackend(
  canvas: HTMLCanvasElement,
  options: PixiBackendOptions = {},
): Promise<SceneBackend> {
  const renderer = new WebGLRenderer<HTMLCanvasElement>();
  await renderer.init({
    canvas,
    width: Math.max(1, canvas.clientWidth || canvas.width),
    height: Math.max(1, canvas.clientHeight || canvas.height),
    resolution: 1,
    antialias: true,
    backgroundAlpha: 0,
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
  });
  const root = new Container();
  const textures = new SceneTextureStore();
  const slots: {
    group: Container;
    sprite: Sprite;
    material?: ReturnType<typeof createMaterialMesh>;
  }[] = [];
  const matrix = new Matrix();
  let disposed = false;
  let lost = false;
  let width = 0,
    height = 0,
    dpr = 0;

  function contextLost(event: Event): void {
    event.preventDefault();
    lost = true;
    options.onContextLost?.();
  }
  function contextRestored(): void {
    lost = false;
    options.onContextRestored?.();
  }
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);

  function resize(w: number, h: number, ratio: number): void {
    if (disposed) return;
    w = Math.max(1, w);
    h = Math.max(1, h);
    ratio = Math.max(1, Math.min(2, ratio));
    if (width === w && height === h && dpr === ratio) return;
    width = w;
    height = h;
    dpr = ratio;
    renderer.resize(w, h, ratio);
  }

  return {
    canvas,
    kind: 'pixi',
    resize,
    render(frame: SceneFrame): void {
      if (disposed || lost) return;
      resize(frame.width, frame.height, frame.dpr);
      textures.beginFrame();
      for (let i = 0; i < frame.sprites.length; i++) {
        const command = frame.sprites[i]!;
        let slot = slots[i];
        if (!slot) {
          slot = { group: new Container(), sprite: new Sprite() };
          slots.push(slot);
          slot.group.addChild(slot.sprite);
          root.addChild(slot.group);
        }
        slot.group.visible = true;
        const sprite = slot.sprite;
        if (command.material) {
          if (!slot.material) {
            slot.material = createMaterialMesh();
            slot.group.addChild(slot.material.mesh);
          }
          sprite.visible = false;
          slot.material.mesh.visible = true;
          slot.material.update(command, frame.lighting, textures);
          continue;
        }
        if (slot.material) slot.material.mesh.visible = false;
        sprite.visible = true;
        sprite.texture = textures.get(command.texture);
        sprite.alpha = command.alpha;
        sprite.tint = command.tint;
        sprite.blendMode = command.blend;
        const t = command.transform;
        const sx = command.width / sprite.texture.orig.width;
        const sy = command.height / sprite.texture.orig.height;
        matrix.set(t.a * sx, t.b * sx, t.c * sy, t.d * sy, t.tx, t.ty);
        sprite.setFromMatrix(matrix);
      }
      for (let i = frame.sprites.length; i < slots.length; i++) slots[i]!.group.visible = false;
      renderer.render(root);
      textures.collect();
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      for (const slot of slots) slot.material?.dispose();
      root.destroy({ children: true });
      textures.dispose();
      renderer.destroy({ removeView: false });
    },
  };
}
