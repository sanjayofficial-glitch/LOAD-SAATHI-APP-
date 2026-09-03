-- Enable RLS on all tables
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
DECLARE 
    r record;
BEGIN
    FOR tbl IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('shipments', 'requests', 'shipment_requests', 'notifications', 'messages', 'users'))
    LOOP
        FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = tbl.tablename)
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.' || tbl.tablename;
        END LOOP;
    END LOOP;
END $$;

-- Allow all authenticated users to read all users (needed for JOINs to show names)
CREATE POLICY "Authenticated users can read all users" ON public.users
FOR SELECT TO authenticated USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = id);

-- Shippers can see all shipments (for browsing)
CREATE POLICY "Shippers can see all shipments" ON public.shipments
FOR SELECT TO authenticated USING (true);

-- Shippers can insert their own shipments
CREATE POLICY "Shippers can insert own shipments" ON public.shipments
FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = shipper_id);

-- Shippers can update their own shipments
CREATE POLICY "Shippers can update own shipments" ON public.shipments
FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = shipper_id);

-- Shippers can delete their own shipments
CREATE POLICY "Shippers can delete own shipments" ON public.shipments
FOR DELETE TO authenticated USING (auth.jwt()->>'sub' = shipper_id);

-- Truckers can see all shipments (for browsing)
CREATE POLICY "Truckers can see all shipments" ON public.shipments
FOR SELECT TO authenticated USING (true);

-- Truckers can see requests for trips they own
CREATE POLICY "Truckers can see relevant requests" ON public.requests
FOR SELECT TO authenticated USING (
  auth.jwt()->>'sub' = receiver_id
);

-- Shippers can insert requests for trips
CREATE POLICY "Shippers can create requests" ON public.requests
FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = shipper_id);

-- Truckers can update received requests (accept/decline)
CREATE POLICY "Truckers can update received requests" ON public.requests
FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = receiver_id);

-- Shippers can update own requests
CREATE POLICY "Shippers can update own requests" ON public.requests
FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = shipper_id);

-- Shippers can see requests for their trips
CREATE POLICY "Shippers can see requests for own trips" ON public.requests
FOR SELECT TO authenticated USING (
  auth.jwt()->>'sub' = shipper_id OR 
  auth.jwt()->>'sub' IN (
    SELECT shipper_id FROM public.shipment_requests 
    WHERE shipment_id = requests.shipment_id
  )
);

-- Truckers can insert shipment requests
CREATE POLICY "Truckers can insert shipment requests" ON public.shipment_requests
FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = trucker_id);

-- Shippers can see shipment requests for their shipments
CREATE POLICY "Shippers can see shipment requests" ON public.shipment_requests
FOR SELECT TO authenticated USING (
  auth.jwt()->>'sub' = shipper_id OR 
  auth.jwt()->>'sub' IN (
    SELECT shipper_id FROM public.shipments 
    WHERE id = shipment_requests.shipment_id
  )
);

-- Truckers can update their own shipment requests
CREATE POLICY "Truckers can update own shipment requests" ON public.shipment_requests
FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = trucker_id);

-- Shippers can delete their own shipment requests
CREATE POLICY "Shippers can delete own shipment requests" ON public.shipment_requests
FOR DELETE TO authenticated USING (auth.jwt()->>'sub' = shipper_id);

-- Users can see their own notifications
CREATE POLICY "Users can see own notifications" ON public.notifications
FOR SELECT TO authenticated USING (auth.jwt()->>'sub' = user_id);

-- Users can see their own notifications
CREATE POLICY "Users can create own notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = user_id);

-- Users can see their own messages
CREATE POLICY "Users can see own messages" ON public.messages
FOR SELECT TO authenticated USING (
  auth.jwt()->>'sub' = sender_id OR 
  auth.jwt()->>'sub' = recipient_id
);

-- Users can send messages
CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT TO authenticated WITH CHECK (
  auth.jwt()->>'sub' = sender_id
);

-- Users can mark their messages as read (update is_read)
CREATE POLICY "Users can update own messages" ON public.messages
FOR UPDATE TO authenticated USING (
  auth.jwt()->>'sub' = recipient_id
);

-- Anonymous users can view active trips (for public share links)
CREATE POLICY "Anonymous can view active trips" ON public.trips
FOR SELECT TO anon USING (status = 'active');

-- Anonymous users can view open shipments (for public share links)
CREATE POLICY "Anonymous can view open shipments" ON public.shipments
FOR SELECT TO anon USING (status = 'pending');