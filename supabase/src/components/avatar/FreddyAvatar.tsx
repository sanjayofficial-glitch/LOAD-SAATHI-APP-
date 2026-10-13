import { useEffect, useRef } from 'react';
import { createAvatar } from './FreddyAvatarEngine';

interface FreddyAvatarProps {
  user: { full_name: string };
  size?: number;
}

export const FreddyAvatar = ({ user, size = 32 }: FreddyAvatarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      createAvatar(containerRef.current, { name: user.full_name, size });
    }
  }, [user.full_name, size]);

  return <div ref={containerRef} style={{ width: size, height: size }} />;
};
