import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, X, Settings } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

const BANNER_DISMISSED_KEY = 'loadsaathi-location-banner-dismissed';

export const LocationPermissionBanner = React.memo(function LocationPermissionBanner() {
  const { locationPermission, requestLocationPermission } = useLocation();
  const { userProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const val = sessionStorage.getItem(BANNER_DISMISSED_KEY);
      if (val === 'true') setDismissed(true);
    } catch {
      // sessionStorage may be unavailable
    }
  }, []);

  useEffect(() => {
    if (locationPermission === 'granted') {
      try {
        sessionStorage.removeItem(BANNER_DISMISSED_KEY);
      } catch {
        // ignore
      }
      setDismissed(false);
    }
  }, [locationPermission]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const handleEnable = useCallback(async () => {
    await requestLocationPermission();
  }, [requestLocationPermission]);

  if (userProfile?.user_type === 'admin') return null;
  if (locationPermission === 'granted') return null;
  if (locationPermission === 'unavailable') return null;
  if (dismissed) return null;

  const isPrompt = locationPermission === 'prompt';
  const isDenied = locationPermission === 'denied';

  return (
    <TooltipProvider>
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-[55] shadow-sm">
        <MapPin className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-center">
          {isPrompt && (
            <>Enable location to share your position on the live map.</>
          )}
          {isDenied && (
            <>Location access is off. Enable it in your browser settings to use live tracking.</>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {isPrompt && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEnable}
              className="h-6 px-2 text-xs font-semibold bg-white text-orange-600 hover:bg-gray-100"
            >
              Enable
            </Button>
          )}
          {isDenied && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-6 px-2 text-xs font-semibold bg-white text-orange-600 hover:bg-gray-100"
                >
                  <Settings className="h-3 w-3" />
                  How to enable
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] p-3 text-xs">
                <p>On mobile: Open Settings → Apps → LoadSaathi → Permissions → Location → Allow.</p>
                <p>On desktop: Click the lock icon in your browser's address bar → Privacy → Location → Allow.</p>
              </TooltipContent>
            </Tooltip>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
});

export default LocationPermissionBanner;
