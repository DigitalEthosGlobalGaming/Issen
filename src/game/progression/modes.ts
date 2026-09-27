export interface RunMode {
  mode: string;
  blade: boolean;
  zen: boolean;
  hard: boolean;
  rush: boolean;
  upgradesEnabled?: boolean;
}

/** Keep the existing save keys stable across the module migration. */
export function modeKey(run: RunMode): string {
  return (
    run.mode +
    (run.blade ? '-blade' : '') +
    (run.zen ? '-zen' : '') +
    (run.hard ? '-hard' : '') +
    (run.rush ? '-rush' : '') +
    (run.upgradesEnabled === false ? '-base' : '')
  );
}

export function modeLabel(
  mode: string,
  blade: boolean,
  zen: boolean,
  hard: boolean,
  rush: boolean,
): string {
  return [
    rush ? 'Boss rush' : null,
    mode === 'ronin' ? 'Ronin' : 'Normal',
    blade ? 'blade only' : null,
    zen ? 'endless' : null,
    hard ? 'no lives' : null,
  ]
    .filter(Boolean)
    .join(', ');
}

export function recordLabel(key: string): string {
  const flags = key.split('-');
  return (
    modeLabel(
      flags[0] ?? 'normal',
      flags.includes('blade'),
      flags.includes('zen'),
      flags.includes('hard'),
      flags.includes('rush'),
    ) + (flags.includes('base') ? ', upgrades off' : '')
  );
}
