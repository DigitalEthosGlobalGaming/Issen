import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

export function androidPreflight(config, execute = execFileSync) {
  const adb =
    config.adb ||
    process.env.ISSEN_ADB ||
    (process.env.ANDROID_HOME
      ? path.join(
          process.env.ANDROID_HOME,
          'platform-tools',
          process.platform === 'win32' ? 'adb.exe' : 'adb',
        )
      : 'adb');
  const call = (...args) =>
    execute(adb, args, { encoding: 'utf8', timeout: 15000, windowsHide: true }).trim();
  const devices = call('devices', '-l');
  if (!config.device)
    throw Error(`Android needs an explicit --device=<serial>. Available devices:\n${devices}`);
  if (
    !devices.split('\n').some((line) => {
      const [serial, state] = line.trim().split(/\s+/);
      return serial === config.device && state === 'device';
    })
  )
    throw Error(`Device ${config.device} is not authorised/connected`);
  const run = (...args) => call('-s', config.device, ...args);
  const emulator = run('shell', 'getprop', 'ro.kernel.qemu') === '1';
  if ((config.target === 'emulator') !== emulator)
    throw Error('Selected device does not match --target');
  return {
    adb,
    run,
    metadata: {
      emulator,
      android: run('shell', 'getprop', 'ro.build.version.release'),
      model: run('shell', 'getprop', 'ro.product.model'),
      abi: run('shell', 'getprop', 'ro.product.cpu.abi'),
    },
  };
}
export async function openTarget(config) {
  if (config.target === 'web') {
    const browser = await chromium.launch({
      channel: config.channel,
      headless: !config.headed,
      args: ['--enable-precise-memory-info'],
    });
    const system = await browser.newBrowserCDPSession();
    const graphics = await system
      .send('SystemInfo.getInfo')
      .then((info) => ({
        devices: info.gpu.devices,
        renderer: info.gpu.auxAttributes?.glRenderer,
        implementation: info.gpu.auxAttributes?.glImplementationParts,
      }))
      .catch(() => null);
    await system.detach();
    return {
      version: browser.version(),
      deviceIdentity: null,
      graphics,
      async sample() {
        const context = await browser.newContext({
          viewport: config.viewport,
          deviceScaleFactor: config.dpr,
          serviceWorkers: 'block',
        });
        const page = await context.newPage();
        return { page, cdp: await context.newCDPSession(page), close: () => context.close() };
      },
      async inactive(page, active) {
        await page.evaluate((active) => {
          if (active) {
            delete document.hidden;
            window.dispatchEvent(new Event('focus'));
          } else Object.defineProperty(document, 'hidden', { configurable: true, value: true });
          document.dispatchEvent(new Event('visibilitychange'));
        }, active);
      },
      close: () => browser.close(),
    };
  }
  const { run, metadata } = androidPreflight(config);
  if (
    !/^com\.digitalethosglobalgaming\.issen(?:\.[a-z0-9_]+)*\.performance$/.test(
      config.package || '',
    )
  )
    throw Error(
      'Android profiling requires a dedicated --package=com.digitalethosglobalgaming.issen.performance (or another .performance suffix); player/debug packages are rejected.',
    );
  const info = run('shell', 'dumpsys', 'package', config.package);
  if (!info.includes('DEBUGGABLE'))
    throw Error('The dedicated performance application must be debuggable');
  const pid = run('shell', 'pidof', config.package);
  if (!/^\d+$/.test(pid)) throw Error('Launch the dedicated performance application first');
  const port = run('forward', 'tcp:0', `localabstract:webview_devtools_remote_${pid}`);
  let browser;
  try {
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const page = browser.contexts().flatMap((c) => c.pages())[0];
    if (
      !page ||
      !(await page.evaluate(
        (buildId) => window.__profile?.schemaVersion === 1 && window.__profile.buildId === buildId,
        config.buildId,
      ))
    )
      throw Error(
        'Install/open matching instrumented performance assets in the dedicated app first. No app build or installation is performed by this runner.',
      );
    const base = page.url();
    return {
      version: browser.version(),
      deviceIdentity: metadata,
      base,
      async sample() {
        // This is reachable only after package identity and test-build marker checks.
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        const cdp = await page.context().newCDPSession(page);
        return { page, cdp, close: () => cdp.detach() };
      },
      async inactive(_page, active) {
        if (active) {
          const component = run(
            'shell',
            'cmd',
            'package',
            'resolve-activity',
            '--brief',
            config.package,
          )
            .split('\n')
            .at(-1)
            .trim();
          if (!component.startsWith(`${config.package}/`))
            throw Error('Cannot resolve dedicated app activity');
          run('shell', 'am', 'start', '-n', component);
        } else run('shell', 'input', 'keyevent', 'KEYCODE_HOME');
      },
      close: async () => {
        await browser.close();
        run('forward', '--remove', `tcp:${port}`);
      },
    };
  } catch (error) {
    await browser?.close();
    run('forward', '--remove', `tcp:${port}`);
    throw error;
  }
}

export function localDoctor(config) {
  if (config.target !== 'web') return androidPreflight(config).metadata;
  const edge =
    process.platform === 'win32' &&
    [process.env['PROGRAMFILES(X86)'], process.env.PROGRAMFILES]
      .filter(Boolean)
      .some((p) => existsSync(path.join(p, 'Microsoft/Edge/Application/msedge.exe')));
  return {
    node: process.version,
    channel: config.channel,
    edgeLocated: edge,
    note: 'The run performs a real browser launch. Android components are not installed automatically.',
  };
}
