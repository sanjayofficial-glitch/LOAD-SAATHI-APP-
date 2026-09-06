export type VehicleClass = {
  id: string;
  label: string;
  capacityTonnes: number;
  marketRateMin: number;
  marketRateMax: number;
  description: string;
};

export type VehicleModel = {
  id: string;
  label: string;
  manufacturer: string;
  vehicleClassId: string;
};

/**
 * LoadSaathi reference data.
 *
 * The market ranges are published India reference ranges from TruckGuru's
 * June 2026 rate-card article. They are deliberately kept as data so the
 * operations team can update them without changing the calculation logic.
 * Diesel reference is the Delhi RSP snapshot published by PPAC/IOCL on
 * 1 September 2026.
 */
export const PRICING_DATA = {
  currency: 'INR',
  dieselReferencePrice: 95.2,
  dieselReferenceDate: '2026-09-01',
  dieselReferenceCity: 'Delhi',
  fuelShareOfRate: 0.55,
  emptyReturnPremium: 1.15,
  gstRate: 0.05,
  defaultHandlingPerPoint: 750,
  defaultDetentionHours: 0,
  defaultDetentionRatePerHour: 1000,
  vehicleClasses: [
    {
      id: 'tata-ace',
      label: 'Tata Ace',
      capacityTonnes: 0.75,
      marketRateMin: 26,
      marketRateMax: 29,
      description: 'Up to 750 kg; local and small commercial loads.',
    },
    {
      id: 'bada-dost',
      label: 'Bada Dost',
      capacityTonnes: 1.5,
      marketRateMin: 26,
      marketRateMax: 29,
      description: 'Up to 1.5 tonnes; compact intercity loads.',
    },
    {
      id: '14ft',
      label: '14 ft truck',
      capacityTonnes: 3.5,
      marketRateMin: 31,
      marketRateMax: 35,
      description: 'Up to 3.5 tonnes; medium commercial consignments.',
    },
    {
      id: '20ft',
      label: '20 ft truck',
      capacityTonnes: 7,
      marketRateMin: 41,
      marketRateMax: 45,
      description: 'Up to 7 tonnes; larger B2B movements.',
    },
    {
      id: '32ft',
      label: '32 ft container',
      capacityTonnes: 15,
      marketRateMin: 78,
      marketRateMax: 85,
      description: 'Up to 15 tonnes; full-load long-haul movement.',
    },
  ] satisfies VehicleClass[],
} as const;

export type PricingInputs = {
  distanceKm: number;
  vehicleClassId: string;
  shipmentMode: 'ptl' | 'ftl';
  shipmentWeightTonnes: number;
  dieselPrice: number;
  tolls: number;
  loadingPoints: number;
  unloadingPoints: number;
  detentionHours: number;
  detentionRatePerHour: number;
  includeReturnLeg: boolean;
  returnLoadCoverage: number;
  applyGst: boolean;
};

export type PricingBreakdown = {
  ratePerKm: number;
  fuelAdjustment: number;
  distanceCharge: number;
  returnLegCharge: number;
  tolls: number;
  handling: number;
  detention: number;
  shipmentMode: 'ptl' | 'ftl';
  capacityUtilization: number;
  subtotal: number;
  gst: number;
  total: number;
};

const roundRupees = (value: number) => Math.round(value);

