-- Admin Sprint 1 — idempotent migration
-- Applied manually in Supabase SQL editor or via `supabase db push`

-- ===================== NEW TABLE: admin_audit_log =====================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN (
    'user.verify', 'user.unverify', 'user.suspend', 'user.unsuspend', 'user.role_change',
    'trip.cancel', 'trip.reactivate',
    'shipment.cancel', 'shipment.reactivate',
    'bulk.verify', 'bulk.cancel_trips', 'bulk.cancel_shipments',
    'export.csv'
  )),
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.jwt()->>'sub' AND u.user_type = 'admin')
  );

DROP POLICY IF EXISTS "Admins write audit log" ON public.admin_audit_log;
CREATE POLICY "Admins write audit log" ON public.admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.jwt()->>'sub' AND u.user_type = 'admin')
  );

-- ===================== NEW COLUMNS: users.suspended =====================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- ===================== REALTIME for audit log =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_log;
