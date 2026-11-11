import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Freddy } from './FreddyAvatar';
import { moodToFreddyAnimation } from './freddyAnimations';
import { useReducedMotion, type DishaMood } from './DishaMascot';
import FreddyChatModal from './FreddyChatModal';

/**
 * Unified Freddy assistant trigger.
 *
 * One floating trigger (bottom-right, circular) that shows the Freddy avatar
 * and opens a single panel combining chat, page tips and help. The panel
 * itself lives in FreddyChatModal; this component owns the trigger, the
 * dismissed/restore chip, and the open state.
 *
 * Replaces the separate Disha mascot (bottom-left), FreddyChat FAB and the
 * Get-Help FAB. Dismissal is persisted in localStorage; a small restore chip
 * is offered so dismissal is never a permanent soft-lock.
 */

export default function FreddyAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mood, setMood] = useState<DishaMood>('idle');
  const reducedMotion = useReducedMotion();

  // Restore dismissed state on mount
  useEffect(() => {
    try {
      if (localStorage.getItem('freddy-chat-dismissed') === 'true') {
        setDismissed(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

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
      localStorage.setItem('freddy-chat-dismissed', 'true');
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleRestore = useCallback(() => {
    setDismissed(false);
    try {
      localStorage.removeItem('freddy-chat-dismissed');
    } catch {
      // ignore
    }
  }, []);

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
