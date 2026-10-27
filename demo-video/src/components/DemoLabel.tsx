import { interpolate } from 'remotion';
import { Badge } from '@/components/ui/badge';

interface DemoLabelProps {
  text: string;
  localFrame: number;
  start: number;
  end: number;
}

export const DemoLabel: React.FC<DemoLabelProps> = ({ text, localFrame, start, end }) => {
  const opacity = interpolate(localFrame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Badge
      variant="outline"
      className="text-xs"
      style={{ opacity, marginTop: 6, display: 'inline-block' }}
    >
      {text}
    </Badge>
  );
};
