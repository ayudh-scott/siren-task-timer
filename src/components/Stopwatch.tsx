import { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, Bell, BellOff, Volume2, VolumeX, Calendar, Clock } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { formatDuration, storage, getTodayString } from '@/lib/storage';
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
    taskDate,
    startTime,
    endTime,
    setTaskName,
    setTaskNotes,
    setTaskDate,
    setStartTime,
    setEndTime,
    start,
    stop,
    reset,
    lastAlertMinutes
  } = useTimer();

  const [soundEnabled, setSoundEnabled] = useState(storage.getSoundEnabled());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomTime, setShowCustomTime] = useState(false);

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
      setTaskDate(getTodayString());
      setStartTime('');
      setEndTime('');
      setShowCustomTime(false);
      // Trigger refresh of task list
      if (onTaskSaved) {
        onTaskSaved();
      }
    }
  };

  // Helper functions to convert between 12-hour and 24-hour format
  const convertTo24Hour = (time12: string): string => {
    if (!time12) return '';
    try {
      const [time, period] = time12.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 = hours + 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      return `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  const convertTo12Hour = (time24: string): string => {
    if (!time24) return '';
    try {
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch {
      return '';
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

        {/* Custom Date/Time Section */}
        {!isRunning && (
          <div className="space-y-3">
            <button
              onClick={() => setShowCustomTime(!showCustomTime)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Calendar size={16} />
              {showCustomTime ? 'Hide' : 'Set'} custom date & time
            </button>

            {showCustomTime && (
              <div className="glass rounded-2xl p-4 space-y-3 animate-fade-in">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                    <Calendar size={12} />
                    Date
                  </label>
                  <input
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="input-field w-full"
                    max={getTodayString()}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                      <Clock size={12} />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime ? convertTo24Hour(startTime) : ''}
                      onChange={(e) => {
                        const time12 = convertTo12Hour(e.target.value);
                        setStartTime(time12);
                      }}
                      className="input-field w-full"
                      placeholder="Start time"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                      <Clock size={12} />
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime ? convertTo24Hour(endTime) : ''}
                      onChange={(e) => {
                        const time12 = convertTo12Hour(e.target.value);
                        setEndTime(time12);
                      }}
                      className="input-field w-full"
                      placeholder="End time"
                    />
                  </div>
                </div>

                {startTime && endTime && taskDate && (
                  <p className="text-xs text-muted-foreground text-center">
                    Duration will be calculated from the times above
                  </p>
                )}

                {(startTime || endTime) && (
                  <button
                    onClick={() => {
                      setStartTime('');
                      setEndTime('');
                      setTaskDate(getTodayString());
                    }}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear custom times
                  </button>
                )}
              </div>
            )}
          </div>
        )}
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
