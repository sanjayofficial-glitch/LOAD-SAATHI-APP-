import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MapPin, AlertTriangle, Info, ListChecks } from 'lucide-react';
import { useReducedMotion } from './DishaMascot';
import { useDishaCoordinator } from '@/hooks/useDishaCoordinator';
import type {
  DishaBlockStatus,
  DishaMissingKey,
  DishaRow,
  DishaStepName,
} from '@/lib/dishaRequest';

interface DishaAskPanelProps {
  open: boolean;
  onClose: () => void;
}

const STEP_LABEL: Record<DishaStepName, string> = {
  shipment_analyst: 'Shipment Analyst',
  matching_specialist: 'Matching Specialist',
  disha_coordinator: 'Disha Coordinator',
};

const STATUS_LABEL: Record<DishaBlockStatus, string> = {
  completed: 'Completed',
  failed: 'Failed',
  unavailable: 'No model configured',
  skipped: 'Partly skipped',
};

const MISSING_LABEL: Record<DishaMissingKey, string> = {
  origin: 'origin',
  destination: 'destination',
  min_capacity_tonnes: 'min capacity (tonnes)',
  max_price_per_tonne: 'max price (₹/tonne)',
};

const EXAMPLES = [
  'Trucks from Patna to Ranchi with 10 tonnes',
  'Loads to Delhi under ₹1500 per tonne',
  'Trips from Kolkata needing 20 t capacity',
];

