import { useCallback, useEffect, useRef, useState } from 'react';
import { Freddy } from './FreddyAvatar';
import FreddyChatModal from './FreddyChatModal';

/**
 * FreddyTrigger — floating, draggable pill trigger for the Freddy assistant.
 *
 * Layout reference: 151×56 px pill, rounded-full, avatar container + truncated
 * "Ask Freddy" label. A tap/click opens the assistant modal; a drag repositions
 * the pill anywhere on screen (pointer events, touch-action: none, user-select:
 * none). The drag position is persisted in localStorage and clamped to the
 * viewport. Dismissal is shared with the chat modal via the same localStorage
 * key as FreddyAssistant.
 */

const STORAGE_KEY = 'freddy-trigger-pos';
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
    const raw = localStorage.getItem(STORAGE_KEY);
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

export default function FreddyTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const dragRef = useRef<DragState>(INITIAL_DRAG);

  // Restore the saved drag position (if any) on mount.
  useEffect(() => {
    setPos(readStoredPos());
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        // If the pill was already dragged somewhere, keep that anchor; else use
        // its current rendered position (default bottom-right corner).
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
      // Movement exceeded the threshold → this is a drag, not a click.
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
      } catch {
        // ignore storage errors
      }
      // Swallow the click that follows a drag (handled via suppressClick).
    }
    // Simple taps are handled by the native click event (handleClick), so the
    // modal toggles exactly once per interaction.

    // Clear drag flags after this frame so the trailing click event can consult
    // suppressClick reliably.
    requestAnimationFrame(() => {
      dragRef.current.dragging = false;
      dragRef.current.suppressClick = false;
    });
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => finishPointer(e),
    [finishPointer]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (drag.pointerId !== e.pointerId) return;
      dragRef.current.pointerId = null;
      dragRef.current.suppressClick = true;
      requestAnimationFrame(() => {
        dragRef.current.dragging = false;
        dragRef.current.suppressClick = false;
      });
    },
    []
  );

  const handleClick = useCallback(() => {
    // After a drag the browser fires a trailing click; ignore it.
    if (dragRef.current.suppressClick) {
      dragRef.current.suppressClick = false;
      return;
    }
    // Keyboard activation (Enter/Space) lands here as a real click.
    setIsOpen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  }, []);

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
