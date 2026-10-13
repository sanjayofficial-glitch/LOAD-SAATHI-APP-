
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  accent?: 'orange' | 'blue';
  className?: string;
}

const ACCENTS = {
  orange: {
    iconBg: 'from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30',
    iconColor: 'text-orange-500 dark:text-orange-400',
    primary: 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600',
  },
  blue: {
    iconBg: 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30',
    iconColor: 'text-blue-500 dark:text-blue-400',
    primary: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600',
  },
} as const;

const EmptyState = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  accent = 'orange',
  className,
}: EmptyStateProps) => {
  const styles = ACCENTS[accent];
  const showActions = !!(primaryAction && (primaryAction.to || primaryAction.onClick));

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-8 sm:p-12 text-center animate-scale-in',
        className
      )}
    >
      <div className={cn('animate-float bg-gradient-to-br w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6', styles.iconBg)}>
        <span className={cn('h-8 w-8 sm:h-10 sm:w-10', styles.iconColor)}>{icon}</span>
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">{description}</p>
      {showActions && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 sm:mt-8">
          {primaryAction && (
            primaryAction.to ? (
              <Button asChild className={cn('shadow-md text-sm sm:text-base w-full sm:w-auto', styles.primary)}>
                <Link to={primaryAction.to}>{primaryAction.label}</Link>
              </Button>
            ) : (
              <Button onClick={primaryAction.onClick} className={cn('shadow-md text-sm sm:text-base w-full sm:w-auto', styles.primary)}>
                {primaryAction.label}
              </Button>
            )
          )}
          {secondaryAction && (secondaryAction.to || secondaryAction.onClick) && (
            secondaryAction.to ? (
              <Button asChild variant="outline" className="shadow-sm text-sm sm:text-base w-full sm:w-auto">
                <Link to={secondaryAction.to}>{secondaryAction.label}</Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={secondaryAction.onClick} className="shadow-sm text-sm sm:text-base w-full sm:w-auto">
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