function formatCheckedAt(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

function formatCell(value: string | number | undefined, fallback = '—'): string {
  if (value === undefined) return fallback;
  return String(value);
}

function RowTable({ rows }: { rows: DishaRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-orange-200 bg-orange-50/50 p-3 text-sm text-muted-foreground dark:border-orange-800/50 dark:bg-orange-950/30">
        No rows came back from the marketplace for these filters.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-orange-100 dark:border-orange-800/40">
      <table className="w-full min-w-[460px] text-left text-xs">
        <caption className="sr-only">Marketplace rows returned by the read-only search</caption>
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Route</th>
            <th scope="col" className="px-3 py-2 font-medium">Departs</th>
            <th scope="col" className="px-3 py-2 font-medium">Capacity</th>
            <th scope="col" className="px-3 py-2 font-medium">Price</th>
            <th scope="col" className="px-3 py-2 font-medium">Vehicle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-orange-100/70 dark:divide-orange-800/40">
          {rows.map((row, index) => (
            <tr key={`${row.origin}-${row.destination}-${row.departure_date}-${index}`}>
              <td className="px-3 py-2 font-medium">
                {row.origin} → {row.destination}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{row.departure_date}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatCell(row.capacity_tonnes)}{row.capacity_tonnes !== undefined ? ' t' : ''}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatCell(row.price_per_tonne)}{row.price_per_tonne !== undefined ? ' ₹/t' : ''}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{formatCell(row.vehicle_type)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DishaAskPanel({ open, onClose }: DishaAskPanelProps) {
  const reducedMotion = useReducedMotion();
  const { view, running, ask, reset } = useDishaCoordinator();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    reset();
    inputRef.current?.focus();
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'clip';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (running) return;
    void ask(text);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? {} : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disha-ask-title"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={reducedMotion ? {} : { y: 10, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={reducedMotion ? {} : { y: 6, scale: 0.97 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
            className="relative flex h-[min(85vh,620px)] w-[min(calc(100vw-2rem),560px)] flex-col overflow-hidden rounded-2xl border-2 border-orange-200 bg-white shadow-2xl dark:border-orange-800 dark:bg-gray-900"
          >
            <div className="flex items-center gap-3 border-b border-orange-200 px-4 pb-3 pt-4 dark:border-orange-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="disha-ask-title" className="truncate text-base font-semibold">
                  Ask Disha
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  Read-only marketplace search — nothing is booked
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
                aria-label="Close Ask Disha"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              <form onSubmit={handleSubmit} className="space-y-2">
                <label htmlFor="disha-ask-input" className="sr-only">
                  Your marketplace question
                </label>
                <textarea
                  id="disha-ask-input"
                  ref={inputRef}
                  rows={3}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="e.g. Trucks from Patna to Ranchi with 10 tonnes, under ₹1500 per tonne"
                  className="w-full resize-none rounded-xl border border-orange-200 bg-background px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:border-orange-800"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    Needs a route, capacity or price.
                  </p>
                  <button
                    type="submit"
                    disabled={running || !text.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {running ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Searching…
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Ask Disha
                      </>
                    )}
                  </button>
                </div>
              </form>

              {view.kind === 'idle' && (
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    I explain what the marketplace actually returns for a route, capacity or
                    price — I never rank, recommend or book anything.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setText(example)}
                        className="rounded-full border border-orange-100 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent dark:border-orange-800/40"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {view.kind === 'running' && (
                <p className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  Searching the marketplace with your own access…
                </p>
              )}

              {view.kind === 'unsupported' && (
                <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-800/60 dark:bg-amber-950/40">
                  <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    That is not a marketplace search
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    I only run requests that name a route, a capacity or a price. For anything
                    else — account help, payments, status questions — ask Freddy as usual.
                  </p>
                </div>
              )}

              {view.kind === 'error' && (
                <div className="space-y-1 rounded-xl border border-red-200 bg-red-50/70 p-3 dark:border-red-900/60 dark:bg-red-950/40">
                  <p className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Disha could not answer
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">{view.message}</p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80">
                    Nothing has been booked or changed.
                  </p>
                </div>
              )}

              {view.kind === 'ok' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-5 items-center rounded-full bg-orange-100 px-2 text-[11px] font-semibold uppercase tracking-wider text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                      Disha’s answer
                    </span>
                    <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {STATUS_LABEL[view.block.status]}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {view.block.explanationSource === 'model' ? 'model explanation' : 'deterministic'} ·{' '}
                      {view.block.provider}
                    </span>
                  </div>

                  <p className="whitespace-pre-line text-sm leading-relaxed">
                    {view.block.explanation ||
                      'No explanation was produced for this request.'}
                  </p>

                  {view.block.status === 'unavailable' && (
                    <p className="rounded-xl border border-dashed border-muted p-2.5 text-xs text-muted-foreground">
                      No language model is configured on this server, so the text above is a
                      deterministic summary of the real rows below — not a model opinion.
                    </p>
                  )}
                  {view.block.status === 'skipped' && (
                    <p className="rounded-xl border border-dashed border-muted p-2.5 text-xs text-muted-foreground">
                      Some steps were skipped (see the trace below), so the rows below are the
                      raw marketplace result.
                    </p>
                  )}
                  {view.block.status === 'failed' && (
                    <p className="rounded-xl border border-dashed border-red-200 p-2.5 text-xs text-red-700 dark:border-red-900/60 dark:text-red-400">
                      {view.serverError || 'The workflow did not complete.'} Nothing has been
                      booked.
                    </p>
                  )}

                  {view.block.missing.length > 0 && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-2.5 text-xs dark:border-amber-900/50 dark:bg-amber-950/30">
                      <span className="font-medium text-amber-800 dark:text-amber-300">
                        Still missing:{' '}
                      </span>
                      <span className="text-amber-700 dark:text-amber-400">
                        {view.block.missing.map((key) => MISSING_LABEL[key]).join(', ')}
                      </span>
                    </div>
                  )}

                  <RowTable rows={view.block.rows} />

                  <details className="rounded-xl border border-muted p-2.5">
                    <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <ListChecks className="h-3.5 w-3.5" />
                      Trace ({view.block.trace.length} events)
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                      {view.block.trace.length === 0 && (
                        <li className="text-xs text-muted-foreground">No trace events returned.</li>
                      )}
                      {view.block.trace.map((event, index) => (
                        <li key={`${event.step}-${event.status}-${index}`} className="text-xs">
                          <span className="font-medium">
                            {STEP_LABEL[event.step] ?? event.step}
                          </span>
                          <span className="text-muted-foreground">
                            {' · '}
                            {event.status}
                            {event.durationMs > 0 ? ` · ${event.durationMs}ms` : ''}
                          </span>
                          {event.summary && (
                            <p className="text-muted-foreground">{event.summary}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>

                  <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Info className="h-3 w-3 shrink-0" />
                    Checked {formatCheckedAt(view.block.checkedAt) ?? 'just now'}
                    {view.requestId ? ` · request ${view.requestId}` : ''}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-orange-200 px-4 py-3 text-xs dark:border-orange-800">
              <span className="text-muted-foreground">
                Read-only: no bookings, offers or payments.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="font-medium text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-400"
              >
                Back to Freddy
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
