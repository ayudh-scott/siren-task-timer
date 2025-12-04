import { useState, useMemo } from 'react';
import { Search, Calendar, Clock, Trash2, ChevronDown, ChevronUp, Edit2, Save, X } from 'lucide-react';
import { storage, Task, formatDuration, formatDate, calculateDailyTotal, getTodayString } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  onRefresh: () => void;
}

export const TaskList = ({ tasks, onRefresh }: TaskListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.notes.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDate = !selectedDate || task.date === selectedDate;
      
      return matchesSearch && matchesDate;
    });
  }, [tasks, searchQuery, selectedDate]);

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    const groups: { [date: string]: Task[] } = {};
    filteredTasks.forEach(task => {
      if (!groups[task.date]) {
        groups[task.date] = [];
      }
      groups[task.date].push(task);
    });
    return groups;
  }, [filteredTasks]);

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const handleDelete = async (id: string) => {
    if (confirm('Delete this task?')) {
      await storage.deleteTask(id);
      onRefresh();
    }
  };

  const handleEdit = (task: Task) => {
    setEditForm({
      taskName: task.taskName,
      notes: task.notes,
      date: task.date,
      startTime: task.startTime,
      endTime: task.endTime,
      duration: task.duration,
    });
    setEditingId(task.id);
    setExpandedId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const calculateDurationFromTimes = (date: string, startTime: string, endTime: string): number => {
    try {
      // Parse times (format: "10:30 AM" or "02:15 PM")
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
      
      const startDate = new Date(`${date}T${String(start.hours).padStart(2, '0')}:${String(start.minutes).padStart(2, '0')}:00`);
      let endDate = new Date(`${date}T${String(end.hours).padStart(2, '0')}:${String(end.minutes).padStart(2, '0')}:00`);
      
      // Handle case where end time is next day
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }
      
      return Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    } catch {
      return 0;
    }
  };

  const handleSaveEdit = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    let updates: Partial<Task> = { ...editForm };

    // Recalculate duration if times changed
    if (updates.startTime && updates.endTime && updates.date) {
      const newDuration = calculateDurationFromTimes(
        updates.date,
        updates.startTime,
        updates.endTime
      );
      if (newDuration > 0) {
        updates.duration = newDuration;
      }
    }

    await storage.updateTask(id, updates);
    setEditingId(null);
    setEditForm({});
    onRefresh();
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate duration if both times are set
      if (updated.startTime && updated.endTime && updated.date) {
        const newDuration = calculateDurationFromTimes(
          updated.date,
          updated.startTime,
          updated.endTime
        );
        if (newDuration > 0) {
          updated.duration = newDuration;
        }
      }
      return updated;
    });
  };

  // Helper functions to convert between 12-hour and 24-hour format
  const convertTo24Hour = (time12: string): string => {
    try {
      const [time, period] = time12.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 = hours + 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      return `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch {
      return '00:00';
    }
  };

  const convertTo12Hour = (time24: string): string => {
    try {
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch {
      return '12:00 AM';
    }
  };

  const today = getTodayString();
  const todayTotal = calculateDailyTotal(tasks, today);

  return (
    <div className="px-4 pb-24 safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl pb-4 pt-4">
        <h1 className="text-2xl font-bold mb-4">Tasks</h1>
        
        {/* Today's Summary */}
        <div className="glass rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Today's Total</span>
            <span className="text-2xl font-bold gradient-timer-text">
              {formatDuration(todayTotal)}
            </span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field pl-10 w-12 opacity-0 absolute inset-0 cursor-pointer"
            />
            <button className="input-field pl-10 pr-4 flex items-center gap-2 whitespace-nowrap">
              <span className="text-muted-foreground">
                {selectedDate ? formatDate(selectedDate) : 'All dates'}
              </span>
            </button>
          </div>
        </div>
        {selectedDate && (
          <button
            onClick={() => setSelectedDate('')}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Clear date filter
          </button>
        )}
      </div>

      {/* Task Groups */}
      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No tasks yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start the timer to track your first task
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {date === today ? 'Today' : formatDate(date)}
                </h2>
                <span className="text-sm text-primary font-medium">
                  {formatDuration(calculateDailyTotal(groupedTasks[date], date))}
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-3">
                {groupedTasks[date].map(task => (
                  <div
                    key={task.id}
                    className={cn(
                      "task-card cursor-pointer",
                      expandedId === task.id && "ring-1 ring-primary/50"
                    )}
                    onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {task.taskName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>{task.startTime}</span>
                          <span>→</span>
                          <span>{task.endTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-semibold text-primary">
                          {formatDuration(task.duration)}
                        </span>
                        {expandedId === task.id ? (
                          <ChevronUp size={18} className="text-muted-foreground" />
                        ) : (
                          <ChevronDown size={18} className="text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedId === task.id && (
                      <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                        {editingId === task.id ? (
                          /* Edit Form */
                          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Task Name</label>
                              <input
                                type="text"
                                value={editForm.taskName || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, taskName: e.target.value }))}
                                className="input-field w-full"
                                placeholder="Task name"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                              <input
                                type="date"
                                value={editForm.date || ''}
                                onChange={(e) => {
                                  const newDate = e.target.value;
                                  setEditForm(prev => {
                                    const updated = { ...prev, date: newDate };
                                    // Recalculate duration if times are set
                                    if (updated.startTime && updated.endTime && newDate) {
                                      const newDuration = calculateDurationFromTimes(
                                        newDate,
                                        updated.startTime,
                                        updated.endTime
                                      );
                                      if (newDuration > 0) {
                                        updated.duration = newDuration;
                                      }
                                    }
                                    return updated;
                                  });
                                }}
                                className="input-field w-full"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
                                <input
                                  type="time"
                                  value={editForm.startTime ? convertTo24Hour(editForm.startTime) : ''}
                                  onChange={(e) => {
                                    const time24 = e.target.value;
                                    const time12 = convertTo12Hour(time24);
                                    handleTimeChange('startTime', time12);
                                  }}
                                  className="input-field w-full"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">End Time</label>
                                <input
                                  type="time"
                                  value={editForm.endTime ? convertTo24Hour(editForm.endTime) : ''}
                                  onChange={(e) => {
                                    const time24 = e.target.value;
                                    const time12 = convertTo12Hour(time24);
                                    handleTimeChange('endTime', time12);
                                  }}
                                  className="input-field w-full"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                Duration: {formatDuration(editForm.duration || task.duration)}
                              </label>
                              <input
                                type="number"
                                value={Math.floor((editForm.duration || task.duration) / 60)}
                                onChange={(e) => {
                                  const minutes = parseInt(e.target.value) || 0;
                                  setEditForm(prev => ({ ...prev, duration: minutes * 60 }));
                                }}
                                className="input-field w-full"
                                placeholder="Duration in minutes"
                                min="0"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Or adjust start/end times above to auto-calculate
                              </p>
                            </div>

                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                              <textarea
                                value={editForm.notes || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                className="input-field w-full resize-none h-20"
                                placeholder="Notes (optional)"
                              />
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => handleSaveEdit(task.id)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                              >
                                <Save size={16} />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-colors"
                              >
                                <X size={16} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <>
                            {task.notes && (
                              <p className="text-sm text-muted-foreground mb-4">
                                {task.notes}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(task);
                                }}
                                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                              >
                                <Edit2 size={16} />
                                Edit task
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(task.id);
                                }}
                                className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors"
                              >
                                <Trash2 size={16} />
                                Delete task
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
