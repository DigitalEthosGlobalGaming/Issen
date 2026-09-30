import { type PremiumState } from '../../platform/premium.ts';

export function renderSupport(root: HTMLElement, state: PremiumState, available: boolean) {
  const button = root.querySelector<HTMLButtonElement>('#bPurchasePremium')!;
  button.disabled = state.busy || state.owned || !state.price;
  button.textContent = state.owned
    ? 'Premium owned'
    : state.price
      ? `Buy Premium · ${state.price}`
      : 'Store unavailable';
  root.querySelector('#supportMessage')!.textContent = state.message;
  for (const id of ['bRestorePremium', 'bRefreshPremium']) {
    root.querySelector<HTMLButtonElement>('#' + id)!.disabled = state.busy || !available;
  }
  root.querySelector<HTMLButtonElement>('#bEquipPremium')!.hidden = !state.owned;
}
