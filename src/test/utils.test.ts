import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/format';

describe('cn', () => {
  it('merges conditional classes', () => {
    const isHidden = false;
    expect(cn('a', isHidden && 'b', 'c')).toBe('a c');
  });

  it('dedupes conflicting tailwind utilities (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatDuration', () => {
  it('formats minutes under an hour', () => {
    expect(formatDuration(45)).toBe('~45m');
  });

  it('formats exact hours', () => {
    expect(formatDuration(60)).toBe('~1h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('~1h 30m');
  });

  it('formats full days in hours', () => {
    expect(formatDuration(1440)).toBe('~24h');
  });
});
