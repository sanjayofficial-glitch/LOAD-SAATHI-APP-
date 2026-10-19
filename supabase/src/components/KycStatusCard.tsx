import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowRight, Clock, ShieldCheck, XCircle } from 'lucide-react';

/**
 * Compact verification nudge for the trucker dashboard.
 * Renders nothing once the trucker is verified, or for non-truckers.
 */
export default function KycStatusCard({ className = '' }: { className?: string }) {
  const { userProfile } = useAuth();

  if (!userProfile || userProfile.user_type !== 'trucker') return null;

  const status = userProfile.verification_status || 'none';
  if (status === 'verified') return null;

  const config = {
    none: {
      icon: ShieldCheck,
      title: 'Get verified',
      body: 'Add your licence and truck documents to earn the verified badge. Verified truckers get more shipment requests.',
      cta: 'Start verification',
      wrapper: 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30',
      iconClass: 'text-orange-600 dark:text-orange-400',
      titleClass: 'text-orange-900 dark:text-orange-200',
      bodyClass: 'text-orange-700 dark:text-orange-300',
    },
    pending: {
      icon: Clock,
      title: 'Verification in review',
      body: 'Your documents are with us. You keep full access while we check them.',
      cta: 'View status',
      wrapper: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
      iconClass: 'text-amber-600 dark:text-amber-400',
      titleClass: 'text-amber-900 dark:text-amber-200',
      bodyClass: 'text-amber-700 dark:text-amber-300',
    },
    rejected: {
      icon: XCircle,
      title: 'Verification needs attention',
      body: userProfile.verification_note
        ? `Reviewer said: "${userProfile.verification_note}"`
        : 'One of your documents needs to be replaced. Please review and resubmit.',
      cta: 'Fix and resubmit',
      wrapper: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
      iconClass: 'text-red-600 dark:text-red-400',
      titleClass: 'text-red-900 dark:text-red-200',
      bodyClass: 'text-red-700 dark:text-red-300',
    },
  }[status] ?? null;

  if (!config) return null;
  const Icon = status === 'rejected' ? AlertTriangle : config.icon;

  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between', config.wrapper, className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClass)} />
        <div>
          <p className={cn('font-semibold', config.titleClass)}>{config.title}</p>
          <p className={cn('text-sm', config.bodyClass)}>{config.body}</p>
        </div>
      </div>
      <Button asChild size="sm" className="shrink-0 bg-orange-600 hover:bg-orange-700">
        <Link to="/trucker/verification">
          {config.cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
