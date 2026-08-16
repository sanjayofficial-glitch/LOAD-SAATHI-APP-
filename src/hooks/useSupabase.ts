import { useSession } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { useCallback, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export const useSupabase = () => {
  const { session } = useSession();

  const getAuthenticatedClient = useCallback(async () => {
    const token = await session?.getToken({ template: "supabase" });
    if (!token) throw new Error("No authentication token found");
    const client = createClerkSupabaseClient(token);
    // Realtime sockets do NOT inherit the global Authorization header — set
    // the JWT on this client's own realtime connection so postgres_changes
    // subscriptions made on it authorize as `authenticated` (RLS is
    // `TO authenticated`; the anon role is denied).
    client.realtime.setAuth(token);
    return client;
  }, [session]);

  /**
   * Executes a Supabase operation with automatic retry on 401.
   * If the first attempt returns 401 (expired/invalid JWT), refreshes
   * the token and retries once. This handles Clerk token rotation gaps.
   */
  const withAuthRetry = useCallback(async <T>(
    operation: (supabase: SupabaseClient) => Promise<T>
  ): Promise<T> => {
    const supabase = await getAuthenticatedClient();
    try {
      return await operation(supabase);
    } catch (err: unknown) {
      // Check if the error is a 401 from Supabase
      const is401 =
        (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 401) ||
        (err instanceof Error && err.message.includes("401"));

      if (!is401) throw err;

      // Retry with a fresh token
      const freshSupabase = await getAuthenticatedClient();
      return operation(freshSupabase);
    }
  }, [getAuthenticatedClient]);

  return useMemo(
    () => ({ getAuthenticatedClient, withAuthRetry }),
    [getAuthenticatedClient, withAuthRetry]
  );
};
