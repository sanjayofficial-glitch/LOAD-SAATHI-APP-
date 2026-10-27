import { interpolate } from 'remotion';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { demoShipment } from '../data/demoData';

interface AcceptBookingSheetProps {
  localFrame: number;
  open: boolean;
}

export const AcceptBookingSheet: React.FC<AcceptBookingSheetProps> = ({ localFrame, open }) => {
  if (!open) return null;

  const sheetLocal = localFrame - 40;
  const opacity = interpolate(sheetLocal, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(sheetLocal, [0, 16], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <span />
      </DialogTrigger>
      <DialogContent
        className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 shadow-2xl"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderRadius: '24px 24px 0 0',
          padding: 24,
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />
        <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-2">
          Accept this shipment?
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {demoShipment.origin} → {demoShipment.destination} · {demoShipment.pickupDate} · {demoShipment.weightKg.toLocaleString()} kg
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 font-bold">
            Confirm Acceptance
          </Button>
          <Button variant="outline" className="flex-1 font-bold">
            Decline
          </Button>
        </div>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Status will update to Booking confirmed
        </div>
      </DialogContent>
    </Dialog>
  );
};
