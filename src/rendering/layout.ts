export function createLayout(W: number, H: number) {
  const portrait = H >= W * 0.9;
  const horizonY = H * (portrait ? 0.37 : 0.43),
    groundY = H * (portrait ? 0.56 : 0.66);
  const eH = portrait ? Math.min(H * 0.16, W * 0.3) : Math.min(H * 0.3, W * 0.12);
  const slots = [];
  for (let i = 0; i < 5; i++) {
    const e = Math.abs(i - 2);
    slots.push({
      x: portrait ? W * (0.12 + i * 0.19) : W * (0.36 + i * 0.14),
      y: groundY + e * eH * 0.13,
      h: eH * (1 + e * 0.07),
      fog: 0.24 - e * 0.05,
    });
  }
  const player = portrait
    ? { x: W * 0.2, y: H * 1.1, h: Math.min(H * 0.62, W * 1.1) }
    : { x: W * 0.21, y: H * 1.12, h: Math.min(H * 1.05, W * 0.5) };
  const strike = portrait
    ? { x: W * 0.62, y: H * 0.8, h: eH * 1.8 }
    : { x: W * 0.56, y: H * 0.95, h: eH * 2.2 };
  const boss = portrait
    ? { x: W * 0.63, y: H * 0.74, h: eH * 2.3 }
    : { x: W * 0.67, y: H * 0.9, h: eH * 2.6 };
  return { horizonY, groundY, eH, slots, player, strike, boss, sunX: W * 0.74 };
}
