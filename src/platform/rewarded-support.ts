export type SupportBenefit = 'revive' | 'embers';
export interface RewardedProvider {
  claim(benefit: SupportBenefit): Promise<boolean>;
}
/** Future ad integrations return true only for a completed, verified reward. */
export function createRewardedSupport(provider: RewardedProvider | null = null) {
  let busy = false;
  return {
    async claim(benefit: SupportBenefit, premium: boolean): Promise<boolean> {
      if (busy) return false;
      busy = true;
      try {
        return premium || !provider ? true : await provider.claim(benefit);
      } catch {
        return false;
      } finally {
        busy = false;
      }
    },
  };
}
