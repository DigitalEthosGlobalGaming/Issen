import { expect, test } from '@playwright/test';

test('Armoury hides inaccessible and inactive powers, then independently activates outfits', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const armoryPath = '/src/ui/screens/armory.ts';
    const itemsPath = '/src/game/content/items.ts';
    const savesPath = '/src/platform/saves.ts';
    const { createArmoryScreen } = await import(armoryPath);
    const { createItems } = await import(itemsPath);
    const { DEFAULT_EQUIPMENT, parseStatistics } = await import(savesPath);
    const root = document.querySelector('#armory')!.cloneNode(true) as HTMLElement;
    const equipment = { ...DEFAULT_EQUIPMENT };
    const unlocks = new Set(['steel', 'steel+', 'sumi', 'sumi+', 'hai']);
    let access = false,
      enabled = true;
    const controller = createArmoryScreen(root, {
      items: createItems(() => unlocks),
      equipment,
      unlocks,
      statistics: parseStatistics({}),
      seals: {},
      charms: {},
      awakeningAccess: () => access,
      powersEnabled: () => enabled,
      awakeningProgress: () => ({ k: 14, p: 0, d: 0, w: 3, rw: 0, c: 0, sc: 0 }),
      events: { equipped() {}, awaken() {}, preview() {} },
    });
    const info = () => root.querySelector('#armInfo')!.textContent!;
    const click = (label: string) =>
      root.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!.click();
    const tab = (name: string) =>
      [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
        .find((button) => button.textContent!.startsWith(name))!
        .click();
    controller.render();
    click('Tamahagane');
    click('Tamahagane');
    const gated = !equipment.bladeSp && !root.querySelector('.spx,.spb,.awakening-active');
    access = true;
    controller.render();
    const inactiveHidden = !info().includes('Score ×1.15');
    click('Tamahagane');
    const bladeActive = equipment.bladeSp && !!root.querySelector('.awakening-active');
    tab('Outfits');
    const beforeSelection = !info().includes('15% more time between attackers');
    click('Sumi');
    const firstSelection = !equipment.robeSp && !info().includes('15% more time between attackers');
    click('Sumi');
    const outfitActive =
      equipment.robeSp &&
      equipment.bladeSp &&
      info().includes('Awakened active') &&
      info().includes('15% more time between attackers');
    enabled = false;
    controller.render();
    const suppressed =
      !root.querySelector('.awakening-active') &&
      info().includes('suppressed') &&
      !info().includes('15% more time between attackers');
    enabled = true;
    controller.render();
    click('Sumi');
    const normalAgain = !equipment.robeSp && !info().includes('15% more time between attackers');
    click('Ash');
    const challengeOnly = info().includes('(3/9)') && !info().includes('Parry window 15% shorter');
    const secretTile = [...root.querySelectorAll<HTMLButtonElement>('.tile')].find((button) =>
      button.textContent!.includes('Hidden'),
    )!;
    secretTile.click();
    const secret =
      !info().includes('Challenge:') &&
      !root.querySelector('.awakening-active') &&
      !secretTile.getAttribute('aria-label')!.includes('Scarecrow');
    controller.dispose();
    return {
      gated,
      inactiveHidden,
      bladeActive,
      beforeSelection,
      firstSelection,
      outfitActive,
      suppressed,
      normalAgain,
      challengeOnly,
      secret,
    };
  });
  expect(result).toEqual({
    gated: true,
    inactiveHidden: true,
    bladeActive: true,
    beforeSelection: true,
    firstSelection: true,
    outfitActive: true,
    suppressed: true,
    normalAgain: true,
    challengeOnly: true,
    secret: true,
  });
});
