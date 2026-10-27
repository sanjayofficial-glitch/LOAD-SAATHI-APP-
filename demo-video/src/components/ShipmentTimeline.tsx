import { interpolate } from 'remotion';
import { Card } from '@/components/ui/card';
import { demoShipment } from '../data/demoData';

interface ShipmentTimelineProps {
  localFrame: number;
  currentStep: number;
}

const steps = [
  { label: 'Booking confirmed', status: 'completed' },
  { label: 'Picked up', status: 'completed' },
  { label: 'In transit', status: 'active' },
  { label: 'Delivered', status: 'pending' },
];

export const ShipmentTimeline: React.FC<ShipmentTimelineProps> = ({ localFrame, currentStep }) => {
  const opacity = interpolate(localFrame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Card className="shadow-sm border-gray-200 dark:border-gray-700" style={{ opacity }}>
      <div className="p-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Shipment {demoShipment.id}
        </div>
        <div className="flex gap-3">
          {steps.map((step, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;
            const stepOpacity = interpolate(localFrame, [i * 12, i * 12 + 16], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={step.label}
                className="flex-1 flex flex-col items-center gap-2"
                style={{ opacity: stepOpacity }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-orange-500 text-white ring-2 ring-white ring-offset-2'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>
                  {isCompleted ? '✓' : String(i + 1)}
                </div>
                <span className={`text-[10px] text-center leading-tight ${
                  isCompleted || isActive ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
