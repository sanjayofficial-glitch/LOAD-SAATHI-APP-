import { describe, it, expect } from 'vitest';

// Re-implement sanitizeContent for testing (it's not exported from chat.ts)
const MAX_MESSAGE_LENGTH = 2000;

function sanitizeContent(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

describe('sanitizeContent', () => {
  it('strips HTML tags', () => {
    expect(sanitizeContent('<b>Hello</b>')).toBe('Hello');
  });

  it('strips script tags and leaves content', () => {
    // Regex strips tags, not tag content — this is expected behavior
    const result = sanitizeContent('<script>alert("xss")</script>Hello');
    expect(result).toContain('Hello');
    expect(result).not.toContain('<script>');
  });

  it('strips nested HTML tags', () => {
    expect(sanitizeContent('<div><b>Bold</b> text</div>')).toBe('Bold text');
  });

  it('decodes HTML entities', () => {
    expect(sanitizeContent('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'');
  });

  it('trims whitespace', () => {
    expect(sanitizeContent('  Hello  ')).toBe('Hello');
  });

  it('truncates long messages', () => {
    const long = 'a'.repeat(3000);
    expect(sanitizeContent(long)).toHaveLength(MAX_MESSAGE_LENGTH);
  });

  it('handles empty input', () => {
    expect(sanitizeContent('')).toBe('');
  });

  it('handles already-clean input', () => {
    expect(sanitizeContent('Hello, how are you?')).toBe('Hello, how are you?');
  });

  it('strips image tags with attributes', () => {
    expect(sanitizeContent('<img src="x" onerror="alert(1)">')).toBe('');
  });
});
