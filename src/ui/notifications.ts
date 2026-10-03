import { activeTimeout, clearActiveTimeout } from '../platform/activity.ts';
export interface ToastMessage {
  k: string;
  msg: string;
}
interface Hint {
  key: string;
  text: string;
  duration: number;
}

export function createNotifications(
  hintElement: HTMLElement,
  toastElement: HTMLElement,
  playUnlock: () => void,
) {
  const hints: Hint[] = [];
  const toasts: ToastMessage[] = [];
  let activeHint: string | null = null;
  let toastBusy = false;
  let disposed = false;
  let hintTimer: number | undefined;
  let hintGap: number | undefined;
  let toastTimer: number | undefined;

  function nextHint() {
    const hint = hints.shift();
    if (!hint || disposed) {
      activeHint = null;
      return;
    }
    activeHint = hint.key;
    hintElement.textContent = hint.text;
    hintElement.classList.add('on');
    clearActiveTimeout(hintTimer);
    hintTimer = activeTimeout(hideHint, hint.duration);
  }
  function hideHint() {
    if (!activeHint) return;
    clearActiveTimeout(hintTimer);
    hintElement.classList.remove('on');
    activeHint = null;
    clearActiveTimeout(hintGap);
    hintGap = activeTimeout(() => {
      if (!activeHint) nextHint();
    }, 450);
  }
  function clearHints() {
    hints.length = 0;
    clearActiveTimeout(hintTimer);
    clearActiveTimeout(hintGap);
    activeHint = null;
    hintElement.classList.remove('on');
  }
  function nextToast() {
    const toast = toasts.shift();
    if (!toast || disposed) {
      toastBusy = false;
      return;
    }
    toastBusy = true;
    const seal = toastElement.ownerDocument.createElement('span');
    seal.className = 'sealk';
    seal.textContent = toast.k;
    const text = toastElement.ownerDocument.createElement('span');
    text.textContent = toast.msg;
    toastElement.replaceChildren(seal, text);
    toastElement.classList.add('on');
    playUnlock();
    toastTimer = activeTimeout(() => {
      toastElement.classList.remove('on');
      toastTimer = activeTimeout(nextToast, 420);
    }, 2600);
  }
  return {
    get activeHint() {
      return activeHint;
    },
    hint(key: string, text: string, duration = 3500) {
      if (disposed) return;
      hints.push({ key, text, duration });
      if (!activeHint) nextHint();
    },
    hideHint,
    clearHints,
    toast(message: ToastMessage) {
      if (disposed) return;
      toasts.push(message);
      if (!toastBusy) nextToast();
    },
    dispose() {
      disposed = true;
      clearHints();
      clearActiveTimeout(toastTimer);
      toasts.length = 0;
      toastBusy = false;
      toastElement.classList.remove('on');
    },
  };
}
