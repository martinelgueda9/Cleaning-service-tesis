export type ServiceKey = 'standard' | 'deep' | 'movein' | 'moveout';

export type PropertyType = 'apartment' | 'house';

export const DEFAULT_PROPERTY_TYPE: PropertyType = 'house';

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
};

export interface PropertyPlan {
  beds: number;
  baths: number;
  half?: boolean;
}

export interface SizeOption {
  id: string;
  label: string;
  basePrice: number | null;
  estimatedTime?: string;
  shortLabel?: string;
  plan: PropertyPlan | null;
  propertyTypes: PropertyType[];
  beds?: string;
  baths?: string;
  popular?: boolean;
}

export interface AddOn {
  id: string;
  label: string;
  min: number;
  max: number;
  unit: 'flat' | 'each' | 'hour';
}

export const PRICING: Record<ServiceKey, { sizeLabel: string; options: SizeOption[] }> = {
  standard: {
    sizeLabel: 'Bedrooms and bathrooms',
    options: [
      { id: '1bed_1bath', label: '1 bedroom / 1 bath', shortLabel: '1 bed · 1 bath', basePrice: 135, estimatedTime: '~2 hrs', plan: { beds: 1, baths: 1 }, beds: '1', baths: '1', propertyTypes: ['apartment', 'house'] },
      { id: '2bed_1bath', label: '2 bedrooms / 1 bath', shortLabel: '2 bed · 1 bath', basePrice: 150, estimatedTime: '~2.5 hrs', plan: { beds: 2, baths: 1 }, beds: '2', baths: '1', propertyTypes: ['apartment', 'house'] },
      { id: '2bed_1_5bath', label: '2 bedrooms / 1.5 baths', shortLabel: '2 bed · 1.5 bath', basePrice: 165, estimatedTime: '~3 hrs', plan: { beds: 2, baths: 1, half: true }, beds: '2', baths: '1.5', propertyTypes: ['house'] },
      { id: '2bed_2bath', label: '2 bedrooms / 2 baths', shortLabel: '2 bed · 2 bath', basePrice: 180, estimatedTime: '~3.5 hrs', plan: { beds: 2, baths: 2 }, beds: '2', baths: '2', propertyTypes: ['apartment', 'house'] },
      { id: '3bed_2bath', label: '3 bedrooms / 2 baths', shortLabel: '3 bed · 2 bath', basePrice: 210, estimatedTime: '~4 hrs', plan: { beds: 3, baths: 2 }, beds: '3', baths: '2', propertyTypes: ['apartment', 'house'] },
      { id: '4bed_2_3bath', label: '4 bedrooms / 2–3 baths', shortLabel: '4 bed · 2–3 bath', basePrice: 250, estimatedTime: '~5 hrs', plan: { beds: 4, baths: 2, half: true }, beds: '4', baths: '2–3', propertyTypes: ['house'] },
      { id: 'something_else', label: 'Something else', shortLabel: 'Custom Layout', basePrice: null, estimatedTime: 'Flexible', plan: null, propertyTypes: ['apartment', 'house'] },
    ],
  },
  deep: {
    sizeLabel: 'Home size',
    options: [
      { id: 'small_apt', label: 'Small apartment', shortLabel: 'Small Apt (1–2 bed)', basePrice: 250, estimatedTime: '~3.5 hrs', plan: { beds: 2, baths: 1 }, beds: '1–2', propertyTypes: ['apartment'] },
      { id: 'medium_home', label: 'Medium home', shortLabel: 'Medium Home (3 bed)', basePrice: 325, estimatedTime: '~5 hrs', plan: { beds: 3, baths: 2 }, beds: '3', propertyTypes: ['house'] },
      { id: 'large_home', label: 'Large home', shortLabel: 'Large Home (4+ bed)', basePrice: 425, estimatedTime: '~6.5+ hrs', plan: { beds: 4, baths: 2, half: true }, beds: '4+', propertyTypes: ['house'] },
    ],
  },
  movein: {
    sizeLabel: 'Property size',
    options: [
      { id: '1_2bed_apt', label: '1–2 bedroom apartment', shortLabel: '1–2 Bed Apartment', basePrice: 275, estimatedTime: '~4 hrs', plan: { beds: 2, baths: 1 }, beds: '1–2', propertyTypes: ['apartment'] },
      { id: '3bed_home', label: '3 bedroom home', shortLabel: '3 Bed Family Home', basePrice: 350, estimatedTime: '~5.5 hrs', plan: { beds: 3, baths: 2 }, beds: '3', propertyTypes: ['house'] },
      { id: 'larger_home', label: 'Larger home', shortLabel: 'Large / Estate Home', basePrice: null, estimatedTime: 'Custom', plan: { beds: 4, baths: 3 }, propertyTypes: ['house'] },
    ],
  },
  moveout: {
    sizeLabel: 'Property size',
    options: [
      { id: '1_2bed_apt', label: '1–2 bedroom apartment', shortLabel: '1–2 Bed Apartment', basePrice: 275, estimatedTime: '~4 hrs', plan: { beds: 2, baths: 1 }, beds: '1–2', propertyTypes: ['apartment'] },
      { id: '3bed_home', label: '3 bedroom home', shortLabel: '3 Bed Family Home', basePrice: 350, estimatedTime: '~5.5 hrs', plan: { beds: 3, baths: 2 }, beds: '3', propertyTypes: ['house'] },
      { id: 'larger_home', label: 'Larger home', shortLabel: 'Large / Estate Home', basePrice: null, estimatedTime: 'Custom', plan: { beds: 4, baths: 3 }, propertyTypes: ['house'] },
    ],
  },
};

export const ADDONS: AddOn[] = [
  { id: 'inside_fridge', label: 'Inside fridge', min: 40, max: 60, unit: 'flat' },
  { id: 'inside_oven', label: 'Inside oven', min: 40, max: 60, unit: 'flat' },
  { id: 'inside_cabinets', label: 'Inside cabinets', min: 40, max: 40, unit: 'flat' },
  { id: 'interior_windows', label: 'Interior windows', min: 8, max: 12, unit: 'each' },
  { id: 'light_organizing', label: 'Light organizing', min: 35, max: 35, unit: 'hour' },
  { id: 'pet_hair_removal', label: 'Heavy pet hair removal', min: 25, max: 50, unit: 'flat' },
];

export const SERVICE_KEY_TO_NAME: Record<ServiceKey, string> = {
  standard: 'Regular Cleaning',
  deep: 'Deep Cleaning',
  movein: 'Move-In Cleaning',
  moveout: 'Move-Out Cleaning',
};

export const SERVICE_ID_TO_KEY: Record<string, ServiceKey | 'commercial'> = {
  regular_cleaning: 'standard',
  deep_cleaning: 'deep',
  commercial_cleaning: 'commercial',
  move_in_cleaning: 'movein',
  move_out_cleaning: 'moveout',
};
