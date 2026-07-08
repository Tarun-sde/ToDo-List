import { format, isPast, isToday } from 'date-fns';
import { CheckCircle2, Circle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from './DashboardPage';

interface Props {
  task: Task;
  onToggle: () => void;
  onClick: () => void;
  priorityColor: string;
}

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-blue-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
};

export default function TaskListItem({ task, onToggle, onClick, priorityColor }: Props) {
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done' && !isToday(new Date(task.dueDate));
  const dueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div
      className={cn(
        'group flex items-center gap-3 bg-white/5 hover:bg-white/8 border rounded-xl px-4 py-3 cursor-pointer transition-all',
        task.status === 'done' ? 'border-white/5 opacity-60' : 'border-white/10'
      )}
      onClick={onClick}
    >
      {/* Checkbox */}
      <button
        id={`toggle-${task._id}`}
        onClick={e => { e.stopPropagation(); onToggle(); }}
        className="shrink-0 text-gray-500 hover:text-violet-400 transition-colors"
        aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.status === 'done'
          ? <CheckCircle2 size={20} className="text-violet-500" />
          : <Circle size={20} />}
      </button>

      {/* Priority dot */}
      <span className={cn('w-2 h-2 rounded-full shrink-0', PRIORITY_DOT[task.priority])} aria-label={`Priority: ${task.priority}`} />

      {/* Title */}
      <span className={cn('flex-1 text-sm font-medium truncate', task.status === 'done' ? 'line-through text-gray-500' : 'text-white')}>
        {task.title}
      </span>

      {/* Project badge */}
      {task.project && (
        <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-400">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color }} />
          {task.project.name}
        </span>
      )}

      {/* Due date */}
      {task.dueDate && (
        <span className={cn(
          'hidden sm:flex items-center gap-1 text-xs font-medium',
          overdue ? 'text-red-400' : dueToday ? 'text-amber-400' : 'text-gray-500'
        )}>
          <Calendar size={12} />
          {format(new Date(task.dueDate), 'MMM d')}
        </span>
      )}
    </div>
  );
}
