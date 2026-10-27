import { interpolate } from 'remotion';
import { theme } from '../theme';

interface SvgCorridorMapProps {
  localFrame: number;
  markerProgress: number;
  showRoute: boolean;
}

export const SvgCorridorMap: React.FC<SvgCorridorMapProps> = ({ localFrame, markerProgress, showRoute }) => {
  const routeOpacity = interpolate(localFrame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pathLength = 520;
  const dashOffset = interpolate(localFrame, [0, 48], [pathLength, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const markerX = interpolate(markerProgress, [0, 1], [120, 420]);
  const markerY = interpolate(markerProgress, [0, 1], [300, 200]);

  return (
    <div
      className="shadow-sm border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
      style={{
        width: '100%',
        height: 360,
        background: '#FFFFFF',
        border: `1px solid ${theme.border}`,
        opacity: showRoute ? routeOpacity : 0.4,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 560 360"
        style={{ display: 'block' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={theme.primary} />
          </marker>
        </defs>
        <path
          d="M 120 300 Q 240 320 360 240 Q 480 160 520 120"
          fill="none"
          stroke={theme.borderLight}
          strokeWidth="3"
          strokeDasharray="8 6"
        />
        <path
          d="M 120 300 Q 240 280 360 220 Q 440 180 480 160"
          fill="none"
          stroke={theme.primary}
          strokeWidth="3"
          strokeDasharray={showRoute ? `${pathLength} ${pathLength}` : '0 0'}
          strokeDashoffset={showRoute ? dashOffset : 0}
          markerEnd={showRoute ? 'url(#arrowhead)' : 'none'}
        />
        <circle cx="120" cy="300" r={7} fill={theme.primary} stroke="#FFFFFF" strokeWidth={2} />
        <text x="130" y="295" fontSize="11" fill={theme.inkLight} fontWeight="600">
          Rourkela
        </text>
        <circle cx="480" cy="160" r={7} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
        <text x="490" y="155" fontSize="11" fill={theme.inkLight} fontWeight="600">
          Ranchi
        </text>
        <circle
          cx={markerX}
          cy={markerY}
          r={6}
          fill={theme.amber}
          stroke="#FFFFFF"
          strokeWidth={2}
          opacity={showRoute ? 1 : 0}
        />
        <text x={markerX + 10} y={markerY - 10} fontSize="10" fill={theme.amber} fontWeight="700">
          Truck (demo)
        </text>
      </svg>
      <div className="absolute bottom-2 left-2 z-10">
        <div className="text-[10px] text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
          Demo route animation · not live GPS
        </div>
      </div>
    </div>
  );
};
