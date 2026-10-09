import { parseArgs } from 'node:util';

export const suites = {
  menus: [
    'title',
    'stats',
    'options',
    'armoury',
    'inspection',
    'setup',
    'temple',
    'trials',
    'paused',
    'reduced-title',
  ],
  gameplay: ['combat', 'demon', 'film-glitch', 'film-inferno', 'kill-effects'],
  stress: ['stress-100'],
  lifecycle: ['inactive-combat', 'inactive-inspection'],
  memory: ['menu-cycles'],
  transitions: ['scene-transitions', 'cinematic-transitions'],
  drift: ['drift-calm', 'drift-gust'],
};
export const allScenarios = Object.values(suites).flat();
export function options(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      target: { type: 'string', default: 'web' },
      suite: { type: 'string', default: 'all' },
      scenario: { type: 'string' },
      mode: { type: 'string', default: 'full' },
      drift: { type: 'string', default: 'current' },
      'cpu-rate': { type: 'string', default: '1' },
      repeats: { type: 'string', default: '5' },
      warmup: { type: 'string', default: '3000' },
      duration: { type: 'string', default: '5000' },
      viewport: { type: 'string', default: '390x844' },
      dpr: { type: 'string', default: '2' },
      seed: { type: 'string', default: '424242' },
      channel: { type: 'string', default: 'msedge' },
      port: { type: 'string', default: '5199' },
      headed: { type: 'boolean', default: false },
      compare: { type: 'string' },
      doctor: { type: 'boolean' },
      help: { type: 'boolean' },
      adb: { type: 'string' },
      device: { type: 'string' },
      package: { type: 'string' },
    },
  });
  for (const [key, allowed] of Object.entries({
    target: ['web', 'emulator', 'android-device'],
    mode: ['full', 'timing', 'diagnostic', 'build'],
    suite: ['all', ...Object.keys(suites)],
    drift: ['off', 'current', 'new'],
  })) {
    if (!allowed.includes(values[key])) throw Error(`Invalid --${key}: ${values[key]}`);
  }
  for (const key of ['repeats', 'warmup', 'duration', 'dpr', 'seed', 'port', 'cpu-rate']) {
    values[key] = Number(values[key]);
    if (!Number.isFinite(values[key]) || values[key] <= 0) throw Error(`--${key} must be positive`);
  }
  if (values['cpu-rate'] < 1 || values['cpu-rate'] > 20)
    throw Error('--cpu-rate must be between 1 and 20');
  if (values.target !== 'web' && values['cpu-rate'] !== 1)
    throw Error('--cpu-rate is a web-only CPU approximation');
  if (!Number.isInteger(values.repeats) || values.repeats > 50)
    throw Error('--repeats must be an integer from 1 to 50');
  if (!Number.isInteger(values.port) || values.port < 1024 || values.port > 65535)
    throw Error('--port must be 1024–65535');
  const match = /^(\d+)x(\d+)$/.exec(values.viewport);
  if (!match || +match[1] < 200 || +match[2] < 200)
    throw Error('--viewport must be WIDTHxHEIGHT, at least 200x200');
  values.viewport = { width: +match[1], height: +match[2] };
  values.scenarios = values.scenario
    ? [...new Set(values.scenario.split(','))]
    : values.suite === 'all'
      ? allScenarios
      : suites[values.suite];
  for (const s of values.scenarios)
    if (!allScenarios.includes(s)) throw Error(`Unknown scenario: ${s}`);
  return values;
}

export const help = `Issen performance suite (sequential; isolated test assets and saves)
npm run test-performance
npm run test-performance -- --suite=menus --mode=timing
npm run test-performance -- --scenario=combat,film-glitch --mode=diagnostic
npm run test-performance -- --compare=tmp/performance/<baseline-run>
npm run test-performance -- --target=emulator --doctor --device=<serial> --adb=<path>
npm run test-performance -- --target=emulator --mode=build

Targets: web (default), emulator, android-device. Modes: full, timing, diagnostic, build.
Defaults: 5 repeats, 3000ms warmup, 5000ms samples, 390x844 DPR2, Edge headless.
--headed --viewport=1440x900 --dpr=1 --port=5199 --seed=424242
Android requires --device and a dedicated --package ending .performance.
No APK build, installation, emulator download, or real-save access is performed.
Outputs: unique ignored tmp/performance/<timestamp-id>/ directory.
`;
