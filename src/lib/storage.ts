import { supabase } from '@/integrations/supabase/client';

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

// Helper function to convert database row to Task
const dbRowToTask = (row: any): Task => {
  // Convert date to string format (YYYY-MM-DD)
  let dateStr = row.date;
  if (dateStr instanceof Date) {
    dateStr = dateStr.toISOString().split('T')[0];
  } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  
  return {
    id: row.id,
    date: dateStr,
    taskName: row.task_name,
    notes: row.notes || '',
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    createdAt: row.created_at,
  };
};

// Helper function to convert Task to database row
const taskToDbRow = (task: Task) => ({
  id: task.id,
  date: task.date,
  task_name: task.taskName,
  notes: task.notes,
  start_time: task.startTime,
  end_time: task.endTime,
  duration: task.duration,
  created_at: task.createdAt,
  user_id: null, // Allow anonymous access
});

export const storage = {
  // Tasks
  getTasks: async (): Promise<Task[]> => {
    try {
      console.log('Fetching tasks from Supabase...');
      const { data, error } = await (supabase
        .from('tasks' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) {
        console.error('Error fetching tasks:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // Fallback to localStorage if Supabase fails
        try {
          const localData = localStorage.getItem(TASKS_KEY);
          return localData ? JSON.parse(localData) : [];
        } catch {
          return [];
        }
      }

      console.log('Fetched tasks from Supabase:', data?.length || 0, 'tasks');
      return data ? data.map(dbRowToTask) : [];
    } catch (error) {
      console.error('Error in getTasks:', error);
      // Fallback to localStorage
      try {
        const localData = localStorage.getItem(TASKS_KEY);
        return localData ? JSON.parse(localData) : [];
      } catch {
        return [];
      }
    }
  },

  saveTask: async (task: Task): Promise<void> => {
    try {
      const dbRow = taskToDbRow(task);
      console.log('Saving task to Supabase:', dbRow);
      const { data, error } = await (supabase
        .from('tasks' as any)
        .insert([dbRow] as any) as any);

      if (error) {
        console.error('Error saving task to Supabase:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // Fallback to localStorage
        const tasks = storage.getTasksSync();
        tasks.unshift(task);
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      } else {
        console.log('Task saved successfully to Supabase:', data);
      }
    } catch (error) {
      console.error('Error in saveTask:', error);
      // Fallback to localStorage
      const tasks = storage.getTasksSync();
      tasks.unshift(task);
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    }
  },

  // Synchronous version for backward compatibility (uses localStorage)
  getTasksSync: (): Task[] => {
    try {
      const data = localStorage.getItem(TASKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<void> => {
    try {
      const dbUpdates: any = {};
      if (updates.taskName !== undefined) dbUpdates.task_name = updates.taskName;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
      if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;

      const query = supabase.from('tasks' as any) as any;
      const { error } = await query.update(dbUpdates as any).eq('id', id);

      if (error) {
        console.error('Error updating task in Supabase:', error);
        // Fallback to localStorage
        const tasks = storage.getTasksSync();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
          tasks[index] = { ...tasks[index], ...updates };
          localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        }
      }
    } catch (error) {
      console.error('Error in updateTask:', error);
      // Fallback to localStorage
      const tasks = storage.getTasksSync();
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates };
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      }
    }
  },

  deleteTask: async (id: string): Promise<void> => {
    try {
      const { error } = await (supabase
        .from('tasks' as any)
        .delete()
        .eq('id', id) as any);

      if (error) {
        console.error('Error deleting task from Supabase:', error);
        // Fallback to localStorage
        const tasks = storage.getTasksSync().filter(t => t.id !== id);
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      }
    } catch (error) {
      console.error('Error in deleteTask:', error);
      // Fallback to localStorage
      const tasks = storage.getTasksSync().filter(t => t.id !== id);
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    }
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
