import { BindGroup, Texture } from 'pixi.js';
import type { TextureSource } from 'pixi.js';

/** Pixi 8.22 caches native graphics groups beyond their last submitted draw. */
export function detachSourceBindings(source: TextureSource): void {
  for (const resource of [source, source.style]) {
    // EventEmitter exposes no public listener-context inventory. Restrict this
    // adapter to known BindGroups observing this renderer-owned GPU resource.
    const events: unknown = Reflect.get(resource, '_events');
    if (!events || typeof events !== 'object') continue;
    const change: unknown = Reflect.get(events, 'change');
    for (const listener of Array.isArray(change) ? [...change] : [change]) {
      if (!listener || typeof listener !== 'object') continue;
      const group: unknown = Reflect.get(listener, 'context');
      if (!(group instanceof BindGroup) || !group.resources) continue;
      for (const [key, value] of Object.entries(group.resources))
        if (value === resource)
          group.setResource(
            resource === source ? Texture.EMPTY.source : Texture.EMPTY.source.style,
            Number(key),
          );
    }
  }
}
