import { interpolate } from 'remotion';
import { demoShipment } from '../data/demoData';
import { RoleHeader } from '../components/RoleHeader';
import { SideNav } from '../components/SideNav';
import { TruckerLoadRequest } from '../components/TruckerLoadRequest';
import { AcceptBookingSheet } from '../components/AcceptBookingSheet';
import { Cursor } from '../components/Cursor';
import { AppShell } from '../components/AppShell';

const SCENE_START = 870;
const SCENE_END = 1349;

interface Scene3TruckerAcceptProps {
  frame: number;
}

export const Scene3TruckerAccept: React.FC<Scene3TruckerAcceptProps> = ({ frame }) => {
  const local = frame - SCENE_START;

  const cursorX = interpolate(local, [100, 200, 300, 380], [700, 700, 700, 700]);
  const cursorY = interpolate(local, [100, 200, 300, 380], [360, 360, 376, 376]);

  const sheetOpen = local >= 360;
  const accepted = local >= 460;
  return (
    <div className="relative w-full h-full bg-white">
      <AppShell localFrame={local}>
        <RoleHeader role="trucker" accountName={demoShipment.trucker} localFrame={local} showDemoLabel />
        <div className="flex">
          <SideNav localFrame={local} activeItem="find" />
          <div className="flex-1 p-6">
            <TruckerLoadRequest localFrame={local} />
            <AcceptBookingSheet localFrame={local} open={sheetOpen} />
            <Cursor x={cursorX} y={cursorY} opacity={local > 60 ? 1 : 0} />
            {accepted && (
              <div className="absolute top-20 left-24 right-24 mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg flex items-center gap-2" style={{ opacity: interpolate(local, [460, 474], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
                <span style={{ fontSize: 16 }}>✓</span>
                <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Booking confirmed — live location sharing on
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
      <div
        className="absolute bottom-6 left-24 right-24 text-sm font-medium text-gray-900 dark:text-white"
        style={{
          opacity: interpolate(local, [560, 620], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        {demoShipment.trucker} accepts LS-DEMO-1028 · {demoShipment.origin} → {demoShipment.destination}
      </div>
    </div>
  );
};

export { SCENE_START, SCENE_END };