export function calculateFreightPrice(inputs: PricingInputs): PricingBreakdown {
  const vehicle = PRICING_DATA.vehicleClasses.find((item) => item.id === inputs.vehicleClassId) ?? PRICING_DATA.vehicleClasses[0];
  const distanceKm = Math.max(0, inputs.distanceKm || 0);
  const dieselPrice = Math.max(0, inputs.dieselPrice || PRICING_DATA.dieselReferencePrice);
  const fuelShare = PRICING_DATA.fuelShareOfRate;
  const nonFuelShare = 1 - fuelShare;
  const fuelAdjustment = nonFuelShare + fuelShare * (dieselPrice / PRICING_DATA.dieselReferencePrice);
  const ratePerKm = ((vehicle.marketRateMin + vehicle.marketRateMax) / 2) * fuelAdjustment;
  const fullTruckDistanceCharge = distanceKm * ratePerKm;
  const capacityUtilization = Math.min(1, Math.max(0, (inputs.shipmentWeightTonnes || 0) / vehicle.capacityTonnes));
  const ptlDistanceCharge = Math.min(
    fullTruckDistanceCharge,
    Math.max(fullTruckDistanceCharge * 0.35, fullTruckDistanceCharge * capacityUtilization * 1.25),
  );
  const distanceCharge = inputs.shipmentMode === 'ptl' ? ptlDistanceCharge : fullTruckDistanceCharge;
  const returnLoadCoverage = Math.min(1, Math.max(0, inputs.returnLoadCoverage || 0));
  const returnLegCharge = inputs.includeReturnLeg
    ? distanceCharge * (1 - returnLoadCoverage) * PRICING_DATA.emptyReturnPremium
    : 0;
  const tolls = Math.max(0, inputs.tolls || 0);
  const handling = (Math.max(0, inputs.loadingPoints || 0) + Math.max(0, inputs.unloadingPoints || 0)) * PRICING_DATA.defaultHandlingPerPoint;
  const detention = Math.max(0, inputs.detentionHours || 0) * Math.max(0, inputs.detentionRatePerHour || 0);
  const subtotal = distanceCharge + returnLegCharge + tolls + handling + detention;
  const gst = inputs.applyGst ? subtotal * PRICING_DATA.gstRate : 0;

  return {
    ratePerKm: roundRupees(ratePerKm),
    fuelAdjustment: Number(fuelAdjustment.toFixed(3)),
    distanceCharge: roundRupees(distanceCharge),
    returnLegCharge: roundRupees(returnLegCharge),
    tolls: roundRupees(tolls),
    handling: roundRupees(handling),
    detention: roundRupees(detention),
    shipmentMode: inputs.shipmentMode,
    capacityUtilization: Number(capacityUtilization.toFixed(3)),
    subtotal: roundRupees(subtotal),
    gst: roundRupees(gst),
    total: roundRupees(subtotal + gst),
  };
}

export const pricingSources = [
  {
    label: 'IndianOil / PPAC diesel RSP reference',
    url: 'https://ppac.gov.in/archives/impnews',
    note: 'Delhi diesel: ₹95.20/L as at 1 September 2026.',
  },
  {
    label: 'TruckGuru India transport rate guide',
    url: 'https://truckguru.co.in/blog/how-calculate-your-transportation-charges/',
    note: 'Published vehicle ranges: Tata Ace ₹26–29/km, 14 ft ₹31–35/km, 20 ft ₹41–45/km, 32 ft ₹78–85/km, plus base charge.',
  },
  {
    label: 'CBIC GST sectoral FAQ',
    url: 'https://cbic-gst.gov.in/sectoral-faq.html',
    note: 'GTA treatment and reverse-charge rules depend on supplier and invoice classification; verify before invoicing.',
  },
] as const;

