-- Migration: 20260918_revoke_anon_privileges
-- Purpose: Fix Supabase security advisor warnings:
--   1. anon_security_definer_function_executable — revoke EXECUTE from anon on all 31 functions
--   2. pg_graphql_anon_table_exposed — revoke SELECT from anon on gallery_images
-- Date: 2026-09-18
--
-- Safety: All app calls use authenticated Clerk JWTs via createClerkSupabaseClient.
--         No function or gallery_images table is accessed as anon.
--         This is defense-in-depth hardening.

-- ============================================================
-- 1. Revoke anon EXECUTE on all 31 functions
-- ============================================================

-- SECURITY DEFINER functions (29)
REVOKE EXECUTE ON FUNCTION public.calculate_credit_score(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_driver_risk(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_trip(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_notification(text, text, text, text, text, uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_clerk_user_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_gallery_image(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_shipment(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_team_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_trip(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_corridor_average(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_route_history(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.insert_price_history(text, text, text, text, numeric, numeric, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.insert_shipment(text, text, text, text, text, date, text, numeric, text, text, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.insert_shipment_request(uuid, text, text, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.insert_trip(text, text, text, text, text, date, numeric, numeric, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read() FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_trip_delivered(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_credit_score() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_driver_risk() FROM anon;
REVOKE EXECUTE ON FUNCTION public.reorder_gallery_images(uuid[], integer[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reorder_team_members(uuid[], integer[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.start_trip(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_shipment_coords(uuid, numeric, numeric, numeric, numeric, numeric, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_shipper_rating() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_trip_coords(uuid, numeric, numeric, numeric, numeric, numeric, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_trucker_rating() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;

-- Non-SECURITY DEFINER functions (2) — defense-in-depth
REVOKE EXECUTE ON FUNCTION public.upsert_gallery_image(uuid, text, text, text, text, integer, integer, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.upsert_team_member(uuid, text, text, text, text, text, text, text, text, integer) FROM anon;

-- ============================================================
-- 2. Revoke anon SELECT on gallery_images (fixes pg_graphql_anon_table_exposed)
-- ============================================================
REVOKE SELECT ON TABLE public.gallery_images FROM anon;
