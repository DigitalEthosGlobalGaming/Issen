import type { SceneryAtlas } from './packed-scene-atlas.ts';
import type { SceneDrawing } from '../scene-drawing.ts';
import type { EnvironmentFrame } from './local-renderer.ts';
import { createLayout } from '../layout.ts';
import { drawHollowMotion } from './hollow.ts';
import { drawShoreMotion } from './shore.ts';
import { drawMeadowFog } from './meadow.ts';

/** Live decorative motion remains on the presentation clock after composition. */
export function drawEnvironmentMotion(
  ctx: SceneDrawing,
  frame: EnvironmentFrame,
  fog?: SceneryAtlas,
) {
  if (frame.stage === 3) drawHollowMotion(ctx, frame);
  if (frame.stage === 7) drawShoreMotion(ctx, frame);
  if (frame.stage === 0 && fog) drawMeadowFog(ctx, fog, frame);
  if (frame.lowQuality || frame.stage === 0) return;
  const { groundY, horizonY } = createLayout(frame.width, frame.height);
  const offset =
    frame.reducedMotion || frame.reducedFlashes
      ? 0
      : Math.sin(frame.time * 0.12) * frame.height * 0.006;
  const mist = ctx.createLinearGradient(
    0,
    horizonY + offset,
    0,
    groundY + frame.height * 0.07 + offset,
  );
  mist.addColorStop(0, 'rgba(222,213,191,0)');
  mist.addColorStop(0.4, 'rgba(222,213,191,0.11)');
  mist.addColorStop(1, 'rgba(222,213,191,0)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, horizonY + offset, frame.width, groundY - horizonY + frame.height * 0.07);
}
