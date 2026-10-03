import {
  assignBinding,
  CONTROL_ACTIONS,
  CONTROL_LABELS,
  defaultSettings,
  keyLabel,
} from '../../platform/settings.ts';
import type { Settings, ControlAction } from '../../platform/settings.ts';
type Category = 'audio' | 'controls' | 'display';
type Page = Category | 'root';
const TITLES: Record<Page, string> = {
  root: 'Options',
  audio: 'Audio',
  controls: 'Controls',
  display: 'Display and Accessibility',
};
export function createOptions(
  root: HTMLElement,
  settings: Settings,
  changed: () => void,
  closed: () => void,
) {
  const doc = root.ownerDocument,
    win = doc.defaultView!;
  const content = root.querySelector<HTMLElement>('#optionsContent')!;
  const events = new AbortController();
  let renderEvents = new AbortController();
  let page: Page = 'root',
    open = false,
    capture: ControlAction | null = null;
  let origin: HTMLElement | null = null,
    message = '';
  let historyId = '',
    session = 0;
  const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') => {
    const el = doc.createElement(tag);
    el.textContent = text;
    el.className = className;
    return el;
  };
  function button(label: string, action: () => void, className = 'btn') {
    const el = node('button', label, className);
    el.type = 'button';
    el.addEventListener('click', action, { signal: renderEvents.signal });
    return el;
  }
  function persist() {
    changed();
  }
  function select<K extends keyof Settings>(
    key: K,
    label: string,
    choices: [string, Settings[K]][],
    help = '',
  ) {
    const row = node('div', '', 'option-row'),
      words = node('div');
    const labelEl = node('label', label);
    labelEl.htmlFor = `option-${key}`;
    words.append(labelEl);
    if (help) words.append(node('small', help));
    const input = node('select');
    input.id = labelEl.htmlFor;
    for (const [text, value] of choices) {
      const opt = node('option', text);
      opt.value = String(value);
      input.append(opt);
    }
    input.value = String(settings[key]);
    input.addEventListener(
      'change',
      () => {
        settings[key] = choices.find(([, v]) => String(v) === input.value)![1];
        persist();
      },
      { signal: renderEvents.signal },
    );
    row.append(words, input);
    content.append(row);
  }
  function checkbox(key: 'muted' | 'vibration', label: string, help = '', disabled = false) {
    const row = node('div', '', 'option-row'),
      words = node('div'),
      labelEl = node('label', label);
    labelEl.htmlFor = `option-${key}`;
    words.append(labelEl);
    if (help) words.append(node('small', help));
    const input = node('input');
    input.type = 'checkbox';
    input.id = labelEl.htmlFor;
    input.checked = settings[key];
    input.disabled = disabled;
    input.addEventListener(
      'change',
      () => {
        settings[key] = input.checked;
        persist();
      },
      { signal: renderEvents.signal },
    );
    row.append(words, input);
    content.append(row);
  }
  function volume(key: 'effectsVolume' | 'ambienceVolume', label: string) {
    const row = node('div', '', 'option-volume'),
      labelEl = node('label', label);
    labelEl.htmlFor = `option-${key}`;
    const output = node('output', `${Math.round(settings[key] * 100)}%`);
    output.htmlFor = labelEl.htmlFor;
    const input = node('input');
    input.id = labelEl.htmlFor;
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.step = '5';
    input.value = String(Math.round(settings[key] * 100));
    const update = () => {
      settings[key] = Number(input.value) / 100;
      output.value = `${input.value}%`;
      input.setAttribute('aria-valuetext', output.value);
      persist();
    };
    input.setAttribute('aria-valuetext', output.value);
    input.addEventListener('input', update, { signal: renderEvents.signal });
    row.append(labelEl, output, input);
    content.append(row);
  }
  function navigate(next: Page) {
    capture = null;
    message = '';
    page = next;
    win.history.pushState({ ...win.history.state, issenOptions: historyId, page }, '');
    render(true);
  }
  function back() {
    if (capture) {
      capture = null;
      message = 'Binding change cancelled.';
      render(true);
      return;
    }
    win.history.back();
  }
  function finish() {
    renderEvents.abort();
    open = false;
    capture = null;
    root.hidden = true;
    closed();
    origin?.focus({ preventScroll: true });
  }
  function render(focus = false) {
    renderEvents.abort();
    renderEvents = new AbortController();
    content.replaceChildren();
    root.scrollTop = 0;
    const header = node('div', '', 'options-heading'),
      heading = node('h2', TITLES[page]);
    heading.tabIndex = -1;
    header.append(heading, button(page === 'root' ? 'Done' : 'Back', back));
    content.append(header);
    if (page === 'root') {
      content.append(
        node('p', 'Make Issen comfortable to play. Changes are saved as you go.', 'options-intro'),
      );
      const summaries: Record<Category, string> = {
        audio: settings.muted
          ? 'Muted'
          : `Effects ${Math.round(settings.effectsVolume * 100)}% · Ambience ${Math.round(settings.ambienceVolume * 100)}%`,
        controls: `${settings.sensitivity[0]!.toUpperCase() + settings.sensitivity.slice(1)} swipe sensitivity · Keyboard bindings`,
        display: `${settings.textSize === 'large' ? 'Large' : 'Normal'} text · ${settings.quality === 'auto' ? 'Automatic' : settings.quality === 'low' ? 'Low' : 'High'} effects`,
      };
      for (const category of ['audio', 'controls', 'display'] as const) {
        const el = button('', () => navigate(category), 'btn option-category');
        el.append(node('strong', TITLES[category]), node('small', summaries[category]));
        content.append(el);
      }
    } else if (page === 'audio') {
      checkbox('muted', 'Master mute', 'Keep your volume choices while sound is muted.');
      volume('effectsVolume', 'Sound effects');
      volume('ambienceVolume', 'Ambience');
    } else if (page === 'controls') {
      content.append(
        node(
          'p',
          'Swipe to cut. Tap to parry in a duel, or throw a charged knife during a wave. Escape always pauses and closes menus.',
          'options-intro',
        ),
      );
      select(
        'sensitivity',
        'Swipe sensitivity',
        [
          ['Low', 'low'],
          ['Normal', 'normal'],
          ['High', 'high'],
        ],
        'Higher sensitivity needs a shorter swipe. Combat timing stays the same.',
      );
      content.append(node('h3', 'Keyboard bindings'));
      for (const action of CONTROL_ACTIONS) {
        const row = node('div', '', 'option-row'),
          label = node('span', CONTROL_LABELS[action]);
        const key = button(
          capture === action ? 'Press a key…' : settings.bindings[action].map(keyLabel).join(' / '),
          () => {
            capture = action;
            message = 'Press a letter, arrow or Space. Escape cancels.';
            render(true);
          },
        );
        key.setAttribute('aria-label', `Change ${CONTROL_LABELS[action].toLowerCase()} binding`);
        row.append(label, key);
        content.append(row);
      }
      if (capture)
        content.append(
          button('Cancel binding change', () => {
            capture = null;
            message = 'Binding change cancelled.';
            render(true);
          }),
        );
      content.append(
        button('Restore default bindings', () => {
          settings.bindings = defaultSettings().bindings;
          capture = null;
          message = 'Default bindings restored.';
          persist();
          render(true);
        }),
      );
    } else {
      select('menuStyle', 'Menus', [
        ['Classic', 'classic'],
        ['Scrolls', 'scroll'],
      ]);
      const preferences = [
        ['System', 'system'],
        ['On', 'on'],
        ['Off', 'off'],
      ] as const;
      select(
        'reducedMotion',
        'Reduced motion',
        preferences.map(([a, b]) => [a, b]),
        'Reduce camera movement and death animation motion.',
      );
      select(
        'reducedFlashes',
        'Reduced flashes',
        preferences.map(([a, b]) => [a, b]),
        'Soften screen flashes. System follows your reduced-motion preference.',
      );
      select('textSize', 'Interface text', [
        ['Normal', 'normal'],
        ['Large', 'large'],
      ]);
      select(
        'quality',
        'Effects quality',
        [
          ['Auto', 'auto'],
          ['Low', 'low'],
          ['High', 'high'],
        ],
        'Auto adapts to performance. Attack cues remain visible at every quality.',
      );
      select(
        'vibrationStrength',
        'Vibration strength',
        [
          ['Light', 'light'],
          ['Full', 'full'],
        ],
        'Off is controlled by the Vibration switch.',
      );
      const supported = typeof win.navigator.vibrate === 'function';
      checkbox(
        'vibration',
        'Vibration',
        supported
          ? 'Short feedback on cuts, impacts and parries.'
          : 'Vibration is unavailable on this device.',
        !supported,
      );
    }
    const status = node('p', message, 'options-status');
    status.setAttribute('role', 'status');
    content.append(status);
    if (page !== 'root') {
      content.append(node('p', 'Restore defaults resets only this category.', 'options-help'));
      content.append(
        button('Restore defaults', () => {
          const defaults = defaultSettings();
          if (page === 'audio') {
            settings.muted = false;
            settings.effectsVolume = 1;
            settings.ambienceVolume = 1;
          }
          if (page === 'controls') {
            settings.sensitivity = 'normal';
            settings.bindings = defaults.bindings;
          }
          if (page === 'display') {
            settings.reducedMotion = 'system';
            settings.reducedFlashes = 'system';
            settings.textSize = 'normal';
            settings.menuStyle = 'classic';
            settings.quality = 'auto';

            settings.vibration = true;
            settings.vibrationStrength = 'full';
          }
          capture = null;
          message = `${TITLES[page]} defaults restored.`;
          persist();
          render(true);
        }),
      );
    }
    if (focus) heading.focus({ preventScroll: true });
  }
  win.addEventListener(
    'popstate',
    () => {
      if (!open) return;
      const state = win.history.state;
      if (
        state?.issenOptions === historyId &&
        ['root', 'audio', 'controls', 'display'].includes(state.page)
      ) {
        page = state.page;
        capture = null;
        message = '';
        render(true);
      } else finish();
    },
    { signal: events.signal },
  );
  win.addEventListener(
    'issen:back',
    () => {
      if (open) back();
    },
    { signal: events.signal },
  );
  win.addEventListener(
    'keydown',
    (event) => {
      if (!open) return;
      // Keep all menu keys away from runtime shortcuts; native control defaults still work.
      event.stopImmediatePropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        back();
        return;
      }
      if (event.key === 'Tab' && !capture) {
        const controls = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled)',
          ),
        );
        const current = controls.indexOf(doc.activeElement as HTMLElement);
        event.preventDefault();
        const next =
          current < 0
            ? event.shiftKey
              ? controls.length - 1
              : 0
            : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
        controls[next]?.focus();
        return;
      }
      if (!capture) return;
      event.preventDefault();
      const error =
        event.ctrlKey || event.altKey || event.metaKey
          ? 'Modifier shortcuts are reserved. Choose a single key.'
          : assignBinding(settings, capture, event.key);
      if (error) {
        message = error;
        render(true);
        return;
      }
      message = `${CONTROL_LABELS[capture]} set to ${keyLabel(settings.bindings[capture][0]!)}.`;
      capture = null;
      persist();
      render(true);
    },
    { capture: true, signal: events.signal },
  );
  return {
    open() {
      historyId = `issen-options-${Date.now()}-${++session}`;
      origin = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
      open = true;
      root.hidden = false;
      navigate('root');
    },
    back,
    dispose() {
      events.abort();
      renderEvents.abort();
      root.hidden = true;
      open = false;
    },
  };
}
