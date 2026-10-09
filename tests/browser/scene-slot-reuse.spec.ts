import { expect, test } from '@playwright/test';

test('changing draw order reuses the bounded mesh pool and preserves submission order', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/feedback loop|destroyed while still bound|GL_INVALID_OPERATION/i.test(message.text()))
      errors.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const painter = await createPixiScenePainter(canvas);
    const source = document.createElement('canvas');
    source.width = source.height = 16;
    const ink = source.getContext('2d')!;
    ink.fillStyle = '#a45d21';
    ink.fillRect(0, 0, 16, 16);
    const initial = new Set<unknown>();
    let peak = 0;
    let reused = true;
    let ordered = true;
    for (let frame = 0; frame < 40; frame++) {
      painter.begin();
      for (let index = 0; index < 12; index++) {
        const kind = (index + frame) % 3;
        painter.globalAlpha = 0.7;
        painter.fillStyle = '#239b7b';
        painter.strokeStyle = '#9c337b';
        painter.lineWidth = 5;
        painter.lineCap = 'round';
        if (kind === 0) painter.fillRect(index * 5, 8 + index * 4, 60, 50);
        if (kind === 1) painter.drawImage(source, index * 3, 12 + index * 2, 70, 65);
        if (kind === 2) {
          painter.beginPath();
          painter.moveTo(7 + index * 4, 60);
          painter.lineTo(50 + index * 4, 100);
          painter.stroke();
        }
      }
      painter.flush();
      const slots = Reflect.get(painter, 'slots');
      const children = Reflect.get(painter, 'root').children;
      peak = Math.max(peak, slots.length);
      if (frame === 0) slots.forEach((slot: { item: unknown }) => initial.add(slot.item));
      else reused &&= slots.every((slot: { item: unknown }) => initial.has(slot.item));
      ordered &&= children.every((item: unknown, index: number) => slots[index].item === item);
    }
    const items = [...initial];
    painter.dispose();
    return {
      peak,
      reused,
      ordered,
      disposed: items.every((item) => Reflect.get(item as object, 'destroyed')),
    };
  });
  expect(result).toEqual({ peak: 12, reused: true, ordered: true, disposed: true });
  expect(errors).toEqual([]);
});
