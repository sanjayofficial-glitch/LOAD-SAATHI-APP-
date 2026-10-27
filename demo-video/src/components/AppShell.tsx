import { interpolate } from 'remotion';

interface AppShellProps {
  children: React.ReactNode;
  localFrame: number;
}

export const AppShell: React.FC<AppShellProps> = ({ children, localFrame }) => {
  const opacity = interpolate(localFrame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      className="relative w-full h-full bg-white"
      style={{ opacity }}
    >
      {children}
    </div>
  );
};
