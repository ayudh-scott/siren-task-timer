export interface Task {
  id: string;
  date: string;
  taskName: string;
  notes: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  createdAt: number;
}

export interface TimerState {
  isRunning: boolean;
  startTimestamp: number | null;
  elapsedBeforePause: number;
  currentTaskName: string;
  currentTaskNotes: string;
}

const TASKS_KEY = 'tasktimer_tasks';
const TIMER_STATE_KEY = 'tasktimer_timer_state';
const SOUND_ENABLED_KEY = 'tasktimer_sound_enabled';
const NOTIFICATION_ENABLED_KEY = 'tasktimer_notification_enabled';

export const storage = {
  // Tasks
  getTasks: (): Task[] => {
    try {
      const data = localStorage.getItem(TASKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveTask: (task: Task): void => {
    const tasks = storage.getTasks();
    tasks.unshift(task);
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },

  updateTask: (id: string, updates: Partial<Task>): void => {
    const tasks = storage.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    }
  },

  deleteTask: (id: string): void => {
    const tasks = storage.getTasks().filter(t => t.id !== id);
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },

  // Timer State (for persistence)
  getTimerState: (): TimerState => {
    try {
      const data = localStorage.getItem(TIMER_STATE_KEY);
      return data ? JSON.parse(data) : {
        isRunning: false,
        startTimestamp: null,
        elapsedBeforePause: 0,
        currentTaskName: '',
        currentTaskNotes: ''
      };
    } catch {
      return {
        isRunning: false,
        startTimestamp: null,
        elapsedBeforePause: 0,
        currentTaskName: '',
        currentTaskNotes: ''
      };
    }
  },

  saveTimerState: (state: TimerState): void => {
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
  },

  clearTimerState: (): void => {
    localStorage.removeItem(TIMER_STATE_KEY);
  },

  // Settings
  getSoundEnabled: (): boolean => {
    return localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
  },

  setSoundEnabled: (enabled: boolean): void => {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  },

  getNotificationEnabled: (): boolean => {
    return localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true';
  },

  setNotificationEnabled: (enabled: boolean): void => {
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, String(enabled));
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const calculateDailyTotal = (tasks: Task[], date: string): number => {
  return tasks
    .filter(t => t.date === date)
    .reduce((total, task) => total + task.duration, 0);
};
