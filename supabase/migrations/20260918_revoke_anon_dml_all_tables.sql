-- Revoke remaining anon DML/DDL on all 25 public tables
-- All tables have RLS enabled; anon table privileges are defense-in-depth.
-- App uses authenticated Clerk JWTs; anon only needs SELECT for public read.
-- Pattern matches 20260918_revoke_anon_gallery_images_dml.sql (individual static statements).

-- admin_audit_log
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='admin_audit_log' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.admin_audit_log FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='admin_audit_log' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.admin_audit_log FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='admin_audit_log' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.admin_audit_log FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='admin_audit_log' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.admin_audit_log FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='admin_audit_log' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.admin_audit_log FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='admin_audit_log' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.admin_audit_log FROM anon; END IF; END $$;

-- corridor_multipliers
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='corridor_multipliers' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.corridor_multipliers FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='corridor_multipliers' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.corridor_multipliers FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='corridor_multipliers' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.corridor_multipliers FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='corridor_multipliers' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.corridor_multipliers FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='corridor_multipliers' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.corridor_multipliers FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='corridor_multipliers' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.corridor_multipliers FROM anon; END IF; END $$;

-- credit_scores
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='credit_scores' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.credit_scores FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='credit_scores' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.credit_scores FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='credit_scores' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.credit_scores FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='credit_scores' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.credit_scores FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='credit_scores' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.credit_scores FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='credit_scores' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.credit_scores FROM anon; END IF; END $$;

-- driver_locations
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='driver_locations' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.driver_locations FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='driver_locations' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.driver_locations FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='driver_locations' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.driver_locations FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='driver_locations' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.driver_locations FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='driver_locations' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.driver_locations FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='driver_locations' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.driver_locations FROM anon; END IF; END $$;

-- favorites
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='favorites' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.favorites FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='favorites' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.favorites FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='favorites' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.favorites FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='favorites' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.favorites FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='favorites' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.favorites FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='favorites' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.favorites FROM anon; END IF; END $$;

-- fuel_prices
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='fuel_prices' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.fuel_prices FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='fuel_prices' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.fuel_prices FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='fuel_prices' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.fuel_prices FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='fuel_prices' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.fuel_prices FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='fuel_prices' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.fuel_prices FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='fuel_prices' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.fuel_prices FROM anon; END IF; END $$;

-- load_locations
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='load_locations' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.load_locations FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='load_locations' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.load_locations FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='load_locations' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.load_locations FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='load_locations' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.load_locations FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='load_locations' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.load_locations FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='load_locations' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.load_locations FROM anon; END IF; END $$;

-- messages
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='messages' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.messages FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='messages' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.messages FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='messages' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.messages FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='messages' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.messages FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='messages' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.messages FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='messages' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.messages FROM anon; END IF; END $$;

-- ml_match_log
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='ml_match_log' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.ml_match_log FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='ml_match_log' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.ml_match_log FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='ml_match_log' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.ml_match_log FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='ml_match_log' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.ml_match_log FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='ml_match_log' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.ml_match_log FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='ml_match_log' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.ml_match_log FROM anon; END IF; END $$;

-- notifications
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='notifications' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.notifications FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='notifications' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.notifications FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='notifications' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.notifications FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='notifications' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.notifications FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='notifications' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.notifications FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='notifications' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.notifications FROM anon; END IF; END $$;

-- price_history
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='price_history' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.price_history FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='price_history' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.price_history FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='price_history' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.price_history FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='price_history' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.price_history FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='price_history' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.price_history FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='price_history' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.price_history FROM anon; END IF; END $$;

-- pricing_config
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_config' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.pricing_config FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_config' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.pricing_config FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_config' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.pricing_config FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_config' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.pricing_config FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_config' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.pricing_config FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_config' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.pricing_config FROM anon; END IF; END $$;

-- pricing_flags
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_flags' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.pricing_flags FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_flags' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.pricing_flags FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_flags' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.pricing_flags FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_flags' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.pricing_flags FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_flags' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.pricing_flags FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_flags' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.pricing_flags FROM anon; END IF; END $$;

-- pricing_surcharge_config
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_surcharge_config' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.pricing_surcharge_config FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_surcharge_config' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.pricing_surcharge_config FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_surcharge_config' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.pricing_surcharge_config FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_surcharge_config' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.pricing_surcharge_config FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_surcharge_config' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.pricing_surcharge_config FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='pricing_surcharge_config' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.pricing_surcharge_config FROM anon; END IF; END $$;

-- requests
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='requests' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.requests FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='requests' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.requests FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='requests' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.requests FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='requests' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.requests FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='requests' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.requests FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='requests' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.requests FROM anon; END IF; END $$;

-- reviews
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='reviews' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.reviews FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='reviews' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.reviews FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='reviews' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.reviews FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='reviews' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.reviews FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='reviews' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.reviews FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='reviews' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.reviews FROM anon; END IF; END $$;

-- route_return_factor
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='route_return_factor' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.route_return_factor FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='route_return_factor' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.route_return_factor FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='route_return_factor' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.route_return_factor FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='route_return_factor' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.route_return_factor FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='route_return_factor' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.route_return_factor FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='route_return_factor' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.route_return_factor FROM anon; END IF; END $$;

-- seasonal_multipliers
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='seasonal_multipliers' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.seasonal_multipliers FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='seasonal_multipliers' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.seasonal_multipliers FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='seasonal_multipliers' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.seasonal_multipliers FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='seasonal_multipliers' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.seasonal_multipliers FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='seasonal_multipliers' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.seasonal_multipliers FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='seasonal_multipliers' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.seasonal_multipliers FROM anon; END IF; END $$;

-- shipment_requests
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipment_requests' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.shipment_requests FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipment_requests' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.shipment_requests FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipment_requests' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.shipment_requests FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipment_requests' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.shipment_requests FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipment_requests' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.shipment_requests FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipment_requests' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.shipment_requests FROM anon; END IF; END $$;

-- shipments
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipments' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.shipments FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipments' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.shipments FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipments' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.shipments FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipments' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.shipments FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipments' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.shipments FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='shipments' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.shipments FROM anon; END IF; END $$;

-- team_members
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='team_members' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.team_members FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='team_members' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.team_members FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='team_members' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.team_members FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='team_members' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.team_members FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='team_members' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.team_members FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='team_members' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.team_members FROM anon; END IF; END $$;

-- templates
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='templates' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.templates FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='templates' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.templates FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='templates' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.templates FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='templates' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.templates FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='templates' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.templates FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='templates' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.templates FROM anon; END IF; END $$;

-- trips
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='trips' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.trips FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='trips' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.trips FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='trips' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.trips FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='trips' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.trips FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='trips' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.trips FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='trips' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.trips FROM anon; END IF; END $$;

-- user_profiles
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='user_profiles' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.user_profiles FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='user_profiles' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.user_profiles FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='user_profiles' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.user_profiles FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='user_profiles' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.user_profiles FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='user_profiles' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.user_profiles FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='user_profiles' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.user_profiles FROM anon; END IF; END $$;

-- users
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='users' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.users FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='users' AND privilege_type='INSERT') THEN REVOKE INSERT ON public.users FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='users' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.users FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='users' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.users FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='users' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.users FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='users' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.users FROM anon; END IF; END $$;
