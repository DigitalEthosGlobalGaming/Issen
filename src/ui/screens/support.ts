import { type PremiumState } from '../../platform/premium.ts';

export function renderSupport(root: HTMLElement, state: PremiumState, tester = false) {
  const button = root.querySelector<HTMLButtonElement>('#bPurchasePremium')!;
  button.disabled = state.owned || tester;
  button.textContent = state.owned
    ? 'Premium owned'
    : tester
      ? 'Tester Premium active'
      : 'Activate tester Premium';
  root.querySelector('#supportMessage')!.textContent = state.owned
    ? 'Thank you for purchasing Premium and supporting Issen.'
    : tester
      ? 'Thank you for playing. Your complimentary tester Premium is active.'
      : '';
  for (const id of ['bRestorePremium', 'bRefreshPremium']) {
    root.querySelector<HTMLButtonElement>('#' + id)!.hidden = true;
  }
  root.querySelector<HTMLButtonElement>('#bEquipPremium')!.hidden = !state.owned && !tester;
}
