export async function configure(page, scenario) {
  // A real button gesture initialises/unlocks audio before gameplay fixtures.
  if (
    [
      'combat',
      'drift-calm',
      'drift-gust',
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
  if (scenario === 'drift-calm' && (initial.gustLeaves !== 0 || final.gustLeaves !== 0))
    throw Error('Calm fixture contains gust leaves');
  if (scenario.startsWith('drift-') && !(initial.driftLeaves > 0 && final.driftLeaves > 0))
    throw Error('Drift fixture has no leaves');
  if (scenario === 'drift-gust' && !(initial.gustLeaves > 0 && final.gustLeaves > 0))
    throw Error('Gust fixture has no gust leaves');
  if (
    scenario === 'cinematic-transitions' &&
    (final.renderedScenes?.length !== 10 || !final.renderedScenes.includes(9))
  )
    throw Error(
      `Cinematic fixture did not render all nine stages and Demon during measurement: ${JSON.stringify(final)}`,
    );
  if (scenario === 'scene-transitions' && final.transitions - initial.transitions < 1)
    throw Error('Scene-transition fixture did not change scenery');
  if (
    scenario === 'stress-100' &&
    (initial.enemies !== 100 || final.enemies !== 100 || final.kills !== 0)
  )
    throw Error('Stress fixture changed: expected 100 waiting actors and no kills');
  if (scenario.startsWith('inactive-') && JSON.stringify(initial) !== JSON.stringify(final))
    throw Error('Inactive scenario advanced simulation');
  if (
    [
      'combat',
      'drift-calm',
      'drift-gust',
      'demon',
      'film-glitch',
      'film-inferno',
      'kill-effects',
    ].includes(scenario) &&
    ['dead', 'over', 'title'].includes(final.state)
  )
    throw Error(`Scenario ${scenario} ended unexpectedly in ${final.state}`);
}

export function checkPresentation(scenario, initial, sample) {
  if (scenario.startsWith('inactive-')) return;
  const snapshot = [
    'stats',
    'options',
    'armoury',
    'inspection',
    'setup',
    'temple',
    'trials',
    'paused',
  ].includes(scenario);
  if (!snapshot && !sample.renders.length)
    throw Error('Animated scenario produced no render callbacks');
  if (['armoury', 'inspection'].includes(scenario) && !sample.previews.length)
    throw Error('Visible Armoury preview stopped');
  if (
    snapshot &&
    !sample.renders.length &&
    (sample.updates.length || JSON.stringify(initial) !== JSON.stringify(sample.state))
  )
    throw Error('Snapshot scene continued simulation without drawing');
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
