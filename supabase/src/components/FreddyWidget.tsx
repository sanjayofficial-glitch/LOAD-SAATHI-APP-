import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Freddy } from './FreddyAvatar';
import { moodToFreddyAnimation } from './freddyAnimations';
import { useReducedMotion, type DishaMood } from './DishaMascot';
import FreddyChatModal from './FreddyChatModal';

/**
 * FreddyWidget — the single, unified trigger for the Freddy assistant.
 *
 * One component owns the assistant's entry point for every layout, with two
 * visual variants:
 *
 *   - `variant="avatar"` (default): circular Freddy avatar FAB (bottom-right),
 *     with a persisted dismiss/restore chip. Used on public/auth layouts.
 *   - `variant="pill"`: draggable "Ask Freddy" pill (151×56) whose position is
 *     persisted; the chat panel morphs out of the pill's actual location. Used
 *     in the authenticated app layout.
 *
 * The chat panel itself lives in FreddyChatModal; this component owns the
 * trigger, the open state, dismissal, and (for the pill) drag position.
 */

const PILL_STORAGE_KEY = 'freddy-trigger-pos';
const DISMISS_STORAGE_KEY = 'freddy-chat-dismissed';
const TRIGGER_WIDTH = 151;
const TRIGGER_HEIGHT = 56;
const DRAG_THRESHOLD = 6; // px of movement before a press becomes a drag
const EDGE_MARGIN = 8;

interface Pos {
  x: number;
  y: number;
}

function clampPos(pos: Pos): Pos {
  if (typeof window === 'undefined') return pos;
  const maxX = Math.max(EDGE_MARGIN, window.innerWidth - TRIGGER_WIDTH - EDGE_MARGIN);
  const maxY = Math.max(EDGE_MARGIN, window.innerHeight - TRIGGER_HEIGHT - EDGE_MARGIN);
  return {
    x: Math.min(Math.max(pos.x, EDGE_MARGIN), maxX),
    y: Math.min(Math.max(pos.y, EDGE_MARGIN), maxY),
  };
}

function readStoredPos(): Pos | null {
  try {
    const raw = localStorage.getItem(PILL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Pos;
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
      return clampPos(parsed);
    }
  } catch {
    // ignore storage/parse errors
  }
  return null;
}

interface DragState {
  pointerId: number | null;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  dragging: boolean;
  suppressClick: boolean;
}

const INITIAL_DRAG: DragState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  dragging: false,
  suppressClick: false,
};

export interface FreddyWidgetProps {
  /** Visual variant of the trigger. Defaults to `avatar`. */
  variant?: 'avatar' | 'pill';
}

