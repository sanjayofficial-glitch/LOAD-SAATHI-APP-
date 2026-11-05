import { useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/EmptyState';
import { IndianRupee, Package, ArrowRight, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { SPRING } from '@/lib/motion';
import { TRANSITIONS } from '@/components/motion';
import { haptic } from '@/lib/haptics';
import type { Shipment } from '@/types';

interface LoadCardStackProps {
  shipments: Shipment[];
  onAccept: (shipment: Shipment) => void;
  onViewDetails?: (shipment: Shipment) => void;
}

/* Swipe physics — the same thresholds Apple's gesture recognizers use:
   a small movement/velocity threshold before committing, then the card
   throws with momentum (velocity handoff) and can be grabbed mid-flight. */
const SWIPE_DISTANCE = 80; // px — commit point
const SWIPE_VELOCITY = 600; // px/s — flick commit
const VELOCITY_HYSTERESIS = 60; // px/s — use offset sign below this

const LoadCardStack = ({ shipments, onAccept, onViewDetails }: LoadCardStackProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [acceptBeat, setAcceptBeat] = useState(false);

  const current = shipments[currentIndex];

  const handleAccept = () => {
    if (acceptBeat || !current) return; // guard double-tap
    setAcceptBeat(true);
    haptic('success'); // same frame as the green commit visual
    window.setTimeout(() => onAccept(current), 500);
  };

  const goNext = () => {
    setCurrentIndex((i) => (i + 1) % shipments.length);
  };

  const goPrev = () => {
    setCurrentIndex((i) => (i - 1 + shipments.length) % shipments.length);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (acceptBeat) return;
    const { offset, velocity } = info;
    // Blend velocity and distance: a flick commits even below the distance
    // threshold; a slow pull commits past it. Hysteresis on low velocities
    // avoids jitter when the gesture barely moved.
    const direction =
      Math.abs(velocity.x) > VELOCITY_HYSTERESIS ? velocity.x : offset.x;
    if (Math.abs(offset.x) > SWIPE_DISTANCE || Math.abs(velocity.x) > SWIPE_VELOCITY) {
      if (direction > 0) goNext();
      else goPrev();
    }
    // Non-committed drags spring back to x:0 (animate target) — interruptible,
    // with the finger's velocity handed off by the spring automatically.
  };

  if (shipments.length === 0 || !current) {
    return (
      <EmptyState
        icon={<Package className="h-8 w-8 sm:h-10 sm:w-10" />}
        title="No loads available right now"
        description="Post a trip and shippers will send you loads."
        primaryAction={{ label: 'Post a Trip', to: '/trucker/post-trip' }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-lg">
        <motion.div
          key={currentIndex}
          drag={acceptBeat ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.985 }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ ...SPRING.default, opacity: TRANSITIONS.base, scale: TRANSITIONS.base }}
          className="cursor-grab active:cursor-grabbing touch-pan-y"
        >
          <Card
            className={`relative border-orange-100 dark:border-orange-800 shadow-xl overflow-hidden ${
              acceptBeat ? 'ring-2 ring-green-500 border-transparent' : ''
            }`}
          >
            <CardContent className="p-6 sm:p-8">
              {acceptBeat && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 z-10 grid place-items-center rounded-[inherit] bg-green-600/10 animate-materialize pointer-events-none"
                >
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-green-600 text-white shadow-xl animate-badge-pop">
                    <Check className="h-8 w-8" />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-xs font-bold">
                  {currentIndex + 1} / {shipments.length}
                </Badge>
                {current.estimated_distance_km && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {current.estimated_distance_km.toLocaleString()} km
                  </span>
                )}
              </div>

              <div className="flex items-center text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-6">
                <span className="truncate">{current.origin_city}</span>
                <ArrowRight className="h-5 w-5 mx-3 text-gray-400 shrink-0" />
                <span className="truncate">{current.destination_city}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Package className="h-4 w-4 text-purple-500 shrink-0" />
                  <span className="font-semibold">{current.weight_tonnes}T</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-green-700 dark:text-green-400">
                  <IndianRupee className="h-4 w-4 shrink-0" />
                  <span>{current.budget_per_tonne.toLocaleString()} /T</span>
                </div>
              </div>

              {current.goods_description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                  {current.goods_description}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={goPrev}
                  disabled={acceptBeat}
                  className="flex-1 h-12"
                  aria-label="Previous load"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" /> Previous
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={acceptBeat}
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  <Check className="h-5 w-5 mr-2" /> Accept
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={goNext}
                  disabled={acceptBeat}
                  className="flex-1 h-12"
                  aria-label="Next load"
                >
                  Next <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </div>

              {onViewDetails && (
                <Button
                  variant="ghost"
                  className="w-full mt-3 text-sm"
                  onClick={() => onViewDetails(current)}
                >
                  View Details
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadCardStack;
