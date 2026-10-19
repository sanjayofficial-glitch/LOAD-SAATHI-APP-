-- app_secrets: operator-managed secret storage for in-DB outbound webhooks.
--
-- Trigger functions that must embed a bearer token in an outbound HTTP call
-- (see 20261019140001_lead_quote_email_trigger.sql) read the value from this
-- table at runtime instead of embedding it in the SQL text. Values are
-- inserted by the operator via SQL sessions and are NEVER committed to the
-- repository.
--
-- Access model: RLS on with NO policies. anon/authenticated have all grants
-- revoked (they cannot even name the table). service_role bypasses RLS.
-- postgres (the table owner) reads it for SECURITY DEFINER trigger use and
-- maintenance because RLS is not forced on owners.

create table if not exists public.app_secrets (
  key        text primary key,
  value      text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_secrets enable row level security;

revoke all on public.app_secrets from anon, authenticated;
