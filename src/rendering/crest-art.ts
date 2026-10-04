/** Single vector source for the Seven Dawns thumbnail and live robe crest. */
export const SEVEN_DAWNS_PATHS = [
  'm12 70 7-5 63 1 8 6-13 4-58-1Z',
  'm29 60 1-12 10-10 13-3 15 6 6 11-1 9-8-1-3-10-10-6-11 4-4 11Z',
  'm46 28 1-18 7-4 2 22Z',
  'm30 32-10-15 6-5 11 18Z',
  'm18 43-14-6 1-8 16 8Z',
  'm14 57-12 3-2-7 13-3Z',
  'm64 31 10-19 7 4-12 19Z',
  'm77 39 17-10 5 6-18 12Z',
  'm84 52 14-2 2 8-15 1Z',
];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#d6cbb4">${SEVEN_DAWNS_PATHS.map((d) => `<path d="${d}"/>`).join('')}</svg>`;
export const SEVEN_DAWNS_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
