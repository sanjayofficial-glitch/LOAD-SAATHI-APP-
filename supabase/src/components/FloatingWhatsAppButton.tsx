import { MessageCircle } from 'lucide-react';
import { generateShareWhatsAppLink } from '@/utils/whatsapp';
import { posthog } from '@/utils/posthog';

interface FloatingWhatsAppButtonProps {
  type?: 'trip' | 'shipment';
  id?: string;
  originCity?: string;
  destinationCity?: string;
  weight?: number;
  className?: string;
}

const FloatingWhatsAppButton = ({
  type = 'shipment',
  id = 'general',
  originCity = '',
  destinationCity = '',
  weight,
  className = '',
}: FloatingWhatsAppButtonProps) => {
  const handleClick = () => {
    const link = generateShareWhatsAppLink(type, id, {
      origin_city: originCity,
      destination_city: destinationCity,
      weight,
    });
    window.open(link, '_blank', 'noopener,noreferrer');
    posthog.capture('whatsapp_booking_clicked', {
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
      aria-label="Chat on WhatsApp"
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:shadow-xl transition-all hover:scale-105 active:scale-95 ${className}`}
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  );
};

export default FloatingWhatsAppButton;
