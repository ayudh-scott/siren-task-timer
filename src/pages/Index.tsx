import { useState, useEffect, useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Stopwatch } from '@/components/Stopwatch';
import { TaskList } from '@/components/TaskList';
import { SettingsPage } from '@/components/SettingsPage';
import { Dashboard } from '@/components/Dashboard';
import { BottomNav, TabType } from '@/components/BottomNav';
import { storage, Task } from '@/lib/storage';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('timer');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const refreshTasks = useCallback(async () => {
    const tasks = await storage.getTasks();
    setTasks(tasks);
  }, []);

  useEffect(() => {
    refreshTasks();
    
    // Check timer state
    const timerState = storage.getTimerState();
    setIsTimerRunning(timerState.isRunning);

    // Refresh tasks and timer state periodically
    const interval = setInterval(() => {
      refreshTasks();
      const state = storage.getTimerState();
      setIsTimerRunning(state.isRunning);
    }, 5000); // Reduced frequency since we're fetching from database

    return () => clearInterval(interval);
  }, [refreshTasks]);

  return (
    <HelmetProvider>
      <Helmet>
        <title>TaskTimer Pro - Track Tasks with Break Reminders</title>
        <meta name="description" content="Mobile-first task tracking app with stopwatch and automatic 30-minute break reminders. Stay productive and take regular breaks." />
        <meta name="theme-color" content="#22d3ee" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Tab Content */}
        <main className="pb-20">
          {activeTab === 'timer' && <Stopwatch onTaskSaved={refreshTasks} />}
          {activeTab === 'dashboard' && <Dashboard tasks={tasks} />}
          {activeTab === 'tasks' && (
            <TaskList tasks={tasks} onRefresh={refreshTasks} />
          )}
          {activeTab === 'settings' && <SettingsPage tasks={tasks} />}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isTimerRunning={isTimerRunning}
        />
      </div>
    </HelmetProvider>
  );
};

export default Index;
