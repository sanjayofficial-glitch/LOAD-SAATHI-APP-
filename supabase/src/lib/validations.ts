import { z } from 'zod';

export const tripSchema = z.object({
  origin_city: z.string().min(1, 'Origin city is required'),
  origin_state: z.string().optional(),
  destination_city: z.string().min(1, 'Destination city is required'),
  destination_state: z.string().optional(),
  departure_date: z.string().min(1, 'Departure date is required'),
  available_capacity_tonnes: z.string()
    .min(1, 'Capacity is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Enter a valid capacity (e.g. 5.0)'),
  price_per_tonne: z.string()
    .min(1, 'Price is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Enter a valid price per tonne'),
  vehicle_type: z.string().min(1, 'Please select a vehicle type'),
  vehicle_number: z.string().optional(),
});
export type TripFormValues = z.infer<typeof tripSchema>;

export const shipmentSchema = z.object({
  origin_city: z.string().min(1, 'Origin city is required'),
  origin_state: z.string().optional(),
  destination_city: z.string().min(1, 'Destination city is required'),
  destination_state: z.string().optional(),
  departure_date: z.string().min(1, 'Departure date is required'),
  goods_description: z.string().min(1, 'Goods description is required'),
  weight_tonnes: z.string()
    .min(1, 'Weight is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Enter a valid weight (e.g. 5.0)'),
  budget_per_tonne: z.string()
    .min(1, 'Budget is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Enter a valid budget'),
  pickup_address: z.string().optional(),
  delivery_address: z.string().optional(),
});
export type ShipmentFormValues = z.infer<typeof shipmentSchema>;