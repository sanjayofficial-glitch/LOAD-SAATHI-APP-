import { useEffect } from 'react';
import { useListingDetail } from './useListingDetail';
import type { ListingKind } from './useListingDetail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonList } from './SkeletonCard';
import {
  formatDuration,
  formatINR,
  formatKm,
  formatDate,
  statusClass,
  statusLabel,
  timeAgo,
} from './format';
import { cn } from '@/lib/utils';
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  Phone,
  Route as RouteIcon,
  ShieldCheck,
  Star,
  Truck,
  User,
  Users,
  X,
} from 'lucide-react';
import type { Request, Shipment, ShipmentRequest, Trip, User as UserProfile } from '@/types';

export type ListingSelection =
  | { type: 'trip'; trip: Trip }
  | { type: 'shipment'; shipment: Shipment };

interface ListingDetailPanelProps {
  selection: ListingSelection | null;
  onClose: () => void;
}

// ── Small building blocks ────────────────────────────────────────

function StatusPill({ status }: { status?: string | null }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        statusClass(status),
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center gap-1.5 px-0.5">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{title}</h3>
        {count != null && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-gray-500">
            {count}
          </Badge>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  wide,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
  mono?: boolean;
}) {
  if (value == null || value === '' || value === '—') return null;
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white px-2.5 py-2 min-w-0',
        wide && 'col-span-2',
      )}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-xs font-medium text-gray-800 break-words',
          mono && 'font-mono text-[11px]',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function initialsOf(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function kycLabel(user?: UserProfile): { text: string; tone: string } | null {
  if (user?.verification_status === 'verified')
    return { text: 'KYC verified', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (user?.verification_status === 'pending')
    return { text: 'KYC in review', tone: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (user?.verification_status === 'rejected')
    return { text: 'KYC rejected', tone: 'text-red-700 bg-red-50 border-red-200' };
  if (user?.is_verified) return { text: 'Verified', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  return null;
}

/**
 * PosterCard — who posted this. Every profile field the users table exposes
 * is surfaced here so the operator never has to leave the board to answer
 * "whose trip is this?".
 */
function PosterCard({ user, role }: { user?: UserProfile; role: 'Trucker' | 'Shipper' }) {
  const name = user?.full_name?.trim() || (role === 'Trucker' ? 'Unknown trucker' : 'Unknown shipper');
  const kyc = kycLabel(user);
  const phone = user?.phone?.trim();
  const rating = user?.rating != null ? Number(user.rating) : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="h-12 w-12 rounded-full object-cover bg-gray-100 shrink-0"
          />
        ) : (
          <span className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 shrink-0">
            {initialsOf(name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            {user?.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
          </div>
          <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-gray-600">
              {role}
            </span>
            {rating != null && (
              <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                <Star className="h-3 w-3 fill-current" />
                {rating.toFixed(1)}
              </span>
            )}
            {user?.total_trips != null && <span>· {user.total_trips} trips</span>}
          </p>
        </div>
        {phone && (
          <Button size="sm" variant="outline" className="h-8 shrink-0" asChild>
            <a href={`tel:${phone.replace(/\s+/g, '')}`}>
              <Phone className="h-3.5 w-3.5 mr-1" /> Call
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px bg-gray-100 border-t border-gray-100">
        <div className="bg-white px-3 py-2 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
          <p className="text-xs font-medium text-gray-800 truncate">{phone ?? '—'}</p>
        </div>
        <div className="bg-white px-3 py-2 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
            {role === 'Trucker' ? 'Company' : 'Account'}
          </p>
          <p className="text-xs font-medium text-gray-800 truncate">
            {user?.company_name || (user ? 'Individual' : '—')}
          </p>
        </div>
        <div className="bg-white px-3 py-2 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Member since</p>
          <p className="text-xs font-medium text-gray-800 truncate">
            {user?.created_at ? formatDate(user.created_at) : '—'}
          </p>
        </div>
        <div className="bg-white px-3 py-2 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Trust</p>
          {kyc ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded border px-1.5 py-px text-[10px] font-semibold',
                kyc.tone,
              )}
            >
              <ShieldCheck className="h-3 w-3" />
              {kyc.text}
            </span>
          ) : (
            <p className="text-xs font-medium text-gray-400">Not verified</p>
          )}
        </div>
      </div>

      <div className="px-3 py-2 border-t border-gray-100 text-[10px] text-gray-400 font-mono truncate">
        {user?.id}
      </div>
    </div>
  );
}

function RouteCard({
  originCity,
  originState,
  originLat,
  originLng,
  destCity,
  destState,
  destLat,
  destLng,
}: {
  originCity: string;
  originState?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  destCity: string;
  destState?: string | null;
  destLat?: number | null;
  destLng?: number | null;
}) {
  const hasBoth = originLat != null && originLng != null && destLat != null && destLng != null;
  const directionsUrl = hasBoth
    ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}`
    : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
        <Navigation className="h-3 w-3" /> Route
      </p>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900 truncate">
            {originCity}
          </span>
          <span className="block text-[10px] text-gray-400 truncate">{originState || '—'}</span>
        </span>
        <span className="flex-1 border-t border-dashed border-gray-300" />
        <span className="min-w-0 flex-1 text-right">
          <span className="block text-sm font-semibold text-gray-900 truncate">{destCity}</span>
          <span className="block text-[10px] text-gray-400 truncate">{destState || '—'}</span>
        </span>
      </div>
      {directionsUrl && (
        <Button size="sm" variant="outline" className="w-full" asChild>
          <a href={directionsUrl} target="_blank" rel="noreferrer">
            <MapPin className="h-3.5 w-3.5 mr-1" /> Open route in Google Maps
          </a>
        </Button>
      )}
    </div>
  );
}

function RequestCard({ request }: { request: Request }) {
  const shipper = request.shipper;
  const phone = shipper?.phone?.trim();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <User className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-gray-900 truncate">
            {shipper?.full_name || 'Unknown shipper'}
          </span>
          <span className="block text-[10px] text-gray-400 truncate">
            Shipper
            {shipper?.rating != null && ` · ★ ${Number(shipper.rating).toFixed(1)}`}
            {phone ? ` · ${phone}` : ''}
          </span>
        </span>
        <StatusPill status={request.status} />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Field label="Goods" value={request.goods_description} />
        <Field label="Weight" value={request.weight_tonnes != null ? `${request.weight_tonnes} T` : null} />
      </div>

      {(request.pickup_address || request.delivery_address) && (
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1.5 space-y-0.5">
          <p className="text-[10px] text-gray-600 flex gap-1">
            <span className="font-bold text-gray-400 shrink-0">Pickup</span>
            <span className="truncate">{request.pickup_address || '—'}</span>
          </p>
          <p className="text-[10px] text-gray-600 flex gap-1">
            <span className="font-bold text-gray-400 shrink-0">Drop</span>
            <span className="truncate">{request.delivery_address || '—'}</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> Requested {timeAgo(request.created_at)}
        </span>
        {request.shipment_id && (
          <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
            <Package className="h-3 w-3" /> Linked load
          </span>
        )}
      </div>
    </div>
  );
}

function OfferCard({ offer, weight }: { offer: ShipmentRequest; weight?: number | null }) {
  const trucker = offer.trucker;
  const phone = trucker?.phone?.trim();
  const proposed = offer.proposed_price_per_tonne;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-7 w-7 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
          <Truck className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-gray-900 truncate">
            {trucker?.full_name || 'Unknown trucker'}
          </span>
          <span className="block text-[10px] text-gray-400 truncate">
            Trucker
            {trucker?.rating != null && ` · ★ ${Number(trucker.rating).toFixed(1)}`}
            {trucker?.total_trips != null && ` · ${trucker.total_trips} trips`}
          </span>
        </span>
        <StatusPill status={offer.status} />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Field
          label="Proposed rate"
          value={proposed != null ? `${formatINR(proposed)}/T` : null}
        />
        <Field
          label="Offer value"
          value={proposed != null && weight != null ? formatINR(proposed * weight) : null}
        />
      </div>

      {offer.message && (
        <p className="rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1.5 text-[11px] text-gray-600 flex gap-1.5">
          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-gray-400" />
          <span>{offer.message}</span>
        </p>
      )}

      <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> Offered {timeAgo(offer.created_at)}
        </span>
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-1 font-semibold text-orange-600"
          >
            <Phone className="h-3 w-3" /> {phone}
          </a>
        )}
      </div>
    </div>
  );
}

// ── Panel ────────────────────────────────────────────────────────

export default function ListingDetailPanel({ selection, onClose }: ListingDetailPanelProps) {
  const kind: ListingKind | null = selection?.type ?? null;
  const id = selection ? (selection.type === 'trip' ? selection.trip.id : selection.shipment.id) : null;

  const { data: related, isLoading, isFetching } = useListingDetail(kind, id);

  // Phone-first: the drawer is full-screen there, so Back must work the way a
  // native sheet does.
  useEffect(() => {
    if (!selection) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selection, onClose]);

  if (!selection) return null;

  const isTrip = selection.type === 'trip';
  const listing = isTrip ? selection.trip : selection.shipment;
  const poster = isTrip ? selection.trip.trucker : selection.shipment.shipper;

  const title = `${listing.origin_city} → ${listing.destination_city}`;
  const updatedAt = 'updated_at' in listing ? listing.updated_at ?? listing.created_at : listing.created_at;
  const requests = isTrip ? ((related as Request[] | undefined) ?? []) : [];
  const offers = !isTrip ? ((related as ShipmentRequest[] | undefined) ?? []) : [];

  return (
    <div className="fixed inset-0 z-[10000] bg-gray-50 flex flex-col sm:left-auto sm:right-0 sm:w-[440px] sm:border-l sm:border-gray-200 sm:shadow-2xl">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <span
          className={cn(
            'h-9 w-9 shrink-0 rounded-lg flex items-center justify-center',
            isTrip ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600',
          )}
        >
          {isTrip ? <Truck className="h-4 w-4" /> : <Package className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
            {isTrip ? 'Trip posted by trucker' : 'Load posted by shipper'}
          </p>
          <h2 className="text-sm font-semibold text-gray-900 truncate">{title}</h2>
        </div>
        <StatusPill status={listing.status} />
        <button
          type="button"
          aria-label="Close details"
          onClick={onClose}
          className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4 pb-10">
        <Section
          title={isTrip ? 'Trucker' : 'Shipper'}
          icon={isTrip ? <Truck className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
        >
          <PosterCard user={poster} role={isTrip ? 'Trucker' : 'Shipper'} />
        </Section>

        <Section title="Route" icon={<RouteIcon className="h-3.5 w-3.5" />}>
          <RouteCard
            originCity={listing.origin_city}
            originState={listing.origin_state}
            originLat={listing.origin_lat}
            originLng={listing.origin_lng}
            destCity={listing.destination_city}
            destState={listing.destination_state}
            destLat={listing.destination_lat}
            destLng={listing.destination_lng}
          />
        </Section>

        <Section
          title={isTrip ? 'Trip details' : 'Load details'}
          icon={isTrip ? <Navigation className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Field
              label="Departure"
              value={
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 text-gray-400" />
                  {formatDate(listing.departure_date)}
                </span>
              }
            />
            <Field label="Status" value={statusLabel(listing.status)} />
            {isTrip ? (
              <>
                <Field
                  label="Capacity"
                  value={
                    selection.trip.available_capacity_tonnes != null
                      ? `${selection.trip.available_capacity_tonnes} T`
                      : null
                  }
                />
                <Field label="Rate" value={`${formatINR(selection.trip.price_per_tonne)}/T`} />
                <Field
                  label="Trip value"
                  value={formatINR(
                    selection.trip.available_capacity_tonnes * selection.trip.price_per_tonne,
                  )}
                />
                <Field label="Vehicle type" value={selection.trip.vehicle_type} />
                <Field label="Vehicle number" value={selection.trip.vehicle_number} mono />
                <Field
                  label="Distance"
                  value={
                    selection.trip.estimated_distance_km
                      ? formatKm(selection.trip.estimated_distance_km)
                      : null
                  }
                />
                <Field
                  label="Est. duration"
                  value={formatDuration(selection.trip.estimated_duration_min)}
                />
              </>
            ) : (
              <>
                <Field
                  label="Weight"
                  value={
                    selection.shipment.weight_tonnes != null
                      ? `${selection.shipment.weight_tonnes} T`
                      : null
                  }
                />
                <Field label="Budget" value={`${formatINR(selection.shipment.budget_per_tonne)}/T`} />
                <Field
                  label="Load value"
                  value={formatINR(
                    selection.shipment.weight_tonnes * selection.shipment.budget_per_tonne,
                  )}
                />
                <Field
                  label="Distance"
                  value={
                    selection.shipment.estimated_distance_km
                      ? formatKm(selection.shipment.estimated_distance_km)
                      : null
                  }
                />
                <Field
                  label="Est. duration"
                  value={formatDuration(selection.shipment.estimated_duration_min)}
                />
                <Field label="Goods" value={selection.shipment.goods_description} wide />
                <Field label="Pickup address" value={selection.shipment.pickup_address} wide />
                <Field label="Delivery address" value={selection.shipment.delivery_address} wide />
              </>
            )}
            <Field label="Posted" value={timeAgo(listing.created_at)} />
            <Field label="Listing ID" value={listing.id} mono />
          </div>
        </Section>

        <Section
          title={isTrip ? 'Shippers on this trip' : 'Trucker offers'}
          icon={isTrip ? <Users className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
          count={isTrip ? requests.length : offers.length}
        >
          {isLoading || (isFetching && (isTrip ? requests.length === 0 : offers.length === 0)) ? (
            <SkeletonList count={3} />
          ) : isTrip ? (
            requests.length === 0 ? (
              <EmptyNote text="No shipper has requested this trip yet." />
            ) : (
              <div className="space-y-1.5">
                {requests.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            )
          ) : offers.length === 0 ? (
            <EmptyNote text="No trucker has offered on this load yet." />
          ) : (
            <div className="space-y-1.5">
              {offers.map((o) => (
                <OfferCard key={o.id} offer={o} weight={selection.shipment.weight_tonnes} />
              ))}
            </div>
          )}
        </Section>

        <p className="text-[10px] text-gray-400 text-center pt-1">
          {isTrip ? 'Trip' : 'Load'} · last updated {timeAgo(updatedAt)}{' '}
          · pull to refresh from the toolbar
        </p>
      </div>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-5 text-center">
      <p className="text-xs text-gray-500">{text}</p>
    </div>
  );
}
