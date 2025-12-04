import { useState, useMemo } from 'react';
import { BarChart3, Clock, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { Task, formatDuration, formatDate } from '@/lib/storage';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

type PeriodType = 'today' | 'week' | 'month' | 'all';

interface DashboardProps {
  tasks: Task[];
}

const getPeriodDates = (period: PeriodType): { start: Date; end: Date } => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  switch (period) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
        end
      };
    case 'week': {
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      return { start: startOfWeek, end };
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { start: startOfMonth, end };
    }
    case 'all':
    default:
      return {
        start: new Date(0),
        end
      };
  }
};

const formatHours = (seconds: number): string => {
  const hours = seconds / 3600;
  return hours.toFixed(1) + 'h';
};

export const Dashboard = ({ tasks }: DashboardProps) => {
  const [period, setPeriod] = useState<PeriodType>('week');

  const filteredTasks = useMemo(() => {
    const { start, end } = getPeriodDates(period);
    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate >= start && taskDate <= end;
    });
  }, [tasks, period]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSeconds = filteredTasks.reduce((sum, t) => sum + t.duration, 0);
    const taskCount = filteredTasks.length;
    const avgDuration = taskCount > 0 ? totalSeconds / taskCount : 0;
    
    // Get unique days worked
    const uniqueDays = new Set(filteredTasks.map(t => t.date)).size;
    const avgPerDay = uniqueDays > 0 ? totalSeconds / uniqueDays : 0;

    return {
      totalSeconds,
      taskCount,
      avgDuration,
      uniqueDays,
      avgPerDay
    };
  }, [filteredTasks]);

  // Chart data - hours per day
  const chartData = useMemo(() => {
    const { start, end } = getPeriodDates(period);
    const dayMap: { [key: string]: number } = {};
    
    // Initialize days
    if (period !== 'all') {
      const current = new Date(start);
      while (current <= end) {
        const key = current.toISOString().split('T')[0];
        dayMap[key] = 0;
        current.setDate(current.getDate() + 1);
      }
    }
    
    // Fill with task data
    filteredTasks.forEach(task => {
      if (!dayMap[task.date]) dayMap[task.date] = 0;
      dayMap[task.date] += task.duration;
    });

    // Convert to array and format
    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // Last 14 days max
      .map(([date, seconds]) => ({
        date,
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        hours: seconds / 3600,
        seconds
      }));
  }, [filteredTasks, period]);

  // Top tasks by duration
  const topTasks = useMemo(() => {
    return [...filteredTasks]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
  }, [filteredTasks]);

  const periods: { value: PeriodType; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className="px-4 pb-24 safe-top pt-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Period Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              period === p.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-primary" />
            <span className="text-sm text-muted-foreground">Total Time</span>
          </div>
          <p className="text-2xl font-bold gradient-timer-text">
            {formatDuration(stats.totalSeconds)}
          </p>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-success" />
            <span className="text-sm text-muted-foreground">Tasks Done</span>
          </div>
          <p className="text-2xl font-bold text-success">
            {stats.taskCount}
          </p>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-warning" />
            <span className="text-sm text-muted-foreground">Avg/Task</span>
          </div>
          <p className="text-2xl font-bold text-warning">
            {formatHours(stats.avgDuration)}
          </p>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-accent" />
            <span className="text-sm text-muted-foreground">Avg/Day</span>
          </div>
          <p className="text-2xl font-bold text-accent">
            {formatHours(stats.avgPerDay)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-primary" />
          <h2 className="font-semibold">Hours per Day</h2>
        </div>
        
        {chartData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(val) => `${val}h`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.hours > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            No data for this period
          </div>
        )}
      </div>

      {/* Top Tasks */}
      <div className="glass rounded-2xl p-4">
        <h2 className="font-semibold mb-4">Top Tasks</h2>
        
        {topTasks.length > 0 ? (
          <div className="space-y-3">
            {topTasks.map((task, index) => (
              <div key={task.id} className="flex items-center gap-3">
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  index === 0 ? "bg-warning/20 text-warning" :
                  index === 1 ? "bg-muted-foreground/20 text-muted-foreground" :
                  index === 2 ? "bg-warning/10 text-warning/70" :
                  "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.taskName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(task.date)}</p>
                </div>
                <span className="text-sm font-mono font-semibold text-primary">
                  {formatDuration(task.duration)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No tasks yet
          </p>
        )}
      </div>
    </div>
  );
};
