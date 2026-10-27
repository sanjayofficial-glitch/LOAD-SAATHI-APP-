import { interpolate } from 'remotion';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

interface RoleHeaderProps {
  role: 'shipper' | 'trucker';
  accountName: string;
  localFrame: number;
  showDemoLabel?: boolean;
}

export const RoleHeader: React.FC<RoleHeaderProps> = ({
  role,
  accountName,
  localFrame,
  showDemoLabel = true,
}) => {
  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(localFrame, [0, 12], [8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const accent = role === 'shipper' ? 'blue' : 'orange';
  const icon = role === 'shipper' ? <Package /> : <span className="h-4 w-4">🚛</span>;

  return (
    <div
      className="mb-6 sm:mb-8"
      style={{ opacity, transform: `translateY(${y}px)` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`bg-gradient-to-br from-${accent}-500 to-${accent}-600 p-1.5 rounded-lg shadow-sm`}>
          {icon}
        </div>
        <h1 className={`text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight`}>
          {role === 'shipper' ? 'Shipper Dashboard' : 'Trucker Dashboard'}
        </h1>
      </div>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
        Welcome back, {accountName}! Manage your loads and find the best trucks.
      </p>
      {showDemoLabel && (
        <Badge variant="outline" className="mt-2 text-xs">
          Demo account — illustrative UI
        </Badge>
      )}
    </div>
  );
};
