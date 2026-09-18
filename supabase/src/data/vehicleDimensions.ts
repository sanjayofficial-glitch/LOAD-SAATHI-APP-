export interface VehicleDimensions {
  model: string;
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  capacityKg: number;
  capacityCuFt: number;
}

export const VEHICLE_DIMENSIONS: VehicleDimensions[] = [
  { model: "Tata Ace", lengthFt: 8.2, widthFt: 5.2, heightFt: 5.5, capacityKg: 750, capacityCuFt: 270 },
  { model: "Tata Ace Gold", lengthFt: 8.2, widthFt: 5.2, heightFt: 5.5, capacityKg: 750, capacityCuFt: 270 },
  { model: "Tata Ace EV", lengthFt: 8.2, widthFt: 5.2, heightFt: 5.5, capacityKg: 750, capacityCuFt: 270 },
  { model: "Tata Intra V10", lengthFt: 9.5, widthFt: 5.5, heightFt: 5.8, capacityKg: 1000, capacityCuFt: 340 },
  { model: "Tata Intra V20", lengthFt: 10.5, widthFt: 5.8, heightFt: 6.0, capacityKg: 1200, capacityCuFt: 400 },
  { model: "Tata Yodha Pickup", lengthFt: 9.0, widthFt: 5.5, heightFt: 5.8, capacityKg: 1100, capacityCuFt: 320 },
  { model: "Tata 407 Gold SFC", lengthFt: 14.0, widthFt: 6.2, heightFt: 7.0, capacityKg: 2500, capacityCuFt: 680 },
  { model: "Tata LPT 709", lengthFt: 17.5, widthFt: 6.5, heightFt: 7.5, capacityKg: 4200, capacityCuFt: 1100 },
  { model: "Tata LPT 1109", lengthFt: 19.0, widthFt: 6.8, heightFt: 7.8, capacityKg: 5500, capacityCuFt: 1300 },
  { model: "Tata LPT 1615", lengthFt: 22.0, widthFt: 7.2, heightFt: 8.0, capacityKg: 7500, capacityCuFt: 1800 },
  { model: "Tata Ultra Series", lengthFt: 19.0, widthFt: 7.0, heightFt: 7.5, capacityKg: 5500, capacityCuFt: 1400 },
  { model: "Tata Signa Series", lengthFt: 22.0, widthFt: 7.5, heightFt: 8.0, capacityKg: 10000, capacityCuFt: 2100 },
  { model: "Tata Prima Series", lengthFt: 24.0, widthFt: 8.0, heightFt: 8.5, capacityKg: 25000, capacityCuFt: 2800 },
  { model: "Mahindra Jeeto", lengthFt: 7.5, widthFt: 5.0, heightFt: 5.2, capacityKg: 600, capacityCuFt: 220 },
  { model: "Mahindra Supro Profit Truck", lengthFt: 9.0, widthFt: 5.5, heightFt: 5.8, capacityKg: 1000, capacityCuFt: 300 },
  { model: "Mahindra Bolero Pickup", lengthFt: 8.5, widthFt: 5.5, heightFt: 5.8, capacityKg: 1200, capacityCuFt: 310 },
  { model: "Eicher Pro", lengthFt: 16.0, widthFt: 6.5, heightFt: 7.5, capacityKg: 3500, capacityCuFt: 950 },
  { model: "Eicher 407", lengthFt: 14.5, widthFt: 6.2, heightFt: 7.0, capacityKg: 2200, capacityCuFt: 700 },
  { model: "Ashok Leyland Dost", lengthFt: 9.0, widthFt: 5.5, heightFt: 5.8, capacityKg: 1100, capacityCuFt: 300 },
  { model: "Ashok Leyland Boss", lengthFt: 16.0, widthFt: 6.5, heightFt: 7.5, capacityKg: 3500, capacityCuFt: 1000 },
  { model: "BharatBenz 1015", lengthFt: 14.0, widthFt: 6.2, heightFt: 7.0, capacityKg: 2500, capacityCuFt: 700 },
  { model: "BharatBenz 1215", lengthFt: 17.0, widthFt: 6.8, heightFt: 7.5, capacityKg: 4000, capacityCuFt: 1000 },
  { model: "BharatBenz 1615", lengthFt: 22.0, widthFt: 7.5, heightFt: 8.0, capacityKg: 7500, capacityCuFt: 1800 },
];

export function getVehicleDimensions(model: string): VehicleDimensions | undefined {
  const normalized = model.toLowerCase();
  return VEHICLE_DIMENSIONS.find(v => normalized.includes(v.model.toLowerCase()));
}
