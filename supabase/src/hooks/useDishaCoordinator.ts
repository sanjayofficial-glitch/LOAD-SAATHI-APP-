import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  askDisha,
  interpretDishaResponse,
  isSupportedDishaRequest,
  type DishaViewState,
} from '@/lib/dishaRequest';
import { beginDishaRun, completeDishaRun, resetDishaRun } from '@/lib/dishaRunStore';

/**
 * State machine for the opt-in "Ask Disha" panel.
 *
 * - Unsupported questions never leave the client: they resolve to an honest
 *   "not a marketplace search" view and Freddy's own behaviour is untouched.
 * - Everything else goes to the agent-router Edge Function with the caller's
 *   own JWT; there is no direct database access from here and no state is
 *   persisted anywhere (no conversation history).
 *
 * The only extra duty this hook has is mirroring the *real* transitions into
 * the in-memory dishaRunStore so the Command Center's AI Agents view can show
 * "request in progress" while a request is in flight and the completed trace
 * afterwards — across the route change that unmounts this hook. Nothing is
 * published for unsupported questions, and there is deliberately no unmount
 * cleanup: clearing on unmount would erase exactly the state the other route
 * needs to show.
 */
export function useDishaCoordinator() {
  const { user, getSupabaseToken } = useAuth();
  const [view, setView] = useState<DishaViewState>({ kind: 'idle' });
  const [running, setRunning] = useState(false);

  const reset = useCallback(() => {
    setView({ kind: 'idle' });
    resetDishaRun();
  }, []);

  useEffect(() => {
    if (running || view.kind === 'running') {
      beginDishaRun();
      return;
    }
    if (view.kind === 'ok' || view.kind === 'error') {
      completeDishaRun(view);
    }
    // 'idle' and 'unsupported' publish nothing: a question that never ran
    // must never look like it ran.
  }, [running, view]);


  const ask = useCallback(
    async (rawMessage: string): Promise<void> => {
      const message = rawMessage.trim();
      if (!message || running) return;

      if (!isSupportedDishaRequest(message)) {
        setView({ kind: 'unsupported' });
        return;
      }

      setRunning(true);
      setView({ kind: 'running' });
      try {
        if (!user) {
          setView({
            kind: 'error',
            message: 'Sign in to ask Disha — she searches the marketplace with your own account access.',
          });
          return;
        }
        const token = await getSupabaseToken();
        if (!token) {
          setView({
            kind: 'error',
            message: 'Your session could not be verified just now. Please try again in a moment.',
          });
          return;
        }
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          setView({
            kind: 'error',
            message: 'The marketplace service is not configured in this environment.',
          });
          return;
        }
        const body = await askDisha({ message, token, supabaseUrl });
        setView(interpretDishaResponse(body));
      } catch (err) {
        const detail =
          err instanceof Error && err.message
            ? err.message
            : 'Disha could not reach the marketplace service.';
        setView({ kind: 'error', message: detail });
      } finally {
        setRunning(false);
      }
    },
    [running, user, getSupabaseToken],
  );

  return { view, running, ask, reset };
}
