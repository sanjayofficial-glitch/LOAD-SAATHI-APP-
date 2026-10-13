import { describe, it, expect } from 'vitest';
import {
  normalizeIndianPhone,
  isValidIndianMobile,
  formatIndianPhone,
  toE164India,
  toTelHref,
  toWhatsAppHref,
} from '@/utils/phone';

describe('normalizeIndianPhone', () => {
  it('keeps a plain 10-digit number', () => {
    expect(normalizeIndianPhone('9876543210')).toBe('9876543210');
  });

  it('strips spaces and dashes', () => {
    expect(normalizeIndianPhone('98765 43210')).toBe('9876543210');
    expect(normalizeIndianPhone('98765-43210')).toBe('9876543210');
  });

  it('drops +91 / 91 prefixes', () => {
    expect(normalizeIndianPhone('+919876543210')).toBe('9876543210');
    expect(normalizeIndianPhone('919876543210')).toBe('9876543210');
  });

  it('drops leading 0', () => {
    expect(normalizeIndianPhone('09876543210')).toBe('9876543210');
  });

  it('returns empty for empty input', () => {
    expect(normalizeIndianPhone('')).toBe('');
    expect(normalizeIndianPhone('   ')).toBe('');
  });

  it('returns empty for too-short input', () => {
    expect(normalizeIndianPhone('98765')).toBe('');
  });

  it('returns empty for too-long unrecognised input', () => {
    expect(normalizeIndianPhone('98765432101234')).toBe('');
  });
});

describe('isValidIndianMobile', () => {
  it('accepts numbers starting 6-9', () => {
    expect(isValidIndianMobile('6876543210')).toBe(true);
    expect(isValidIndianMobile('7876543210')).toBe(true);
    expect(isValidIndianMobile('8876543210')).toBe(true);
    expect(isValidIndianMobile('9876543210')).toBe(true);
  });

  it('rejects numbers starting 0-5', () => {
    expect(isValidIndianMobile('5876543210')).toBe(false);
    expect(isValidIndianMobile('4876543210')).toBe(false);
    expect(isValidIndianMobile('0876543210')).toBe(false);
  });

  it('rejects short/long/garbage', () => {
    expect(isValidIndianMobile('')).toBe(false);
    expect(isValidIndianMobile('98765')).toBe(false);
    expect(isValidIndianMobile('not a phone')).toBe(false);
    expect(isValidIndianMobile('98765432101')).toBe(false);
  });

  it('accepts formatted input', () => {
    expect(isValidIndianMobile('+91 98765 43210')).toBe(true);
    expect(isValidIndianMobile('098765-43210')).toBe(true);
  });
});

describe('formatIndianPhone', () => {
  it('renders the display form', () => {
    expect(formatIndianPhone('9876543210')).toBe('+91 98765 43210');
  });

  it('returns empty when invalid', () => {
    expect(formatIndianPhone('12345')).toBe('');
    expect(formatIndianPhone('')).toBe('');
  });
});

describe('toE164India / links', () => {
  it('builds the country-code form', () => {
    expect(toE164India('9876543210')).toBe('919876543210');
    expect(toE164India('+91 98765 43210')).toBe('919876543210');
    expect(toE164India('')).toBe('');
  });

  it('builds a tel link', () => {
    expect(toTelHref('9876543210')).toBe('tel:+919876543210');
    expect(toTelHref('')).toBeNull();
  });

  it('builds a wa.me link with optional text', () => {
    expect(toWhatsAppHref('9876543210')).toBe('https://wa.me/919876543210');
    expect(toWhatsAppHref('9876543210', 'hi there')).toBe(
      'https://wa.me/919876543210?text=hi%20there'
    );
    expect(toWhatsAppHref('')).toBeNull();
  });
});
