import { useMemo, useState } from 'react';
import { ChevronRight, Package, Route, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkeletonList } from './SkeletonCard';
import {
  STATUS_ORDER,
  formatDate,
  formatINR,
  statusClass,
  statusLabel,
  timeAgo,
} from './format';
import type { Shipment, Trip } from '@/types';

type Segment = 'trips' | 'loads';

export interface PostedListingsPanelProps {
  trips: Trip[];
  shipments: Shipment[];
  loading?: boolean;
  /**
   * Per-table read failures. Without these a failed loads query is
   * indistinguishable from a board where nobody has posted a load.
   */
  errors?: { trips?: string; shipments?: string };
  /**
   * `pane` = full-height tab pane (mobile), `rail` = collapsible section in
   * the desktop side rail. Same rows, different chrome.
   */
  density?: 'rail' | 'pane';
  selectedTripId?: string | null;
  selectedShipmentId?: string | null;
  onSelectTrip: (trip: Trip) => void;
  onSelectShipment: (shipment: Shipment) => void;
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
        statusClass(status),
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function TripRow({
  trip,
  selected,
  onClick,
}: {
  trip: Trip;
  selected: boolean;
  onClick: () => void;
}) {
  const trucker = trip.trucker;
  const value = trip.available_capacity_tonnes * trip.price_per_tonne;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected || undefined}
      className={cn(
        'w-full text-left rounded-xl border p-2.5 transition-colors',
        selected
          ? 'border-orange-300 bg-orange-50/70 ring-1 ring-orange-200'
          : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
          <Truck className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {trip.origin_city} → {trip.destination_city}
            </span>
            <span className="ml-auto">
              <StatusPill status={trip.status} />
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-gray-600 truncate">
            {trucker?.full_name || 'Unknown trucker'}
            {trucker?.rating ? ` · ★ ${Number(trucker.rating).toFixed(1)}` : ''}
            {' · '}
            {trip.vehicle_type}
            {trip.vehicle_number ? ` · ${trip.vehicle_number}` : ''}
          </span>
          <span className="mt-0.5 block text-[11px] text-gray-400 truncate">
            {trip.available_capacity_tonnes != null && `${trip.available_capacity_tonnes}T · `}
            {formatINR(trip.price_per_tonne)}/T · {formatINR(value)} trip · dep{' '}
            {formatDate(trip.departure_date)} · {timeAgo(trip.created_at)}
          </span>
        </span>
        <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-gray-300" />
      </div>
    </button>
  );
}

function ShipmentRow({
  shipment,
  selected,
  onClick,
}: {
  shipment: Shipment;
  selected: boolean;
  onClick: () => void;
}) {
  const shipper = shipment.shipper;
  const value = shipment.weight_tonnes * shipment.budget_per_tonne;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected || undefined}
      className={cn(
        'w-full text-left rounded-xl border p-2.5 transition-colors',
        selected
          ? 'border-blue-300 bg-blue-50/70 ring-1 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Package className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {shipment.origin_city} → {shipment.destination_city}
            </span>
            <span className="ml-auto">
              <StatusPill status={shipment.status} />
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-gray-600 truncate">
            {shipper?.full_name || 'Unknown shipper'}
            {shipper?.rating ? ` · ★ ${Number(shipper.rating).toFixed(1)}` : ''}
            {' · '}
            {shipment.goods_description}
          </span>
          <span className="mt-0.5 block text-[11px] text-gray-400 truncate">
            {shipment.weight_tonnes != null && `${shipment.weight_tonnes}T · `}
            {formatINR(shipment.budget_per_tonne)}/T · {formatINR(value)} load · dep{' '}
            {formatDate(shipment.departure_date)} · {timeAgo(shipment.created_at)}
          </span>
        </span>
        <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-gray-300" />
      </div>
    </button>
  );
}

/**
 * PostedListingsPanel — the Trips / Loads browser.
 *
 * Left deliberately independent of the map: a posting only reaches the map
 * once it has coordinates, so this list is the operator's source of truth for
 * "what has been posted". Tapping a row opens the full detail drawer.
 */
export default function PostedListingsPanel({
  trips,
  shipments,
  loading = false,
  errors,
  density = 'pane',
  selectedTripId,
  selectedShipmentId,
  onSelectTrip,
  onSelectShipment,
}: PostedListingsPanelProps) {
  const [segment, setSegment] = useState<Segment>('trips');
  const [status, setStatus] = useState<string>('all');

  const items: Array<Trip | Shipment> = segment === 'trips' ? trips : shipments;
  const counts: Record<Segment, number> = { trips: trips.length, loads: shipments.length };
  const segmentError = segment === 'trips' ? errors?.trips : errors?.shipments;

  // Only offer filter chips for statuses that actually occur, so the row never
  // fills up with dead filters on a quiet board.
  const availableStatuses = useMemo(() => {
    const seen = new Set<string>(items.map((i) => i.status));
    return STATUS_ORDER.filter((s) => seen.has(s));
  }, [items]);

  const filtered = useMemo(
    () => (status === 'all' ? items : items.filter((i) => i.status === status)),
    [items, status],
  );

  const isPane = density === 'pane';

  return (
    <div className={cn('flex flex-col min-h-0', isPane && 'h-full')}>
      {/* Segment switch */}
      <div
        className={cn(
          'shrink-0',
          isPane ? 'bg-white border-b border-gray-200 px-3 py-2 space-y-2' : 'space-y-1.5',
        )}
      >
        <div className="flex items-center gap-1">
          {(['trips', 'loads'] as Segment[]).map((key) => {
            const active = segment === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSegment(key);
                  setStatus('all');
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors min-w-0',
                  active
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {key === 'trips' ? (
                  <Truck className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Package className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">{key === 'trips' ? 'Trips' : 'Loads'}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                    active ? 'bg-white/20 text-white' : 'bg-white text-gray-500',
                  )}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {availableStatuses.length > 1 && (
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setStatus('all')}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors',
                status === 'all'
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
              )}
            >
              All
            </button>
            {availableStatuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors',
                  status === s
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
                )}
              >
                {statusLabel(s)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rows */}
      <div
        className={cn(
          'min-h-0 overflow-y-auto',
          isPane ? 'flex-1 p-3 pb-8 space-y-1.5' : 'max-h-[320px] pt-1.5 space-y-1.5',
        )}
      >
        {loading && items.length === 0 ? (
          <SkeletonList count={4} />
        ) : segmentError && filtered.length === 0 ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-4">
            <p className="text-xs font-semibold text-red-700">
              Couldn’t load {segment === 'trips' ? 'trips' : 'loads'}
            </p>
            <p className="mt-1 break-words text-[11px] leading-relaxed text-red-600">
              {segmentError}
            </p>
            <p className="mt-1 text-[11px] text-red-500">
              Nothing is missing from the board — the read itself failed. Check the
              browser console for the failing request.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-6 text-center">
            <Route className="mx-auto h-5 w-5 text-gray-300" />
            <p className="mt-2 text-xs font-semibold text-gray-600">
              {loading ? 'Loading postings…' : 'No postings here yet'}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {status === 'all'
                ? segment === 'trips'
                  ? 'Trips posted by truckers will appear here.'
                  : 'Loads posted by shippers will appear here.'
                : `Nothing with the “${statusLabel(status)}” status right now.`}
            </p>
          </div>
        ) : segment === 'trips' ? (
          (filtered as Trip[]).map((trip) => (
            <TripRow
              key={trip.id}
              trip={trip}
              selected={trip.id === selectedTripId}
              onClick={() => onSelectTrip(trip)}
            />
          ))
        ) : (
          (filtered as Shipment[]).map((shipment) => (
            <ShipmentRow
              key={shipment.id}
              shipment={shipment}
              selected={shipment.id === selectedShipmentId}
              onClick={() => onSelectShipment(shipment)}
            />
          ))
        )}
      </div>
    </div>
  );
}
