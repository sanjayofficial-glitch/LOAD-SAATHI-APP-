import { interpolate } from 'remotion';

interface SideNavProps {
  localFrame: number;
  activeItem?: string;
}

export const SideNav: React.FC<SideNavProps> = ({ localFrame, activeItem }) => {
  const opacity = interpolate(localFrame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const items = [
    { id: 'overview', label: 'Overview' },
    { id: 'shipments', label: 'Shipments' },
    { id: 'find', label: 'Find Trucks' },
    { id: 'payments', label: 'Payments' },
    { id: 'messages', label: 'Messages' },
  ];

  return (
    <nav
      className="w-64"
      style={{ opacity }}
    >
      <div className="mb-6">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Navigation
        </div>
        {items.map((item) => {
          const isActive = item.id === activeItem;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <span className="h-5 w-5 shrink-0">{isActive ? '●' : '○'}</span>
              {item.label}
            </div>
          );
        })}
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
        <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">
          Rourkela Components
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Verified · GST registered
        </div>
      </div>
    </nav>
  );
};
