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
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['supabase/src/**/*.{ts,tsx}'],
      exclude: ['supabase/src/test/**', 'supabase/src/**/*.d.ts', 'supabase/src/main.tsx'],
    },
  },
});
