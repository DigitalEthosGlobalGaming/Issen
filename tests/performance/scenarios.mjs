export async function configure(page, scenario) {
  // A real button gesture initialises/unlocks audio before gameplay fixtures.
  if (
    [
      'combat',
      'demon',
      'paused',
      'inactive-combat',
      'inactive-inspection',
      'film-glitch',
      'film-inferno',
      'kill-effects',
      'stress-100',
    ].includes(scenario)
  ) {
    await page.locator('#bPlay').click();
    await page.evaluate(() => window.__profile.closePanel());
  }
  const panels = {
    stats: 'stats',
    options: 'options',
    armoury: 'armory',
    inspection: 'armory',
    setup: 'setup',
    temple: 'template',
    trials: 'trials',
    'inactive-inspection': 'armory',
  };
  if (panels[scenario]) {
    if (scenario === 'options') await page.locator('#bOptions').click();
    else await page.evaluate((id) => window.__profile.openPanel(id), panels[scenario]);
    await page.locator(`#${panels[scenario]}.on`).waitFor({ state: 'visible' });
  }
  if (scenario.includes('inspection')) {
    await page.locator('#prevC').click();
    await page.getByRole('dialog', { name: 'Equipment inspection' }).waitFor();
  }
  await page.evaluate((name) => window.__profile.configure(name), scenario);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

export function checkState(scenario, initial, final) {
  if (
    scenario === 'stress-100' &&
    (initial.enemies !== 100 || final.enemies !== 100 || final.kills !== 0)
  )
    throw Error('Stress fixture changed: expected 100 waiting actors and no kills');
  if (scenario.startsWith('inactive-') && JSON.stringify(initial) !== JSON.stringify(final))
    throw Error('Inactive scenario advanced simulation');
  if (
    ['combat', 'demon', 'film-glitch', 'film-inferno', 'kill-effects'].includes(scenario) &&
    ['dead', 'over', 'title'].includes(final.state)
  )
    throw Error(`Scenario ${scenario} ended unexpectedly in ${final.state}`);
}

export async function cycleMenus(page, cdp, count = 8) {
  const heaps = [];
  for (let i = 0; i <= count; i++) {
    if (i) {
      for (const id of ['armory', 'options', 'stats']) {
        if (id === 'options') await page.locator('#bOptions').click();
        else await page.evaluate((id) => window.__profile.openPanel(id), id);
        await page.waitForTimeout(150);
        if (id === 'options')
          await page.locator('#options').getByRole('button', { name: 'Done', exact: true }).click();
        else await page.evaluate(() => window.__profile.closePanel());
      }
    }
    // Retention experiment only; never used in headline timing runs.
    await cdp.send('HeapProfiler.collectGarbage');
    heaps.push({ cycle: i, ...(await cdp.send('Runtime.getHeapUsage')) });
  }
  return heaps;
}
