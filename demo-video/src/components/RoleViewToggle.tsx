import { interpolate } from 'remotion';
import { Button } from '@/components/ui/button';

interface RoleViewToggleProps {
  localFrame: number;
  active: 'shipper' | 'trucker';
}

export const RoleViewToggle: React.FC<RoleViewToggleProps> = ({ localFrame, active }) => {
  const opacity = interpolate(localFrame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{ opacity, position: 'absolute', top: 112, right: 96, display: 'flex', gap: 2 }}
    >
      {['shipper', 'trucker'].map((role) => (
        <Button
          key={role}
          variant={active === role ? 'default' : 'outline'}
          size="sm"
          style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600 }}
        >
          {role === 'shipper' ? 'Shipper view' : 'Trucker view'}
        </Button>
      ))}
    </div>
  );
};
