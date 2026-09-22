import { PRICING, ADDONS, ServiceKey } from '../data/pricing';

export interface EstimateResult {
  min: number;
  max: number;
}

export function estimate(
  service: ServiceKey,
  sizeId: string | null,
  selectedAddons: Record<string, number>
): EstimateResult | null {
  if (!service || !sizeId) {
    return null;
  }

  const servicePricing = PRICING[service];
  if (!servicePricing) {
    return null;
  }

  const sizeOption = servicePricing.options.find((opt) => opt.id === sizeId);
  if (!sizeOption || sizeOption.basePrice === null) {
    return null;
  }

  let min = sizeOption.basePrice;
  let max = sizeOption.basePrice;

  for (const [addonId, quantity] of Object.entries(selectedAddons)) {
    if (quantity > 0) {
      const addon = ADDONS.find((a) => a.id === addonId);
      if (addon) {
        min += addon.min * quantity;
        max += addon.max * quantity;
      }
    }
  }

  return { min, max };
}

export function formatEstimatePrice(
  result: EstimateResult | null,
  sizeSelected: boolean
): { display: string; isCustomQuote: boolean } {
  if (!sizeSelected) {
    return { display: 'Select a size', isCustomQuote: false };
  }

  if (result === null) {
    return { display: 'Custom quote', isCustomQuote: true };
  }

  if (result.min === result.max) {
    return { display: `Starting at $${result.min}`, isCustomQuote: false };
  }

  return { display: `Starting at $${result.min} – $${result.max}`, isCustomQuote: false };
}
