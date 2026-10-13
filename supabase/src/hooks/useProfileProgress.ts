import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';

export type ProgressItem = {
  id: string;
  label: string;
  done: boolean;
  requiredFor: string[];
};

/**
 * Computes onboarding progress as a percentage from 0–100.
 *
 * Steps counted as "done":
 *  - full_name present
 *  - phone present and valid (Indian mobile)
 *  - role selected (user_type present and not admin)
 *
 * Progress is 0 for admins (they skip onboarding entirely).
 */
export function useProfileProgress() {
  const { userProfile } = useAuth();

  const progress = useMemo(() => {
    if (!userProfile || userProfile.user_type === 'admin') return 0;

    const steps: ProgressItem[] = [
      {
        id: 'name',
        label: 'Full name',
        done: Boolean(userProfile.full_name?.trim()),
        requiredFor: ['profile-complete'],
      },
      {
        id: 'phone',
        label: 'Phone number',
        done: Boolean(userProfile.phone?.trim()),
        requiredFor: ['contactable'],
      },
      {
        id: 'role',
        label: 'Role set',
        done: Boolean(userProfile.user_type) && (userProfile.user_type as User['user_type']) !== 'admin',
        requiredFor: ['dashboard'],
      },
    ];

    const doneCount = steps.filter(s => s.done).length;
    return Math.round((doneCount / steps.length) * 100);
  }, [userProfile]);

  return progress;
}
