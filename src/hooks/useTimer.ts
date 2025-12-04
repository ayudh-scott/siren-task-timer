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
  taskDate: string;
  startTime: string;
  endTime: string;
  setTaskName: (name: string) => void;
  setTaskNotes: (notes: string) => void;
  setTaskDate: (date: string) => void;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  start: () => void;
  stop: () => Promise<Task | null>;
  reset: () => void;
  lastAlertMinutes: number;
}

export const useTimer = (): UseTimerReturn => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [taskName, setTaskName] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskDate, setTaskDate] = useState(getTodayString());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
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

  const stop = useCallback(async (): Promise<Task | null> => {
    if (!isRunning) return null;

    // Use custom times if provided, otherwise use current time
    let finalStartTime: string;
    let finalEndTime: string;
    let finalDate: string;
    let finalDuration: number;

    if (startTime && endTime && taskDate) {
      // Use custom date and times
      finalDate = taskDate;
      finalStartTime = startTime;
      finalEndTime = endTime;
      
      // Calculate duration from custom times
      try {
        const parseTime = (timeStr: string) => {
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let hour24 = hours;
          if (period === 'PM' && hours !== 12) hour24 = hours + 12;
          if (period === 'AM' && hours === 12) hour24 = 0;
          return { hours: hour24, minutes };
        };

        const start = parseTime(startTime);
        const end = parseTime(endTime);
        
        const startDate = new Date(`${taskDate}T${String(start.hours).padStart(2, '0')}:${String(start.minutes).padStart(2, '0')}:00`);
        let endDate = new Date(`${taskDate}T${String(end.hours).padStart(2, '0')}:${String(end.minutes).padStart(2, '0')}:00`);
        
        // Handle case where end time is next day
        if (endDate < startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
        
        finalDuration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
      } catch {
        finalDuration = elapsedSeconds;
      }
    } else {
      // Use actual timer times
      const endTimeDate = new Date();
      const startTimeDate = startTimestamp ? new Date(startTimestamp) : endTimeDate;
      finalDate = getTodayString();
      finalStartTime = formatTime(startTimeDate);
      finalEndTime = formatTime(endTimeDate);
      finalDuration = elapsedSeconds;
    }
    
    const task: Task = {
      id: generateId(),
      date: finalDate,
      taskName: taskName || 'Untitled Task',
      notes: taskNotes,
      startTime: finalStartTime,
      endTime: finalEndTime,
      duration: finalDuration,
      createdAt: Date.now()
    };

    console.log('Saving task:', task);
    await storage.saveTask(task);
    storage.clearTimerState();

    setIsRunning(false);
    setStartTimestamp(null);
    
    notificationService.showTimerStopped(task.taskName, formatDuration(task.duration));

    return task;
  }, [isRunning, startTimestamp, taskName, taskNotes, elapsedSeconds, startTime, endTime, taskDate]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setStartTimestamp(null);
    setElapsedSeconds(0);
    setTaskName('');
    setTaskNotes('');
    setTaskDate(getTodayString());
    setStartTime('');
    setEndTime('');
    lastAlertRef.current = 0;
    setLastAlertMinutes(0);
    storage.clearTimerState();
  }, []);

  return {
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
  };
};
