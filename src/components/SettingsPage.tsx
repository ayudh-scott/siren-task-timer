import { useState, useEffect } from 'react';
import { Volume2, Bell, Download, Info, ExternalLink, Smartphone } from 'lucide-react';
import { storage, Task, formatDuration } from '@/lib/storage';
import { notificationService } from '@/lib/notifications';
import { sirenService } from '@/lib/siren';
import { cn } from '@/lib/utils';

interface SettingsPageProps {
  tasks: Task[];
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const SettingsPage = ({ tasks }: SettingsPageProps) => {
  const [soundEnabled, setSoundEnabled] = useState(storage.getSoundEnabled());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(notificationService.isPermissionGranted());

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const toggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    storage.setSoundEnabled(newValue);
    sirenService.setEnabled(newValue);
    
    if (newValue) {
      await sirenService.initialize();
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await notificationService.requestPermission();
      setNotificationsEnabled(granted);
      storage.setNotificationEnabled(granted);
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const exportCSV = () => {
    if (tasks.length === 0) {
      alert('No tasks to export');
      return;
    }

    const headers = ['Date', 'Task Name', 'Notes', 'Start Time', 'End Time', 'Duration'];
    const rows = tasks.map(t => [
      t.date,
      `"${t.taskName.replace(/"/g, '""')}"`,
      `"${t.notes.replace(/"/g, '""')}"`,
      t.startTime,
      t.endTime,
      formatDuration(t.duration)
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasktimer-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Calculate stats
  const totalTasks = tasks.length;
  const totalTime = tasks.reduce((sum, t) => sum + t.duration, 0);

  return (
    <div className="px-4 pb-24 safe-top pt-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Stats Card */}
      <div className="glass rounded-2xl p-4 mb-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">All Time Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-3xl font-bold gradient-timer-text">{totalTasks}</p>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </div>
          <div>
            <p className="text-3xl font-bold gradient-timer-text">{formatDuration(totalTime)}</p>
            <p className="text-sm text-muted-foreground">Total Time</p>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-3">
        {/* Install PWA */}
        {!isInstalled && (
          <button
            onClick={handleInstall}
            disabled={!deferredPrompt}
            className={cn(
              "w-full task-card flex items-center gap-4",
              deferredPrompt ? "hover:bg-primary/10 cursor-pointer" : "opacity-60"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Smartphone size={20} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Install App</p>
              <p className="text-sm text-muted-foreground">
                {deferredPrompt 
                  ? 'Add to home screen for best experience'
                  : 'Use browser menu to install'
                }
              </p>
            </div>
          </button>
        )}

        {/* Sound */}
        <button
          type="button"
          onClick={toggleSound}
          className="w-full task-card flex items-center gap-4"
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            soundEnabled ? "bg-primary/20" : "bg-muted"
          )}>
            <Volume2 size={20} className={soundEnabled ? "text-primary" : "text-muted-foreground"} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Sound Alerts</p>
            <p className="text-sm text-muted-foreground">30-minute interval siren</p>
          </div>
          <div className={cn(
            "w-12 h-7 rounded-full transition-colors relative",
            soundEnabled ? "bg-primary" : "bg-muted"
          )}>
            <div className={cn(
              "absolute top-1 w-5 h-5 rounded-full bg-foreground transition-transform",
              soundEnabled ? "translate-x-6" : "translate-x-1"
            )} />
          </div>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={toggleNotifications}
          className="w-full task-card flex items-center gap-4"
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            notificationsEnabled ? "bg-primary/20" : "bg-muted"
          )}>
            <Bell size={20} className={notificationsEnabled ? "text-primary" : "text-muted-foreground"} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Notifications</p>
            <p className="text-sm text-muted-foreground">
              {notificationsEnabled ? 'Enabled' : 'Tap to enable'}
            </p>
          </div>
          <div className={cn(
            "w-12 h-7 rounded-full transition-colors relative",
            notificationsEnabled ? "bg-primary" : "bg-muted"
          )}>
            <div className={cn(
              "absolute top-1 w-5 h-5 rounded-full bg-foreground transition-transform",
              notificationsEnabled ? "translate-x-6" : "translate-x-1"
            )} />
          </div>
        </button>

        {/* Export */}
        <button
          type="button"
          onClick={exportCSV}
          className="w-full task-card flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Download size={20} className="text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Export Tasks</p>
            <p className="text-sm text-muted-foreground">Download as CSV file</p>
          </div>
          <ExternalLink size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* App Info */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Info size={18} />
          <div className="text-sm">
            <p className="font-medium">TaskTimer Pro</p>
            <p>Track tasks with 30-min break reminders</p>
          </div>
        </div>
      </div>
    </div>
  );
};
