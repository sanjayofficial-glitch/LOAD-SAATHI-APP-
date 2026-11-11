import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './supabase/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./supabase/src/test/setup.ts'],
    // Only run the app's own test files — never installed skill suites
    // (.agents/**), which aren't part of the application build.
    include: ['supabase/src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', '.agents/**'],
    css: true,
    // The Radix-Select-driven tool tests poll asynchronously and need ~2s per
    // interaction on busy Windows CI runners — the 5s default made the
    // ShipmentBriefBuilder test flake only in the parallel suite (it passes
    // in isolation). No assertions depend on wall-clock speed, so raising the
    // ceiling only removes runner-load sensitivity.
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['supabase/src/**/*.{ts,tsx}'],
      exclude: ['supabase/src/test/**', 'supabase/src/**/*.d.ts', 'supabase/src/main.tsx'],
    },
  },
});
