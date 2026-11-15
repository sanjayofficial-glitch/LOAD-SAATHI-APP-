export const RATES_UPDATED_AT: string;
export const RATES_UPDATED_LABEL: string;

export interface LaneRateBand {
  perTonneMin: number;
  perTonneMax: number;
  perTruckMin: number;
  perTruckMax: number;
  perKmMin: number;
  perKmMax: number;
  perKgMin: number;
  perKgMax: number;
}

export function rateBand(route: { distanceKm: number }): LaneRateBand;
export function formatINR(n: number): string;
export function groupINR(n: number): string;
