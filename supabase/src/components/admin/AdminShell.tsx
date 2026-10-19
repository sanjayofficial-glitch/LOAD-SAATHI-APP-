import { Link } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Lightweight in-page header + body used by admin pages that need their own
 * titled section inside AdminLayout. Fills the layout's scroll area rather
 * than assuming a fixed viewport height.
 */
const AdminShell = ({ title, description, children, className }: AdminShellProps) => {
  return (
    <div className={cn('min-h-full bg-gray-50 text-gray-900', className)}>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="text-gray-500 hover:text-gray-900 hover:bg-gray-100">
            <Link to="/admin/monitoring" aria-label="Back to command center">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-orange-500" />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-gray-900">{title}</h1>
              {description && <p className="text-[10px] sm:text-xs text-gray-500">{description}</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default AdminShell;
