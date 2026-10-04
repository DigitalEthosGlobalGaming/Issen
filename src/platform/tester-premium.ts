/** Change the campaign or disable it to retire complimentary access independently of billing. */
export const TESTER_PREMIUM_CAMPAIGN = 1;
export const TESTER_PREMIUM_ENABLED = true;
export function parseTesterPremium(value: unknown): { campaign: number } {
  const campaign = value && typeof value === 'object' && 'campaign' in value ? value.campaign : 0;
  return { campaign: campaign === TESTER_PREMIUM_CAMPAIGN ? campaign : 0 };
}
export function testerPremiumActive(value: unknown): boolean {
  return TESTER_PREMIUM_ENABLED && parseTesterPremium(value).campaign === TESTER_PREMIUM_CAMPAIGN;
}
