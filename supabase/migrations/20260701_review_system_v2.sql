-- Bidirectional Review System V2
-- Supports both shipper→trucker and trucker→shipper reviews

-- 1. Add reviewer_role column (default 'shipper' for existing reviews)
-- IF NOT EXISTS because 20250601_baseline_schema.sql already creates it.
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS reviewer_role text NOT NULL DEFAULT 'shipper'
CHECK (reviewer_role IN ('shipper', 'trucker'));

-- 2. Drop old constraint, add new per-role constraint
-- 'shipper' reviews: each shipper reviews a trip once
-- 'trucker' reviews: trucker reviews each shipper once
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS unique_trip_shipper_review;

-- The baseline already creates this constraint, so drop before re-adding to
-- keep the migration replay-safe.
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS unique_trip_role_review;

ALTER TABLE public.reviews
ADD CONSTRAINT unique_trip_role_review UNIQUE (trip_id, reviewer_role, shipper_id);

-- 3. Update trucker rating function to only count shipper-written reviews
CREATE OR REPLACE FUNCTION public.update_trucker_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating numeric;
  target_trucker_id text;
BEGIN
  target_trucker_id := COALESCE(NEW.trucker_id, OLD.trucker_id);

  SELECT ROUND(AVG(rating)::numeric, 1) INTO avg_rating
  FROM public.reviews
  WHERE trucker_id = target_trucker_id
    AND reviewer_role = 'shipper';

  UPDATE public.users
  SET rating = COALESCE(avg_rating, 0)
  WHERE id = target_trucker_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Create shipper rating function
CREATE OR REPLACE FUNCTION public.update_shipper_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating numeric;
  target_shipper_id text;
BEGIN
  target_shipper_id := COALESCE(NEW.shipper_id, OLD.shipper_id);

  SELECT ROUND(AVG(rating)::numeric, 1) INTO avg_rating
  FROM public.reviews
  WHERE shipper_id = target_shipper_id
    AND reviewer_role = 'trucker';

  UPDATE public.users
  SET rating = COALESCE(avg_rating, 0)
  WHERE id = target_shipper_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. Drop old trigger, create role-specific triggers
DROP TRIGGER IF EXISTS trg_reviews_update_rating ON public.reviews;
DROP TRIGGER IF EXISTS trg_reviews_update_trucker_rating ON public.reviews;
DROP TRIGGER IF EXISTS trg_reviews_update_shipper_rating ON public.reviews;

-- No WHEN clause. It is not valid on a trigger firing for INSERT OR UPDATE OR
-- DELETE: NEW does not exist for DELETE, and a bare column name is ambiguous,
-- so PostgreSQL rejects both spellings with "column ... does not exist". The
-- role filter is inside the two functions above instead. This also matches the
-- definition these triggers have in production.
CREATE TRIGGER trg_reviews_update_trucker_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trucker_rating();

CREATE TRIGGER trg_reviews_update_shipper_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shipper_rating();

-- 6. Update RLS policy to allow both roles to create reviews
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Shippers can create reviews" ON public.reviews;

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    (reviewer_role = 'shipper' AND auth.uid()::text = shipper_id)
    OR
    (reviewer_role = 'trucker' AND auth.uid()::text = trucker_id)
  );
