export function getShareUrl(type: "trip" | "shipment", id: string): string {
  const base = window.location.origin;
  return `${base}/share/${type}/${id}`;
}

export function generateShareWhatsAppLink(type: "trip" | "shipment", id: string, details: {
  origin_city: string;
  destination_city: string;
  weight?: number;
}): string {
  const shareUrl = getShareUrl(type, id);
  const label = type === "trip" ? "trip" : "load";
  const msg = encodeURIComponent(
    `Check out this ${label} on LoadSaathi:\n\n` +
    `📍 ${details.origin_city} → ${details.destination_city}\n` +
    (details.weight ? `⚖️ ${details.weight}t\n` : "") +
    `\n${shareUrl}`
  );
  return `https://wa.me/?text=${msg}`;
}

export function generateWhatsAppLink(
  truckerPhone: string,
  details: {
    id: string;
    cargo_type?: string;
    goods_description?: string;
    pickup_city: string;
    drop_city: string;
    weight: number;
  }
): string {
  const cargo = details.cargo_type || details.goods_description || 'Cargo';
  // Strip non-digits and ensure Indian country code prefix
  let phone = truckerPhone.replace(/\D/g, '');
  if (phone.length === 10) {
    phone = '91' + phone;
  } else if (phone.length === 12 && phone.startsWith('91')) {
    // Already has country code
  } else if (phone.length > 12) {
    // International format, take last 12 digits
    phone = phone.slice(-12);
  }
  const msg = encodeURIComponent(
    `Hello,\n\nI found your trip on LoadSaathi.\n\n` +
    `Cargo: ${cargo}\n` +
    `Pickup: ${details.pickup_city}\n` +
    `Drop: ${details.drop_city}\n` +
    `Weight: ${details.weight}t\n` +
    `ID: LS-${details.id.slice(0, 8).toUpperCase()}\n\n` +
    `Can we discuss availability?`
  );
  return `https://wa.me/${phone}?text=${msg}`;
}
