import type { Equipment } from '../../platform/saves.ts';
import { addPreset, type LoadoutPreset } from '../../game/progression/presets.ts';
import { confirmAction } from '../confirm-action.ts';
import './presets.css';
interface PresetOptions {
  presets: LoadoutPreset[];
  capacity(): number;
  current(): Equipment;
  save(): void;
  equip(preset: LoadoutPreset): void;
  temple(): void;
}
export function createPresetScreen(root: HTMLElement, options: PresetOptions) {
  const doc = root.ownerDocument;
  const button = root.querySelector<HTMLButtonElement>('#armPresets')!;
  const dialog = doc.createElement('dialog');
  dialog.className = 'preset-dialog';
  dialog.setAttribute('aria-label', 'Loadout presets');
  root.append(dialog);
  const close = () => {
    dialog.close();
    button.focus();
  };
  const refresh = () => {
    button.textContent = `Presets ${options.presets.length}/${options.capacity()}`;
  };
  function action(label: string, callback: () => void) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = label;
    button.onclick = callback;
    return button;
  }
  function render() {
    refresh();
    dialog.replaceChildren();
    const heading = doc.createElement('h2');
    heading.textContent = `Presets ${options.presets.length}/${options.capacity()}`;
    dialog.append(heading);
    const capacity = options.capacity();
    if (capacity > 0) {
      const save = action('Save current loadout', () => {
        if (!addPreset(options.presets, options.capacity(), options.current())) return;
        options.save();
        render();
      });
      save.disabled = options.presets.length >= capacity;
      dialog.append(save);
    }
    for (const [index, preset] of options.presets.entries()) {
      const row = doc.createElement('section');
      row.className = 'preset-entry';
      row.dataset.preset = preset.id;
      const name = doc.createElement('input');
      name.type = 'text';
      name.value = preset.name;
      name.maxLength = 32;
      name.setAttribute('aria-label', `Name for preset ${index + 1}`);
      name.addEventListener('change', () => {
        preset.name = name.value.trim().slice(0, 32) || preset.name;
        name.value = preset.name;
        options.save();
      });
      const buttons = doc.createElement('div');
      buttons.className = 'row';
      const equip = action('Equip', () => {
        if (index >= options.capacity()) return;
        options.equip(preset);
        close();
      });
      equip.disabled = index >= capacity;
      const update = action('Update', async () => {
        if (
          index >= options.capacity() ||
          !(await confirmAction(dialog, 'Replace this preset?', '', 'Replace'))
        )
          return;
        preset.equipment = { ...options.current() };
        options.save();
        render();
      });
      update.disabled = index >= capacity;
      const remove = action('Delete', async () => {
        if (!(await confirmAction(dialog, 'Delete this preset?', '', 'Delete'))) return;
        const position = options.presets.findIndex((p) => p.id === preset.id);
        if (position < 0) return;
        options.presets.splice(position, 1);
        options.save();
        render();
      });
      buttons.append(equip, update, remove);
      row.append(name, buttons);
      dialog.append(row);
    }
    if (capacity < 5)
      dialog.append(
        action('Unlock in Temple', () => {
          close();
          options.temple();
        }),
      );
    dialog.append(action('Done', close));
  }
  const open = () => {
    render();
    dialog.showModal();
  };
  button.addEventListener('click', open);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('keydown', (event) => event.stopPropagation());
  const back = (event: Event) => {
    if (!dialog.open || dialog.querySelector('.confirm-action[open]')) return;
    event.stopImmediatePropagation();
    close();
  };
  doc.defaultView!.addEventListener('issen:back', back, { capture: true });
  refresh();
  return {
    refresh,
    dispose() {
      button.removeEventListener('click', open);
      doc.defaultView!.removeEventListener('issen:back', back, { capture: true });
      dialog.remove();
    },
  };
}
