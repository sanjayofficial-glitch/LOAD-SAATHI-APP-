import { createClerkSupabaseClient } from '@/utils/supabaseClient';

interface NotificationPayload {
  userId: string;
  message: string;
  getToken: () => Promise<string | null>;
  relatedTripId?: string;
  relatedShipmentRequestId?: string;
  type?: string;
  title?: string;
  actionUrl?: string;
}

export const sendNotification = async (payload: NotificationPayload): Promise<boolean> => {
  try {
    const token = await payload.getToken();
    if (!token) return false;

    const supabase = createClerkSupabaseClient(token);

    // Use SECURITY DEFINER function to bypass RLS for cross-user notifications
    const { error } = await supabase.rpc('create_notification', {
      p_user_id: payload.userId,
      p_message: payload.message,
      p_type: payload.type ?? 'info',
      p_title: payload.title ?? '',
      p_action_url: payload.actionUrl ?? '',
      p_related_trip_id: payload.relatedTripId ?? null,
      p_related_shipment_request_id: payload.relatedShipmentRequestId ?? null,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[sendNotification] Error:', err);
    return false;
  }
};

export const notifyTruckerOfBookingRequest = (params: {
  truckerId: string;
  shipperName: string;
  weightTonnes: number;
  goodsDescription: string;
  originCity: string;
  destinationCity: string;
  tripId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.truckerId,
    message: `📦 New booking! ${params.shipperName} wants to ship ${params.weightTonnes}t of "${params.goodsDescription}" on your trip from ${params.originCity} → ${params.destinationCity}.`,
    relatedTripId: params.tripId,
    getToken: params.getToken,
  });

export const notifyShipperOfRequestAccepted = (params: {
  shipperId: string;
  truckerName: string;
  truckerPhone: string;
  originCity: string;
  destinationCity: string;
  requestId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.shipperId,
    message: `✅ Request Accepted! ${params.truckerName} is ready for your trip from ${params.originCity} → ${params.destinationCity}. Contact them at ${params.truckerPhone}.`,
    relatedShipmentRequestId: params.requestId,
    getToken: params.getToken,
  });

export const notifyShipperOfRequestDeclined = (params: {
  shipperId: string;
  truckerName: string;
  originCity: string;
  destinationCity: string;
  requestId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.shipperId,
    message: `❌ ${params.truckerName} declined your booking request for ${params.originCity} → ${params.destinationCity}.`,
    relatedShipmentRequestId: params.requestId,
    getToken: params.getToken,
  });

export const notifyShipperOfTripCompletion = (params: {
  shipperId: string;
  truckerName: string;
  originCity: string;
  destinationCity: string;
  tripId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.shipperId,
    message: `🏁 Trip Completed! ${params.truckerName} has completed the trip from ${params.originCity} → ${params.destinationCity}. Please rate your experience.`,
    relatedTripId: params.tripId,
    getToken: params.getToken,
  });

export const notifyShipperOfTripStarted = (params: {
  shipperId: string;
  truckerName: string;
  originCity: string;
  destinationCity: string;
  tripId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.shipperId,
    message: `🚛 Trip Started! ${params.truckerName} is on the way from ${params.originCity} → ${params.destinationCity}. Track your shipment live.`,
    relatedTripId: params.tripId,
    getToken: params.getToken,
  });

export const notifyShipperOfTripDelivered = (params: {
  shipperId: string;
  truckerName: string;
  originCity: string;
  destinationCity: string;
  tripId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.shipperId,
    message: `📍 Package Delivered! ${params.truckerName} has delivered your goods from ${params.originCity} → ${params.destinationCity}. Please confirm and rate.`,
    relatedTripId: params.tripId,
    getToken: params.getToken,
  });

export const notifyTruckerOfOfferAccepted = (params: {
  truckerId: string;
  shipperName: string;
  shipperPhone: string;
  originCity: string;
  destinationCity: string;
  requestId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.truckerId,
    message: `✅ Offer Accepted! ${params.shipperName} accepted your offer for ${params.originCity} → ${params.destinationCity}. Contact them at ${params.shipperPhone}.`,
    relatedShipmentRequestId: params.requestId,
    getToken: params.getToken,
  });

export const notifyTruckerOfOfferDeclined = (params: {
  truckerId: string;
  shipperName: string;
  originCity: string;
  destinationCity: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.truckerId,
    message: `❌ Offer Declined. ${params.shipperName} declined your offer for the load from ${params.originCity} → ${params.destinationCity}.`,
    getToken: params.getToken,
  });

export const notifyTruckerOfNewReview = (params: {
  truckerId: string;
  shipperName: string;
  tripId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.truckerId,
    message: `⭐ ${params.shipperName} left you a new review! Check your profile to see your updated rating.`,
    relatedTripId: params.tripId,
    getToken: params.getToken,
  });

export const notifyShipperOfNewReview = (params: {
  shipperId: string;
  truckerName: string;
  tripId: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.shipperId,
    message: `⭐ ${params.truckerName} left you a new review! Check your profile to see your updated rating.`,
    relatedTripId: params.tripId,
    getToken: params.getToken,
  });

export const notifyShipperOfTruckerOffer = (params: {
  shipperId: string;
  truckerName: string;
  proposedPrice: number;
  weightTonnes: number;
  originCity: string;
  destinationCity: string;
  requestId?: string;
  getToken: () => Promise<string | null>;
}) =>
  sendNotification({
    userId: params.shipperId,
    message: `🚛 ${params.truckerName} offered ₹${params.proposedPrice.toLocaleString()}/t for your ${params.weightTonnes}t load from ${params.originCity} → ${params.destinationCity}.`,
    relatedShipmentRequestId: params.requestId,
    getToken: params.getToken,
  });