import { z } from 'zod';

const envSchema = z.object({
  VITE_CLERK_PUBLISHABLE_KEY: z.string().regex(/^pk_(test|live)_/, 'Invalid Clerk publishable key format'),
  VITE_SUPABASE_URL: z.string().url('Supabase URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  VITE_POSTHOG_API_KEY: z.string().min(1, 'PostHog API key is required'),
  VITE_POSTHOG_HOST: z.string().url('PostHog host must be a valid URL'),
  VITE_ADMIN_USER_ID: z.string().optional(),
});

function validateEnv() {
  const raw = {
    VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_POSTHOG_API_KEY: import.meta.env.VITE_POSTHOG_API_KEY,
    VITE_POSTHOG_HOST: import.meta.env.VITE_POSTHOG_HOST,
    VITE_ADMIN_USER_ID: import.meta.env.VITE_ADMIN_USER_ID,
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const messages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${messages}`);
  }

  return result.data;
}

export const env = validateEnv();
