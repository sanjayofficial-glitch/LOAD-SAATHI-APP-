import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowRingProps {
  targetRect: DOMRect | null;
  isVisible: boolean;
  accent?: 'orange' | 'blue';
  className?: string;
}

export function GlowRing({
  targetRect,
  isVisible,
  accent = 'orange',
  className,
}: GlowRingProps) {
  if (!isVisible || !targetRect) return null;

  const ringColor = accent === 'blue' ? 'border-blue-500' : 'border-orange-500';

  return (
    <AnimatePresence>
      {isVisible && targetRect && (
        <motion.div
          aria-hidden="true"
          className={cn('fixed pointer-events-none z-[9998]', className)}
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className={cn(
              'w-full h-full rounded-lg border-2 animate-pulse-ring',
              ringColor,
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
