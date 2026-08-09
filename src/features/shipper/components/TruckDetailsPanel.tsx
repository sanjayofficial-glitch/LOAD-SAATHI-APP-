import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Star,
  MapPin,
  IndianRupee,
  Calendar,
  Truck,
  Clock,
  Navigation,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TruckLocation } from '@/components/maps/TruckMarker';
import { isTruckInTransit, formatTimeAgo } from '@/components/maps/TruckMarker';

export interface TripWithTrucker {
  id: string;
  origin_city: string | null;
  destination_city: string | null;
  origin_state?: string | null;
  destination_state?: string | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  available_capacity_tonnes: number | null;
  price_per_tonne: number | null;
  departure_date: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  status: string | null;
  estimated_distance_km: number | null;
  estimated_duration_min: number | null;
  trucker?: {
    full_name?: string | null;
    rating?: number | null;
    phone?: string | null;
    total_trips?: number | null;
    is_verified?: boolean | null;
  } | null;
}

export interface TruckerProfile {
  id: string;
  full_name?: string | null;
  rating?: number | null;
  phone?: string | null;
  total_trips?: number | null;
  is_verified?: boolean | null;
}

interface TruckDetailsPanelProps {
  truck: TruckLocation;
  trip: TripWithTrucker | null;
  truckerProfile: TruckerProfile | null;
  loading?: boolean;
  onClose: () => void;
}

function RatingStars({ rating }: { rating?: number | null }) {
  if (rating == null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
      <Star className="h-3.5 w-3.5 fill-current" />
      {Number(rating).toFixed(1)}
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

export default React.memo(function TruckDetailsPanel({
  truck,
  trip,
  truckerProfile,
  loading = false,
  onClose,
}: TruckDetailsPanelProps) {
  const inTransit = isTruckInTransit(truck);

  const name =
    trip?.trucker?.full_name || truckerProfile?.full_name || truck.driver_name || 'Trucker';
  const rating = trip?.trucker?.rating ?? truckerProfile?.rating ?? null;
  const totalTrips = trip?.trucker?.total_trips ?? truckerProfile?.total_trips ?? null;
  const isVerified =
    trip?.trucker?.is_verified ?? truckerProfile?.is_verified ?? false;

  const vehicleType = trip?.vehicle_type || truck.vehicle_type || 'Truck';
  const vehicleNumber = trip?.vehicle_number || null;
  const pricePerTonne = trip?.price_per_tonne ?? null;
  const capacity = trip?.available_capacity_tonnes ?? truck.available_capacity_tonnes ?? null;
  const departureDate = trip?.departure_date ?? null;
  const distanceKm = trip?.estimated_distance_km ?? null;
  const durationMin = trip?.estimated_duration_min ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-2 px-4 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 w-11 h-11 items-center justify-center">
            <span className="text-white text-base font-black">
              {(name || 'T').charAt(0).toUpperCase()}
            </span>
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-foreground truncate">{name}</p>
              {isVerified && (
                <span title="Verified trucker">
                  <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <RatingStars rating={rating} />
              {totalTrips != null && (
                <span className="text-[11px] text-muted-foreground">{totalTrips} trips</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close details"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Status + vehicle */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              'text-[11px] px-2.5 py-0.5',
              inTransit
                ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30'
                : 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30',
            )}
          >
            {inTransit ? '🚛 In Transit' : '📍 Standing / Available'}
          </Badge>
          <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 text-muted-foreground">
            <Truck className="h-3 w-3 mr-1" />
            {vehicleType}
            {vehicleNumber && <span className="ml-1 font-mono">{vehicleNumber}</span>}
          </Badge>
        </div>

        {/* Route */}
        <div className="rounded-xl bg-muted/50 dark:bg-white/5 border border-border/60 p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Trip Route
          </p>
          {trip ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-foreground truncate">
                    {trip.origin_city || '—'}
                  </p>
                  {trip.origin_state && (
                    <p className="text-[11px] text-muted-foreground truncate">{trip.origin_state}</p>
                  )}
                </div>
                <Navigation className="h-4 w-4 text-blue-500 shrink-0 rotate-90" />
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-black text-foreground truncate">
                    {trip.destination_city || '—'}
                  </p>
                  {trip.destination_state && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {trip.destination_state}
                    </p>
                  )}
                </div>
              </div>
              {(distanceKm != null || durationMin != null) && (
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {distanceKm != null && `~${Math.round(distanceKm).toLocaleString('en-IN')} km`}
                  {distanceKm != null && durationMin != null && ' • '}
                  {durationMin != null && `~${Math.round(durationMin / 60)} hrs`}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active trip posted — this truck is currently standing and available.
            </p>
          )}
        </div>

        {/* Price + capacity */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Price
            </p>
            {loading ? (
              <Skeleton className="h-6 w-20 mt-1" />
            ) : pricePerTonne != null ? (
              <p className="text-lg font-black text-green-600 dark:text-green-400 mt-0.5">
                <IndianRupee className="h-4 w-4 inline -mt-0.5" />
                {Number(pricePerTonne).toLocaleString('en-IN')}
                <span className="text-xs font-semibold text-muted-foreground"> /tonne</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-muted-foreground mt-1">—</p>
            )}
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Capacity
            </p>
            {capacity != null ? (
              <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                {Number(capacity).toLocaleString('en-IN')}T
                <span className="text-xs font-semibold text-muted-foreground"> available</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-muted-foreground mt-1">—</p>
            )}
          </div>
        </div>

        {/* Meta rows */}
        <div className="space-y-2.5">
          {departureDate && (
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Departure"
              value={new Date(departureDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            />
          )}
          <DetailRow
            icon={<Clock className="h-4 w-4" />}
            label="Live Status"
            value={
              truck.is_live === false
                ? 'Posted trip — live GPS not shared'
                : truck.speed != null && truck.speed > 0
                  ? `Moving • ${Math.round(truck.speed * 3.6)} km/h • updated ${formatTimeAgo(truck.last_seen_at)}`
                  : `Standing • updated ${formatTimeAgo(truck.last_seen_at)}`
            }
          />
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2 pt-1">
          {trip ? (
            <Link to={`/trips/${trip.id}`} className="block">
              <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-sm font-bold shadow-md">
                View Trip Details <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link to="/browse-trucks" className="block">
              <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-sm font-bold shadow-md">
                Browse Trucker Trips <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link
            to="/shipper/post-shipment"
            className="text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Post a load on this route →
          </Link>
        </div>
      </div>
    </div>
  );
});
