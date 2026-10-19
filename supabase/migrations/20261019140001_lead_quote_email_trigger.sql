-- On-insert webhook for public.leads -> instant quote email.
--
-- When a lead with an email address lands (quote lead card, contact form),
-- this trigger POSTs the row to the Vercel endpoint /api/lead-quote, which
-- renders and sends both the lead-facing instant quote acknowledgement and
-- the founder-facing "new lead" notification through Resend.
--
-- Auth: the endpoint requires `Authorization: Bearer <CRON_SECRET>`; the
-- value is read from public.app_secrets (operator-inserted, not in git) so
-- the migration text stays secret-free.
--
-- Transport: pg_net (schema `net`). http_post is async fire-once, no retry —
-- failures are logged as warnings and never break the lead insert.
--
-- The webhook URL (https://loadsaathi.in/api/lead-quote) is public info, so
-- baking it here is fine. The Authorization header value transits pg_net's
-- internal bookkeeping briefly; pg_net stores are only reachable by the
-- postgres role, which is acceptable for this secret's blast radius.

create schema if not exists private;

revoke all on schema private from anon, authenticated;

create or replace function private.notify_lead_quote_email()
returns trigger
language plpgsql
security definer
set search_path = private, public, net
as $$
declare
  v_secret text;
  v_url    text := 'https://loadsaathi.in/api/lead-quote';
begin
  if new.email is null or btrim(coalesce(new.email, '')) = '' then
    -- No email captured: WhatsApp-first lead, nothing to send.
    return new;
  end if;

  select value into v_secret from public.app_secrets where key = 'cron_secret';
  if v_secret is null or coalesce(v_secret, '') = '' then
    raise warning 'app_secrets: cron_secret missing, skipping lead-quote webhook for lead %', new.id;
    return new;
  end if;

  begin
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_secret
      ),
      body := jsonb_build_object(
        'id', new.id,
        'created_at', new.created_at,
        'email', btrim(new.email),
        'phone', new.phone,
        'name', new.name,
        'source', new.source,
        'page_path', new.page_path,
        'message', new.message
      ),
      timeout_milliseconds := 8000
    );
  exception when others then
    -- Never let email delivery issues break the lead write path.
    raise warning 'lead-quote webhook post failed for lead %: %', new.id, sqlerrm;
  end;

  return new;
end $$;

drop trigger if exists on_lead_created_notify_quote on public.leads;

create trigger on_lead_created_notify_quote
after insert on public.leads
for each row
execute function private.notify_lead_quote_email();
