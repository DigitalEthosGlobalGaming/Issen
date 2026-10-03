import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// One editable, monochrome source for material panels, scrolls and brush crests.
const destination = new URL('../src/ui/assets/', import.meta.url);
const width = 768;
const height = 640;
const frames = {};
const parts = [];
const path = (d, fill = '#fff', extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (d, color = '#333', strokeWidth = 2, extra = '') =>
  path(d, 'none', `stroke="${color}" stroke-width="${strokeWidth}" ${extra}`);
function add(name, x, y, w, h, art, slice) {
  frames[name] = { x, y, width: w, height: h, pivot: [w / 2, h / 2], ...(slice ? { slice } : {}) };
  parts.push(`<g transform="translate(${x} ${y})">${art}</g>`);
}
const edge =
  'M10 29 15 15 29 9 57 11 88 9 119 11 151 9 176 15 183 30 181 62 183 95 181 128 183 161 175 179 151 183 121 181 89 183 59 181 29 183 13 173 9 151 11 120 9 89 11 57Z';
function material(kind) {
  let art = path(edge, '#fafafa', 'stroke="#333" stroke-width="3"');
  art += line(
    'M29 18 64 17 97 19 127 17 163 19 M18 34 19 70 17 102 19 141 18 158 M30 174 65 176 97 174 128 176 160 174 M174 32 176 67 174 102 176 133 173 157',
    '#8b8b8b',
    1.8,
  );
  art += path(
    'M10 31 15 16 28 10 43 12 26 20 19 30 15 49Z M155 11 176 16 182 31 180 49 173 30 164 21 150 17Z M11 149 17 165 31 178 48 180 29 182 14 173Z M180 151 182 162 175 178 153 182 169 172Z',
    '#555',
  );
  if (kind === 'paper' || kind === 'scroll-paper') {
    for (let i = 0; i < 18; i++) {
      const x = 27 + ((i * 31) % 133),
        y = 28 + ((i * 43) % 133);
      art += line(`M${x} ${y}l${4 + (i % 6)} ${(i % 3) - 1}`, '#d8d8d8', 0.9);
    }
    art += line('M31 24 27 49 M162 141 165 165 M42 168 64 167', '#aaa', 1.2);
    if (kind === 'scroll-paper')
      art += line('M24 32Q96 27 168 32 M24 160Q96 166 168 160', '#888', 2);
  } else if (kind === 'wood') {
    art += path('M22 21 171 24 170 165 22 168Z', '#ddd');
    for (let i = 0; i < 10; i++) {
      const y = 30 + i * 14;
      art += line(
        `M22 ${y}Q57 ${y - 4} 87 ${y + 1}T170 ${y - 1} M32 ${y + 5}Q73 ${y + 2} 119 ${y + 6}`,
        i % 3 ? '#999' : '#666',
        i % 3 ? 1.4 : 2.5,
      );
    }
    art += line(
      'M118 65C100 58 104 77 120 75C133 74 134 62 118 65 M120 61C96 53 94 82 119 81C142 82 145 55 120 61',
      '#777',
      1.4,
    );
  } else if (kind === 'metal') {
    art += path('M22 21 169 22 162 29 30 29 30 161 162 161 171 171 22 171Z', '#aaa');
    art += path('M30 30 161 30 161 161 30 161Z', '#e5e5e5');
    art += path('M31 30 112 30 31 111Z', '#f8f8f8');
    art += line('M44 53 69 37 M121 150 146 134', '#bbb', 2);
    for (const [x, y] of [
      [25, 25],
      [167, 25],
      [25, 167],
      [167, 167],
    ])
      art += `<circle cx="${x}" cy="${y}" r="4" fill="#444"/><circle cx="${x - 1}" cy="${y - 1}" r="1.5" fill="#fff"/>`;
  } else if (kind === 'silk') {
    art += path('M23 23 168 22 169 168 24 170Z', '#ededed');
    for (let i = 0; i < 9; i++) {
      const x = 27 + i * 17;
      art += line(
        `M${x} 24Q${x - 8} 61 ${x + 2} 97T${x} 169`,
        i % 3 ? '#d6d6d6' : '#b7b7b7',
        i % 3 ? 1 : 3,
      );
    }
    art += line('M21 33 22 160 M171 32 170 159', '#777', 2, 'stroke-dasharray="3 5"');
  } else if (kind === 'stone') {
    art += path(
      'M21 24 69 21 88 33 164 22 172 62 156 85 170 167 100 172 79 158 23 169 29 110 20 78Z',
      '#d7d7d7',
    );
    art += path(
      'M21 24 69 21 88 33 31 44 20 78Z M164 22 172 62 156 85 150 35Z M100 172 79 158 23 169 28 154 85 149Z',
      '#aaa',
    );
    art += line('M69 21 74 40 62 50 M170 110 148 118 145 132 M35 113 48 107 52 119', '#888', 2.5);
    art += path('M109 53 114 49 120 55 115 59Z M70 132 75 130 79 135 73 139Z', '#bbb');
  }
  return art;
}
for (const [i, kind] of ['paper', 'wood', 'metal', 'silk', 'stone', 'scroll-paper'].entries()) {
  add(
    kind === 'scroll-paper' ? kind : `material-${kind}`,
    (i % 4) * 192,
    Math.floor(i / 4) * 192,
    192,
    192,
    material(kind),
    36,
  );
}
add(
  'scroll-rod',
  384,
  192,
  192,
  48,
  path('M8 13 20 9 26 15 168 15 174 9 184 13 186 33 176 38 168 32 26 32 19 38 7 33Z', '#333') +
    path('M27 18 167 18 170 22 25 24Z', '#bdbdbd') +
    line('M29 29 165 29', '#777', 2) +
    path(
      'M12 15 18 13 22 18 22 29 17 33 11 29Z M172 18 178 13 182 16 183 28 177 33 172 29Z',
      '#999',
    ) +
    line('M19 16 18 28 M177 17 178 28', '#ddd', 2),
);

// At 20–40 px these broad, tapered strokes retain the catalog's original motifs.
function ring(cx = 64, cy = 64, r = 48, thickness = 7) {
  const points = (radius) =>
    Array.from({ length: 40 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2,
        jitter = (((i * 7) % 5) - 2) * 0.65;
      return `${cx + Math.cos(a) * (radius + jitter)},${cy + Math.sin(a) * (radius + jitter)}`;
    });
  return path(
    `M${points(r).join('L')}Z M${points(r - thickness)
      .reverse()
      .join('L')}Z`,
    '#fff',
    'fill-rule="evenodd"',
  );
}
const rotate = (angle, art) => `<g transform="rotate(${angle} 64 64)">${art}</g>`;
const crest = {};
crest.tomoe =
  ring() +
  [0, 120, 240]
    .map((a) =>
      rotate(
        a,
        path(
          'M59 28C79 20 84 38 76 46C83 68 66 89 47 88C67 80 69 65 66 53C54 55 48 49 48 41C48 34 52 30 59 28Z',
        ),
      ),
    )
    .join('');
crest.kikyo = [0, 72, 144, 216, 288]
  .map((a) => rotate(a, path('M64 58C43 49 41 30 52 17L64 26 75 16C88 35 79 48 67 58Z')))
  .join('');
crest.kikyo += path('M64 49 73 62 65 74 54 63Z');
crest.juji =
  ring() + path('M56 29 68 27 71 57 97 55 100 68 70 71 70 99 58 102 55 72 29 72 27 59 56 57Z');
crest.aoi =
  ring() +
  [0, 120, 240]
    .map((a) =>
      rotate(
        a,
        path('M64 57C40 48 41 33 48 25C55 18 61 25 64 29C70 20 79 23 82 32C88 48 74 54 64 57Z'),
      ),
    )
    .join('');
crest.fuji = ring();
for (const side of [-1, 1])
  for (let k = 0; k < 6; k++) {
    const t = k / 5,
      x = 64 + side * (6 + 20 * Math.sin(t * Math.PI * 0.9)),
      y = 34 + t * 55,
      r = 8.5 - k * 0.7;
    crest.fuji += path(
      `M${x - r} ${y}Q${x - r} ${y - r} ${x} ${y - r}Q${x + r} ${y - r + 1} ${x + r} ${y}Q${x + r - 1} ${y + r} ${x} ${y + r}Q${x - r} ${y + r - 1} ${x - r} ${y}Z`,
    );
  }
crest.tsuru =
  ring() +
  path(
    'M29 67C34 34 54 35 62 41C52 43 43 50 39 61L62 72 60 43 67 44 69 69 90 57C88 44 78 38 73 36C94 33 104 51 101 66L74 83 58 87Z M60 29C58 18 75 19 75 30L88 36 72 34C64 40 59 35 60 29Z',
  );
crest.rokumon = '';
for (let row = 0; row < 2; row++)
  for (let col = 0; col < 3; col++) {
    const x = 33 + col * 31,
      y = 47 + row * 34;
    crest.rokumon +=
      ring(x, y, 14, 4) +
      path(
        `M${x - 10} ${y - 2} ${x - 3} ${y - 7} ${x - 3} ${y + 5} ${x - 9} ${y + 7}Z M${x + 3} ${y - 6} ${x + 10} ${y - 3} ${x + 9} ${y + 8} ${x + 3} ${y + 5}Z`,
      );
  }
for (const [i, [name, art]] of Object.entries(crest).entries()) {
  const mask = `brush-${name}`;
  const breaks =
    line('M35 40 40 35 M86 31 93 29 M23 67 28 69 M86 90 92 88 M61 105 66 109', '#000', 1.6) +
    path('M53 37 56 34 55 41Z M72 74 77 73 73 77Z M95 52 98 50 97 56Z', '#000');
  const brush = `<defs><mask id="${mask}" maskUnits="userSpaceOnUse" x="0" y="0" width="128" height="128"><rect width="128" height="128" fill="#fff"/>${breaks}</mask></defs><g mask="url(#${mask})">${art}</g>`;
  add(`crest-${name}`, (i % 6) * 128, 384 + Math.floor(i / 6) * 128, 128, 128, brush);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
await mkdir(destination, { recursive: true });
await writeFile(new URL('world-ui-atlas.svg', destination), svg);
const manifest = {
  width,
  height,
  frames,
  origin: 'top-left',
  pivotUnits: 'frame-local pixels',
  color: 'grayscale; opaque material interiors, white transparent crests',
  transforms: 'do not mirror or rotate crests; materials use nine-slice',
  source: 'scripts/generate-world-ui-atlas.mjs',
};
await writeFile(
  new URL('world-ui-atlas.json', destination),
  JSON.stringify(manifest, null, 2) + '\n',
);
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage();
  const result = await page.evaluate(
    async ({ svg, width, height, frames }) => {
      const image = new Image();
      image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
      await image.decode();
      const atlas = document.createElement('canvas');
      atlas.width = width;
      atlas.height = height;
      const context = atlas.getContext('2d');
      context.drawImage(image, 0, 0);
      const files = { atlas: atlas.toDataURL('image/png').split(',')[1] };
      const bounds = {};
      for (const [name, f] of Object.entries(frames)) {
        const canvas = document.createElement('canvas');
        canvas.width = f.width;
        canvas.height = f.height;
        const g = canvas.getContext('2d');
        g.drawImage(atlas, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
        files[name] = canvas.toDataURL('image/png').split(',')[1];
        const pixels = g.getImageData(0, 0, f.width, f.height).data;
        let minX = f.width,
          minY = f.height,
          maxX = -1,
          maxY = -1,
          nonGray = 0;
        for (let y = 0; y < f.height; y++)
          for (let x = 0; x < f.width; x++) {
            const i = (y * f.width + x) * 4;
            if (pixels[i + 3]) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
              if (pixels[i] !== pixels[i + 1] || pixels[i] !== pixels[i + 2]) nonGray++;
            }
          }
        bounds[name] = {
          minX,
          minY,
          maxX,
          maxY,
          nonGray,
          cornerAlpha: [
            pixels[3],
            pixels[(f.width - 1) * 4 + 3],
            pixels[(f.height - 1) * f.width * 4 + 3],
            pixels[pixels.length - 1],
          ],
        };
      }
      return { files, bounds };
    },
    { svg, width, height, frames },
  );
  for (const [name, data] of Object.entries(result.files))
    await writeFile(new URL(`world-ui-${name}.png`, destination), Buffer.from(data, 'base64'));
  console.log(JSON.stringify(result.bounds, null, 2));
} finally {
  await browser.close();
}
