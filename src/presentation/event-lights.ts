import type { EventBus, GameEvents } from '../game/events.ts';
import type { SceneLight } from '../rendering/scene-frame.ts';
import { transformSceneLight, type createLightSources } from './light-sources.ts';

interface EventLightViews {
  readonly time: number;
  readonly reducedFlashes: boolean;
}
interface Flash {
  readonly id: string;
  readonly born: number;
  readonly life: number;
  readonly light: Readonly<SceneLight>;
}

/** Presentation-only event listener. No run references, random stream or simulation clock. */
export function bindEventLights(
  events: EventBus<GameEvents>,
  sources: ReturnType<typeof createLightSources>,
  read: () => EventLightViews,
) {
  const flashes: Flash[] = [];
  let sequence = 0;
  let disposed = false;
  function add(
    event: { x: number; y: number; height: number; perfect: boolean },
    kind: 'kill' | 'parry' | 'block',
  ) {
    const views = read();
    if (disposed || views.reducedFlashes) return;
    const height = Math.max(1, event.height);
    const life = kind === 'parry' ? 0.24 : kind === 'kill' ? 0.18 : 0.14;
    // Retire expired flashes on event delivery; drawing only samples their immutable births.
    while (flashes.length && flashes[0]!.born + flashes[0]!.life <= views.time) flashes.shift();
    flashes.push({
      id: String(++sequence),
      born: views.time,
      life,
      light: {
        x: event.x,
        y: event.y - height * 0.55,
        z: height * 0.12,
        radius: height * (kind === 'parry' ? 0.65 : 0.45),
        intensity: (event.perfect ? 1.2 : 0.7) * (kind === 'block' ? 0.6 : 1),
        color: kind === 'kill' ? [1, 0.8, 0.55] : [0.65, 0.85, 1],
      },
    });
  }
  const removeSource = sources.register('combat-flashes', (frame) => {
    if (disposed || read().reducedFlashes) return [];
    return flashes.flatMap((flash) => {
      const age = Math.max(0, frame.time - flash.born);
      if (age >= flash.life) return [];
      const decay = 1 - age / flash.life;
      return [
        {
          id: flash.id,
          light: transformSceneLight(
            {
              ...flash.light,
              intensity: flash.light.intensity * decay * decay,
            },
            frame,
          ),
        },
      ];
    });
  });
  const remove = [
    events.on('kill', (event) => add(event, 'kill')),
    events.on('parry', (event) => add(event, 'parry')),
    events.on('block', (event) => add(event, 'block')),
    events.on('runStarted', () => {
      flashes.length = 0;
    }),
    events.on('runStartCue', (event) => {
      if (event.kind === 'effects') flashes.length = 0;
    }),
  ];
  return () => {
    if (disposed) return;
    disposed = true;
    for (const unsubscribe of remove) unsubscribe();
    removeSource();
    flashes.length = 0;
  };
}
