CREATE OR REPLACE FUNCTION public.insert_shipment(
  p_shipper_id text,
  p_origin_city text,
  p_origin_state text,
  p_destination_city text,
  p_destination_state text,
  p_departure_date date,
  p_goods_description text,
  p_weight_tonnes numeric,
  p_pickup_address text,
  p_delivery_address text,
  p_budget_per_tonne numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $fn$
DECLARE
  new_shipment jsonb;
  caller_id text;
BEGIN
  caller_id := auth.jwt() ->> 'sub';
  IF caller_id IS NULL OR caller_id != p_shipper_id THEN
    RETURN jsonb_build_object('error', 'Unauthorized: token does not match shipper_id');
  END IF;

  INSERT INTO public.shipments (
    shipper_id, origin_city, origin_state, destination_city, destination_state,
    departure_date, goods_description, weight_tonnes,
    pickup_address, delivery_address, budget_per_tonne, status
  ) VALUES (
    p_shipper_id, p_origin_city, p_origin_state, p_destination_city, p_destination_state,
    p_departure_date, p_goods_description, p_weight_tonnes,
    p_pickup_address, p_delivery_address, p_budget_per_tonne, 'pending'
  )
  RETURNING to_jsonb(shipments.*) INTO new_shipment;

  RETURN new_shipment;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.insert_shipment(text,text,text,text,text,date,text,numeric,text,text,numeric) TO authenticated, anon;
