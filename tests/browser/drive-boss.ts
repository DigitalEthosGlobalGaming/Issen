import type { Page } from '@playwright/test';

/** Drive the live duel by its glint and blade, independent of the run seed. */
export async function defeatCurrentBoss(page: Page): Promise<void> {
  await page.evaluate(() => {
    const game = window as any;
    const advance = game.advanceGameFrames ?? game.advance;
    const keys: Record<string, string> = {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    };
    for (let frame = 0; frame < 1200; frame++) {
      advance(1);
      const boss = game.__bossState();
      if (!boss || boss.state === 'dying' || boss.hp <= 0) return;
      if (boss.state === 'flash') window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      const opening = game.__bossState();
      if (opening?.state === 'stagger' && opening.blockT <= 0) {
        const key = keys[opening.sdir];
        if (key) window.dispatchEvent(new KeyboardEvent('keydown', { key }));
      }
    }
    throw new Error('Boss did not fall within 1200 simulated frames');
  });
}
