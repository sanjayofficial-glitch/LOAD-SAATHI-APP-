import { useState, useEffect, useRef, useMemo } from 'react';
import { geocodeCity } from '@/utils/geocode';
import type { TruckLocation } from '@/components/maps';
import type { Trip } from '@/types';

/**
 * useTripMapMarkers - Build map markers for a list of posted trips so every
 * listed truck shows up on the map even when it isn't broadcasting live GPS.
 *
 * Per trip (deduped by trucker):
 * 1. Live GPS position from driverLocations when the driver is sharing one
 *    (marker keeps moving in realtime).
 * 2. The trip's stored origin_lat / origin_lng.
 * 3. A geocoded pin at the origin city (Nominatim — cached in state, attempted
 *    once per session, and only when `enabled` is true).
 *
 * Synthetic fallback markers set `is_live: false` so consumers can show an
 * honest "posted trip, no live GPS" label instead of a fake updated time.
 */
export function useTripMapMarkers(
  trips: Trip[],
  driverLocations: TruckLocation[],
  enabled = true,
): TruckLocation[] {
  const [cityCoords, setCityCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const attemptedCitiesRef = useRef<Set<string>>(new Set());

  // Resolve coordinates for trips that never got lat/lng stored (PostTrip
  // geocodes fire-and-forget, so many trips only have city names).
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const citiesToResolve = [
      ...new Set(
        trips
          .filter((t) => (t.origin_lat == null || t.origin_lng == null) && t.origin_city)
          .map((t) => t.origin_city.trim().toLowerCase())
          .filter((c) => !attemptedCitiesRef.current.has(c) && !cityCoords[c]),
      ),
    ];
    for (const city of citiesToResolve) attemptedCitiesRef.current.add(city);
    if (citiesToResolve.length === 0) return;

    (async () => {
      const resolved: Record<string, { lat: number; lng: number }> = {};
      for (const city of citiesToResolve) {
        const coords = await geocodeCity(city);
        if (cancelled) return;
        if (coords) resolved[city] = { lat: coords.lat, lng: coords.lon };
      }
      if (!cancelled && Object.keys(resolved).length > 0) {
        setCityCoords((prev) => ({ ...prev, ...resolved }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trips, cityCoords, enabled]);

  return useMemo<TruckLocation[]>(() => {
    const trucks: TruckLocation[] = [];
    const seen = new Set<string>();

    for (const trip of trips) {
      if (seen.has(trip.trucker_id)) continue;
      seen.add(trip.trucker_id);

      const live = driverLocations.find((d) => d.driver_id === trip.trucker_id);
      if (live) {
        trucks.push(live);
        continue;
      }

      let lat = trip.origin_lat;
      let lng = trip.origin_lng;
      if ((lat == null || lng == null) && trip.origin_city) {
        const coords = cityCoords[trip.origin_city.trim().toLowerCase()];
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }
      if (lat == null || lng == null) continue;

      trucks.push({
        driver_id: trip.trucker_id,
        driver_name: trip.trucker?.full_name,
        lat,
        lng,
        heading: null,
        speed: null,
        trip_id: trip.id,
        origin_city: trip.origin_city,
        destination_city: trip.destination_city,
        vehicle_type: trip.vehicle_type,
        available_capacity_tonnes: trip.available_capacity_tonnes,
        trip_status: 'active',
        last_seen_at: trip.created_at,
        is_live: false,
      });
    }

    return trucks;
  }, [trips, driverLocations, cityCoords]);
}