export default function FreddyWidget({ variant = 'avatar' }: FreddyWidgetProps) {
  const isPill = variant === 'pill';
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mood, setMood] = useState<DishaMood>('idle');
  const reducedMotion = useReducedMotion();

  // Pill-only drag state.
  const [pos, setPos] = useState<Pos | null>(null);
  const dragRef = useRef<DragState>(INITIAL_DRAG);

  // Restore dismissed state on mount (avatar variant only).
  useEffect(() => {
    if (isPill) return;
    try {
      if (localStorage.getItem(DISMISS_STORAGE_KEY) === 'true') {
        setDismissed(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [isPill]);

  // Restore the saved pill position (if any) on mount.
  useEffect(() => {
    if (!isPill) return;
    setPos(readStoredPos());
  }, [isPill]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setMood('waking');
        setTimeout(() => setMood('idle'), 500);
      } else {
        setMood('idle');
      }
      return next;
    });
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setIsOpen(false);
    setMood('idle');
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, 'true');
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleRestore = useCallback(() => {
    setDismissed(false);
    try {
      localStorage.removeItem(DISMISS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // ── Pill drag handlers (pill variant only) ──
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: pos ? pos.x : rect.left,
        originY: pos ? pos.y : rect.top,
        dragging: false,
        suppressClick: false,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore capture failures (e.g. synthetic events)
      }
    },
    [pos]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.dragging = true;
      drag.suppressClick = true;
    }

    setPos(clampPos({ x: drag.originX + dx, y: drag.originY + dy }));
  }, []);

  const finishPointer = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== e.pointerId) return;
    dragRef.current.pointerId = null;

    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    if (drag.dragging) {
      const final = clampPos({
        x: drag.originX + (e.clientX - drag.startX),
        y: drag.originY + (e.clientY - drag.startY),
      });
      setPos(final);
      try {
        localStorage.setItem(PILL_STORAGE_KEY, JSON.stringify(final));
      } catch {
        // ignore storage errors
      }
    }

    requestAnimationFrame(() => {
      dragRef.current.dragging = false;
      dragRef.current.suppressClick = false;
    });
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => finishPointer(e),
    [finishPointer]
  );

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== e.pointerId) return;
    dragRef.current.pointerId = null;
    dragRef.current.suppressClick = true;
    requestAnimationFrame(() => {
      dragRef.current.dragging = false;
      dragRef.current.suppressClick = false;
    });
  }, []);

  const handleClick = useCallback(() => {
    if (dragRef.current.suppressClick) {
      dragRef.current.suppressClick = false;
      return;
    }
    setIsOpen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  }, []);

  // ── Pill variant ──
  if (isPill) {
    return (
      <>
        {!isOpen && (
          <button
            type="button"
            aria-label="Ask Freddy"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className="fixed z-[100] flex items-center justify-start w-[151px] h-[56px] rounded-full p-[11px] shadow-lg cursor-grab active:cursor-grabbing select-none bg-stone-800 text-white border border-stone-700 hover:border-orange-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            style={{
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              ...(pos
                ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
                : { right: 16, bottom: 96 }),
            }}
          >
            <span className="grid w-8 h-8 rounded-full bg-orange-600 place-items-center flex-shrink-0 overflow-hidden pointer-events-none">
              <Freddy animation="idle" size={26} />
            </span>
            <span className="ml-3 font-medium text-sm truncate min-w-0 max-w-[77px] pointer-events-none">Ask Freddy</span>
          </button>
        )}

        <FreddyChatModal
          open={isOpen}
          onOpenChange={setIsOpen}
          dismissed={false}
          onDismiss={() => {}}
          anchor={pos}
        />
      </>
    );
  }

  // ── Avatar variant (default) ──
  if (dismissed) {
    return (
      <button
        type="button"
        onClick={handleRestore}
        className="fixed bottom-24 right-4 z-[100] inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/95 px-4 py-2 text-xs font-semibold text-orange-700 shadow-lg backdrop-blur transition-colors hover:bg-orange-50 dark:border-orange-900/40 dark:bg-gray-900/95 dark:text-orange-300 dark:hover:bg-gray-800"
        aria-label="Show Freddy the LoadSaathi assistant"
      >
        <span aria-hidden>🐻</span> Show Freddy
      </button>
    );
  }

  return (
    <>
      {/* Floating trigger — the Freddy avatar itself (high-contrast white) */}
      <motion.button
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close Freddy chat' : 'Open Freddy chat'}
        className="fixed z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-white border border-gray-200 shadow-lg shadow-black/10 hover:shadow-xl transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        style={{ right: 16, bottom: 96 }}
        initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
        animate={reducedMotion ? {} : { scale: isOpen ? 0.9 : 1, opacity: isOpen ? 0.9 : 1 }}
        whileHover={reducedMotion ? {} : { scale: 1.05 }}
        whileTap={reducedMotion ? {} : { scale: 0.95 }}
      >
        <span className="pointer-events-none flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
          <Freddy animation={moodToFreddyAnimation[mood]} size={44} />
        </span>
        {!isOpen && (
          <motion.span
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            !
          </motion.span>
        )}
      </motion.button>

      <FreddyChatModal
        open={isOpen}
        onOpenChange={setIsOpen}
        dismissed={dismissed}
        onDismiss={handleDismiss}
      />
    </>
  );
}
