import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const destination = new URL('../src/ui/assets/', import.meta.url);
await mkdir(destination, { recursive: true });
const silhouette =
  '8,26 14,14 27,8 57,9 84,8 119,10 150,8 176,13 184,26 182,59 184,94 183,130 184,166 176,181 155,184 121,182 87,184 52,182 24,184 11,174 8,153 10,120 8,83 10,52';
function frame(selected) {
  const edge = selected ? '#d5c29b' : '#8e8572';
  const fill = selected ? '#27231c' : '#191815';
  let texture = '';
  for (let i = 0; i < 24; i++) {
    const x = 37 + i * 5;
    texture += `<path d="M${x} ${14 + (i % 4)}h${3 + (i % 5)} M${192 - x} ${175 - (i % 4)}h-${3 + (i % 3)}" stroke="${edge}" stroke-opacity="${0.12 + (i % 3) * 0.08}" stroke-width="1.5"/>`;
  }
  return `<g>
    <polygon points="${silhouette}" fill="${fill}" fill-opacity=".97" stroke="${edge}" stroke-width="3"/>
    <path d="M30 17 54 16 88 18 126 16 163 18 M17 34 18 68 16 100 18 141 18 160 M32 174 62 176 95 174 126 176 156 174 M174 32 176 63 174 99 176 135 173 155" fill="none" stroke="${edge}" stroke-opacity=".24" stroke-width="2"/>
    <path d="M10 34 13 19 25 10 46 11 32 16 24 19 18 28 15 47 11 42Z M148 11 174 14 182 27 181 45 176 33 172 23 164 19 143 16Z M11 146 16 158 19 170 29 177 47 179 32 182 20 180 11 170Z M180 148 182 169 174 181 150 182 162 177 170 171 174 157Z" fill="${edge}" fill-opacity=".68"/>
    <path d="M22 34 24 24 35 22 M158 23 168 25 169 35 M23 156 24 167 35 170 M157 170 168 168 170 157" fill="none" stroke="${edge}" stroke-width="3" stroke-opacity=".65"/>
    <path d="M42 10h16 M182 70v13 M9 106v17 M129 183h17" stroke="${fill}" stroke-width="4"/>
    ${texture}
    ${selected ? '<path d="M17 28 22 17 31 14 38 15 28 21 23 31Z M160 178l13-13 1 7-7 7Z" fill="#a34a35"/>' : ''}
  </g>`;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="192" viewBox="0 0 384 192">${frame(false)}<g transform="translate(192)">${frame(true)}</g></svg>`;
await writeFile(new URL('panel-atlas.svg', destination), svg);
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage();
  const files = await page.evaluate(async (source) => {
    const image = new Image();
    image.src = `data:image/svg+xml;base64,${btoa(source)}`;
    await image.decode();
    const atlas = document.createElement('canvas');
    atlas.width = 384;
    atlas.height = 192;
    atlas.getContext('2d').drawImage(image, 0, 0);
    const frames = [0, 192].map((x) => {
      const cell = document.createElement('canvas');
      cell.width = cell.height = 192;
      cell.getContext('2d').drawImage(atlas, x, 0, 192, 192, 0, 0, 192, 192);
      return cell.toDataURL('image/png').split(',')[1];
    });
    return [atlas.toDataURL('image/png').split(',')[1], ...frames];
  }, svg);
  for (const [index, name] of ['panel-atlas', 'panel-normal', 'panel-highlighted'].entries()) {
    await writeFile(new URL(`${name}.png`, destination), Buffer.from(files[index], 'base64'));
  }
} finally {
  await browser.close();
}
