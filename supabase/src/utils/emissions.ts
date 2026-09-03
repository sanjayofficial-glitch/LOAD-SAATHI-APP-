export type VehicleEmissionClass = 'light' | 'medium' | 'heavy';

export interface EmissionsInput {
  distanceKm: number;
  vehicleType?: string | null;
  loadTonnes?: number | null;
}

export interface EmissionsResult {
  distanceKm: number;
  factorKgPerKm: number;
  totalKg: number;
  tonnesCO2e: number;
  intensityKgPerTonneKm: number | null;
  vehicleClass: VehicleEmissionClass;
}

const EMISSION_FACTORS: Record<VehicleEmissionClass, number> = {
  light: 0.32,
  medium: 0.68,
  heavy: 0.92,
};

export function getVehicleEmissionClass(vehicleType?: string | null): VehicleEmissionClass {
  const n = vehicleType?.toLowerCase() ?? '';
  // Heavy: MHCVs, tippers, tractors, trailers and special-purpose trucks
  if (/signa|prima|ultra|lpt|tipper|tractor|avtr|blazo|container|reefer|tanker|trailer|car carrier/.test(n)) return 'heavy';
  // BharatBenz: small 10-16 tonne models are medium, everything else is heavy
  if (/bharatbenz/.test(n)) return /1015|1215|1217|1415|1617/.test(n) ? 'medium' : 'heavy';
  // Medium: 407s, Eichers, and other ILCV/MCV workhorses
  if (/eicher|407|furio|loadking|ecomet|boss|partner|sartaj|samrat|shaktiman|trump|supreme|14|16|17/.test(n)) return 'medium';
  // Light: LCVs, pickups and light vans
  if (/mini|pick|ace|intra|jeeto|supro|veero|bolero|dost|saathi|jayo|kargo|minidor|d-max|hilux|v-cross|hi-lander|traveller|urbania|tempo|light/.test(n)) return 'light';
  return 'heavy';
}

export function calculateEmissions({ distanceKm, vehicleType, loadTonnes }: EmissionsInput): EmissionsResult {
  const safeDistance = Number.isFinite(distanceKm) && distanceKm > 0 ? distanceKm : 0;
  const safeLoad = Number.isFinite(loadTonnes) && (loadTonnes ?? 0) > 0 ? Number(loadTonnes) : null;
  const vehicleClass = getVehicleEmissionClass(vehicleType);
  const factorKgPerKm = EMISSION_FACTORS[vehicleClass];
  const totalKg = safeDistance * factorKgPerKm;

  return {
    distanceKm: safeDistance,
    factorKgPerKm,
    totalKg: Math.round(totalKg * 10) / 10,
    tonnesCO2e: Math.round((totalKg / 1000) * 1000) / 1000,
    intensityKgPerTonneKm: safeLoad && safeDistance > 0 ? Math.round((totalKg / (safeDistance * safeLoad)) * 1000) / 1000 : null,
    vehicleClass,
  };
}
