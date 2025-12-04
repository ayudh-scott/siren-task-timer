import { useState, useMemo } from 'react';
import { Search, Calendar, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
                        {task.notes && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {task.notes}
                          </p>
                        )}
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
