-- Migration: Add document upload, mentor, and SMS opt-in columns to users table
-- These columns correspond to fields in src/types/index.ts User interface (lines 15-19)
-- that were added to the frontend but never migrated to the database.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS rc_document_url text,
  ADD COLUMN IF NOT EXISTS insurance_document_url text,
  ADD COLUMN IF NOT EXISTS mentor_requested boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS mentor_id text,
  ADD COLUMN IF NOT EXISTS sms_opt_in boolean DEFAULT false NOT NULL;
