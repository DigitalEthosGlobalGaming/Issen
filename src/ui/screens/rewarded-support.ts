import type { SupportBenefit } from '../../platform/rewarded-support.ts';
import './rewarded-support.css';
/** Two-step reward screen: choose a benefit, then complete its support acknowledgement. */
export function createRewardScreen(root: HTMLElement) {
  const dialog = root.ownerDocument.createElement('dialog');
  dialog.className = 'support-reward-dialog';
  dialog.setAttribute('aria-labelledby', 'rewardSupportTitle');
  root.append(dialog);
  let resolve: ((complete: boolean) => void) | null = null;
  const close = (complete: boolean) => {
    dialog.close();
    dialog.replaceChildren();
    const callback = resolve;
    resolve = null;
    callback?.(complete);
  };
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close(false);
  });
  for (const type of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click'])
    dialog.addEventListener(type, (e) => e.stopPropagation());
  return {
    get open() {
      return dialog.open;
    },
    offer(
      benefit: SupportBenefit,
      premium: boolean,
      tester: boolean,
      lives: number,
    ): Promise<boolean> {
      if (resolve) return Promise.resolve(false);
      return new Promise((done) => {
        resolve = done;
        dialog.innerHTML = `<h2 id="rewardSupportTitle">${benefit === 'revive' ? 'Another stroke?' : 'Double your Embers?'}</h2><p>${benefit === 'revive' ? `Restart this wave or duel with ${lives} ${lives === 1 ? 'life' : 'lives'}.` : 'Collect twice the Embers earned in this run.'}</p><button class="btn primary" data-claim>${premium ? 'Revive' : benefit === 'revive' ? 'Watch ad · Revive' : 'Watch ad · Double Embers'}</button><button class="btn" data-skip>${benefit === 'revive' ? 'End run' : 'Collect Embers'}</button>`;
        dialog.querySelector<HTMLButtonElement>('[data-skip]')!.onclick = () => close(false);
        dialog.querySelector<HTMLButtonElement>('[data-claim]')!.onclick = () => {
          dialog.innerHTML = `<h2 id="rewardSupportTitle">${premium ? 'Thank you' : 'On the house'}</h2><p>${premium ? (tester ? 'Thank you for playing. Your complimentary tester Premium includes this revive.' : 'Thank you for purchasing Premium and supporting Issen. This revive is included.') : "We're working on ways you can support our development. While we do this, thank you for playing—this one is on the house."}</p><button class="btn primary" data-complete>Continue</button><button class="btn" data-cancel>Cancel</button>`;
          dialog.querySelector<HTMLButtonElement>('[data-complete]')!.onclick = () => close(true);
          dialog.querySelector<HTMLButtonElement>('[data-cancel]')!.onclick = () => close(false);
          dialog.querySelector<HTMLButtonElement>('[data-complete]')!.focus();
        };
        dialog.showModal();
        dialog.querySelector<HTMLButtonElement>('[data-claim]')!.focus();
      });
    },
    dispose() {
      close(false);
      dialog.remove();
    },
  };
}
