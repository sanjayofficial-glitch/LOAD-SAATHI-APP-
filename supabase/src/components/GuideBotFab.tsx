import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/utils/analytics';

const STORAGE_KEY = 'loadsaathi-guide-bot-dismissed';

/**
 * GuideBotFab — a floating help bot anchored to the bottom-left of the screen
 * (below the DockNav z-[100] layer, above the WhatsApp FAB z-50).
 *
 * Layout:
 *  - DockNav:          bottom-3 z-[100]
 *  - GuideBotFab:      bottom-20 right-4 z-[60]  (when open, animates upward)
 *  - FloatingWhatsApp: bottom-6 right-6 z-50
 *  - MobileTabBar:     fixed bottom z-40
 *
 * Coexists with VoiceGuide (driver.js, one-time via localStorage) — both can
 * be present; VoiceGuide runs its tour, GuideBotFab stays visible.
 */
export default function GuideBotFab() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { getAuthenticatedClient } = useSupabase();
  const [open, setOpen] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);

  // Location awareness: read last known GPS position from localStorage and
  // from the live driver-location store if the user is a trucker.
  useEffect(() => {
    if (userProfile?.user_type !== 'trucker') return;

    // Try to grab a fresh position from the active-driver store via a
    // best-effort Supabase position channel (no extra subscription if
    // unavailable).
    let cancelled = false;

    const maybeUpdate = async () => {
      try {
        const supabase = await getAuthenticatedClient();
        const { data } = await supabase
          .from('driver_positions')
          .select('latitude, longitude, last_city')
          .eq('driver_id', userProfile.id)
          .single();

        if (!cancelled && data) {
          setLat(data.latitude);
          setLng(data.longitude);
          setCity(data.last_city || null);
        }
      } catch {
        // No position yet — that's fine.
      }
    };

    maybeUpdate();
    const interval = setInterval(maybeUpdate, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userProfile?.user_type, userProfile?.id, getAuthenticatedClient]);

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggleOpen = useCallback(() => {
    trackEvent('guide_bot_opened', { previouslyOpen: open });
    setOpen(prev => !prev);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  if (dismissed) return null;

  const pulse = {
    hidden: { scale: 1, opacity: 1 },
    hover: { scale: 1.15, opacity: 1 },
    tap: { scale: 0.95 },
  };

  return (
    <div className="fixed bottom-20 right-4 z-[60]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-80 rounded-2xl border border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-900 shadow-2xl shadow-orange-500/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs font-bold">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div className="leading-none">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Guide Bot</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {city ? `You're near ${city}` : 'Location-aware helper'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {lat != null && (
                  <Badge variant="outline" className="text-[9px] border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 gap-1">
                    <MapPin className="h-3 w-3" />
                    {lat.toFixed(4)}, {lng?.toFixed(4)}
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close guide"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                New here? Get a quick walkthrough of the dashboard.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                  onClick={() => {
                    handleClose();
                    navigate('/guide');
                  }}
                >
                  Take the tour
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
                  onClick={() => {
                    handleClose();
                    navigate('/how-it-works');
                  }}
                >
                  How it works
                </Button>
              </div>
              <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3 w-3 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  onChange={e => {
                    if (e.target.checked) {
                      try {
                        localStorage.setItem(STORAGE_KEY, '1');
                      } catch {}
                      setDismissed(true);
                    }
                  }}
                />
                Don't show again
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button — animated pulse */}
      <motion.button
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl',
          dismissed && 'hidden'
        )}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={pulse.hover}
        whileTap={pulse.tap}
        onClick={toggleOpen}
        aria-label={open ? 'Close guide bot' : 'Open guide bot'}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <HelpCircle className="h-5 w-5" />
        )}
      </motion.button>
    </div>
  );
}


