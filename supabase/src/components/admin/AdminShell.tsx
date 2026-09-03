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

const AdminShell = ({ title, description, children, className }: AdminShellProps) => {
  return (
    <div className={cn('h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] flex flex-col bg-slate-950 text-slate-50 overflow-hidden', className)}>
      <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-slate-700/60 bg-slate-900/70">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-white hover:bg-slate-800">
            <Link to="/admin/monitoring">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-orange-400" />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white">{title}</h1>
              {description && (
                <p className="text-[10px] sm:text-xs text-slate-400">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminShell;
