import { useState, useEffect, useCallback, useRef } from 'react';
import { storage, TimerState, Task, generateId, getTodayString, formatTime, formatDuration } from '@/lib/storage';
import { notificationService } from '@/lib/notifications';
import { sirenService } from '@/lib/siren';

const INTERVAL_MINUTES = 30;
const INTERVAL_SECONDS = INTERVAL_MINUTES * 60;

export interface UseTimerReturn {
  isRunning: boolean;
  elapsedSeconds: number;
  taskName: string;
  taskNotes: string;
  setTaskName: (name: string) => void;
  setTaskNotes: (notes: string) => void;
  start: () => void;
  stop: () => Task | null;
  reset: () => void;
  lastAlertMinutes: number;
}

export const useTimer = (): UseTimerReturn => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [taskName, setTaskName] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [lastAlertMinutes, setLastAlertMinutes] = useState(0);
  
  const intervalRef = useRef<number | null>(null);
  const lastAlertRef = useRef(0);

  // Restore timer state on mount
  useEffect(() => {
    const savedState = storage.getTimerState();
    if (savedState.isRunning && savedState.startTimestamp) {
      const now = Date.now();
      const elapsed = savedState.elapsedBeforePause + 
        Math.floor((now - savedState.startTimestamp) / 1000);
      
      setIsRunning(true);
      setStartTimestamp(savedState.startTimestamp);
      setElapsedSeconds(elapsed);
      setTaskName(savedState.currentTaskName);
      setTaskNotes(savedState.currentTaskNotes);
      
      // Calculate last alert
      lastAlertRef.current = Math.floor(elapsed / INTERVAL_SECONDS) * INTERVAL_MINUTES;
      setLastAlertMinutes(lastAlertRef.current);
    }
  }, []);

  // Timer interval
  useEffect(() => {
    if (isRunning && startTimestamp) {
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimestamp) / 1000);
        setElapsedSeconds(elapsed);

        // Check for 30-minute intervals
        const currentMinutes = Math.floor(elapsed / 60);
        const intervalsPassed = Math.floor(currentMinutes / INTERVAL_MINUTES);
        const alertMinutes = intervalsPassed * INTERVAL_MINUTES;

        if (alertMinutes > lastAlertRef.current && alertMinutes > 0) {
          lastAlertRef.current = alertMinutes;
          setLastAlertMinutes(alertMinutes);
          
          // Play siren and show notification
          sirenService.play();
          notificationService.showBreakReminder(alertMinutes);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, startTimestamp]);

  // Persist timer state
  useEffect(() => {
    const state: TimerState = {
      isRunning,
      startTimestamp,
      elapsedBeforePause: isRunning ? 0 : elapsedSeconds,
      currentTaskName: taskName,
      currentTaskNotes: taskNotes
    };
    storage.saveTimerState(state);
  }, [isRunning, startTimestamp, elapsedSeconds, taskName, taskNotes]);

  const start = useCallback(() => {
    const now = Date.now();
    setStartTimestamp(now);
    setIsRunning(true);
    setElapsedSeconds(0);
    lastAlertRef.current = 0;
    setLastAlertMinutes(0);
    
    notificationService.showTimerStarted();
  }, []);

  const stop = useCallback((): Task | null => {
    if (!isRunning) return null;

    const endTime = new Date();
    const startTime = startTimestamp ? new Date(startTimestamp) : endTime;
    
    const task: Task = {
      id: generateId(),
      date: getTodayString(),
      taskName: taskName || 'Untitled Task',
      notes: taskNotes,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      duration: elapsedSeconds,
      createdAt: Date.now()
    };

    console.log('Saving task:', task);
    storage.saveTask(task);
    storage.clearTimerState();

    setIsRunning(false);
    setStartTimestamp(null);
    
    notificationService.showTimerStopped(task.taskName, formatDuration(task.duration));

    return task;
  }, [isRunning, startTimestamp, taskName, taskNotes, elapsedSeconds]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setStartTimestamp(null);
    setElapsedSeconds(0);
    setTaskName('');
    setTaskNotes('');
    lastAlertRef.current = 0;
    setLastAlertMinutes(0);
    storage.clearTimerState();
  }, []);

  return {
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
  };
};
