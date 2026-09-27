import type { RunMode } from '../game/progression/modes.ts';
import { modeLabel } from '../game/progression/modes.ts';
import { DEATH_REASONS } from './screens/game-over.ts';

export interface ShareCardRun extends RunMode {
  reason: string;
  maxCombo: number;
  cardScore: number;
  bossesSlain: number;
  wave: number;
  kills: number;
  perfects: number;
  hits: number;
}

export interface ShareCardOptions {
  stage: { n: string; k: string };
  font: string;
  seal: string;
  grain?: CanvasImageSource;
  date?: Date;
}

/** Render a snapshot without mutating the live game canvas or run. */
export function createShareCard(
  source: HTMLCanvasElement,
  run: ShareCardRun,
  { stage, font, seal, grain, date = new Date() }: ShareCardOptions,
): HTMLCanvasElement {
  const canvas = source.ownerDocument.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Share cards require a 2D canvas context');
  context.fillStyle = '#e8e2d4';
  context.fillRect(0, 0, 1080, 1350);

  const px = 48,
    py = 48,
    pw = 984,
    ph = 930;
  context.save();
  context.beginPath();
  context.rect(px, py, pw, ph);
  context.clip();
  const scale = Math.max(pw / source.width, ph / source.height);
  const width = source.width * scale,
    height = source.height * scale;
  context.drawImage(source, px + (pw - width) / 2, py + (ph - height) / 2, width, height);
  const gradient = context.createLinearGradient(0, py + ph * 0.55, 0, py + ph);
  gradient.addColorStop(0, 'rgba(10,10,9,0)');
  gradient.addColorStop(1, 'rgba(10,10,9,.75)');
  context.fillStyle = gradient;
  context.fillRect(px, py, pw, ph);
  const pattern = grain ? context.createPattern(grain, 'repeat') : null;
  if (pattern) {
    context.globalAlpha = 0.9;
    context.fillStyle = pattern;
    context.fillRect(px, py, pw, ph);
    context.globalAlpha = 1;
  }
  context.fillStyle = '#efe9dd';
  context.font = `italic 500 34px ${font}`;
  context.textBaseline = 'alphabetic';
  context.fillText(DEATH_REASONS[run.reason] || '', px + 40, py + ph - 44);
  context.restore();

  context.strokeStyle = 'rgba(20,19,17,.5)';
  context.lineWidth = 2;
  context.strokeRect(px, py, pw, ph);
  context.fillStyle = '#161513';
  context.font = `800 150px ${font}`;
  context.fillText('一閃', 60, 1160);
  context.fillStyle = '#5f5a51';
  context.font = `500 30px ${font}`;
  context.fillText('Issen, a single stroke', 66, 1212);
  context.fillText(
    `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`,
    66,
    1296,
  );
  context.fillText(modeLabel(run.mode, run.blade, run.zen, run.hard, run.rush), 66, 1254);
  context.textAlign = 'right';
  context.fillStyle = '#161513';
  context.font = `800 104px ${font}`;
  context.fillText(run.zen ? `${run.maxCombo} 連` : run.cardScore.toLocaleString(), 1030, 1116);
  context.fillStyle = '#3a3732';
  context.font = `500 32px ${font}`;
  const duels = `${run.bossesSlain} duel${run.bossesSlain === 1 ? '' : 's'} won`;
  context.fillText(
    run.rush
      ? `Boss rush, ${duels}`
      : run.zen
        ? `Longest combo, wave ${run.wave}, ${stage.n}`
        : `Wave ${run.wave}, ${stage.n}`,
    1030,
    1170,
  );
  context.fillText(
    `${run.kills} cut, ${run.perfects} perfect, ${duels}${run.zen ? `, ${run.hits} hit${run.hits === 1 ? '' : 's'}` : ''}`,
    1030,
    1216,
  );

  const glyph = run.mode === 'ronin' ? '浪人' : stage.k;
  const size = glyph.length > 1 ? 96 : 84;
  context.save();
  context.translate(1030 - size / 2, 1276);
  context.rotate(-0.05);
  context.fillStyle = seal;
  context.fillRect(-size / 2, -size / 2, size, size);
  context.strokeStyle = 'rgba(244,237,225,.45)';
  context.lineWidth = 3;
  context.strokeRect(-size / 2 + 6, -size / 2 + 6, size - 12, size - 12);
  context.fillStyle = '#f4ede1';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  if (glyph.length > 1) {
    context.font = `800 38px ${font}`;
    context.fillText(glyph.charAt(0), 0, -18);
    context.fillText(glyph.charAt(1), 0, 22);
  } else {
    context.font = `800 54px ${font}`;
    context.fillText(glyph, 0, 4);
  }
  context.restore();
  return canvas;
}