const vehicleCatalog: Record<string, string[]> = {
  'Tata Motors': ['Tata Ace Gold', 'Tata Ace Gold Diesel', 'Tata Ace Gold Petrol', 'Tata Ace Gold CNG', 'Tata Ace EV', 'Tata Ace Pro', 'Tata Ace Pro EV', 'Tata Ace Pro Bi-Fuel', 'Tata Ace Flex', 'Tata Intra V10', 'Tata Intra V10 Gold', 'Tata Intra V20', 'Tata Intra V30', 'Tata Intra V50', 'Tata Intra V50 Gold', 'Tata Intra V70 Gold', 'Tata Yodha Pickup', 'Tata Yodha 2.0', 'Tata Yodha CNG', 'Tata 207 Pickup', 'Tata 407 Gold SFC', 'Tata LPT Series', 'Tata Ultra Series', 'Tata Signa Series', 'Tata Prima Series', 'Tata Tipper', 'Tata Tractor Trailer'],
  Mahindra: ['Mahindra Jeeto', 'Mahindra Jeeto Plus', 'Mahindra Supro Profit Truck', 'Mahindra Supro Profit Truck Mini', 'Mahindra Supro Profit Truck Maxi', 'Mahindra Veero', 'Mahindra Bolero Pik-Up', 'Mahindra Bolero Pik-Up 4WD', 'Mahindra Bolero Camper', 'Mahindra Bolero MaXX Pik-Up City', 'Mahindra Bolero MaXX Pik-Up HD', 'Mahindra Bolero MaXX Pik-Up HD 1.7', 'Mahindra Bolero MaXX Pik-Up HD 2.0', 'Mahindra Bolero MaXX Pik-Up HD 1.9 CNG', 'Mahindra Bolero MaXX Pik-Up City 1.3', 'Mahindra Bolero MaXX Pik-Up City 1.4', 'Mahindra Bolero MaXX Pik-Up City 1.5', 'Mahindra Bolero MaXX Pik-Up City CNG', 'Mahindra Jayo', 'Mahindra Furio', 'Mahindra Blazo X', 'Mahindra Loadking Optimo', 'Mahindra Blazo Tractor', 'Mahindra Blazo Tipper'],
  'Ashok Leyland': ['Ashok Leyland Saathi', 'Ashok Leyland Dost', 'Ashok Leyland Dost+', 'Ashok Leyland Dost Strong', 'Ashok Leyland Dost CNG', 'Ashok Leyland Dost+ XL', 'Ashok Leyland Dost+ XL CNG', 'Ashok Leyland Bada Dost', 'Ashok Leyland Bada Dost i4', 'Ashok Leyland Bada Dost CNG', 'Ashok Leyland Partner', 'Ashok Leyland Ecomet', 'Ashok Leyland Ecomet Star', 'Ashok Leyland Boss', 'Ashok Leyland AVTR', 'Ashok Leyland AVTR 2620', 'Ashok Leyland AVTR 2820', 'Ashok Leyland AVTR 3520', 'Ashok Leyland AVTR 4020', 'Ashok Leyland AVTR 4220', 'Ashok Leyland AVTR 4520', 'Ashok Leyland AVTR 4525', 'Ashok Leyland AVTR 4625', 'Ashok Leyland AVTR 4925', 'Ashok Leyland AVTR Tractor', 'Ashok Leyland AVTR Tipper'],
  Eicher: ['Eicher Pro 2049', 'Eicher Pro 2055', 'Eicher Pro 2059', 'Eicher Pro 2075', 'Eicher Pro 2095', 'Eicher Pro 3008', 'Eicher Pro 3010', 'Eicher Pro 3014', 'Eicher Pro 3015', 'Eicher Pro 3019', 'Eicher Pro 2110', 'Eicher Pro 2114', 'Eicher Pro 2119', 'Eicher Pro 2120', 'Eicher Pro 6025', 'Eicher Pro 6042', 'Eicher Pro 6055', 'Eicher Pro 6055 XP', 'Eicher Pro CNG', 'Eicher Pro LNG', 'Eicher Pro Tractor', 'Eicher Pro Tipper'],
  BharatBenz: ['BharatBenz 1015R', 'BharatBenz 1215R', 'BharatBenz 1217R', 'BharatBenz 1415R', 'BharatBenz 1617R', 'BharatBenz 1923C', 'BharatBenz 2823C', 'BharatBenz 2823R', 'BharatBenz 2828C', 'BharatBenz 3128C', 'BharatBenz 3523R', 'BharatBenz 3528C', 'BharatBenz 3528R', 'BharatBenz 4023R', 'BharatBenz 4228R', 'BharatBenz 4828R', 'BharatBenz 5228T', 'BharatBenz 5428T', 'BharatBenz Tractor', 'BharatBenz Tipper'],
  'SML Mahindra': ['SML Sartaj', 'SML Sartaj GS', 'SML Samrat', 'SML Samrat GS', 'SML Supreme'],
  'Force Motors': ['Force Kargo King', 'Force Minidor', 'Force Shaktiman', 'Force Traveller', 'Force Urbania', 'Force Trump'],
  Isuzu: ['Isuzu D-Max', 'Isuzu D-Max Regular Cab', 'Isuzu D-Max S-CAB', 'Isuzu D-Max S-CAB Z', 'Isuzu Hi-Lander', 'Isuzu V-Cross'],
  Toyota: ['Toyota Hilux'],
  'Other Heavy Vehicles': ['Container Truck', 'Reefer Truck', 'Tanker', 'Flatbed Trailer', 'Lowbed Trailer', 'Semi Trailer', 'Hydraulic Trailer', 'Car Carrier'],
};

function rateClassForModel(label: string): string {
  const value = label.toLowerCase();
  if (/(container|reefer|tanker|trailer|car carrier|prima|avtr 4|avtr 5|avtr 3|blazo|furio|ecomet|boss|4828|5428|5228|4228|4023|3528|3128|2828|2823|1923)/.test(value)) return '32ft';
  if (/(ace|intra|jeeto|supro|veero|bolero|yodha|207|407|d-max|hi-lander|v-cross|hilux|saathi|dost|bada dost|sartaj|samrat|supreme|kargo|minidor|shaktiman|traveller|urbania|trump|partner)/.test(value)) return '14ft';
  if (/(eicher pro|1015|1215|1217|1415|1617|jayo|loadking|lpt|ultra|signa)/.test(value)) return '20ft';
  return '20ft';
}

export const VEHICLE_MODELS: VehicleModel[] = Object.entries(vehicleCatalog).flatMap(([manufacturer, models]) => models.map((label) => ({
  id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  label,
  manufacturer,
  vehicleClassId: rateClassForModel(label),
})));
