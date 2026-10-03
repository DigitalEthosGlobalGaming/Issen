export type Preference = 'system' | 'on' | 'off';
export type ControlAction = 'up' | 'down' | 'left' | 'right' | 'tap' | 'pause';
export type Bindings = Record<ControlAction, string[]>;
export interface Settings {
  version: 1;
  muted: boolean;
  effectsVolume: number;
  ambienceVolume: number;
  sensitivity: 'low' | 'normal' | 'high';
  bindings: Bindings;
  reducedMotion: Preference;
  reducedFlashes: Preference;
  textSize: 'normal' | 'large';
  menuStyle: 'scroll';
  quality: 'auto' | 'low' | 'high';
  vibration: boolean;
  vibrationStrength: 'light' | 'full';
}
export const CONTROL_LABELS: Record<ControlAction, string> = {
  up: 'Cut up',
  down: 'Cut down',
  left: 'Cut left',
  right: 'Cut right',
  tap: 'Tap / parry / knife',
  pause: 'Pause / resume',
};
export const CONTROL_ACTIONS = Object.keys(CONTROL_LABELS) as ControlAction[];
export function defaultSettings(muted = false): Settings {
  return {
    version: 1,
    muted,
    effectsVolume: 1,
    ambienceVolume: 1,
    sensitivity: 'normal',
    bindings: {
      up: ['ArrowUp', 'w'],
      down: ['ArrowDown', 's'],
      left: ['ArrowLeft', 'a'],
      right: ['ArrowRight', 'd'],
      tap: [' '],
      pause: ['p'],
    },
    reducedMotion: 'system',
    reducedFlashes: 'system',
    textSize: 'normal',
    menuStyle: 'scroll',
    quality: 'auto',
    vibration: true,
    vibrationStrength: 'full',
  };
}
/** Menu keys, modifier chords and the testing shortcut remain reserved. */
export function controlKey(key: string): string | null {
  if (/^Arrow(Up|Down|Left|Right)$/.test(key) || key === ' ') return key;
  const lower = key.toLowerCase();
  return /^[a-z0-9\-=[\]\\;',./`]$/.test(lower) ? lower : null;
}
export function keyLabel(key: string): string {
  return key === ' ' ? 'Space' : key.length === 1 ? key.toUpperCase() : key.replace('Arrow', '');
}
export function parseSettings(raw: unknown, legacyMuted = false): Settings {
  const defaults = defaultSettings(legacyMuted);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
  const value = raw as Record<string, unknown>;
  if (value.version !== 1) return defaults;
  const fraction = (key: 'effectsVolume' | 'ambienceVolume') =>
    typeof value[key] === 'number' && Number.isFinite(value[key])
      ? Math.max(0, Math.min(1, value[key] as number))
      : defaults[key];
  const choice = <T extends string>(key: string, choices: readonly T[], fallback: T): T =>
    choices.includes(value[key] as T) ? (value[key] as T) : fallback;
  const bindings = value.bindings;
  // Treat bindings as a complete map: partial/conflicting saves fall back safely.
  if (bindings && typeof bindings === 'object' && !Array.isArray(bindings)) {
    const source = bindings as Record<string, unknown>,
      used = new Set<string>();
    const parsed = {} as Bindings;
    let valid = true;
    for (const action of CONTROL_ACTIONS) {
      const keys = source[action];
      if (!Array.isArray(keys) || !keys.length || keys.length > 4) {
        valid = false;
        break;
      }
      parsed[action] = [];
      for (const key of keys) {
        const normalized = typeof key === 'string' ? controlKey(key) : null;
        if (!normalized || used.has(normalized)) {
          valid = false;
          break;
        }
        used.add(normalized);
        parsed[action].push(normalized);
      }
    }
    if (valid) defaults.bindings = parsed;
  }
  return {
    ...defaults,
    muted: typeof value.muted === 'boolean' ? value.muted : legacyMuted,
    effectsVolume: fraction('effectsVolume'),
    ambienceVolume: fraction('ambienceVolume'),
    sensitivity: choice('sensitivity', ['low', 'normal', 'high'], 'normal'),
    reducedMotion: choice('reducedMotion', ['system', 'on', 'off'], 'system'),
    reducedFlashes: choice('reducedFlashes', ['system', 'on', 'off'], 'system'),
    textSize: choice('textSize', ['normal', 'large'], 'normal'),
    menuStyle: 'scroll',
    quality: choice('quality', ['auto', 'low', 'high'], 'auto'),
    vibration: typeof value.vibration === 'boolean' ? value.vibration : true,
    vibrationStrength: choice('vibrationStrength', ['light', 'full'], 'full'),
  };
}
export function preferenceEnabled(value: Preference, systemReduced: boolean): boolean {
  return value === 'on' || (value === 'system' && systemReduced);
}
export function sensitivityScale(value: Settings['sensitivity']): number {
  return value === 'low' ? 1.35 : value === 'high' ? 0.75 : 1;
}
export function assignBinding(
  settings: Settings,
  action: ControlAction,
  key: string,
): string | null {
  const normalized = controlKey(key);
  if (!normalized)
    return 'That key is reserved for menu navigation. Choose a letter, arrow or Space.';
  const conflict = CONTROL_ACTIONS.find(
    (other) => other !== action && settings.bindings[other].includes(normalized),
  );
  if (conflict)
    return `${keyLabel(normalized)} is already used for ${CONTROL_LABELS[conflict].toLowerCase()}.`;
  settings.bindings[action] = [normalized];
  return null;
}
