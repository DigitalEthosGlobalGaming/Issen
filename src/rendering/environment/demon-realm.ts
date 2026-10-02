const landmarkUrl = new URL('./assets/demon-landmarks-atlas.png', import.meta.url).href;
const terrainUrl = new URL('./assets/demon-terrain-atlas.png', import.meta.url).href;

/** Independently placed atlas props over a procedural sky/floor; no flattened backdrop. */
export function createDemonRealmRenderer(doc: Document) {
  const landmarks = doc.createElement('img'),
    terrain = doc.createElement('img');
  landmarks.decoding = terrain.decoding = 'async';
  landmarks.src = landmarkUrl;
  terrain.src = terrainUrl;
  let disposed = false;
  function stamp(
    g: CanvasRenderingContext2D,
    image: HTMLImageElement,
    cell: number,
    x: number,
    base: number,
    width: number,
    alpha = 1,
  ) {
    if (!image.complete || !image.naturalWidth) return;
    const terrainFrames = [
      [21, 231, 580, 285],
      [650, 240, 586, 285],
      [17, 716, 594, 353],
      [645, 782, 593, 298],
    ] as const;
    const landmarkBases = [550, 552, 528, 533];
    const frame =
      image === terrain
        ? terrainFrames[cell]!
        : [
            ((cell % 2) * image.naturalWidth) / 2,
            (Math.floor(cell / 2) * image.naturalHeight) / 2,
            image.naturalWidth / 2,
            image.naturalHeight / 2,
          ];
    const [sx, sy, sw, sh] = frame;
    const anchor = image === terrain ? (cell === 2 ? 0.94 : 0.93) : landmarkBases[cell]! / 627;
    const height = (width * sh) / sw;
    g.save();
    g.globalAlpha = alpha;
    g.drawImage(image, sx!, sy!, sw, sh, x - width / 2, base - height * anchor, width, height);
    g.restore();
  }
  return {
    draw(
      g: CanvasRenderingContext2D,
      width: number,
      height: number,
      time = 0,
      reducedMotion = false,
      seed = 131304,
    ): boolean {
      if (disposed) return false;
      const variation = (i: number) => {
        const n = Math.sin(seed * 0.731 + i * 12.9898) * 43758.5453;
        return n - Math.floor(n);
      };
      const sky = g.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#110d1a');
      sky.addColorStop(0.48, '#35213c');
      sky.addColorStop(1, '#0e0c10');
      g.fillStyle = sky;
      g.fillRect(0, 0, width, height);
      const moonX = width * (0.42 + variation(0) * 0.35),
        moonY = height * 0.19,
        radius = Math.min(width, height) * 0.075;
      const halo = g.createRadialGradient(moonX, moonY, radius * 0.3, moonX, moonY, radius * 3);
      halo.addColorStop(0, 'rgba(189,155,180,.19)');
      halo.addColorStop(1, 'rgba(100,70,110,0)');
      g.fillStyle = halo;
      g.fillRect(0, 0, width, height * 0.6);
      g.fillStyle = '#958592';
      g.beginPath();
      g.arc(moonX, moonY, radius, 0, Math.PI * 2);
      g.fill();
      stamp(
        g,
        landmarks,
        0,
        width * (0.32 + variation(1) * 0.26),
        height * 0.65,
        Math.min(Math.max(width * 1.15, height * 0.67), height * 0.78),
        0.8,
      );
      stamp(
        g,
        landmarks,
        2,
        width * (0.76 + variation(2) * 0.18),
        height * 0.65,
        Math.min(Math.max(width * 0.5, height * 0.37), height * 0.62),
        0.8,
      );
      stamp(
        g,
        landmarks,
        1,
        width * (0.04 + variation(3) * 0.18),
        height * 0.75,
        Math.min(Math.max(width * 0.36, height * 0.33), height * 0.55),
      );
      const floor = g.createLinearGradient(0, height * 0.53, 0, height);
      floor.addColorStop(0, 'rgba(54,43,58,0)');
      floor.addColorStop(0.13, '#554955');
      floor.addColorStop(0.48, '#49404a');
      floor.addColorStop(1, '#302731');
      g.fillStyle = floor;
      g.fillRect(0, height * 0.53, width, height * 0.47);
      // Broad fractured plates recede toward the horizon, with visible seams between them.
      for (let row = 0; row < 5; row++) {
        const near = height * (0.59 + ((row + 1) / 5) ** 1.7 * 0.43);
        const far = height * (0.59 + (row / 5) ** 1.7 * 0.43);
        for (let col = -1; col < 6; col++) {
          const x = ((col + variation(row * 7 + col + 180) * 0.2) / 5) * width;
          const w = width / 5;
          const taper = (near - far) * 0.22;
          g.fillStyle = `rgba(${col % 2 ? '111,92,106' : '36,26,42'},.24)`;
          g.strokeStyle = 'rgba(16,9,22,.3)';
          g.lineWidth = Math.max(0.7, (row + 1) * 0.35);
          g.beginPath();
          g.moveTo(x + taper, far);
          g.lineTo(x + w - taper, far + (near - far) * 0.08);
          g.lineTo(x + w, near);
          g.lineTo(x, near - (near - far) * 0.06);
          g.closePath();
          g.fill();
          g.stroke();
        }
      }
      // Flat ash beds and low perspective slabs make the combat surface continuous.
      for (let i = 0; i < 65; i++) {
        const depth = variation(i + 10);
        const y = height * (0.59 + depth * 0.4);
        const x = variation(i + 90) * width;
        const w = width * (0.012 + depth * 0.07);
        const h = height * (0.002 + depth * 0.013);
        g.fillStyle = i % 3 ? 'rgba(126,113,125,.15)' : 'rgba(13,10,18,.24)';
        g.beginPath();
        g.moveTo(x - w, y);
        g.lineTo(x + w * 0.7, y - h);
        g.lineTo(x + w, y + h * 0.4);
        g.lineTo(x - w * 0.6, y + h);
        g.closePath();
        g.fill();
      }
      stamp(
        g,
        terrain,
        0,
        width * (0.38 + variation(4) * 0.24),
        height * 1.06,
        Math.min(width * 0.9, height * 0.65),
      );
      const bankWidth = Math.min(width * 0.6, height * 0.75);
      stamp(g, terrain, 1, width * 0.04, height * 0.98, bankWidth);
      stamp(g, terrain, 1, width * 0.96, height * 0.98, bankWidth);
      stamp(
        g,
        terrain,
        2,
        width * 0.03,
        height * 0.87,
        Math.min(Math.max(width * 0.33, 130), height * 0.45),
      );
      stamp(
        g,
        terrain,
        3,
        width * 0.92,
        height * 1.02,
        Math.min(Math.max(width * 0.35, 150), height * 0.45),
      );
      stamp(
        g,
        landmarks,
        3,
        width * 1.02,
        height * 0.93,
        Math.min(Math.max(width * 0.4, height * 0.38), height * 0.6),
      );
      const t = reducedMotion ? 0 : time;
      for (let i = 0; i < 5; i++) {
        const y = height * (0.43 + i * 0.074);
        const shift = Math.sin(t * 0.12 + i) * width * 0.05;
        const mist = g.createRadialGradient(
          width * 0.5 + shift,
          y,
          0,
          width * 0.5 + shift,
          y,
          width * 0.6,
        );
        mist.addColorStop(0, 'rgba(146,96,153,.045)');
        mist.addColorStop(1, 'rgba(146,96,153,0)');
        g.fillStyle = mist;
        g.fillRect(0, y - height * 0.06, width, height * 0.12);
      }
      for (let i = 0; i < 18; i++) {
        const rise = (t * 0.04 + i / 18) % 1;
        g.fillStyle = `rgba(210,78,66,${(1 - rise) * 0.28})`;
        g.fillRect((((i * 137) % 997) / 997) * width, height * (0.94 - rise * 0.65), 1.5, 2);
      }
      return (
        landmarks.complete &&
        landmarks.naturalWidth > 0 &&
        terrain.complete &&
        terrain.naturalWidth > 0
      );
    },
    dispose() {
      disposed = true;
      landmarks.removeAttribute('src');
      terrain.removeAttribute('src');
    },
  };
}
