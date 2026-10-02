import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Exact slice geometry is authored as vector ink, then rasterized with Edge.
const destination = new URL('../src/ui/assets/', import.meta.url);
await mkdir(destination, { recursive: true });
const silhouette =
  '6,15 12,7 37,6 61,7 91,6 116,8 121,15 120,45 122,78 120,111 113,120 81,121 49,120 16,121 7,113 6,82 7,48';
function frame(highlighted) {
  const edge = highlighted ? '#d8cdb6' : '#8a8374';
  const fill = highlighted ? '#38342c' : '#24221f';
  let marks = '';
  // Dry-brush breaks stay within the edge bands; the text area stays quiet.
  for (let i = 0; i < 19; i++) {
    const x = 25 + i * 4;
    const length = 2 + (i % 4);
    marks += `<path d="M${x} ${10 + (i % 3)}h${length} M${128 - x} ${116 - (i % 3)}h-${length}" stroke="${edge}" stroke-opacity="${0.14 + (i % 3) * 0.1}" stroke-width="1"/>`;
  }
  return `<g>
    <polygon points="${silhouette}" fill="${fill}" stroke="${edge}" stroke-width="2.4"/>
    <path d="M12 23 17 13 45 13 61 14 92 13 112 14 116 23 M12 24 13 57 12 89 14 108 22 114 M23 115 58 114 87 115 108 114 115 106 115 82 116 48" fill="none" stroke="${edge}" stroke-opacity=".25" stroke-width="1.5"/>
    <path d="M9 17 17 9 25 9 19 14 14 28 10 45Z M119 93 116 111 108 118 94 118 110 113Z" fill="${edge}" fill-opacity=".36"/>
    <path d="M25 9 52 9 47 11 26 12Z M74 118 99 117 105 119 75 120Z" fill="${edge}" fill-opacity=".35"/>
    <path d="M9 55v17 M119 29v19 M31 119h9 M82 8h12" stroke="${fill}" stroke-width="3"/>
    ${marks}
    ${highlighted ? '<path d="M14 17 19 12 25 12 20 17 17 25 13 25Z M104 115l10-10v7l-5 5Z" fill="#a74c3b"/>' : ''}
  </g>`;
}
const normal = frame(false);
const highlighted = frame(true);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="128" viewBox="0 0 256 128">${normal}<g transform="translate(128)">${highlighted}</g></svg>`;
await writeFile(new URL('button-atlas.svg', destination), svg);
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage();
  const files = await page.evaluate(async (source) => {
    const image = new Image();
    image.src = `data:image/svg+xml;base64,${btoa(source)}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const atlas = canvas.toDataURL('image/png').split(',')[1];
    const frames = [0, 128].map((x) => {
      const cell = document.createElement('canvas');
      cell.width = cell.height = 128;
      cell.getContext('2d').drawImage(canvas, x, 0, 128, 128, 0, 0, 128, 128);
      return cell.toDataURL('image/png').split(',')[1];
    });
    return [atlas, ...frames];
  }, svg);
  for (const [index, name] of ['button-atlas', 'button-normal', 'button-highlighted'].entries()) {
    await writeFile(new URL(`${name}.png`, destination), Buffer.from(files[index], 'base64'));
  }
} finally {
  await browser.close();
}
