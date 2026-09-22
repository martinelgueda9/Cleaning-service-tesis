export type ServiceKey = 'standard' | 'deep' | 'movein' | 'moveout';

export interface SizeOption {
  id: string;
  label: string;
  basePrice: number | null; 
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
      { id: '1bed_1bath', label: '1 bedroom / 1 bath', basePrice: 135 },
      { id: '2bed_1bath', label: '2 bedrooms / 1 bath', basePrice: 150 },
      { id: '2bed_1_5bath', label: '2 bedrooms / 1.5 baths', basePrice: 165 },
      { id: '2bed_2bath', label: '2 bedrooms / 2 baths', basePrice: 180 },
      { id: '3bed_2bath', label: '3 bedrooms / 2 baths', basePrice: 210 },
      { id: '4bed_2_3bath', label: '4 bedrooms / 2–3 baths', basePrice: 250 },
      { id: 'something_else', label: 'Something else', basePrice: null },
    ],
  },
  deep: {
    sizeLabel: 'Home size',
    options: [
      { id: 'small_apt', label: 'Small apartment', basePrice: 250 },
      { id: 'medium_home', label: 'Medium home', basePrice: 325 },
      { id: 'large_home', label: 'Large home', basePrice: 425 },
    ],
  },
  movein: {
    sizeLabel: 'Property size',
    options: [
      { id: '1_2bed_apt', label: '1–2 bedroom apartment', basePrice: 275 },
      { id: '3bed_home', label: '3 bedroom home', basePrice: 350 },
      { id: 'larger_home', label: 'Larger home', basePrice: null },
    ],
  },
  moveout: {
    sizeLabel: 'Property size',
    options: [
      { id: '1_2bed_apt', label: '1–2 bedroom apartment', basePrice: 275 },
      { id: '3bed_home', label: '3 bedroom home', basePrice: 350 },
      { id: 'larger_home', label: 'Larger home', basePrice: null },
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
