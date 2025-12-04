import { Timer, ListTodo, Settings, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabType = 'timer' | 'tasks' | 'dashboard' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isTimerRunning?: boolean;
}

export const BottomNav = ({ activeTab, onTabChange, isTimerRunning }: BottomNavProps) => {
  const navItems = [
    { id: 'timer' as const, label: 'Timer', icon: Timer },
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong safe-bottom">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "nav-item relative flex-1 max-w-24",
              activeTab === id && "nav-item-active"
            )}
          >
            <div className="relative">
              <Icon size={24} />
              {id === 'timer' && isTimerRunning && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
