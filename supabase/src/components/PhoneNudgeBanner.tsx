import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Phone, X } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';
import { formatIndianPhone } from '@/utils/phone';

/**
 * Phone nudge banner — shown to logged-in users who haven't added a phone yet.
 * Non-blocking: sits near the top of the page; clicking "Add phone" jumps to
 * /profile, clicking X dismisses for the session.
 *
 * Mounting is wired in Layout.tsx so it appears on every authenticated route.
 */
export default function PhoneNudgeBanner() {
  const { userProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Must run before any early return: localStorage is read once on mount to
  // keep the banner dismissed for the rest of the session.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('loadsaathi-phone-nudge-dismissed');
      if (stored === '1') setDismissed(true);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't show to admins or users who already have a phone.
  const hasPhone = userProfile?.phone && formatIndianPhone(userProfile.phone);
  if (!userProfile || userProfile.user_type === 'admin' || hasPhone || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem('loadsaathi-phone-nudge-dismissed', '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
    trackEvent('phone_nudge_clicked', { action: 'dismiss' });
  };

  const handleAddPhone = () => {
    trackEvent('phone_nudge_clicked', { action: 'add_phone' });
    window.location.href = '/profile';
  };

  return (
    <div className="mx-auto max-w-2xl mt-3 px-4">
      <div className="flex items-start gap-3 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 p-4 text-sm shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ease-ios">
        <Phone className="h-5 w-5 shrink-0 text-orange-500 dark:text-orange-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-orange-800 dark:text-orange-200 font-semibold">
            Add your phone number
          </p>
          <p className="text-orange-700 dark:text-orange-300/80 mt-0.5">
            Shippers and truckers use it to reach you about a load. Tap below to add it in one tap.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={handleAddPhone} className="border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40">
            Add
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            className="press text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
