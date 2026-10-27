import { interpolate } from 'remotion';
import { demoShipment } from '../data/demoData';
import { RoleHeader } from '../components/RoleHeader';
import { SideNav } from '../components/SideNav';
import { ShipmentForm } from '../components/ShipmentForm';
import { PriceGuidanceCard } from '../components/PriceGuidanceCard';
import { Cursor } from '../components/Cursor';
import { DemoLabel } from '../components/DemoLabel';
import { AppShell } from '../components/AppShell';

const SCENE_START = 0;
const SCENE_END = 419;

interface Scene1ShipperPostProps {
  frame: number;
}

export const Scene1ShipperPost: React.FC<Scene1ShipperPostProps> = ({ frame }) => {
  const local = frame - SCENE_START;

  const cursorX = interpolate(local, [240, 300, 360, 390], [520, 520, 520, 520]);
  const cursorY = interpolate(local, [240, 300, 360, 390], [320, 320, 320, 336]);

  const weightCount = interpolate(local, [132, 156], [0, 2400], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div className="relative w-full h-full bg-white">
      <AppShell localFrame={local}>
        <RoleHeader role="shipper" accountName={demoShipment.shipper} localFrame={local} showDemoLabel />
        <div className="flex">
          <SideNav localFrame={local} activeItem="shipments" />
          <ShipmentForm localFrame={local} />
          <PriceGuidanceCard
            localFrame={local}
            minINR={demoShipment.indicativePriceMinINR}
            maxINR={demoShipment.indicativePriceMaxINR}
          />
          <DemoLabel
            text="Illustrative price estimate · not a live quote"
            localFrame={local}
            start={144}
            end={158}
          />
          <Cursor x={cursorX} y={cursorY} opacity={local > 220 ? 1 : 0} />
        </div>
      </AppShell>
      <div
        className="absolute bottom-6 left-24 right-24 text-sm font-medium text-gray-900 dark:text-white"
        style={{
          opacity: interpolate(local, [360, 419], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Posting {Math.round(weightCount)} kg {demoShipment.cargo} — {demoShipment.origin} → {demoShipment.destination}
      </div>
    </div>
  );
};

export { SCENE_START, SCENE_END };
