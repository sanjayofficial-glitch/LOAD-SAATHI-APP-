-- =============================================================
-- Accurate India Pricing Engine V3
-- Updates pricing_config rates to TruckGuru/CRISIL benchmarks,
-- adds fuel_prices table + Odisha seed data, surcharge config,
-- return-leg factors, and new pricing flags.
-- =============================================================

-- 1. Update pricing_config rates (per-km, TruckGuru/CRISIL benchmarks)
UPDATE public.pricing_config SET
  rate_per_km = 26, min_price = 1500, max_price = 4500, base_capacity_tonnes = 0.75,
  updated_at = now()
WHERE vehicle_type = 'mini_truck';

UPDATE public.pricing_config SET
  rate_per_km = 28, min_price = 1800, max_price = 5500, base_capacity_tonnes = 1.5,
  updated_at = now()
WHERE vehicle_type = 'pickup';

UPDATE public.pricing_config SET
  rate_per_km = 32, min_price = 2500, max_price = 7500, base_capacity_tonnes = 5,
  updated_at = now()
WHERE vehicle_type = '14ft';

UPDATE public.pricing_config SET
  rate_per_km = 40, min_price = 3500, max_price = 10000, base_capacity_tonnes = 7,
  updated_at = now()
WHERE vehicle_type = '17ft';

UPDATE public.pricing_config SET
  rate_per_km = 52, min_price = 5000, max_price = 14000, base_capacity_tonnes = 12,
  updated_at = now()
WHERE vehicle_type = '22ft';

UPDATE public.pricing_config SET
  rate_per_km = 68, min_price = 7000, max_price = 18000, base_capacity_tonnes = 16,
  updated_at = now()
WHERE vehicle_type = 'container';

UPDATE public.pricing_config SET
  rate_per_km = 82, min_price = 9000, max_price = 24000, base_capacity_tonnes = 25,
  updated_at = now()
WHERE vehicle_type = 'trailer';

