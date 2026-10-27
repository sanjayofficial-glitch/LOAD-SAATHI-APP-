import { interpolate } from 'remotion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaymentProtectionStatusProps {
  localFrame: number;
  stage: 'pending' | 'confirmed';
}

export const PaymentProtectionStatus: React.FC<PaymentProtectionStatusProps> = ({ localFrame, stage }) => {
  const opacity = interpolate(localFrame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const confirmed = stage === 'confirmed';

  return (
    <Card className="shadow-sm border-gray-200 dark:border-gray-700" style={{ opacity }}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${confirmed ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
            {confirmed ? '🔒' : '⏳'}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {confirmed ? 'Delivery confirmed · payment release initiated (demo flow)' : 'Milestone status · Delivery confirmation pending'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Payment protection — escrow-backed · synthetic demo state
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pb-3">
        <Badge variant={confirmed ? 'default' : 'secondary'} className="text-xs">
          {confirmed ? 'Confirmed (demo flow)' : 'Pending'}
        </Badge>
      </div>
    </Card>
  );
};
