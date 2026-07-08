import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isBefore, startOfTomorrow, startOfDay } from 'date-fns';
import { Plus, Search, CheckCircle2, Circle, AlertCircle, Clock, Inbox } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import TaskListItem from './TaskListItem';

export type Task = {
  _id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  project?: { _id: string; name: string; color: string };
  completedAt?: string;
};

type Filter = 'today' | 'upcoming' | 'overdue' | 'all';

const PRIORITY_COLOR = { low: 'text-blue-400', medium: 'text-amber-400', high: 'text-red-400' };

export default function DashboardPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('today');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [quickAdd, setQuickAdd] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      const today = new Date();

      if (filter === 'today') {
        params.dueBefore = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
        params.dueAfter = startOfDay(today).toISOString();
      } else if (filter === 'upcoming') {
        params.dueAfter = startOfTomorrow().toISOString();
      } else if (filter === 'overdue') {
        params.dueBefore = startOfDay(today).toISOString();
        params.status = 'todo';
      }

      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdd.trim()) return;
    const { data } = await api.post('/tasks', { title: quickAdd.trim() });
    setQuickAdd('');
    setTasks(prev => [data, ...prev]);
  };

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    // Optimistic update
    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${task._id}/status`, { status: newStatus });
    } catch {
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: task.status } : t));
    }
  };

  const filters: { key: Filter; label: string; icon: React.ElementType }[] = [
    { key: 'today', label: 'Today', icon: Clock },
    { key: 'upcoming', label: 'Upcoming', icon: CheckCircle2 },
    { key: 'overdue', label: 'Overdue', icon: AlertCircle },
    { key: 'all', label: 'All', icon: Inbox },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <button id="new-task-btn" onClick={() => navigate('/tasks/new')}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
          <Plus size={16} /> New task
        </button>
      </div>

      {/* Quick add */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          id="quick-add-input"
          value={quickAdd}
          onChange={e => setQuickAdd(e.target.value)}
          placeholder="Quick add — type and press Enter…"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-sm"
        />
        <button type="submit" id="quick-add-submit"
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-2 rounded-lg transition">
          <Plus size={18} />
        </button>
      </form>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          id="search-input"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search tasks…"
          className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-sm"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {filters.map(({ key, label, icon: Icon }) => (
          <button key={key} id={`filter-${key}`}
            onClick={() => { setFilter(key); setPage(1); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all',
              filter === key ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
            )}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
          ))
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400 font-medium">No tasks here</p>
            <p className="text-gray-600 text-sm mt-1">
              {filter === 'today' ? "Nothing due today — enjoy the calm." : "Nothing to show for this filter."}
            </p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskListItem
              key={task._id}
              task={task}
              onToggle={() => handleToggle(task)}
              onClick={() => navigate(`/tasks/${task._id}`)}
              priorityColor={PRIORITY_COLOR[task.priority]}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm disabled:opacity-30 transition">
            Previous
          </button>
          <span className="px-4 py-2 text-gray-400 text-sm">{page} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm disabled:opacity-30 transition">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
