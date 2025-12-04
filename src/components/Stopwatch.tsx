import { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { formatDuration, storage } from '@/lib/storage';
import { notificationService } from '@/lib/notifications';
import { sirenService } from '@/lib/siren';
import { cn } from '@/lib/utils';

interface StopwatchProps {
  onTaskSaved?: () => void;
}

export const Stopwatch = ({ onTaskSaved }: StopwatchProps) => {
  const {
    isRunning,
    elapsedSeconds,
    taskName,
    taskNotes,
    setTaskName,
    setTaskNotes,
    start,
    stop,
    reset,
    lastAlertMinutes
  } = useTimer();

  const [soundEnabled, setSoundEnabled] = useState(storage.getSoundEnabled());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(notificationService.isPermissionGranted());
  }, []);

  const handleStart = async () => {
    // Initialize audio on first user interaction
    await sirenService.initialize();
    start();
  };

  const handleStop = async () => {
    const task = await stop();
    if (task) {
      // Reset task fields for next task
      setTaskName('');
      setTaskNotes('');
      // Trigger refresh of task list
      if (onTaskSaved) {
        onTaskSaved();
      }
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    storage.setSoundEnabled(newValue);
    sirenService.setEnabled(newValue);
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await notificationService.requestPermission();
      setNotificationsEnabled(granted);
      storage.setNotificationEnabled(granted);
    }
  };

  const timeString = formatDuration(elapsedSeconds);
  const [hours, minutes, seconds] = timeString.split(':');

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 pb-8">
      {/* Settings Toggle */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={toggleSound}
          className={cn(
            "p-3 rounded-xl transition-all duration-200",
            soundEnabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}
          aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        <button
          onClick={toggleNotifications}
          className={cn(
            "p-3 rounded-xl transition-all duration-200",
            notificationsEnabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}
          aria-label={notificationsEnabled ? "Notifications enabled" : "Enable notifications"}
        >
          {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
      </div>

      {/* Timer Display */}
      <div className="relative mb-8">
        {/* Glow effect when running */}
        {isRunning && (
          <div className="absolute inset-0 -m-8 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        )}
        
        <div className={cn(
          "relative flex items-baseline justify-center gap-1 font-mono",
          isRunning && "animate-pulse-glow"
        )}>
          <span className={cn(
            "text-7xl sm:text-8xl font-bold transition-all duration-300",
            isRunning ? "gradient-timer-text" : "text-foreground"
          )}>
            {hours}
          </span>
          <span className={cn(
            "text-5xl sm:text-6xl font-bold",
            isRunning ? "text-primary animate-timer-tick" : "text-muted-foreground"
          )}>
            :
          </span>
          <span className={cn(
            "text-7xl sm:text-8xl font-bold transition-all duration-300",
            isRunning ? "gradient-timer-text" : "text-foreground"
          )}>
            {minutes}
          </span>
          <span className={cn(
            "text-5xl sm:text-6xl font-bold",
            isRunning ? "text-primary animate-timer-tick" : "text-muted-foreground"
          )}>
            :
          </span>
          <span className={cn(
            "text-7xl sm:text-8xl font-bold transition-all duration-300",
            isRunning ? "gradient-timer-text" : "text-foreground"
          )}>
            {seconds}
          </span>
        </div>
      </div>

      {/* Alert indicator */}
      {isRunning && lastAlertMinutes > 0 && (
        <div className="mb-6 px-4 py-2 rounded-full bg-warning/20 text-warning text-sm font-medium animate-fade-in">
          Last break reminder: {lastAlertMinutes} min
        </div>
      )}

      {/* Task Input Fields */}
      <div className="w-full max-w-md space-y-4 mb-8">
        <input
          type="text"
          placeholder="What are you working on?"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="input-field text-center text-lg font-medium"
          disabled={isRunning}
        />
        <textarea
          placeholder="Notes (optional)"
          value={taskNotes}
          onChange={(e) => setTaskNotes(e.target.value)}
          className="input-field text-center resize-none h-20"
          disabled={isRunning}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="btn-timer-start w-20 h-20 flex items-center justify-center"
            aria-label="Start timer"
          >
            <Play size={32} className="ml-1" />
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="btn-timer-stop w-20 h-20 flex items-center justify-center"
            aria-label="Stop timer"
          >
            <Square size={28} />
          </button>
        )}
        
        {!isRunning && elapsedSeconds > 0 && (
          <button
            onClick={reset}
            className="p-4 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-all duration-200"
            aria-label="Reset timer"
          >
            <RotateCcw size={24} />
          </button>
        )}
      </div>

      {/* Info text */}
      <p className="mt-8 text-sm text-muted-foreground text-center max-w-xs">
        {isRunning 
          ? "Timer running — you'll get a reminder every 30 minutes"
          : "Tap play to start tracking your task"
        }
      </p>
    </div>
  );
};
