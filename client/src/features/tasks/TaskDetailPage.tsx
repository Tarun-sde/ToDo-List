import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Check, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  project: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.enum(['Study', 'Work', 'Personal', 'Fitness', 'Shopping', 'Other']),
  dueDate: z.string().optional(),
  tags: z.string().optional(), // comma-separated
});
type FormData = z.infer<typeof schema>;

type Subtask = { _id?: string; title: string; completed: boolean };

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();

  const [projects, setProjects] = useState<{ _id: string; name: string; color: string }[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'todo', priority: 'medium', category: 'Personal' },
  });

  useEffect(() => {
    api.get('/projects').then(({ data }) => setProjects(data));
    if (!isNew) {
      api.get(`/tasks/${id}`).then(({ data }) => {
        reset({
          title: data.title,
          description: data.description ?? '',
          project: data.project?._id ?? '',
          status: data.status,
          priority: data.priority,
          category: data.category || 'Personal',
          dueDate: data.dueDate ? data.dueDate.slice(0, 10) : '',
          tags: data.tags?.join(', ') ?? '',
        });
        setSubtasks(data.subtasks ?? []);
        setLoading(false);
      });
    }
  }, [id]); // eslint-disable-line

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const payload = {
      ...data,
      project: data.project || null,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      subtasks,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    };
    try {
      if (isNew) await api.post('/tasks', payload);
      else await api.put(`/tasks/${id}`, payload);
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks(p => [...p, { title: newSubtask.trim(), completed: false }]);
    setNewSubtask('');
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-sm';
  const labelCls = 'block text-sm text-gray-300 font-medium mb-1.5';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="text-violet-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-white mb-8">{isNew ? 'New task' : 'Edit task'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label className={labelCls}>Title *</label>
          <input id="task-title" {...register('title')} className={inputCls} placeholder="What needs to be done?" />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea id="task-description" {...register('description')} rows={4} className={cn(inputCls, 'resize-none')} placeholder="Add details…" />
        </div>

        {/* Row: project + priority + status + category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Project</label>
            <select id="task-project" {...register('project')} className={inputCls}>
              <option value="">Inbox</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select id="task-category" {...register('category')} className={inputCls}>
              <option value="Study">Study</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Fitness">Fitness</option>
              <option value="Shopping">Shopping</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select id="task-priority" {...register('priority')} className={inputCls}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select id="task-status" {...register('status')} className={inputCls}>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        {/* Due date + tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Due date</label>
            <input id="task-due-date" type="date" {...register('dueDate')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input id="task-tags" {...register('tags')} className={inputCls} placeholder="design, frontend, bug" />
          </div>
        </div>

        {/* Subtasks */}
        <div>
          <label className={labelCls}>Subtasks</label>
          <div className="space-y-2 mb-3">
            {subtasks.map((st, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
                <button type="button" onClick={() => setSubtasks(p => p.map((s, j) => j === i ? { ...s, completed: !s.completed } : s))}
                  className={cn('shrink-0 transition-colors', st.completed ? 'text-violet-500' : 'text-gray-500 hover:text-violet-400')}>
                  {st.completed ? <Check size={16} /> : <div className="w-4 h-4 rounded border border-current" />}
                </button>
                <span className={cn('flex-1 text-sm', st.completed && 'line-through text-gray-500')}>{st.title}</span>
                <button type="button" onClick={() => setSubtasks(p => p.filter((_, j) => j !== i))}
                  className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              id="subtask-input"
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
              placeholder="Add subtask…"
              className={cn(inputCls, 'flex-1')}
            />
            <button type="button" id="add-subtask-btn" onClick={addSubtask}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 rounded-lg transition">
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-2.5 rounded-lg text-sm font-medium transition">
            Cancel
          </button>
          <button id="save-task-btn" type="submit" disabled={saving}
            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isNew ? 'Create task' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
