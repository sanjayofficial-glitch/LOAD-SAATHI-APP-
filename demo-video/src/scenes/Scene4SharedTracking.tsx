import { interpolate } from 'remotion';
import { RoleViewToggle } from '../components/RoleViewToggle';
import { SvgCorridorMap } from '../components/SvgCorridorMap';
import { ShipmentTimeline } from '../components/ShipmentTimeline';
import { PaymentProtectionStatus } from '../components/PaymentProtectionStatus';
import { Cursor } from '../components/Cursor';
import { DemoLabel } from '../components/DemoLabel';
import { AppShell } from '../components/AppShell';

const SCENE_START = 1350;
const SCENE_END = 1799;

interface Scene4SharedTrackingProps {
  frame: number;
}

export const Scene4SharedTracking: React.FC<Scene4SharedTrackingProps> = ({ frame }) => {
  const local = frame - SCENE_START;

  const markerProgress = interpolate(local, [20, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const currentStep = interpolate(local, [0, 40, 90, 140], [0, 1, 2, 3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stepInt = Math.min(3, Math.max(0, Math.floor(currentStep as number)));

  const activeRole = local > 100 && local < 140 ? 'trucker' : 'shipper';

  const paymentStage: 'pending' | 'confirmed' = local > 130 ? 'confirmed' : 'pending';

  const cursorX = interpolate(local, [20, 100], [600, 600]);
  const cursorY = interpolate(local, [20, 100], [260, 260]);

  return (
    <div className="relative w-full h-full bg-white">
      <AppShell localFrame={local}>
        <RoleViewToggle localFrame={local} active={activeRole} />
        <div className="flex gap-6 p-6">
          <div className="flex-1">
            <SvgCorridorMap localFrame={local} markerProgress={markerProgress} showRoute={local > 10} />
          </div>
          <div className="w-96 flex flex-col gap-4">
            <ShipmentTimeline localFrame={local} currentStep={stepInt} />
            <PaymentProtectionStatus localFrame={local} stage={paymentStage} />
          </div>
          <Cursor x={cursorX} y={cursorY} opacity={local > 0 ? 1 : 0} />
          <DemoLabel
            text="Shared view — both accounts see the same status"
            localFrame={local}
            start={80}
            end={94}
          />
        </div>
      </AppShell>
      <div
        className="absolute bottom-6 left-24 right-24 text-sm font-medium text-gray-900 dark:text-white"
        style={{
          opacity: interpolate(local, [150, 200], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        Delivery confirmed · payment protection status updated · credit score builds
      </div>
    </div>
  );
};

export { SCENE_START, SCENE_END };
