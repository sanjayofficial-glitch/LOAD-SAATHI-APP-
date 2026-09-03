export interface User {
  id: string;
  user_type: 'trucker' | 'shipper' | 'admin';
  full_name: string;
  phone?: string;
  company_name?: string;
  rating: number;
  total_trips: number;
  is_verified?: boolean;
  suspended?: boolean;
  suspended_reason?: string;
  suspended_at?: string;
  created_at: string;
  city?: string;
}

export interface Trip {
  id: string;
  trucker_id: string;
  origin_city: string;
  destination_city: string;
  departure_date: string;
  available_capacity_tonnes: number;
  price_per_tonne: number;
  vehicle_type: string;
  vehicle_number: string;
  status: 'active' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  origin_state?: string;
  destination_state?: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  estimated_distance_km?: number;
  estimated_duration_min?: number;
  trucker?: User;
  requests?: Request[];
}

export interface Shipment {
  id: string;
  shipper_id: string;
  origin_city: string;
  origin_state?: string;
  destination_city: string;
  destination_state?: string;
  departure_date: string;
  goods_description: string;
  weight_tonnes: number;
  pickup_address: string;
  delivery_address: string;
  budget_per_tonne: number;
  status: 'pending' | 'matched' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  created_at: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  estimated_distance_km?: number;
  estimated_duration_min?: number;
  shipper?: User;
}

export interface ShipmentRequest {
  id: string;
  shipment_id: string;
  trucker_id: string;
  shipper_id: string;
  proposed_price_per_tonne?: number;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  updated_at?: string;
  shipment?: Shipment;
  trucker?: User;
  shipper?: User;
}

export interface Request {
  id: string;
  trip_id: string;
  shipper_id: string;
  receiver_id?: string;
  goods_description: string;
  weight_tonnes: number;
  pickup_address: string;
  delivery_address: string;
  status: 'pending' | 'accepted' | 'declined';
  shipment_id?: string;
  created_at: string;
  trip?: Trip;
  shipper?: User;
  receiver?: User;
  shipment?: Shipment;
}

export interface Review {
  id: string;
  trip_id: string;
  trucker_id: string;
  shipper_id: string;
  reviewer_role: 'shipper' | 'trucker';
  rating: number;
  comment?: string;
  created_at: string;
  trip?: Trip;
  trucker?: User;
  shipper?: User;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  request_id?: string;
  shipment_request_id?: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
  recipient?: User;
}

export interface CreditScoreFactors {
  completion: { score: number; max: number; rate: number; completed: number; cancelled: number }
  reliability: { score: number; max: number; delivered: number; terminated: number }
  communication: { score: number; max: number; messagesSent: number; acceptedRequests: number; totalRequests: number }
  reviews: { score: number; max: number; averageRating: number; reviewCount: number }
  tenure: { score: number; max: number; daysActive: number; completedTrips: number }
  tier: 'excellent' | 'good' | 'fair' | 'needs_improvement' | 'poor'
}

export interface CreditScore {
  score: number
  factors: CreditScoreFactors
  history?: { score: number; changed_at: string }[]
  calculated_at: string
}

export interface CreditInsights {
  summary: string
  overallTrend: 'up' | 'down' | 'stable'
  strengths: string[]
  improvements: string[]
  tips: string[]
  projection: string
  provider: string
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  related_trip_id?: string;
  related_shipment_request_id?: string;
  created_at: string;
  type?: string;
  title?: string;
  action_url?: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  admin?: {
    full_name?: string;
    email?: string;
  };
}
