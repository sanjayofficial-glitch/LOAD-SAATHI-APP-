
import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  retry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
  className?: string;
}

const ErrorState = ({
  title = 'Something went wrong',
  description = "We couldn't load this data. Please try again.",
  retry,
  retryLabel = 'Try Again',
  icon = <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-red-500 dark:text-red-400" />,
  className,
}: ErrorStateProps) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border-2 border-dashed border-red-200 dark:border-red-900/40 rounded-3xl p-8 sm:p-12 text-center animate-scale-in',
        className
      )}
    >
      <div className="bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">{description}</p>
      {retry && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 sm:mt-8">
          <Button
            onClick={retry}
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-md text-sm sm:text-base w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
