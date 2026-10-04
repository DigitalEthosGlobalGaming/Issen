import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  ENTITLEMENT_VERIFICATION_MODE,
  type PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import { createPremium, PREMIUM_PRODUCT } from './premium.ts';

export const nativePurchases = Capacitor.isNativePlatform();
export const PLACEHOLDER_SUPPORT = true;
export const premiumEnabled =
  !PLACEHOLDER_SUPPORT && nativePurchases && import.meta.env.VITE_PREMIUM_ENABLED === 'true';
const key = import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined;
const enabled =
  premiumEnabled &&
  Capacitor.getPlatform() === 'android' &&
  !!key &&
  (key.startsWith('goog_') ||
    (import.meta.env.VITE_PREMIUM_TEST_STORE === 'true' && key.startsWith('test_')));
let configured: Promise<void> | undefined;
function ready() {
  return (configured ??= Purchases.configure({
    apiKey: key!,
    entitlementVerificationMode: ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
  }));
}
let currentPackage: PurchasesPackage | null = null;
export const premium = createPremium(
  enabled
    ? {
        async customer() {
          await ready();
          return (await Purchases.getCustomerInfo()).customerInfo;
        },
        async price() {
          await ready();
          const offerings = await Purchases.getOfferings();
          const candidate = offerings.all.default?.lifetime;
          currentPackage = candidate?.product.identifier === PREMIUM_PRODUCT ? candidate : null;
          return currentPackage?.product.priceString ?? null;
        },
        async purchase() {
          await ready();
          if (!currentPackage) throw new Error('Premium product unavailable');
          return (await Purchases.purchasePackage({ aPackage: currentPackage })).customerInfo;
        },
        async restore() {
          await ready();
          return (await Purchases.restorePurchases()).customerInfo;
        },
      }
    : null,
);

/** SDK instance survives screen changes/HMR; each runtime owns its listener. */
export function listenToPurchases(): () => void {
  let disposed = false;
  let remove: (() => void) | undefined;
  if (enabled)
    void ready()
      .then(async () => {
        const id = await Purchases.addCustomerInfoUpdateListener((info) => {
          if (!disposed) premium.receive(info);
        });
        remove = () => {
          void Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: id }).catch(() => {});
        };
        if (disposed) remove();
      })
      .catch(() => {});
  return () => {
    disposed = true;
    remove?.();
  };
}
