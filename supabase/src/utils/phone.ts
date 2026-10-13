/**
 * Indian mobile number normalisation + validation.
 *
 * No OTP, no network — pure string work so it can run inline while typing.
 */

/** Keep digits only. */
export function stripDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/**
 * Normalise any of the shapes users paste into a 10-digit local number:
 *   "98765 43210", "+91 98765-43210", "919876543210", "09876543210", "9876543210"
 * Returns a 10-digit string starting 6-9 when the input is recoverable,
 * otherwise an empty string.
 */
export function normalizeIndianPhone(value: string): string {
  const digits = stripDigits(value);
  if (!digits) return '';

  let local = digits;
  if (local.length > 10 && local.startsWith('91') && local.length <= 12) {
    local = local.slice(2);
  } else if (local.length === 11 && local.startsWith('0')) {
    local = local.slice(1);
  } else if (local.length > 11 && local.startsWith('0')) {
    local = local.slice(1);
  } else if (local.length === 13 && local.startsWith('91')) {
    local = local.slice(3);
  }

  if (local.length > 10) {
    // Anything longer than 10 digits we don't recognise — take the last 10
    // only when a leading country code is obviously present.
    if (digits.startsWith('91') && digits.length === 12) local = digits.slice(2);
    else if (digits.startsWith('0') && digits.length === 11) local = digits.slice(1);
  }

  return local.length === 10 ? local : '';
}

/** True for a plausible 10-digit Indian mobile (starts 6/7/8/9). */
export function isValidIndianMobile(value: string): boolean {
  const local = normalizeIndianPhone(value);
  return local.length === 10 && /^[6-9]/.test(local);
}

/** Display form: "+91 98765 43210". Returns "" for empty/invalid. */
export function formatIndianPhone(value: string): string {
  const local = normalizeIndianPhone(value);
  if (!local) return '';
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

/** E.164-ish "919876543210" for wa.me / tel: links. */
export function toE164India(value: string): string {
  const local = normalizeIndianPhone(value);
  return local ? `91${local}` : '';
}

/** "tel:+919876543210" link, or null when unusable. */
export function toTelHref(value: string): string | null {
  const e164 = toE164India(value);
  return e164 ? `tel:+${e164}` : null;
}

/** "https://wa.me/919876543210?text=..." or null when unusable. */
export function toWhatsAppHref(value: string, text?: string): string | null {
  const e164 = toE164India(value);
  if (!e164) return null;
  const suffix = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${e164}${suffix}`;
}
