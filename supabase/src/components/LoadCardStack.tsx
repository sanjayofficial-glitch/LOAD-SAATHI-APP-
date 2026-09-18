import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Package, ArrowRight, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Shipment } from '@/types';

interface LoadCardStackProps {
  shipments: Shipment[];
  onAccept: (shipment: Shipment) => void;
  onViewDetails?: (shipment: Shipment) => void;
}

const LoadCardStack = ({ shipments, onAccept, onViewDetails }: LoadCardStackProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = shipments[currentIndex];

  const goNext = () => {
    setCurrentIndex((i) => (i + 1) % shipments.length);
  };

  const goPrev = () => {
    setCurrentIndex((i) => (i - 1 + shipments.length) % shipments.length);
  };

  if (shipments.length === 0 || !current) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">No loads available right now</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Post a trip and shippers will send you loads.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-lg">
        <Card className="border-orange-100 dark:border-orange-800 shadow-xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
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
                className="flex-1 h-12"
                aria-label="Previous load"
              >
                <ChevronLeft className="h-5 w-5 mr-1" /> Previous
              </Button>
              <Button
                onClick={() => onAccept(current)}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                <Check className="h-5 w-5 mr-2" /> Accept
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={goNext}
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
      </div>
    </div>
  );
};

export default LoadCardStack;
