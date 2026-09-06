-- =====================================================
-- Migration: Fix fuel_prices schema + add missing tables
-- The remote fuel_prices table has OLD schema (id, state, fuel_type, price, updated_at)
-- We need to ALTER it, not CREATE TABLE IF NOT EXISTS
-- Run this in Supabase SQL Editor (Dashboard → SQL)
-- =====================================================

-- 1. Make old columns nullable first (price has NOT NULL constraint)
ALTER TABLE public.fuel_prices ALTER COLUMN price DROP NOT NULL;
ALTER TABLE public.fuel_prices ALTER COLUMN fuel_type DROP NOT NULL;

-- 2. Add new columns
ALTER TABLE public.fuel_prices 
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS diesel_price numeric,
  ADD COLUMN IF NOT EXISTS petrol_price numeric,
  ADD COLUMN IF NOT EXISTS effective_date date DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS source text;

-- 2. Backfill: copy price → diesel_price for existing diesel rows
UPDATE public.fuel_prices 
  SET diesel_price = price 
  WHERE diesel_price IS NULL AND fuel_type = 'diesel';

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_fuel_prices_state_date ON public.fuel_prices (state, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_prices_state_city ON public.fuel_prices (state, city, effective_date DESC);

-- 4. Add unique constraint for upserts
ALTER TABLE public.fuel_prices 
  ADD CONSTRAINT fuel_prices_state_city_date_unique UNIQUE (state, city, effective_date);

-- 5. Create pricing_surcharge_config table
CREATE TABLE IF NOT EXISTS public.pricing_surcharge_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  base_diesel_price numeric NOT NULL DEFAULT 95.20,
  surcharge_per_rupee numeric NOT NULL DEFAULT 0.0065,
  base_diesel_date date NOT NULL DEFAULT '2026-09-01'::date,
  description text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Seed surcharge config
INSERT INTO public.pricing_surcharge_config (base_diesel_price, surcharge_per_rupee, base_diesel_date, description)
VALUES (95.20, 0.0065, '2026-09-01', 'Industry-standard: 0.65% surcharge per ₹1 diesel rise over base ₹95.20')
ON CONFLICT DO NOTHING;

-- 6. Create route_return_factor table
CREATE TABLE IF NOT EXISTS public.route_return_factor (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  origin_state text NOT NULL,
  destination_state text NOT NULL,
  factor numeric NOT NULL DEFAULT 1.4 CHECK (factor >= 1.0 AND factor <= 2.0),
  note text,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(origin_state, destination_state)
);

-- Seed return-leg factors
INSERT INTO public.route_return_factor (origin_state, destination_state, factor, note) VALUES
  ('Odisha', 'Odisha', 1.5, 'Interior Odisha — low return-load probability'),
  ('Jharkhand', 'Jharkhand', 1.5, 'Interior Jharkhand — low return-load probability'),
  ('Odisha', 'Jharkhand', 1.4, 'Odisha ↔ Jharkhand interior'),
  ('Jharkhand', 'Odisha', 1.4, 'Jharkhand ↔ Odisha interior'),
  ('Odisha', 'West Bengal', 1.2, 'Rourkela↔Bhubaneswar corridor'),
  ('West Bengal', 'Odisha', 1.2, 'Rourkela↔Bhubaneswar corridor'),
  ('Jharkhand', 'West Bengal', 1.4, 'Jharkhand ↔ West Bengal interior'),
  ('West Bengal', 'Jharkhand', 1.4, 'West Bengal ↔ Jharkhand interior'),
  ('Chhattisgarh', 'Odisha', 1.3, 'Rourkela→Raipur — limited return'),
  ('Odisha', 'Chhattisgarh', 1.3, 'Rourkela→Raipur return — limited'),
  ('Odisha', 'Bihar', 1.3, 'Moderate return-load probability'),
  ('Bihar', 'Odisha', 1.3, 'Moderate return-load probability'),
  ('Odisha', 'Maharashtra', 1.1, 'Long-haul, some return'),
  ('Maharashtra', 'Odisha', 1.1, 'Long-haul return'),
  ('Odisha', 'Tamil Nadu', 1.05, 'Major long-haul route'),
  ('Tamil Nadu', 'Odisha', 1.05, 'Major long-haul return'),
  ('Karnataka', 'Tamil Nadu', 1.1, 'South corridor'),
  ('Tamil Nadu', 'Karnataka', 1.1, 'South corridor return'),
  ('Gujarat', 'Maharashtra', 1.05, 'Western routes'),
  ('Maharashtra', 'Gujarat', 1.05, 'Western routes return'),
  ('Delhi', 'Maharashtra', 1.15, 'Long-haul premium'),
  ('Maharashtra', 'Delhi', 1.08, 'Return long-haul'),
  ('DEFAULT', 'DEFAULT', 1.4, 'Default for unmatched pairs')
ON CONFLICT (origin_state, destination_state) DO NOTHING;

-- 7. Enable RLS
ALTER TABLE public.pricing_surcharge_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_return_factor ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies
CREATE POLICY "Service role full access" ON public.pricing_surcharge_config FOR ALL USING (true);
CREATE POLICY "Service role full access" ON public.route_return_factor FOR ALL USING (true);
CREATE POLICY "Anon can read" ON public.pricing_surcharge_config FOR SELECT USING (true);
CREATE POLICY "Anon can read" ON public.route_return_factor FOR SELECT USING (true);

-- 9. Add missing pricing flags
INSERT INTO public.pricing_flags (flag_name, enabled) VALUES
  ('enable_fuel_surcharge', true),
  ('enable_return_factor', true)
ON CONFLICT (flag_name) DO NOTHING;

-- 10. Update existing Odisha diesel row with new columns
UPDATE public.fuel_prices SET
  city = 'Rourkela',
  diesel_price = 101.61,
  petrol_price = 103.45,
  effective_date = '2026-09-04',
  source = 'dieselprice.in'
WHERE state = 'Odisha' AND fuel_type = 'diesel';

-- 11. Verify
SELECT 'fuel_prices' as tbl, count(*) as rows FROM public.fuel_prices
UNION ALL SELECT 'pricing_surcharge_config', count(*) FROM public.pricing_surcharge_config
UNION ALL SELECT 'route_return_factor', count(*) FROM public.route_return_factor
UNION ALL SELECT 'pricing_flags', count(*) FROM public.pricing_flags;
