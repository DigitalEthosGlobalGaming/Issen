import './confirm-action.css';
/** Accessible confirmation owned by the requesting screen. */
export function confirmAction(
  root: HTMLElement,
  title: string,
  message: string,
  label = 'Confirm',
): Promise<boolean> {
  const doc = root.ownerDocument;
  const previous = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
  const dialog = doc.createElement('dialog');
  dialog.className = 'confirm-action';
  const heading = doc.createElement('h2');
  heading.textContent = title;
  const description = doc.createElement('p');
  description.textContent = message;
  description.hidden = !message;
  const cancel = doc.createElement('button');
  cancel.className = 'btn';
  cancel.textContent = 'Cancel';
  cancel.type = 'button';
  const confirm = doc.createElement('button');
  confirm.className = 'btn primary';
  confirm.textContent = label;
  confirm.type = 'button';
  const actions = doc.createElement('div');
  actions.className = 'row';
  actions.append(cancel, confirm);
  dialog.setAttribute('aria-label', title);
  dialog.append(heading, description, actions);
  root.append(dialog);
  return new Promise((resolve) => {
    const events = new AbortController();
    const finish = (accepted: boolean) => {
      events.abort();
      dialog.close();
      dialog.remove();
      previous?.focus({ preventScroll: true });
      resolve(accepted);
    };
    cancel.onclick = () => finish(false);
    confirm.onclick = () => finish(true);
    dialog.addEventListener(
      'cancel',
      (e) => {
        e.preventDefault();
        finish(false);
      },
      { signal: events.signal },
    );
    dialog.addEventListener('keydown', (e) => e.stopPropagation(), { signal: events.signal });
    doc.defaultView!.addEventListener(
      'issen:back',
      (e) => {
        e.stopImmediatePropagation();
        finish(false);
      },
      { capture: true, signal: events.signal },
    );
    dialog.showModal();
    cancel.focus();
  });
}
export function confirmEmberSpend(root: HTMLElement, name: string, cost: number, balance: number) {
  return confirmAction(root, 'Are you sure?', '', `Confirm | -${cost} Embers`);
}
