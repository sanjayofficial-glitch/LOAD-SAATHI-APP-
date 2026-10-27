import { interpolate } from 'remotion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, IndianRupee, MapPin, Package, Clock } from 'lucide-react';
import { demoShipment } from '../data/demoData';

interface TruckerLoadRequestProps {
  localFrame: number;
}

export const TruckerLoadRequest: React.FC<TruckerLoadRequestProps> = ({ localFrame }) => {
  const headerOpacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const detailsOpacity = interpolate(localFrame, [24, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const capacityOpacity = interpolate(localFrame, [48, 72], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const payoutOpacity = interpolate(localFrame, [72, 96], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const actionsOpacity = interpolate(localFrame, [96, 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const availablePct = (demoShipment.truckAvailableTons / demoShipment.truckCapacityTons) * 100;

  return (
    <div
      className="grid sm:grid-cols-2 gap-6"
      style={{
        position: 'absolute',
        top: 160,
        left: 96,
        right: 96,
      }}
    >
      <Card
        className="shadow-sm border-gray-200 dark:border-gray-700"
        style={{ opacity: headerOpacity }}
      >
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
            Load Request
          </CardTitle>
          <Badge variant="outline" className="text-xs">New request</Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row justify-between gap-6" style={{ opacity: detailsOpacity }}>
            <div className="flex-1">
              <div className="flex items-center text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                <MapPin className="h-5 w-5 text-orange-500 mr-1.5 shrink-0" />
                {demoShipment.origin}
                <ArrowRight className="h-4 w-4 mx-2 text-gray-300 dark:text-gray-600" />
                {demoShipment.destination}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-4">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-2 text-orange-500 shrink-0" />
                  <span>{demoShipment.pickupDate}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Package className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
                  <span>{demoShipment.weightKg / 1000}T</span>
                </div>
                <div className="flex items-center font-bold text-gray-900 dark:text-white">
                  <IndianRupee className="h-4 w-4 mr-1 text-green-500 shrink-0" />
                  ₹{demoShipment.illustrativeCarrierQuoteINR.toLocaleString()}
                </div>
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                  <span>PTL</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-16" style={{ opacity: capacityOpacity }}>
        <Card className="flex-1 shadow-sm border-gray-200 dark:border-gray-700" style={{ padding: 24 }}>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Truck Capacity</div>
          <div className="text-xl font-black text-gray-900 dark:text-white">
            {demoShipment.truckCapacityTons}T vehicle · {demoShipment.truckAvailableTons}T available
          </div>
          <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${availablePct}%` }} />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available space — synthetic demo data</div>
        </Card>
        <Card className="w-64 shadow-sm border-gray-200 dark:border-gray-700" style={{ padding: 24 }}>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Indicative Payout</div>
          <div style={{ opacity: payoutOpacity }} className="text-2xl font-black text-gray-900 dark:text-white">
            ₹{demoShipment.illustrativeCarrierQuoteINR.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Demo amount · final terms confirmed by both parties</div>
        </Card>
      </div>

      <div className="col-span-full flex gap-3" style={{ opacity: actionsOpacity }}>
        <Button className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 h-12 font-bold shadow-md hover:shadow-lg">
          Accept Request
        </Button>
        <Button variant="outline" className="flex-1 h-12 font-bold">
          Propose Rate
        </Button>
        <Button size="icon" className="w-12 h-12" style={{ padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 18 }}>💬</span>
        </Button>
      </div>
    </div>
  );
};
