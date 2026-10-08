const retained: string[] = [];
const limit = 128;
export function markScenePhase(phase: string, key = '', detail: object = {}): string {
  const name = 'issen:' + phase + ':' + key;
  performance.clearMarks(name);
  performance.mark(name, { detail });
  const previous = retained.indexOf(name);
  if (previous >= 0) retained.splice(previous, 1);
  retained.push(name);
  if (retained.length > limit) performance.clearMarks(retained.shift()!);
  return name;
}
export function measureScenePhase(phase: string, start: string, end: string, key: string): void {
  const name = 'issen:' + phase + ':' + key;
  if (
    !performance.getEntriesByName(start, 'mark').length ||
    !performance.getEntriesByName(end, 'mark').length
  )
    return;
  performance.clearMeasures(name);
  performance.measure(name, { start, end });
  const measures = performance
    .getEntriesByType('measure')
    .filter((entry) => entry.name.startsWith('issen:'));
  if (measures.length > limit) performance.clearMeasures(measures[0]!.name);
}
