import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Plus } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

type Task = { _id: string; title: string; status: 'todo' | 'in-progress' | 'done'; priority: 'low' | 'medium' | 'high' };
type Col = 'todo' | 'in-progress' | 'done';
const COLS: { id: Col; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];
const PRIORITY_DOT: Record<string, string> = { low: 'bg-blue-500', medium: 'bg-amber-500', high: 'bg-red-500' };

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 cursor-grab select-none',
        isDragging && 'opacity-50'
      )}>
      <div className="flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full shrink-0', PRIORITY_DOT[task.priority])} />
        <span className="text-white text-sm font-medium">{task.title}</span>
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<{ name: string; color: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetch = useCallback(async () => {
    const [{ data: proj }, { data: taskData }] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get('/tasks', { params: { project: id, limit: '100' } }),
    ]);
    // Handle list response from GET /projects/:id — may not exist; use list endpoint
    setProject(proj);
    setTasks(taskData.tasks);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const col = (s: Col) => tasks.filter(t => t.status === s);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTask(tasks.find(t => t._id === e.active.id as string) ?? null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target column from overId (could be col id or task id)
    const targetCol = (COLS.map(c => c.id) as string[]).includes(overId)
      ? overId as Col
      : tasks.find(t => t._id === overId)?.status;

    if (!targetCol) return;
    const task = tasks.find(t => t._id === activeId);
    if (!task || task.status === targetCol) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t._id === activeId ? { ...t, status: targetCol } : t));
    try {
      await api.patch(`/tasks/${activeId}/status`, { status: targetCol });
    } catch {
      setTasks(prev => prev.map(t => t._id === activeId ? { ...t, status: task.status } : t));
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/projects')} className="text-gray-400 hover:text-white transition">
          <ArrowLeft size={20} />
        </button>
        {project && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
          </div>
        )}
        <button onClick={() => navigate('/tasks/new')}
          className="ml-auto flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={14} /> Add task
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
          {COLS.map(({ id: colId, label }) => (
            <div key={colId} id={`col-${colId}`}
              className="bg-white/3 border border-white/5 rounded-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-gray-300 font-semibold text-sm">{label}</span>
                <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{col(colId).length}</span>
              </div>
              {/* Drop zone */}
              <SortableContext items={col(colId).map(t => t._id)} strategy={verticalListSortingStrategy} id={colId}>
                <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[120px]">
                  {col(colId).map(task => <TaskCard key={task._id} task={task} />)}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-[#0d0d14] border border-violet-500/50 rounded-xl px-4 py-3 shadow-2xl shadow-violet-500/20">
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', PRIORITY_DOT[activeTask.priority])} />
                <span className="text-white text-sm font-medium">{activeTask.title}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
