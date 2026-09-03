export interface VehicleGroup {
  brand: string;
  vehicles: string[];
}

/**
 * Catalog of the most common commercial vehicles in India,
 * organized by brand. Users pick one option — no typing required.
 */
export const VEHICLE_GROUPS: VehicleGroup[] = [
  {
    brand: 'Tata Motors',
    vehicles: [
      'Tata Ace Gold',
      'Tata Ace Gold Diesel',
      'Tata Ace Gold Petrol',
      'Tata Ace Gold CNG',
      'Tata Ace EV',
      'Tata Ace Pro',
      'Tata Ace Pro EV',
      'Tata Ace Pro Bi-Fuel',
      'Tata Ace Flex',
      'Tata Intra V10',
      'Tata Intra V10 Gold',
      'Tata Intra V20',
      'Tata Intra V30',
      'Tata Intra V50',
      'Tata Intra V50 Gold',
      'Tata Intra V70 Gold',
      'Tata Yodha Pickup',
      'Tata Yodha 2.0',
      'Tata Yodha CNG',
      'Tata 207 Pickup',
      'Tata 407 Gold SFC',
      'Tata LPT Series',
      'Tata Ultra Series',
      'Tata Signa Series',
      'Tata Prima Series',
      'Tata Tipper',
      'Tata Tractor Trailer',
    ],
  },
  {
    brand: 'Mahindra',
    vehicles: [
      'Mahindra Jeeto',
      'Mahindra Jeeto Plus',
      'Mahindra Supro Profit Truck',
      'Mahindra Supro Profit Truck Mini',
      'Mahindra Supro Profit Truck Maxi',
      'Mahindra Veero',
      'Mahindra Bolero Pik-Up',
      'Mahindra Bolero Pik-Up 4WD',
      'Mahindra Bolero Camper',
      'Mahindra Bolero MaXX Pik-Up City',
      'Mahindra Bolero MaXX Pik-Up HD',
      'Mahindra Bolero MaXX Pik-Up HD 1.7',
      'Mahindra Bolero MaXX Pik-Up HD 2.0',
      'Mahindra Bolero MaXX Pik-Up HD 1.9 CNG',
      'Mahindra Bolero MaXX Pik-Up City 1.3',
      'Mahindra Bolero MaXX Pik-Up City 1.4',
      'Mahindra Bolero MaXX Pik-Up City 1.5',
      'Mahindra Bolero MaXX Pik-Up City CNG',
      'Mahindra Jayo',
      'Mahindra Furio',
      'Mahindra Blazo X',
      'Mahindra Loadking Optimo',
      'Mahindra Blazo Tractor',
      'Mahindra Blazo Tipper',
    ],
  },
  {
    brand: 'Ashok Leyland',
    vehicles: [
      'Ashok Leyland Saathi',
      'Ashok Leyland Dost',
      'Ashok Leyland Dost+',
      'Ashok Leyland Dost Strong',
      'Ashok Leyland Dost CNG',
      'Ashok Leyland Dost+ XL',
      'Ashok Leyland Dost+ XL CNG',
      'Ashok Leyland Bada Dost',
      'Ashok Leyland Bada Dost i4',
      'Ashok Leyland Bada Dost CNG',
      'Ashok Leyland Partner',
      'Ashok Leyland Ecomet',
      'Ashok Leyland Ecomet Star',
      'Ashok Leyland Boss',
      'Ashok Leyland AVTR',
      'Ashok Leyland AVTR 2620',
      'Ashok Leyland AVTR 2820',
      'Ashok Leyland AVTR 3520',
      'Ashok Leyland AVTR 4020',
      'Ashok Leyland AVTR 4220',
      'Ashok Leyland AVTR 4520',
      'Ashok Leyland AVTR 4525',
      'Ashok Leyland AVTR 4625',
      'Ashok Leyland AVTR 4925',
      'Ashok Leyland AVTR Tractor',
      'Ashok Leyland AVTR Tipper',
    ],
  },
  {
    brand: 'Eicher',
    vehicles: [
      'Eicher Pro 2049',
      'Eicher Pro 2055',
      'Eicher Pro 2059',
      'Eicher Pro 2075',
      'Eicher Pro 2095',
      'Eicher Pro 3008',
      'Eicher Pro 3010',
      'Eicher Pro 3014',
      'Eicher Pro 3015',
      'Eicher Pro 3019',
      'Eicher Pro 2110',
      'Eicher Pro 2114',
      'Eicher Pro 2119',
      'Eicher Pro 2120',
      'Eicher Pro 6025',
      'Eicher Pro 6042',
      'Eicher Pro 6055',
      'Eicher Pro 6055 XP',
      'Eicher Pro CNG',
      'Eicher Pro LNG',
      'Eicher Pro Tractor',
      'Eicher Pro Tipper',
    ],
  },
  {
    brand: 'BharatBenz',
    vehicles: [
      'BharatBenz 1015R',
      'BharatBenz 1215R',
      'BharatBenz 1217R',
      'BharatBenz 1415R',
      'BharatBenz 1617R',
      'BharatBenz 1923C',
      'BharatBenz 2823C',
      'BharatBenz 2823R',
      'BharatBenz 2828C',
      'BharatBenz 3128C',
      'BharatBenz 3523R',
      'BharatBenz 3528C',
      'BharatBenz 3528R',
      'BharatBenz 4023R',
      'BharatBenz 4228R',
      'BharatBenz 4828R',
      'BharatBenz 5228T',
      'BharatBenz 5428T',
      'BharatBenz Tractor',
      'BharatBenz Tipper',
    ],
  },
  {
    brand: 'SML Mahindra',
    vehicles: ['SML Sartaj', 'SML Sartaj GS', 'SML Samrat', 'SML Samrat GS', 'SML Supreme'],
  },
  {
    brand: 'Force Motors',
    vehicles: [
      'Force Kargo King',
      'Force Minidor',
      'Force Shaktiman',
      'Force Traveller',
      'Force Urbania',
      'Force Trump',
    ],
  },
  {
    brand: 'Isuzu',
    vehicles: [
      'Isuzu D-Max',
      'Isuzu D-Max Regular Cab',
      'Isuzu D-Max S-CAB',
      'Isuzu D-Max S-CAB Z',
      'Isuzu Hi-Lander',
      'Isuzu V-Cross',
    ],
  },
  {
    brand: 'Toyota',
    vehicles: ['Toyota Hilux'],
  },
  {
    brand: 'Other Heavy Vehicles',
    vehicles: [
      'Container Truck',
      'Reefer Truck',
      'Tanker',
      'Flatbed Trailer',
      'Lowbed Trailer',
      'Semi Trailer',
      'Hydraulic Trailer',
      'Car Carrier',
    ],
  },
];

/** Flat list of every selectable vehicle name. */
export const ALL_VEHICLES: string[] = VEHICLE_GROUPS.flatMap((group) => group.vehicles);

/** True when `name` exactly matches a vehicle in the catalog (case-insensitive). */
export function isKnownVehicle(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return ALL_VEHICLES.some((vehicle) => vehicle.toLowerCase() === normalized);
}

/**
 * Filter the catalog by a search query. Matches vehicle names and brand names.
 * Returns only groups that have at least one match.
 */
export function filterVehicles(query: string): VehicleGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return VEHICLE_GROUPS;
  return VEHICLE_GROUPS.map((group) => ({
    brand: group.brand,
    vehicles: group.vehicles.filter(
      (vehicle) =>
        vehicle.toLowerCase().includes(q) || group.brand.toLowerCase().includes(q),
    ),
  })).filter((group) => group.vehicles.length > 0);
}
