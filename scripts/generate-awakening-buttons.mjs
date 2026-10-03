import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

// Quiet charcoal centers, loaded brush rims, and deliberately cut corners.
// Decoration stays within slice bands so short form labels never cross texture.
const destination = new URL('../src/ui/assets/', import.meta.url);
const cellWidth = 256;
const cellHeight = 128;
const slice = 32;
const width = cellWidth * 3;
const height = cellHeight;
const frames = {};
const p = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const palettes = {
  normal: { body: '#242320', edge: '#beb6a6', light: '#dfd7c7', plane: '#302e29' },
  awakened: { body: '#28251e', edge: '#b39a60', light: '#d3bb7a', plane: '#363126' },
  third: { body: '#2b261c', edge: '#c2a35f', light: '#e1c786', plane: '#3b3325' },
};
const silhouette = 'M8 25 14 13 31 10 52 11 76 10 102 11 133 9 159 11 185 10 216 11 237 14 247 26 246 47 247 70 246 91 244 107 233 117 216 118 191 117 162 119 133 117 104 118 77 117 52 119 29 117 14 113 9 101 10 76 9 50Z';
function plate(name) {
  const c = palettes[name];
  const third = name === 'third';
  const awakened = name !== 'normal';
  let art = p(silhouette, c.body, `stroke="${c.edge}" stroke-width="${third ? 3.3 : 2.2}"`);
  // Broad angular planes are confined to the rim, leaving the center a flat ink field.
  art += p('M16 24 26 17 72 17 108 19 143 16 187 18 229 18 239 26 229 29 164 26 105 27 49 25 23 31Z', c.plane);
  art += p('M14 31 21 26 20 57 18 86 23 104 17 107 12 98 14 72Z', c.plane);
  art += p('M30 107 81 110 133 108 188 109 229 103 234 109 216 114 165 113 117 114 67 113 29 113Z', '#1d1c19');
  art += p('M238 31 242 28 242 56 240 82 241 100 235 106 234 83 237 57Z', '#1b1b18');
  // Loaded ivory/gold brush contact tapers across the upper edge, with split bristles.
  art += p('M14 22 20 15 32 13 59 15 90 14 124 16 158 14 194 16 224 15 233 18 221 20 196 19 166 20 131 18 99 20 72 18 48 19 27 20 18 29Z', c.light, `opacity="${awakened ? '.82' : '.6'}"`);
  art += p('M25 14 48 14 77 13 97 15 73 16 44 15Z', c.body);
  art += p('M115 16 151 15 178 17 147 18 117 17Z', c.body);
  art += p('M181 19 205 17 226 17 213 18 195 20Z', c.body);
  // Dry bottom return stroke and a short vertical loaded contact, no emblems.
  art += p('M27 115 54 112 78 113 107 112 136 114 165 112 199 113 220 109 232 104 229 111 216 115 188 116 154 115 129 116 94 115 60 117Z', c.edge, `opacity="${third ? '.88' : '.47'}"`);
  art += p('M10 41 13 33 15 46 13 66 14 87 17 103 13 100 11 88 12 62Z', c.edge, 'opacity=".5"');
  art += p('M242 78 244 93 241 107 231 115 219 116 235 109 239 101Z', c.light, `opacity="${third ? '.9' : '.5'}"`);
  // Thin straight bristle breaks retain the brush direction and transparent surround.
  art += p('M34 115h19 M85 116h15 M171 114h18 M243 39v10 M12 73v9', 'none', `stroke="${c.body}" stroke-width="1.6"`);
  if (awakened) {
    art += p('M22 23 28 21 55 22 85 21 118 23 151 21 183 22 216 21 234 23', 'none', `stroke="${c.edge}" stroke-width="1.3" stroke-opacity=".7"`);
    art += p('M24 102 31 107 64 106 96 107 131 105 162 107 199 105 225 105 235 98', 'none', `stroke="${c.edge}" stroke-width="1.3" stroke-opacity=".55"`);
  }
  if (third) {
    // A separate inner rim survives nine-slicing and distinguishes Third by structure.
    art += p('M24 31 28 27 59 28 92 27 129 28 161 27 196 28 227 27 232 32 231 58 232 80 230 96 225 101 196 100 161 101 130 100 95 101 59 100 28 101 23 96 24 74 23 52Z', 'none', `stroke="${c.edge}" stroke-width="1.8" stroke-opacity=".72"`);
    art += p('M14 23 20 16 29 14 26 19 21 23 17 32Z M236 108 230 114 217 115 223 111 230 108 239 98Z', c.light);
    art += p('M37 28h12 M180 27h8 M231 68v7 M88 101h9 M24 47v8', 'none', `stroke="${c.body}" stroke-width="2.4"`);
  }
  return art;
}
const parts = Object.keys(palettes).map((name, i) => {
  frames[name] = {
    x: i * cellWidth, y: 0, width: cellWidth, height: cellHeight,
    pivot: [128, 64], slice: [slice, slice, slice, slice],
    image: `awakening-button-${name}.png`,
  };
  return `<g transform="translate(${i * cellWidth} 0)">${plate(name)}</g>`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
await writeFile(new URL('awakening-buttons-atlas.svg', destination), svg);
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage();
  const result = await page.evaluate(async ({ svg, width, height, frames }) => {
    const image = new Image(); image.src = `data:image/svg+xml;base64,${btoa(svg)}`; await image.decode();
    const atlas = document.createElement('canvas'); atlas.width = width; atlas.height = height;
    const g = atlas.getContext('2d'); g.drawImage(image, 0, 0);
    const files = { atlas: atlas.toDataURL('image/png').split(',')[1] };
    const checks = {};
    const previews = {};
    for (const [name, frame] of Object.entries(frames)) {
      const cell = document.createElement('canvas'); cell.width = frame.width; cell.height = frame.height;
      const c = cell.getContext('2d'); c.drawImage(atlas, frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height);
      previews[name] = cell.toDataURL('image/png');
      files[name] = previews[name].split(',')[1];
      const pixels = c.getImageData(0, 0, frame.width, frame.height).data;
      let minX = frame.width, minY = frame.height, maxX = -1, maxY = -1;
      let transparent = 0, partial = 0, opaque = 0;
      for (let y = 0; y < frame.height; y++) for (let x = 0; x < frame.width; x++) {
        const a = pixels[(y * frame.width + x) * 4 + 3];
        if (!a) transparent++; else if (a === 255) opaque++; else partial++;
        if (a) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
      }
      const center = Array.from(c.getImageData(128, 64, 1, 1).data);
      const corners = [[0, 0], [255, 0], [0, 127], [255, 127]].map(([x, y]) => c.getImageData(x, y, 1, 1).data[3]);
      const edgeAlpha = c.getImageData(32, 32, 192, 64).data;
      let centerAlphaFailures = 0;
      for (let i = 3; i < edgeAlpha.length; i += 4) if (edgeAlpha[i] !== 255) centerAlphaFailures++;
      checks[name] = { alphaBounds: [minX, minY, maxX, maxY], transparent, partial, opaque, corners, center, centerAlphaFailures };
    }
    return { files, checks, previews };
  }, { svg, width, height, frames });
  for (const [name, check] of Object.entries(result.checks)) {
    const [minX, minY, maxX, maxY] = check.alphaBounds;
    if (Math.min(minX, minY, cellWidth - 1 - maxX, cellHeight - 1 - maxY) < 6 || check.corners.some(Boolean) || check.centerAlphaFailures)
      throw new Error(`${name} violates nine-slice alpha contract: ${JSON.stringify(check)}`);
    frames[name].alphaBounds = check.alphaBounds;
  }
  for (const [name, data] of Object.entries(result.files))
    await writeFile(new URL(name === 'atlas' ? 'awakening-buttons-atlas.png' : `awakening-button-${name}.png`, destination), Buffer.from(data, 'base64'));
  await writeFile(new URL('awakening-buttons-atlas.json', destination), JSON.stringify({
    width, height, columns: 3, rows: 1, cellWidth, cellHeight, frames,
    origin: 'top-left', pivotUnits: 'frame-local pixels',
    alphaBoundsUnits: 'frame-local pixels; inclusive; alpha > 0', sliceUnits: 'source pixels, top right bottom left',
    transforms: { mirror: false, rotate: false },
    rendering: { blend: 'normal alpha', borderImageSlice: '32 fill', borderImageRepeat: 'stretch', suggestedBorderWidth: [8, 12] },
    source: 'scripts/generate-awakening-buttons.mjs',
  }, null, 2) + '\n');
  if (process.argv.includes('--preview')) {
    await page.setViewportSize({ width: 640, height: 218 });
    await page.setContent(`<style>body{margin:0;padding:16px;background:#131315;color:#ece6da;font:14px Georgia}section{display:flex;gap:18px;margin-bottom:18px;align-items:center}.button{box-sizing:border-box;border:10px solid transparent;display:flex;align-items:center;justify-content:center;height:44px;white-space:nowrap;border-image-slice:32 fill;border-image-repeat:stretch}.label{width:82px;color:#aaa;font:12px Arial}</style>${[100,150,130].map((size) => `<section><span class="label">${size} × 44</span>${Object.entries(result.previews).map(([name, src]) => `<div class="button" style="width:${size}px;border-image-source:url('${src}')">${name[0].toUpperCase()+name.slice(1)}</div>`).join('')}</section>`).join('')}`);
    // Include both requested sizes; the last row inspects compact 130px controls.
    const previewPath = join(tmpdir(), 'issen-awakening-buttons-review.png');
    await page.screenshot({ path: previewPath });
    console.log(`Review: ${previewPath}`);
  }
  console.log(JSON.stringify(result.checks, null, 2));
} finally { await browser.close(); }
