import { packedDomainStore, packedMaterialEntries } from '../rendering/packed-catalog.ts';
import { packedSpritePlacement } from '../rendering/packed-assets.ts';
import { drawMaterialStamp, setSceneLighting } from '../rendering/scene-material.ts';
import type { createLightingRig } from '../rendering/lighting-rig.ts';
import type { PixiScenePainter } from '../rendering/pixi/scene-painter.ts';
import type { UiLease } from './packed-ui.ts';

/** A preview retains its own lease while sharing decoded pages with live consumers. */
export function createPackedMaterialPreview(
  image: HTMLImageElement,
  rig: ReturnType<typeof createLightingRig>,
) {
  const doc = image.ownerDocument;
  const canvas = doc.createElement('canvas');
  let painter: PixiScenePainter | undefined;
  let painterPending: Promise<PixiScenePainter> | undefined;
  let lease: UiLease | undefined;
  let selected: string | undefined;
  let generation = 0,
    disposed = false;
  let pending: Promise<void> = Promise.resolve();
  function render() {
    const sprite = selected && lease?.sprite(selected);
    if (!sprite || !painter || disposed || !sprite.material) return;
    const [width, height] = sprite.metadata.logicalSize;
    canvas.width = Math.ceil(width);
    canvas.height = Math.ceil(height);
    painter.begin();
    setSceneLighting(painter, rig.lighting(width, height));
    if (!sprite.metadata.empty)
      drawMaterialStamp(painter, {
        texture: { source: sprite.colour, revision: 0, frame: sprite.metadata.frame },
        material: sprite.material,
        ...packedSpritePlacement(sprite.metadata, 0, 0, width, height),
      });
    painter.flush();
    image.src = canvas.toDataURL();
    image.hidden = false;
  }
  const unsubscribe = rig.subscribe(render);
  return {
    select(key: string) {
      const current = ++generation;
      const entry = packedMaterialEntries.find((entry) => entry.key === key);
      if (!entry) {
        lease?.release();
        lease = undefined;
        selected = undefined;
        image.hidden = true;
        image.removeAttribute('src');
        pending = Promise.resolve();
        return pending;
      }
      pending = (async () => {
        const store = await packedDomainStore(doc, entry.domain);
        if (disposed || current !== generation) return;
        const next = store.acquire([entry.id]);
        try {
          await next.ready;
          const target = await (painterPending ??= import('../rendering/pixi/scene-painter.ts')
            .then((module) => module.createPixiScenePainter(canvas))
            .then((target) => {
              if (disposed) target.dispose();
              else painter = target;
              return target;
            }));
          if (disposed || current !== generation) {
            next.release();
            return;
          }
          painter = target;
          lease?.release();
          lease = next;
          selected = entry.id;
          render();
        } catch (error) {
          next.release();
          throw error;
        }
      })();
      void pending.catch(() => {});
      return pending;
    },
    prepare: () => pending,
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      unsubscribe();
      lease?.release();
      painter?.dispose();
      canvas.width = canvas.height = 0;
    },
  };
}
