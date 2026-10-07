import { createResultsSession } from '../../../src/game/session/results.ts';
/** Actual results orchestration with in-memory profile and display capabilities. */
export function resultsSessionFixture(runtime) {
  const nodes = new Map(),
    saved = new Map(),
    trace = [],
    sequences = [];
  const views = Object.assign(runtime.views, {
    $: (id) => {
      if (!nodes.has(id))
        nodes.set(id, {
          classList: { remove() {} },
          dataset: {},
          disabled: false,
          hidden: false,
          textContent: '',
        });
      return nodes.get(id);
    },
    sceneContinuation: undefined,
    rewardFlowBusy: false,
    lifecycle: { disposed: false },
    rewardScreen: { offer: async () => false },
    rewardSupport: { claim: async () => true },
    supportPremium: () => false,
    testerPremium: { campaign: 0 },
    captureCheckpoint: (status) => trace.push(['checkpoint', status]),
    reviveDaruma: (...args) => trace.push(['revive', ...args]),
    finishTrial: (message) => trace.push(['trial', message]),
    challenge() {},
    saveStats: () => trace.push('stats'),
    saveMeta: () => {
      trace.push('meta');
      return true;
    },
    runResults: {
      start(...args) {
        sequences.push(args);
      },
    },
    setBestLine() {},
    toast: (value) => trace.push(['toast', value]),
    modeKey: () => 'normal',
    store: {
      get: (key, fallback) => saved.get(key) ?? fallback,
      set: (key, value) => {
        saved.set(key, structuredClone(value));
        return true;
      },
      remove: (key) => saved.delete(key),
    },
    clearRunCheckpoint: () => trace.push('clear'),
    updateSavedRunButtons() {},
    renderGameOver: (...args) => trace.push(['render', ...args.slice(2)]),
  });
  return { views, saved, trace, sequences, flow: createResultsSession(() => views) };
}
