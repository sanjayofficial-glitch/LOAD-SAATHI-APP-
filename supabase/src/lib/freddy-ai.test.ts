import { describe, it, expect } from 'vitest';
import { freddyAI } from './freddy-ai';

describe('freddyAI (knowledge base)', () => {
  it('always answers successfully with a non-empty message', async () => {
    const samples = [
      'what is loadsaathi',
      'I want to ship goods to Kolkata',
      'I have a truck, how do I earn?',
      'how much should I charge for freight?',
      'how do I get started?',
      'contact support',
      'is it free?',
      'anything at all',
    ];
    for (const sample of samples) {
      const res = await freddyAI.ask(sample);
      expect(res.success).toBe(true);
      expect(res.providerUsed).toBe('knowledge-base');
      expect(res.message.length).toBeGreaterThan(0);
    }
  });

  it('rotates greetings (not a fixed opening line)', async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 25; i++) {
      const res = await freddyAI.ask('who are you');
      const firstLine = (res.message.split('\n')[0] ?? '').trim();
      if (firstLine) seen.add(firstLine);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('owns its limits in the default answer', async () => {
    const res = await freddyAI.ask('tell me about quantum physics');
    expect(res.message).toContain("I'll say so and point you to a human");
    expect(res.message).toContain('I won\'t make it up');
  });

  it('never claims invented marketplace data', async () => {
    const res = await freddyAI.ask('I want to ship goods');
    expect(res.message).toContain('never invent trucks or prices');
  });

  it('answers in Hindi when lang=hi with the same honesty', async () => {
    const samples = [
      'लोडसाथी क्या है',
      'मुझे माल भेजना है',
      'मेरे पास ट्रक है, कमाई कैसे होगी?',
      'दाम कैसे पता करें?',
      'कैसे शुरू करें?',
      'संपर्क कैसे करें?',
      'क्या यह मुफ़्त है?',
      'बाकी कुछ भी',
    ];
    for (const sample of samples) {
      const res = await freddyAI.ask(sample, undefined, 'hi');
      expect(res.success).toBe(true);
      expect(res.message.length).toBeGreaterThan(0);
      // Responses are in Devanagari (Hindi script).
      expect(res.message).toMatch(/[\u0900-\u097F]/);
    }

    const fallback = await freddyAI.ask('बाकी कुछ भी', undefined, 'hi');
    expect(fallback.message).toContain('मनगढ़ंत');
  });

  it('purging legacy provider tokens is safe in jsdom', () => {
    // The module already ran its purge on import; ensure no error and no keys.
    expect(localStorage.getItem('freddy_hf_token')).toBeNull();
    expect(localStorage.getItem('freddy_groq_token')).toBeNull();
  });
});
