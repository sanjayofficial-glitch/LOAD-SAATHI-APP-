import { useSession } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/lib/supabase";
import { useCallback, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export const useSupabase = () => {
  const { session } = useSession();

  const getToken = useCallback(async (): Promise<string | null> => {
    return session?.getToken({ template: "supabase" }) ?? null;
  }, [session]);

  const getAuthenticatedClient = useCallback(async () => {
    const rawToken = await session?.getToken({ template: "supabase" });
    if (!rawToken) throw new Error("No authentication token found");
    const token: string = rawToken;

    const client = createClerkSupabaseClient(token);
    client.realtime.setAuth(token);
    return client;
  }, [session]);

  const withAuthRetry = useCallback(async <T>(
    operation: (supabase: SupabaseClient) => Promise<T>
  ): Promise<T> => {
    const supabase = await getAuthenticatedClient();
    try {
      const result = await operation(supabase);

      if (
        result && typeof result === "object" && "error" in result &&
        result.error && typeof result.error === "object" &&
        "code" in result.error
      ) {
        const errObj = result.error as { code?: string; message?: string; status?: number };
        const is401 =
          errObj.status === 401 ||
          errObj.code === "PGRST301" ||
          (typeof errObj.message === "string" && errObj.message.includes("401"));

        if (is401) {
          const freshSupabase = await getAuthenticatedClient();
          return operation(freshSupabase);
        }
      }

      return result;
    } catch (err: unknown) {
      const is401 =
        (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 401) ||
        (err instanceof Error && err.message.includes("401"));

      if (!is401) throw err;

      const freshSupabase = await getAuthenticatedClient();
      return operation(freshSupabase);
    }
  }, [getAuthenticatedClient]);

  return useMemo(
    () => ({ getAuthenticatedClient, withAuthRetry, getToken }),
    [getAuthenticatedClient, withAuthRetry, getToken]
  );
};
