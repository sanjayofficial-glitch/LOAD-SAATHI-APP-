import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
}

export default function Sparkline({
  data,
  width = 80,
  height = 28,
  className,
  strokeWidth = 1.5,
}: SparklineProps) {
  if (data.length < 2) {
    return <div style={{ width, height }} className={cn('rounded bg-muted/30', className)} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const last = data[data.length - 1] ?? 0;
  const first = data[0] ?? 0;
  const lastY = height - padding - ((last - min) / range) * (height - padding * 2);
  const trend = last >= first ? 'up' : 'down';
  const color = trend === 'up' ? '#22c55e' : '#ef4444';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points.split(' ').pop()!.split(',')[0]}
        cy={lastY}
        r={2}
        fill={color}
      />
    </svg>
  );
}
