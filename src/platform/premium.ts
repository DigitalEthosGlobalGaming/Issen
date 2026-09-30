export const PREMIUM_FILM = 'supporter-print';
export const PREMIUM_PRODUCT = 'issen_premium';

export interface PremiumInfo {
  entitlements: {
    verification: string;
    active: Record<string, { isActive: boolean; verification: string }>;
  };
}
export interface PremiumState {
  owned: boolean;
  busy: boolean;
  price: string | null;
  message: string;
}
export interface PremiumBilling {
  customer(): Promise<PremiumInfo>;
  price(): Promise<string | null>;
  purchase(): Promise<PremiumInfo>;
  restore(): Promise<PremiumInfo>;
}

/** Ownership comes only from the billing SDK, never from profile unlock flags. */
export function hasPremium(info: PremiumInfo): boolean {
  const entitlement = info.entitlements.active.premium;
  return (
    info.entitlements.verification !== 'FAILED' &&
    entitlement?.isActive === true &&
    entitlement.verification !== 'FAILED'
  );
}

export function createPremium(billing: PremiumBilling | null) {
  let state: PremiumState = {
    owned: false,
    busy: false,
    price: null,
    message: billing
      ? 'Checking purchase availability…'
      : 'Purchases are not available in this build.',
  };
  const listeners = new Set<(state: PremiumState) => void>();
  const publish = (next: Partial<PremiumState>) => {
    state = { ...state, ...next };
    for (const listener of listeners) listener({ ...state });
  };
  function receive(info: PremiumInfo) {
    publish({ owned: hasPremium(info) });
  }
  async function refresh() {
    if (!billing || state.busy) return;
    publish({ busy: true });
    try {
      receive(await billing.customer()); // SDK supplies its native offline cache.
      publish({
        message: state.owned ? 'Thank you for supporting Issen.' : 'One purchase. Yours to keep.',
      });
      try {
        publish({ price: await billing.price() });
      } catch {
        publish({ price: null, message: 'Store unavailable. Please try again online.' });
      }
    } catch {
      // A network failure is not a revocation of already verified ownership.
      publish({ message: 'Could not check purchases. Your free game remains available.' });
    } finally {
      publish({ busy: false });
    }
  }
  async function transact(kind: 'purchase' | 'restore') {
    if (!billing || state.busy || (kind === 'purchase' && (!state.price || state.owned))) return;
    publish({
      busy: true,
      message: kind === 'restore' ? 'Restoring purchases…' : 'Opening the store…',
    });
    try {
      receive(await billing[kind]());
      publish({
        message: state.owned
          ? 'Thank you! Premium is unlocked.'
          : kind === 'restore'
            ? 'No Premium purchase found for this store account.'
            : 'Premium has not been confirmed yet. Pending payments unlock after approval.',
      });
    } catch (error) {
      const cancelled =
        typeof error === 'object' &&
        error !== null &&
        'userCancelled' in error &&
        error.userCancelled === true;
      publish({
        message: cancelled
          ? 'Purchase cancelled. You have not unlocked Premium.'
          : 'Purchase not confirmed. Try again or restore purchases when online.',
      });
    } finally {
      publish({ busy: false });
    }
  }
  return {
    get state() {
      return { ...state };
    },
    available: !!billing,
    receive,
    refresh,
    purchase: () => transact('purchase'),
    restore: () => transact('restore'),
    subscribe(listener: (state: PremiumState) => void) {
      listeners.add(listener);
      listener({ ...state });
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
