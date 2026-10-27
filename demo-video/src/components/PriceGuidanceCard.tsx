import { interpolate } from 'remotion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PriceGuidanceCardProps {
  localFrame: number;
  minINR: number;
  maxINR: number;
}

export const PriceGuidanceCard: React.FC<PriceGuidanceCardProps> = ({ localFrame, minINR, maxINR }) => {
  const opacity = interpolate(localFrame, [120, 134], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(localFrame, [120, 134], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Card
      className="shadow-sm border-gray-200 dark:border-gray-700"
      style={{
        position: 'absolute',
        top: 160,
        right: 96,
        width: 300,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">AI Price Guidance</div>
          <Badge variant="outline" className="text-[10px]">Illustrative estimate</Badge>
        </div>
        <div className="text-3xl font-black text-gray-900 dark:text-white">
          ₹{minINR.toLocaleString()} – ₹{maxINR.toLocaleString()}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Indicative range · based on route, cargo weight, and demand
        </p>
        <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full" style={{ width: '70%' }} />
        </div>
      </div>
    </Card>
  );
};
