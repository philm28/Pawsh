export type BundleTier = 'bundle_5' | 'bundle_10' | 'bundle_20';

export interface BundleTierConfig {
  id: BundleTier;
  label: string;
  walksIncluded: number;
  monthlyPriceCents: number;
  regularPriceCents: number; // walksIncluded * $50 (the standalone 45-min rate), for showing savings
}

export const BUNDLE_TIERS: BundleTierConfig[] = [
  { id: 'bundle_5', label: '5 Walks / mo', walksIncluded: 5, monthlyPriceCents: 24000, regularPriceCents: 25000 },
  { id: 'bundle_10', label: '10 Walks / mo', walksIncluded: 10, monthlyPriceCents: 45000, regularPriceCents: 50000 },
  { id: 'bundle_20', label: '20 Walks / mo', walksIncluded: 20, monthlyPriceCents: 80000, regularPriceCents: 100000 },
];

export const DOG_SITTING_RATES = {
  day: { label: 'Day Sitting', desc: '4 visits/day, 15 min each', priceCents: 10000 },
  overnight: { label: 'Overnight Sitting', desc: '3 visits + an overnight stay', priceCents: 15000 },
};

export function creditRateCents(tier: BundleTier): number {
  const cfg = BUNDLE_TIERS.find(t => t.id === tier)!;
  return Math.round(cfg.monthlyPriceCents / cfg.walksIncluded);
}

export function creditsNeededFor(tier: BundleTier, priceCents: number): number {
  return Math.ceil(priceCents / creditRateCents(tier));
}
