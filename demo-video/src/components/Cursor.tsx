import { theme } from '../theme';

interface CursorProps {
  x: number;
  y: number;
  opacity?: number;
}

export const Cursor: React.FC<CursorProps> = ({ x, y, opacity = 1 }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 4,
        top: y - 4,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: theme.primary,
        opacity,
        pointerEvents: 'none',
        zIndex: 10000,
        boxShadow: `0 0 12px ${theme.primary}`,
      }}
    />
  );
};
