import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/format';
import { calculateMatchScore, getMatchLabel, getAIMatchBadge } from '@/utils/matching';

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

describe('calculateMatchScore', () => {
  const baseParams = {
    shipmentOriginCity: 'Delhi',
    shipmentDestCity: 'Mumbai',
    tripOriginCity: 'Delhi',
    tripDestCity: 'Mumbai',
    shipmentWeightTonnes: 5,
    tripCapacityTonnes: 10,
  };

  it('returns high score for exact city match', () => {
    const score = calculateMatchScore(baseParams);
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it('returns lower score for different cities', () => {
    const score = calculateMatchScore({
      ...baseParams,
      tripOriginCity: 'Chennai',
      tripDestCity: 'Kolkata',
    });
    expect(score).toBeLessThan(40);
  });

  it('returns 0-100 range', () => {
    const score = calculateMatchScore(baseParams);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('weights capacity correctly', () => {
    const small = calculateMatchScore({ ...baseParams, shipmentWeightTonnes: 1, tripCapacityTonnes: 10 });
    const large = calculateMatchScore({ ...baseParams, shipmentWeightTonnes: 9, tripCapacityTonnes: 10 });
    expect(small).toBeGreaterThanOrEqual(large);
  });

  it('weights price compatibility', () => {
    const matching = calculateMatchScore({
      ...baseParams,
      shipmentBudgetPerTonne: 100,
      tripPricePerTonne: 100,
    });
    const low = calculateMatchScore({
      ...baseParams,
      shipmentBudgetPerTonne: 50,
      tripPricePerTonne: 100,
    });
    expect(matching).toBeGreaterThan(low);
  });
});

describe('getMatchLabel', () => {
  it('returns Excellent for score >= 80', () => {
    expect(getMatchLabel(85).label).toContain('Excellent');
  });

  it('returns Good for score >= 60', () => {
    expect(getMatchLabel(65).label).toContain('Good');
  });

  it('returns Fair for score >= 40', () => {
    expect(getMatchLabel(45).label).toContain('Fair');
  });

  it('returns Weak for score >= 20', () => {
    expect(getMatchLabel(25).label).toContain('Weak');
  });

  it('returns No Match for score < 20', () => {
    expect(getMatchLabel(10).label).toContain('No Match');
  });
});

describe('getAIMatchBadge', () => {
  it('returns AI label with score', () => {
    expect(getAIMatchBadge({ aiScore: 75, confidence: 'high', reasoning: 'test' }).label).toBe('AI 75%');
  });
});
