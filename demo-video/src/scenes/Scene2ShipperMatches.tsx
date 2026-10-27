import { interpolate } from 'remotion';
import { demoShipment, demoCarriers } from '../data/demoData';
import { RoleHeader } from '../components/RoleHeader';
import { SideNav } from '../components/SideNav';
import { CarrierMatchCard } from '../components/CarrierMatchCard';
import { Cursor } from '../components/Cursor';
import { AppShell } from '../components/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SCENE_START = 420;
const SCENE_END = 869;

interface Scene2ShipperMatchesProps {
  frame: number;
}

export const Scene2ShipperMatches: React.FC<Scene2ShipperMatchesProps> = ({ frame }) => {
  const local = frame - SCENE_START;

  const cursorX = interpolate(local, [0, 100, 180, 260, 300], [600, 600, 600, 620, 620]);
  const cursorY = interpolate(local, [0, 100, 180, 260, 300], [340, 340, 340, 360, 376]);

  const requestSent = local >= 280;
  const showTruckerTransition = local >= 340;

  return (
    <div className="relative w-full h-full bg-white">
      <AppShell localFrame={local}>
        <RoleHeader role="shipper" accountName={demoShipment.shipper} localFrame={local} showDemoLabel />
        <div className="flex">
          <SideNav localFrame={local} activeItem="find" />
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Matching Truckers</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {demoShipment.origin} → {demoShipment.destination} · {demoShipment.weightKg.toLocaleString()} kg · PTL
                </p>
              </div>
              <Badge className="text-[10px] text-gray-500">Demo profiles and quotes</Badge>
            </div>
            {demoCarriers.map((carrier, i) => (
              <CarrierMatchCard
                key={carrier.id}
                localFrame={local}
                carrier={carrier}
                index={i}
                featured={carrier.featured}
              />
            ))}
            <div className="mt-6" style={{ opacity: interpolate(local, [260, 274], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
              <Button
                variant={requestSent ? 'outline' : 'default'}
                className={requestSent ? 'bg-gray-100 text-gray-900' : 'bg-orange-600 text-white'}
                style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600 }}
              >
                {requestSent ? 'Request sent' : 'Request booking'}
              </Button>
              {requestSent && (
                <div style={{ marginLeft: 10, fontSize: 11, color: '#0B5C3B', fontWeight: 600 }}>
                  Awaiting trucker response
                </div>
              )}
            </div>
            <Cursor x={cursorX} y={cursorY} opacity={local > 0 ? 1 : 0} />
          </div>
        </div>
      </AppShell>
      {showTruckerTransition && (
        <div
          className="absolute inset-0 bg-white z-20"
          style={{
            opacity: interpolate(local, [340, 400], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        />
      )}
      <div
        className="absolute bottom-6 left-24 right-24 text-sm font-medium text-gray-900 dark:text-white"
        style={{
          opacity: interpolate(local, [380, 449], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        Shipment {demoShipment.id} — request sent to {demoCarriers[0].name}
      </div>
    </div>
  );
};

export { SCENE_START, SCENE_END };