-- 2. Create fuel_prices table if it does not exist
CREATE TABLE IF NOT EXISTS public.fuel_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  state text NOT NULL,
  city text,
  diesel_price numeric NOT NULL,
  petrol_price numeric,
  effective_date date NOT NULL DEFAULT current_date,
  source text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(state, city, effective_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_fuel_prices_state_date
  ON public.fuel_prices (state, effective_date DESC);

-- Seed Odisha diesel prices (from IOCL / PRICING_DATA, 4 Sept 2026)
-- Source: dieselprice.in, IOCL PPP daily — Odisha diesel ₹101.61/L
INSERT INTO public.fuel_prices (state, city, diesel_price, petrol_price, effective_date, source)
VALUES
  ('Odisha', 'Rourkela', 101.61, 103.45, '2026-09-04', 'dieselprice.in'),
  ('Odisha', 'Bhubaneswar', 101.61, 103.45, '2026-09-04', 'dieselprice.in'),
  ('Odisha', 'Cuttack', 101.61, 103.45, '2026-09-04', 'dieselprice.in')
ON CONFLICT (state, city, effective_date) DO NOTHING;

-- 3. Create pricing_surcharge_config table (fuel surcharge config)
CREATE TABLE IF NOT EXISTS public.pricing_surcharge_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  base_diesel_price numeric NOT NULL DEFAULT 95.20,
  surcharge_per_rupee numeric NOT NULL DEFAULT 0.0065,
  base_diesel_date date NOT NULL DEFAULT '2026-09-01'::date,
  description text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Seed the single config row
INSERT INTO public.pricing_surcharge_config (base_diesel_price, surcharge_per_rupee, base_diesel_date, description)
VALUES (95.20, 0.0065, '2026-09-01', 'Industry-standard: 0.65% surcharge per ₹1 diesel rise over base ₹95.20 (Delhi RSP, 1 Sept 2026). Source: IOCL, CRISIL 2024.')
ON CONFLICT DO NOTHING;

-- 4. Create route_return_factor table
CREATE TABLE IF NOT EXISTS public.route_return_factor (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  origin_state text NOT NULL,
  destination_state text NOT NULL,
  factor numeric NOT NULL DEFAULT 1.0 CHECK (factor >= 1.0 AND factor <= 2.0),
  note text,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(origin_state, destination_state)
);

-- Seed return-leg factors
-- Interior Odisha/Jharkhand routes have low return-load probability → higher factor
-- Rourkela↔Bhubaneswar has better return-load probability → lower factor
INSERT INTO public.route_return_factor (origin_state, destination_state, factor, note) VALUES
  ('Odisha', 'Odisha', 1.5, 'Interior Odisha — low return-load probability'),
  ('Jharkhand', 'Jharkhand', 1.5, 'Interior Jharkhand — low return-load probability'),
  ('Odisha', 'Jharkhand', 1.4, 'Odisha ↔ Jharkhand interior — limited return loads'),
  ('Jharkhand', 'Odisha', 1.4, 'Jharkhand ↔ Odisha interior — limited return loads'),
  ('Odisha', 'West Bengal', 1.2, 'Rourkela↔Bhubaneswar corridor — moderate return-load probability'),
  ('West Bengal', 'Odisha', 1.2, 'Rourkela↔Bhubaneswar corridor — moderate return-load probability'),
  ('Jharkhand', 'West Bengal', 1.4, 'Jharkhand interior ↔ West Bengal — limited return loads'),
  ('West Bengal', 'Jharkhand', 1.4, 'West Bengal ↔ Jharkhand interior — limited return loads'),
  ('Chhattisgarh', 'Odisha', 1.3, 'Rourkela→Raipur — limited return loads'),
  ('Odisha', 'Chhattisgarh', 1.3, 'Rourkela→Raipur return — limited return loads'),
  ('Odisha', 'Bihar', 1.3, 'Odisha ↔ Bihar — moderate return-load probability'),
  ('Bihar', 'Odisha', 1.3, 'Bihar ↔ Odisha — moderate return-load probability'),
  ('Odisha', 'Maharashtra', 1.1, 'Long-haul with some return-load probability'),
  ('Maharashtra', 'Odisha', 1.1, 'Long-haul with some return-load probability'),
  ('Odisha', 'Tamil Nadu', 1.05, 'Long-haul major routes — higher return-load probability'),
  ('Tamil Nadu', 'Odisha', 1.05, 'Long-haul major routes — higher return-load probability'),
  ('Karnataka', 'Tamil Nadu', 1.1, 'South corridor — moderate return-load probability'),
  ('Tamil Nadu', 'Karnataka', 1.1, 'South corridor — moderate return-load probability'),
  ('Gujarat', 'Maharashtra', 1.05, 'Western routes — higher return-load probability'),
  ('Maharashtra', 'Gujarat', 1.05, 'Western routes — higher return-load probability'),
  ('Delhi', 'Maharashtra', 1.15, 'Long-haul premium — limited return loads'),
  ('Maharashtra', 'Delhi', 1.08, 'Return long-haul'),
  ('Delhi', 'Delhi', 1.2, 'Delhi intra-state — moderate return-load probability')
ON CONFLICT (origin_state, destination_state) DO NOTHING;

-- Default return factor for unmatched state pairs
INSERT INTO public.route_return_factor (origin_state, destination_state, factor, note)
VALUES ('DEFAULT', 'DEFAULT', 1.4, 'Default return factor for unmatched route pairs')
ON CONFLICT (origin_state, destination_state) DO NOTHING;

-- 5. Add new pricing flags
INSERT INTO public.pricing_flags (flag_name, enabled) VALUES
  ('enable_fuel_surcharge', true),
  ('enable_return_factor', true)
ON CONFLICT (flag_name) DO NOTHING;

-- 6. RLS policies for new tables
-- fuel_prices
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read fuel prices" ON public.fuel_prices;
DROP POLICY IF EXISTS "Service role can manage fuel prices" ON public.fuel_prices;

CREATE POLICY "Authenticated users can read fuel prices"
  ON public.fuel_prices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage fuel prices"
  ON public.fuel_prices FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pricing_surcharge_config
ALTER TABLE public.pricing_surcharge_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read pricing_surcharge_config" ON public.pricing_surcharge_config;
DROP POLICY IF EXISTS "Service role full access pricing_surcharge_config" ON public.pricing_surcharge_config;

CREATE POLICY "Authenticated can read pricing_surcharge_config"
  ON public.pricing_surcharge_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access pricing_surcharge_config"
  ON public.pricing_surcharge_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- route_return_factor
ALTER TABLE public.route_return_factor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read route_return_factor" ON public.route_return_factor;
DROP POLICY IF EXISTS "Service role full access route_return_factor" ON public.route_return_factor;

CREATE POLICY "Authenticated can read route_return_factor"
  ON public.route_return_factor FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access route_return_factor"
  ON public.route_return_factor FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Update final-schema.sql reference (add to existing pricing_flags RLS)
-- pricing_flags already has RLS enabled in v2 migration; no changes needed.
