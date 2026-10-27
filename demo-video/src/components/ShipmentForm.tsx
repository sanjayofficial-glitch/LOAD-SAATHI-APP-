import { interpolate, spring } from 'remotion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, IndianRupee, MapPin, Package, Scale } from 'lucide-react';

interface ShipmentFormProps {
  localFrame: number;
  onComplete?: () => void;
}

export const ShipmentForm: React.FC<ShipmentFormProps> = ({ localFrame }) => {
  const fieldOpacity = (start: number) =>
    interpolate(localFrame, [start, start + 14], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const fieldY = (start: number) =>
    interpolate(localFrame, [start, start + 14], [12, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  const fields = [
    { label: 'Origin Location', value: 'Rourkela, Odisha', icon: <MapPin className="h-4 w-4" />, start: 60 },
    { label: 'Destination Location', value: 'Ranchi, Jharkhand', icon: <MapPin className="h-4 w-4" />, start: 84 },
    { label: 'Goods Description', value: 'Industrial components', icon: <Package className="h-4 w-4" />, start: 108 },
    { label: 'Weight (Tonnes)', value: '2.4', icon: <Scale className="h-4 w-4" />, start: 132 },
    { label: 'Ready Date', value: '28 Oct', icon: <Calendar className="h-4 w-4" />, start: 156 },
    { label: 'Budget per Tonne (₹)', value: '20,500', icon: <IndianRupee className="h-4 w-4" />, start: 180 },
  ];

  const buttonOpacity = interpolate(localFrame, [204, 218], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const buttonScale = spring({ frame: localFrame - 204, fps: 30, config: { damping: 18, stiffness: 120, mass: 0.8 } });

  return (
    <Card
      className="border-blue-100 dark:border-blue-800 shadow-lg"
      style={{
        position: 'absolute',
        top: 160,
        left: 340,
        width: 420,
        opacity: interpolate(localFrame, [0, 16], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    >
      <div className="bg-blue-50/50 dark:bg-blue-950/50 border-b border-blue-100 dark:border-blue-800 px-4 sm:px-6">
        <div className="flex items-center text-blue-900 dark:text-blue-100 text-lg sm:text-xl font-black">
          <Package className="mr-2 text-blue-600 dark:text-blue-400 h-5 w-5 sm:h-6 sm:w-6" />
          Post a New Shipment
        </div>
      </div>
      <div className="p-4 sm:p-6 space-y-5">
        {fields.map((field) => (
          <div key={field.label} className="space-y-2" style={{ opacity: fieldOpacity(field.start), transform: `translateY(${fieldY(field.start)}px)` }}>
            <Label className="text-gray-700 dark:text-gray-200 font-medium">
              {field.label}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                {field.icon}
              </span>
              <Input
                defaultValue={field.value}
                readOnly
                className="pl-10 bg-white text-gray-900"
              />
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          padding: '0 16px 16px 16px',
          opacity: buttonOpacity,
          transform: `scale(${buttonScale})`,
        }}
      >
        <Button
          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 h-12 text-base sm:text-lg font-bold shadow-md transition-all hover:shadow-lg"
          style={{ fontSize: 16 }}
        >
          Post Shipment
        </Button>
      </div>
    </Card>
  );
};
