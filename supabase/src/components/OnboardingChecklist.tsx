import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, X, Phone, ArrowRight } from 'lucide-react';
import { formatIndianPhone } from '@/utils/phone';

interface ChecklistItem {
  label: string;
  done: boolean;
  to?: string;
}

interface OnboardingChecklistProps {
  accent: 'orange' | 'blue';
  userId: string;
  items: ChecklistItem[];
  userPhone?: string | null;
}

const OnboardingChecklist = ({ accent, userId, items, userPhone }: OnboardingChecklistProps) => {
  const storageKey = `loadsaathi-checklist-dismissed-${userId}`;
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  // Phone item is non-dismissible and always shown when the user has no phone.
  const phoneMissing = !userPhone || !formatIndianPhone(userPhone);

  const displayItems = useMemo(() => {
    if (!phoneMissing) return items;
    // Replace any existing phone item with a hard requirement.
    const withoutPhone = items.filter(i => !i.label.toLowerCase().includes('phone'));
    return [
      {
        label: 'Add phone number',
        done: false,
        to: '/profile',
      },
      ...withoutPhone,
    ];
  }, [items, phoneMissing]);

  const doneCount = displayItems.filter(i => i.done).length;
  const allDone = displayItems.length > 0 && doneCount === displayItems.length;

  if (dismissed || allDone) return null;

  const progress = Math.round((doneCount / items.length) * 100);

  const ring = accent === 'orange'
    ? 'border-orange-200 dark:border-orange-800'
    : 'border-blue-200 dark:border-blue-800';
  const progressClass = accent === 'orange' ? 'bg-orange-500' : 'bg-blue-500';
  const checkClass = accent === 'orange' ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400';
  const hoverBg = accent === 'orange'
    ? 'hover:bg-orange-50 dark:hover:bg-orange-950/50'
    : 'hover:bg-blue-50 dark:hover:bg-blue-950/50';

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <Card className={`${ring} shadow-md overflow-hidden animate-fade-in-up`}>
      <div className={`h-1 ${progressClass}`} />
      <CardContent className="pt-4 px-4 sm:px-6 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">Getting Started</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {doneCount} of {items.length} steps done — keep it rolling
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss checklist"
            className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-300 press shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-[width] duration-700 ease-ios ${progressClass}`} style={{ width: `${progress}%` }} />
        </div>

        <ul className="mt-3 space-y-1">
          {items.map((item) => (
            <li key={item.label}>
              {item.to && !item.done ? (
                <Link to={item.to} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 press group ${hoverBg}`}>
                  {item.label.toLowerCase().includes('phone')
                    ? <Phone className="h-5 w-5 shrink-0 text-orange-400 dark:text-orange-500" />
                    : <Circle className="h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600" />}
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex-1">{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {item.done ? (
                    <CheckCircle2 className={`h-5 w-5 shrink-0 ${checkClass}`} />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600" />
                  )}
                  <span className={`text-sm font-semibold ${item.done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                    {item.label}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default OnboardingChecklist;
