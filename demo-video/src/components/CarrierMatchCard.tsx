import { interpolate } from 'remotion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, IndianRupee, MapPin, Package, Star } from 'lucide-react';

interface CarrierMatchCardProps {
  localFrame: number;
  carrier: {
    name: string;
    matchFitPercent: number;
    creditScore: number;
    rating: number;
    availableDate: string;
    indicativeQuoteINR: number;
    factors: Array<{ label: string; score: number }>;
    featured: boolean;
  };
  index: number;
  featured: boolean;
}

export const CarrierMatchCard: React.FC<CarrierMatchCardProps> = ({
  localFrame,
  carrier,
  index,
  featured,
}) => {
  const staggerDelay = index * 28;
  const cardOpacity = interpolate(localFrame, [staggerDelay, staggerDelay + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cardY = interpolate(localFrame, [staggerDelay, staggerDelay + 16], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Card
      className={`border-orange-100 dark:border-orange-800 hover:shadow-md transition-all duration-300 ${
        featured ? 'border-orange-200 shadow-sm' : ''
      }`}
      style={{
        opacity: cardOpacity,
        transform: `translateY(${cardY}px)`,
        marginBottom: 12,
      }}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center text-lg sm:text-xl font-black text-gray-900 dark:text-white">
            <MapPin className="h-5 w-5 text-orange-500 mr-1.5 shrink-0" />
            {carrier.name}
          </div>
          <Badge className={`${featured ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'} text-[10px] font-bold`}>
            {carrier.matchFitPercent}% match
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-2 text-orange-500 shrink-0" />
            <span className="truncate">{carrier.availableDate}</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Package className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
            <span>14T</span>
          </div>
          <div className="flex items-center font-bold text-gray-900 dark:text-white">
            <IndianRupee className="h-4 w-4 mr-1 text-green-500 shrink-0" />
            ₹{carrier.indicativeQuoteINR.toLocaleString()} /T
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
            <span>280 km</span>
          </div>
        </div>
        <div className="flex items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="bg-orange-100 dark:bg-orange-900/30 w-7 h-7 rounded-full flex items-center justify-center mr-2">
            <Package className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {carrier.name}
          </span>
          <Star className="h-4 w-4 text-yellow-400 ml-2 shrink-0" />
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
            {carrier.rating.toFixed(1)}
          </span>
        </div>
        <div className="md:w-44 flex flex-row md:flex-col gap-2 items-center mt-4">
          <Button
            variant="outline"
            className="flex-1 md:w-full text-sm font-semibold"
            style={{ padding: '8px 12px' }}
          >
            View Details
          </Button>
          <Button
            className="flex-1 md:w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-sm text-sm font-semibold"
            style={{ padding: '8px 12px' }}
          >
            Send Offer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
