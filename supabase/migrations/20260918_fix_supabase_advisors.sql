-- Migration: Fix Supabase Advisor Warnings
-- Date: 2026-09-18
-- Fixes:
--   1. Remove SECURITY DEFINER from user_profiles view (security advisor ERROR)
--   2. Set immutable search_path on 5 functions (security advisor WARN)
--   3. Add indexes on 15 unindexed foreign keys (performance advisor INFO)

-- =============================================================================
-- 1. FIX: user_profiles view - remove SECURITY DEFINER
-- =============================================================================

-- Drop and recreate without SECURITY DEFINER (keeps security_barrier)
DROP VIEW IF EXISTS public.user_profiles;

CREATE VIEW public.user_profiles
WITH (security_barrier = true)
AS
SELECT
    id,
    full_name,
    user_type,
    is_verified,
    rating,
    total_trips,
    company_name,
    created_at
FROM public.users;

-- Grant necessary permissions
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO service_role;

-- =============================================================================
-- 2. FIX: Functions with mutable search_path - set immutable search_path
-- =============================================================================

-- refresh_credit_score (trigger function)
ALTER FUNCTION public.refresh_credit_score()
    SET search_path = public;

-- refresh_driver_risk (trigger function)
ALTER FUNCTION public.refresh_driver_risk()
    SET search_path = public;

-- start_trip (also SECURITY DEFINER - keep that, just fix search_path)
ALTER FUNCTION public.start_trip(p_trip_id uuid)
    SET search_path = public;

-- complete_trip (also SECURITY DEFINER - keep that, just fix search_path)
ALTER FUNCTION public.complete_trip(p_trip_id uuid)
    SET search_path = public;

-- mark_trip_delivered (also SECURITY DEFINER - keep that, just fix search_path)
ALTER FUNCTION public.mark_trip_delivered(p_trip_id uuid)
    SET search_path = public;

-- =============================================================================
-- 3. FIX: Add indexes on unindexed foreign keys
-- =============================================================================

-- load_locations.shipment_id → shipments
CREATE INDEX IF NOT EXISTS idx_load_locations_shipment_id
    ON public.load_locations (shipment_id);

-- messages.request_id → requests
CREATE INDEX IF NOT EXISTS idx_messages_request_id
    ON public.messages (request_id);

-- messages.shipment_request_id → shipment_requests
CREATE INDEX IF NOT EXISTS idx_messages_shipment_request_id
    ON public.messages (shipment_request_id);

-- ml_match_log.shipment_id → shipments
CREATE INDEX IF NOT EXISTS idx_ml_match_log_shipment_id
    ON public.ml_match_log (shipment_id);

-- ml_match_log.trip_id → trips
CREATE INDEX IF NOT EXISTS idx_ml_match_log_trip_id
    ON public.ml_match_log (trip_id);

-- notifications.related_shipment_request_id → shipment_requests
CREATE INDEX IF NOT EXISTS idx_notifications_related_shipment_request_id
    ON public.notifications (related_shipment_request_id);

-- notifications.related_trip_id → trips
CREATE INDEX IF NOT EXISTS idx_notifications_related_trip_id
    ON public.notifications (related_trip_id);

-- requests.shipment_id → shipments
CREATE INDEX IF NOT EXISTS idx_requests_shipment_id
    ON public.requests (shipment_id);

-- requests.shipper_id → users
CREATE INDEX IF NOT EXISTS idx_requests_shipper_id
    ON public.requests (shipper_id);

-- requests.trip_id → trips
CREATE INDEX IF NOT EXISTS idx_requests_trip_id
    ON public.requests (trip_id);

-- reviews.shipper_id → users
CREATE INDEX IF NOT EXISTS idx_reviews_shipper_id
    ON public.reviews (shipper_id);

-- reviews.trip_id → trips
CREATE INDEX IF NOT EXISTS idx_reviews_trip_id
    ON public.reviews (trip_id);

-- reviews.trucker_id → users
CREATE INDEX IF NOT EXISTS idx_reviews_trucker_id
    ON public.reviews (trucker_id);

-- shipment_requests.shipment_id → shipments
CREATE INDEX IF NOT EXISTS idx_shipment_requests_shipment_id
    ON public.shipment_requests (shipment_id);

-- shipment_requests.trucker_id → users
CREATE INDEX IF NOT EXISTS idx_shipment_requests_trucker_id
    ON public.shipment_requests (trucker_id);
