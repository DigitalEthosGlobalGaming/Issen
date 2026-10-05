import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SETTINGS } from './pbr-forge/settings.mjs';

export const PRESETS_DIR = fileURLToPath(new URL('./presets/', import.meta.url));
export const MODES = ['auto', 'sprite', 'texture'];
export const ENGINES = ['opengl', 'directx'];
export function validatePreset(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('Preset must be a JSON object.');
  for (const key of Object.keys(raw)) {
    if (!['version', 'name', 'description', 'mode', 'engine', 'settings'].includes(key))
      throw new Error(`Unknown preset field: ${key}`);
  }
  if (raw.version !== 1) throw new Error('Preset version must be 1.');
  if (typeof raw.name !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(raw.name))
    throw new Error(
      'Preset name must contain lowercase letters, numbers or hyphens (1–64 characters).',
    );
  if (!MODES.includes(raw.mode)) throw new Error('Preset mode must be auto, sprite or texture.');
  if (!ENGINES.includes(raw.engine)) throw new Error('Preset engine must be opengl or directx.');
  if (raw.description !== undefined && typeof raw.description !== 'string')
    throw new Error('Preset description must be a string.');
  if (!raw.settings || typeof raw.settings !== 'object' || Array.isArray(raw.settings))
    throw new Error('Preset settings must be an object.');
  const settings = {};
  for (const key of Object.keys(raw.settings).sort()) {
    const rule = SETTINGS[key],
      value = raw.settings[key];
    if (!Object.hasOwn(SETTINGS, key)) throw new Error(`Unknown PBR setting: ${key}`);
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < rule.min ||
      value > rule.max
    )
      throw new Error(`${key} must be a number from ${rule.min} to ${rule.max}.`);
    const steps = (value - rule.min) / rule.step;
    if (Math.abs(steps - Math.round(steps)) > 1e-7)
      throw new Error(`${key} must use increments of ${rule.step}.`);
    settings[key] = value;
  }
  return { version: 1, name: raw.name, mode: raw.mode, engine: raw.engine, settings };
}
export async function loadPreset(reference = 'default') {
  const file = /^[a-z0-9][a-z0-9-]*$/.test(reference)
    ? path.join(PRESETS_DIR, `${reference}.pbr.json`)
    : path.resolve(reference);
  try {
    return validatePreset(JSON.parse(await readFile(file, 'utf8')));
  } catch (error) {
    throw new Error(`Cannot load preset ${reference}: ${error.message}`);
  }
}
export async function listPresets() {
  return (await readdir(PRESETS_DIR))
    .filter((name) => name.endsWith('.pbr.json'))
    .sort()
    .map((name) => name.slice(0, -9));
}
