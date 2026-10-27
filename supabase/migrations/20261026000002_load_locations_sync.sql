-- Migration: load_locations_sync
-- Date: 2026-10-26
--
-- Why: public.load_locations is the only source for load pins on the Command
-- Center map, SmartMatch suggestions and the "waiting loads" KPIs. Nothing in
-- the app ever wrote to it — every posted load lived only in public.shipments —
-- so the board showed trucks but never loads (load_locations had 0 rows while
-- shipments had 16). This migration makes shipments the single source of truth
-- and mirrors the geo-relevant ones into load_locations:
--
--   * open loads (anything not cancelled/completed/delivered/expired) that
--     carry a full origin + destination coordinate pair are kept 'active'
--   * everything else is flipped to 'inactive' so the map stops drawing it
--   * existing shipments are backfilled, so today's board is correct without
--     waiting for the next edit
--
-- The trigger is SECURITY DEFINER because shipments are also written by admin
-- and service-role paths that do not own the matching load_locations row.
-- search_path is pinned, and EXECUTE is revoked below (trigger firing does not
-- check EXECUTE, so this only closes the RPC surface).

-- One location row per shipment, so the mirror below can never duplicate pins.
create unique index if not exists load_locations_shipment_id_key
  on public.load_locations (shipment_id)
  where shipment_id is not null;

create or replace function public.sync_load_location_from_shipment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  src public.shipments;
  has_coords boolean;
  keep_active boolean;
begin
  -- AFTER DELETE has no NEW row; retire whatever was mirrored for it.
  if tg_op = 'DELETE' then
    update public.load_locations
       set status = 'inactive',
           updated_at = now()
     where shipment_id = old.id
       and status is distinct from 'inactive';
    return null;
  end if;

  src := new;

  has_coords := src.origin_lat is not null
            and src.origin_lng is not null
            and src.destination_lat is not null
            and src.destination_lng is not null;

  keep_active := has_coords
             and src.status not in ('cancelled', 'completed', 'delivered', 'expired');

  if keep_active then
    update public.load_locations
       set shipper_id = src.shipper_id,
           origin_city = src.origin_city,
           dest_city = src.destination_city,
           origin_lat = src.origin_lat,
           origin_lng = src.origin_lng,
           dest_lat = src.destination_lat,
           dest_lng = src.destination_lng,
           weight_tonnes = src.weight_tonnes,
           budget_per_tonne = src.budget_per_tonne,
           goods_description = src.goods_description,
           status = 'active',
           updated_at = now()
     where shipment_id = src.id;

    if not found then
      insert into public.load_locations (
        shipper_id, shipment_id, origin_city, dest_city,
        origin_lat, origin_lng, dest_lat, dest_lng,
        weight_tonnes, budget_per_tonne, goods_description, status
      ) values (
        src.shipper_id, src.id, src.origin_city, src.destination_city,
        src.origin_lat, src.origin_lng, src.destination_lat, src.destination_lng,
        src.weight_tonnes, src.budget_per_tonne, src.goods_description, 'active'
      );
    end if;
  else
    update public.load_locations
       set status = 'inactive',
           updated_at = now()
     where shipment_id = src.id
       and status is distinct from 'inactive';
  end if;

  return null;
end;
$$;

revoke execute on function public.sync_load_location_from_shipment()
  from anon, authenticated, public;

drop trigger if exists trg_sync_load_location on public.shipments;
create trigger trg_sync_load_location
  after insert or update or delete on public.shipments
  for each row execute function public.sync_load_location_from_shipment();

-- ── Backfill ────────────────────────────────────────────────────
-- Retire mirrors whose shipment is no longer open or lost its coordinates.
update public.load_locations l
   set status = 'inactive',
       updated_at = now()
  from public.shipments s
 where s.id = l.shipment_id
   and (
     s.status in ('cancelled', 'completed', 'delivered', 'expired')
     or s.origin_lat is null
     or s.origin_lng is null
     or s.destination_lat is null
     or s.destination_lng is null
   )
   and l.status is distinct from 'inactive';

-- Mirror every open load that has coordinates and no row yet.
insert into public.load_locations (
  shipper_id, shipment_id, origin_city, dest_city,
  origin_lat, origin_lng, dest_lat, dest_lng,
  weight_tonnes, budget_per_tonne, goods_description, status
)
select s.shipper_id, s.id, s.origin_city, s.destination_city,
       s.origin_lat, s.origin_lng, s.destination_lat, s.destination_lng,
       s.weight_tonnes, s.budget_per_tonne, s.goods_description, 'active'
  from public.shipments s
 where s.status not in ('cancelled', 'completed', 'delivered', 'expired')
   and s.origin_lat is not null
   and s.origin_lng is not null
   and s.destination_lat is not null
   and s.destination_lng is not null
   and not exists (
     select 1 from public.load_locations l where l.shipment_id = s.id
   );
