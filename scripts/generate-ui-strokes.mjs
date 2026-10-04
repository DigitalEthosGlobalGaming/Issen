import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

// Editable left-to-right brush marks, matching Issen's calligraphic UI family.
// Geometry and texture share a seed so regenerating never changes card identity.
const destination = new URL('../src/ui/assets/', import.meta.url);
const cellWidth = 384;
const cellHeight = 128;
const columns = 4;
const rows = 2;
const width = columns * cellWidth;
const height = rows * cellHeight;
const frames = {};
const parts = [];
const num = (n) => Number(n.toFixed(2));
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const random = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const curve = (points, t) => {
  const s = 1 - t;
  return [0, 1].map(
    (axis) =>
      s ** 3 * points[0][axis] +
      3 * s ** 2 * t * points[1][axis] +
      3 * s * t ** 2 * points[2][axis] +
      t ** 3 * points[3][axis],
  );
};
function point(points, t, offset = 0) {
  const p = curve(points, t);
  const before = curve(points, Math.max(0, t - 0.002));
  const after = curve(points, Math.min(1, t + 0.002));
  const dx = after[0] - before[0];
  const dy = after[1] - before[1];
  const length = Math.hypot(dx, dy) || 1;
  return [num(p[0] - (dy / length) * offset), num(p[1] + (dx / length) * offset)];
}
function ribbon(points, thickness, seed, taper = 0.7) {
  const rand = random(seed);
  const edges = [[], []];
  for (let i = 0; i <= 96; i++) {
    const t = i / 96;
    // A loaded left-hand contact and an accelerating, split right-hand tip.
    const contact = Math.min(1, 0.55 + t * 7);
    const tip = Math.max(0.012, 1 - Math.pow(t, 2.2) * taper);
    const pressure = thickness * contact * tip * (0.86 + 0.14 * Math.sin(t * Math.PI));
    for (let side = 0; side < 2; side++) {
      const jitter = (rand() - 0.5) * (1.2 + thickness * 0.045);
      edges[side].push(point(points, t, (side ? 1 : -1) * (pressure / 2 + jitter)));
    }
  }
  return `M${edges[0].map((p) => p.join(' ')).join('L')}L${edges[1]
    .reverse()
    .map((p) => p.join(' '))
    .join('L')}Z`;
}
function strand(points, start, end, offset, strokeWidth, seed) {
  const rand = random(seed);
  const pointsOnStrand = [];
  for (let i = 0; i <= 18; i++) {
    const t = start + (end - start) * (i / 18);
    pointsOnStrand.push(point(points, t, offset + Math.sin(t * 12) * 0.55 + (rand() - 0.5) * 0.7));
  }
  return path(
    `M${pointsOnStrand.map((p) => p.join(' ')).join('L')}`,
    'none',
    `stroke="#000" stroke-width="${strokeWidth}" stroke-linecap="round"`,
  );
}
function brush(points, thickness, seed, dry = 1, taper = 0.95) {
  const shape = ribbon(points, thickness, seed, taper);
  const id = `stroke-${seed}`;
  const rand = random(seed + 51);
  let breaks = '';
  // Long bristle tracks follow the sweep, leaving broad coherent value masses.
  for (let i = 0; i < Math.ceil(8 * dry); i++) {
    const start = 0.12 + rand() * 0.56;
    const end = Math.min(0.985, start + 0.11 + rand() * 0.43);
    const offset = (rand() - 0.5) * thickness * 0.69;
    breaks += strand(points, start, end, offset, 0.7 + rand() * 1.2 * dry, seed + i);
  }
  // A few open flecks interrupt the loaded part without speckling its surround.
  for (let i = 0; i < Math.ceil(4 * dry); i++) {
    const t = 0.1 + rand() * 0.73;
    const [x, y] = point(points, t, (rand() - 0.5) * thickness * 0.5);
    breaks += path(`M${x} ${y}l${num(3 + rand() * 7)} -1 -3 2 -4 1Z`, '#000');
  }
  const facet = ribbon(points, thickness * 0.22, seed + 105, taper);
  return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="384" height="128"><rect width="384" height="128" fill="#fff"/>${breaks}</mask></defs><g mask="url(#${id})">${path(shape, '#eeeeee')}${path(facet, '#c7c7c7', 'opacity="0.55"')}</g>`;
}
const variants = [
  [
    'broad-rise',
    'Loaded broad upward slash',
    brush(
      [
        [30, 87],
        [90, 83],
        [250, 46],
        [351, 34],
      ],
      29,
      110,
    ),
  ],
  [
    'fine-rise',
    'Fast thin rising cut',
    brush(
      [
        [30, 86],
        [122, 70],
        [249, 54],
        [352, 32],
      ],
      11,
      220,
      0.8,
    ),
  ],
  [
    'dry-brush',
    'Broken horizontal bristle sweep',
    brush(
      [
        [30, 77],
        [128, 68],
        [258, 57],
        [351, 54],
      ],
      27,
      330,
      2.2,
      0.7,
    ),
  ],
  [
    'sweeping-arc',
    'Broad curved upward sweep',
    brush(
      [
        [31, 67],
        [115, 109],
        [252, 88],
        [350, 30],
      ],
      21,
      440,
      1.2,
    ),
  ],
  [
    'double-streak',
    'Two parallel accelerating cuts',
    brush(
      [
        [31, 71],
        [126, 64],
        [249, 49],
        [351, 34],
      ],
      15,
      550,
    ) +
      brush(
        [
          [39, 98],
          [137, 83],
          [256, 63],
          [340, 49],
        ],
        8,
        560,
        1.2,
      ),
  ],
  [
    'loaded-taper',
    'Heavy contact narrowing to a long tail',
    brush(
      [
        [32, 68],
        [107, 51],
        [240, 62],
        [351, 70],
      ],
      38,
      660,
      1.3,
      0.99,
    ),
  ],
  [
    'falling-cut',
    'Downward slash with dry trailing edge',
    brush(
      [
        [31, 34],
        [123, 48],
        [251, 79],
        [351, 89],
      ],
      24,
      770,
      1.4,
    ),
  ],
  [
    'low-sweep',
    'Shallow crescent with a raised finishing tip',
    brush(
      [
        [31, 47],
        [123, 86],
        [261, 95],
        [350, 66],
      ],
      17,
      880,
      1.1,
    ),
  ],
];
for (const [i, [name, description, art]] of variants.entries()) {
  const x = (i % columns) * cellWidth;
  const y = Math.floor(i / columns) * cellHeight;
  frames[name] = { x, y, width: cellWidth, height: cellHeight, pivot: [192, 64], description };
  parts.push(`<g transform="translate(${x} ${y})">${art}</g>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
await writeFile(new URL('ui-strokes-atlas.svg', destination), svg);
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage();
  const result = await page.evaluate(
    async ({ svg, width, height, frames }) => {
      const image = new Image();
      image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const g = canvas.getContext('2d');
      g.drawImage(image, 0, 0);
      const checks = {};
      for (const [name, frame] of Object.entries(frames)) {
        const pixels = g.getImageData(frame.x, frame.y, frame.width, frame.height).data;
        let minX = frame.width,
          minY = frame.height,
          maxX = -1,
          maxY = -1;
        let transparent = 0,
          partial = 0,
          opaque = 0,
          nonGray = 0;
        for (let y = 0; y < frame.height; y++)
          for (let x = 0; x < frame.width; x++) {
            const i = (y * frame.width + x) * 4;
            const a = pixels[i + 3];
            if (a === 0) transparent++;
            else if (a === 255) opaque++;
            else partial++;
            if (a > 0) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
              if (pixels[i] !== pixels[i + 1] || pixels[i] !== pixels[i + 2]) nonGray++;
            }
          }
        checks[name] = {
          alphaBounds: [minX, minY, maxX, maxY],
          transparent,
          partial,
          opaque,
          nonGray,
        };
      }
      const preview = document.createElement('canvas');
      preview.width = 600;
      preview.height = 360;
      const p = preview.getContext('2d');
      p.fillStyle = '#131315';
      p.fillRect(0, 0, 600, 360);
      Object.entries(frames).forEach(([name, f], i) => {
        const x = 16 + (i % 2) * 298,
          y = 10 + Math.floor(i / 2) * 88;
        p.fillStyle = '#252427';
        p.fillRect(x, y, 268, 72);
        p.globalAlpha = 0.28;
        p.drawImage(canvas, f.x, f.y, f.width, f.height, x + 10, y - 5, 248, 82.67);
        p.globalAlpha = 1;
        p.fillStyle = '#ece7db';
        p.font = '17px Georgia';
        p.textAlign = 'center';
        p.fillText('Demon Mirror', x + 134, y + 29);
        p.fillStyle = '#aaa69d';
        p.font = '12px Arial';
        p.fillText(name, x + 134, y + 51);
      });
      return {
        png: canvas.toDataURL('image/png').split(',')[1],
        checks,
        preview: preview.toDataURL('image/png').split(',')[1],
      };
    },
    { svg, width, height, frames },
  );
  for (const [name, check] of Object.entries(result.checks)) {
    const [minX, minY, maxX, maxY] = check.alphaBounds;
    if (Math.min(minX, minY, cellWidth - 1 - maxX, cellHeight - 1 - maxY) < 14 || check.nonGray > 0)
      throw new Error(
        `${name} violates transparent gutter or grayscale contract: ${JSON.stringify(check)}`,
      );
    frames[name].alphaBounds = check.alphaBounds;
  }
  await writeFile(new URL('ui-strokes-atlas.png', destination), Buffer.from(result.png, 'base64'));
  const manifest = {
    width,
    height,
    columns,
    rows,
    cellWidth,
    cellHeight,
    frames,
    family: 'UI completion brush strokes',
    origin: 'top-left',
    pivotUnits: 'frame-local pixels',
    alphaBoundsUnits: 'frame-local pixels; inclusive; alpha > 0',
    direction: 'left-to-right',
    transforms: { mirror: false, rotate: false, preserveAspectRatio: true },
    blend: 'normal alpha',
    color: 'grayscale light ink; tint to muted ivory if desired',
    suggestedDisplay: { width: [144, 288], height: [48, 96], opacity: [0.5, 0.65] },
    source: 'scripts/generate-ui-strokes.mjs',
  };
  await writeFile(
    new URL('ui-strokes-atlas.json', destination),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  if (process.argv.includes('--preview')) {
    const previewPath = join(tmpdir(), 'issen-ui-strokes-review.png');
    await writeFile(previewPath, Buffer.from(result.preview, 'base64'));
    console.log(`Review: ${previewPath}`);
  }
  console.log(JSON.stringify(result.checks, null, 2));
} finally {
  await browser.close();
}
