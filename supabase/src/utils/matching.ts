function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface MatchParams {
  shipmentOriginCity: string;
  shipmentDestCity: string;
  tripOriginCity: string;
  tripDestCity: string;
  shipmentWeightTonnes: number;
  tripCapacityTonnes: number;
  shipmentOriginState?: string;
  shipmentDestState?: string;
  tripOriginState?: string;
  tripDestState?: string;
  shipmentOriginLat?: number;
  shipmentOriginLng?: number;
  tripOriginLat?: number;
  tripOriginLng?: number;
  shipmentDestLat?: number;
  shipmentDestLng?: number;
  tripDestLat?: number;
  tripDestLng?: number;
  shipmentBudgetPerTonne?: number;
  tripPricePerTonne?: number;
  shipmentDate?: string;
  tripDate?: string;
  truckerRating?: number;
}

export function calculateMatchScore(params: MatchParams): number {
  const n = (s: string) => s.toLowerCase().trim();

  // 1. City/State match (0-30 points)
  let cityStateScore = 0;
  const so = n(params.shipmentOriginCity);
  const sd = n(params.shipmentDestCity);
  const to = n(params.tripOriginCity);
  const td = n(params.tripDestCity);

  if (so === to || so.includes(to) || to.includes(so)) {
    cityStateScore += 15;
  } else if (params.shipmentOriginState && params.tripOriginState &&
             n(params.shipmentOriginState) === n(params.tripOriginState)) {
    cityStateScore += 8;
  }

  if (sd === td || sd.includes(td) || td.includes(sd)) {
    cityStateScore += 15;
  } else if (params.shipmentDestState && params.tripDestState &&
             n(params.shipmentDestState) === n(params.tripDestState)) {
    cityStateScore += 8;
  }

  // 2. Geographic proximity score (0-25 points) using haversine
  let proximityScore = 0;
  const hasOriginCoords =
    params.shipmentOriginLat != null && params.shipmentOriginLng != null &&
    params.tripOriginLat != null && params.tripOriginLng != null;
  const hasDestCoords =
    params.shipmentDestLat != null && params.shipmentDestLng != null &&
    params.tripDestLat != null && params.tripDestLng != null;

  if (hasOriginCoords) {
    const d = haversineKm(
      params.shipmentOriginLat!, params.shipmentOriginLng!,
      params.tripOriginLat!, params.tripOriginLng!
    );
    if (d < 10) proximityScore += 12.5;
    else if (d < 50) proximityScore += 10;
    else if (d < 150) proximityScore += 7;
    else if (d < 300) proximityScore += 4;
    else if (d < 500) proximityScore += 2;
  }

  if (hasDestCoords) {
    const d = haversineKm(
      params.shipmentDestLat!, params.shipmentDestLng!,
      params.tripDestLat!, params.tripDestLng!
    );
    if (d < 10) proximityScore += 12.5;
    else if (d < 50) proximityScore += 10;
    else if (d < 150) proximityScore += 7;
    else if (d < 300) proximityScore += 4;
    else if (d < 500) proximityScore += 2;
  }

  // Fallback: if no coords, redistribute cityStateScore
  if (!hasOriginCoords && !hasDestCoords) {
    proximityScore = 0;
    cityStateScore = Math.min(cityStateScore * 1.5, 30);
  }

  // 3. Route overlap score (0-15 points)
  let routeOverlapScore = 0;
  if (hasOriginCoords && hasDestCoords) {
    const sO = { lat: params.shipmentOriginLat!, lng: params.shipmentOriginLng! };
    const sD = { lat: params.shipmentDestLat!, lng: params.shipmentDestLng! };
    const tO = { lat: params.tripOriginLat!, lng: params.tripOriginLng! };
    const tD = { lat: params.tripDestLat!, lng: params.tripDestLng! };

    const shipmentDist = haversineKm(sO.lat, sO.lng, sD.lat, sD.lng);
    const tripDist = haversineKm(tO.lat, tO.lng, tD.lat, tD.lng);

    const originDist = haversineKm(sO.lat, sO.lng, tO.lat, tO.lng);
    const destDist = haversineKm(sD.lat, sD.lng, tD.lat, tD.lng);

    const avgRouteDist = (shipmentDist + tripDist) / 2;
    const deviation = (originDist + destDist) / 2;

    if (avgRouteDist > 0 && deviation < avgRouteDist * 0.5) {
      routeOverlapScore = 15 * (1 - deviation / avgRouteDist);
    }
  }

  // 4. Capacity score (0-15 points)
  let capacityScore = 0;
  if (params.tripCapacityTonnes > 0) {
    const ratio = params.shipmentWeightTonnes / params.tripCapacityTonnes;
    if (ratio <= 0.3) capacityScore = 15;
    else if (ratio <= 0.5) capacityScore = 12;
    else if (ratio <= 0.75) capacityScore = 8;
    else if (ratio <= 1.0) capacityScore = 5;
  }

  // 5. Price compatibility score (0-10 points)
  let priceScore = 10;
  if (params.shipmentBudgetPerTonne != null && params.tripPricePerTonne != null && params.tripPricePerTonne > 0) {
    const priceRatio = params.shipmentBudgetPerTonne / params.tripPricePerTonne;
    if (priceRatio >= 1.0) priceScore = 10;
    else if (priceRatio >= 0.85) priceScore = 7;
    else if (priceRatio >= 0.7) priceScore = 4;
    else priceScore = 0;
  }

  // 6. Date compatibility score (0-5 points)
  let dateScore = 5;
  if (params.shipmentDate && params.tripDate) {
    const sDate = new Date(params.shipmentDate).getTime();
    const tDate = new Date(params.tripDate).getTime();
    const dayDiff = Math.abs(sDate - tDate) / (1000 * 60 * 60 * 24);
    if (dayDiff <= 3) dateScore = 5;
    else if (dayDiff <= 7) dateScore = 3;
    else dateScore = 1;
  }

  // 7. Trucker rating bonus (0-5 extra points)
  let ratingBonus = 0;
  if (params.truckerRating != null) {
    if (params.truckerRating >= 4.5) ratingBonus = 5;
    else if (params.truckerRating >= 4.0) ratingBonus = 3;
    else if (params.truckerRating >= 3.5) ratingBonus = 1;
  }

  const total = cityStateScore + proximityScore + routeOverlapScore +
                capacityScore + priceScore + dateScore + ratingBonus;

  return Math.min(Math.round(total), 100);
}

export function getMatchLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) return { label: `${score}% Excellent Match`, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' };
  if (score >= 60) return { label: `${score}% Good Match`, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
  if (score >= 40) return { label: `${score}% Fair Match`, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' };
  if (score >= 20) return { label: `${score}% Weak Match`, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' };
  return { label: `${score}% No Match`, color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' };
}

export interface AIMatchInfo {
  aiScore: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

export function getAIMatchBadge(info: AIMatchInfo): {
  label: string
  color: string
} {
  const score = info.aiScore
  const base = score >= 80 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
    : score >= 60 ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
    : score >= 40 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  return { label: `AI ${score}%`, color: base }
}


