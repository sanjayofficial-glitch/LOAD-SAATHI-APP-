
import React from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner = React.memo(function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-950 px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 sticky top-0 z-[60] shadow-sm animate-in fade-in slide-in-from-top-1 duration-300 ease-ios">
        <WifiOff className="h-4 w-4" />
        You are offline. Some features may not work.
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 sticky top-0 z-[60] shadow-sm animate-in fade-in slide-in-from-top-1 duration-300 ease-ios">
        <Wifi className="h-4 w-4" />
        Back online!
      </div>
    );
  }

  return null;
});

export default OfflineBanner;
