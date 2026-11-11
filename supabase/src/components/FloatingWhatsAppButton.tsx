import { MessageCircle, Phone } from 'lucide-react';
import { generateOwnerWhatsAppLink, generateShareWhatsAppLink } from '@/utils/whatsapp';
import { trackEvent, trackWhatsappClicked } from '@/utils/analytics';


interface FloatingWhatsAppButtonProps {
  type?: 'trip' | 'shipment';
  id?: string;
  originCity?: string;
  destinationCity?: string;
  weight?: number;
  className?: string;
  /** When true, opens the owner WhatsApp instead of the share link. */
  toOwner?: boolean;
}

const FloatingWhatsAppButton = ({
  type = 'shipment',
  id = 'general',
  originCity = '',
  destinationCity = '',
  weight,
  className = '',
  toOwner = false,
}: FloatingWhatsAppButtonProps) => {
  const handleClick = async () => {
    trackWhatsappClicked({ channel: toOwner ? "owner" : "share" });
    if (toOwner) {
      // Best-effort lead capture before navigating away.
      trackEvent('whatsapp_lead_started', {
        type,
        id,
        origin_city: originCity,
        destination_city: destinationCity,
        weight,
      });
      const pretext = [
        type === 'trip' ? 'Trip' : 'Load',
        `${originCity ? originCity : 'N/A'} → ${destinationCity ? destinationCity : 'N/A'}`,
        weight ? `• ${weight}t` : '',
        id && id !== 'general' ? `• ID: ${id}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      // Best-effort lead capture — failure must not block the WhatsApp nav.
      try {
        const module = await import('@/lib/leadCapture').catch(() => null);
        if (module?.insertLead) {
          await module.insertLead({
            phone: '',
            name: '',
            source: 'whatsapp_fab_owner',
            page_path: window.location.pathname,
            user_id: '',
            message: pretext,
          });
        }
      } catch {
        // Insert failed — navigation still proceeds.
      }

      const link = generateOwnerWhatsAppLink(pretext || undefined);
      window.open(link, '_blank', 'noopener,noreferrer');
      return;
    }

    const link = generateShareWhatsAppLink(type, id, {
      origin_city: originCity,
      destination_city: destinationCity,
      weight,
    });
    window.open(link, '_blank', 'noopener,noreferrer');
    trackEvent('whatsapp_booking_clicked', {
      type,
      id,
      origin_city: originCity,
      destination_city: destinationCity,
      weight,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={toOwner ? 'Chat with owner on WhatsApp' : 'Share on WhatsApp'}
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:shadow-xl transition-all hover:scale-105 active:scale-95 ${className}`}
    >
      {toOwner ? (
        <Phone className="h-7 w-7" />
      ) : (
        <MessageCircle className="h-7 w-7" />
      )}
    </button>
  );
};

export default FloatingWhatsAppButton;
