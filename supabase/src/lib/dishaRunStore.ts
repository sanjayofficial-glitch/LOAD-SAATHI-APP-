import { useSyncExternalStore } from 'react';
import type { DishaBlock, DishaViewState } from './dishaRequest';

/**
 * In-memory, same-tab status of the most recent "Ask Disha" request.
 *
 * Why this exists: the Command Center lives behind a different route (and a
 * different layout) than the "Ask Disha" bubble, so the coordinator hook that
 * owns the request unmounts while the user walks over to the AI Agents view.
 * This store is the smallest possible bridge between those two routes.
 *
 * Deliberate limits — all of them part of the zero-cost / no-new-writes
 * posture of this phase:
 *
 * - module-scoped memory only: no localStorage, no sessionStorage, no
 *   cookies, no IndexedDB, no network call, no Supabase table;
 * - it dies on reload and is never shared between tabs;
 * - only `useDishaCoordinator` publishes into it (this module exposes the
 *   publish functions for that hook and for tests);
 * - it records what actually happened: a real `running` transition and the
 *   real final view returned by `agent-router`. Unsupported questions publish
 *   nothing because they never left the client.
 *
 * It intentionally does NOT stream per-step events: `agent-router` only ever
 * returns `running` and a finished block, so no step-by-step "agent is
 * working now" signal exists to show. The completed trace is rendered by the
 * AI Agents panel after the fact.
 */

export type DishaRunPhase = 'idle' | 'running' | 'done' | 'error';

export interface DishaRunSnapshot {
  readonly phase: DishaRunPhase;
  /** When the recorded request started (epoch ms), null when idle. */
  readonly startedAt: number | null;
  /** When the recorded request finished (epoch ms), null unless done/error. */
  readonly finishedAt: number | null;
  /** Final `disha` block, only for `done`. */
  readonly block: DishaBlock | null;
  /** Error text, only for `error`. */
  readonly message: string | null;
}

export const IDLE_DISHA_RUN: DishaRunSnapshot = Object.freeze({
  phase: 'idle' as const,
  startedAt: null,
  finishedAt: null,
  block: null,
  message: null,
});

let snapshot: DishaRunSnapshot = IDLE_DISHA_RUN;
const listeners = new Set<() => void>();

function publish(next: DishaRunSnapshot): void {
  if (next === snapshot) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function subscribeDishaRun(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDishaRunSnapshot(): DishaRunSnapshot {
  return snapshot;
}

/**
 * Record that a supported request actually started. Idempotent while a run is
 * already in flight so React's double-invoked effects cannot restart the clock.
 */
export function beginDishaRun(now: number = Date.now()): void {
  if (snapshot.phase === 'running') return;
  publish({
    phase: 'running',
    startedAt: now,
    finishedAt: null,
    block: null,
    message: null,
  });
}

/**
 * Record the real final view returned by the coordinator. `running`,
 * `unsupported` and `idle` views publish nothing: a question that never ran
 * must never look like it ran.
 */
export function completeDishaRun(view: DishaViewState, now: number = Date.now()): void {
  if (view.kind === 'ok') {
    if (snapshot.phase === 'done' && snapshot.block === view.block) return;
    publish({
      phase: 'done',
      startedAt: snapshot.startedAt,
      finishedAt: now,
      block: view.block,
      message: null,
    });
    return;
  }
  if (view.kind === 'error') {
    if (snapshot.phase === 'error' && snapshot.message === view.message) return;
    publish({
      phase: 'error',
      startedAt: snapshot.startedAt,
      finishedAt: now,
      block: null,
      message: view.message,
    });
  }
}

/** Back to "nothing recorded". Idempotent. */
export function resetDishaRun(): void {
  if (snapshot.phase === 'idle') return;
  publish(IDLE_DISHA_RUN);
}

export function useDishaRunStore(): DishaRunSnapshot {
  return useSyncExternalStore(subscribeDishaRun, getDishaRunSnapshot, getDishaRunSnapshot);
}
