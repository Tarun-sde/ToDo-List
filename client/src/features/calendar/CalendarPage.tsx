import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type Task = { _id: string; title: string; dueDate: string; status: string; priority: string };

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [reschedule, setReschedule] = useState<{ taskId: string; date: string } | null>(null);
  const navigate = useNavigate();

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  useEffect(() => {
    api.get('/tasks', {
      params: {
        dueAfter: calStart.toISOString(),
        dueBefore: calEnd.toISOString(),
        limit: '200',
      },
    }).then(({ data }) => setTasks(data.tasks));
  }, [current]); // eslint-disable-line

  const tasksForDay = (day: Date) => tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));

  const handleReschedule = async (taskId: string, newDate: Date) => {
    const iso = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 12).toISOString();
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, dueDate: iso } : t));
    await api.put(`/tasks/${taskId}`, { dueDate: iso });
    setReschedule(null);
    setSelectedDay(null);
  };

  const PRIORITY_DOT: Record<string, string> = { low: 'bg-blue-500', medium: 'bg-amber-500', high: 'bg-red-500' };
  const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const selectedTasks = selectedDay ? tasksForDay(selectedDay) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{format(current, 'MMMM yyyy')}</h1>
        <div className="flex gap-2">
          <button id="prev-month" onClick={() => setCurrent(subMonths(current, 1))}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition">
            <ChevronLeft size={18} />
          </button>
          <button id="today-btn" onClick={() => setCurrent(new Date())}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white text-sm transition">
            Today
          </button>
          <button id="next-month" onClick={() => setCurrent(addMonths(current, 1))}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="text-center text-xs text-gray-600 font-medium py-2">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            {days.map(day => {
              const dayTasks = tasksForDay(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    'bg-[#0a0a0f] p-2 min-h-[80px] cursor-pointer transition-colors hover:bg-white/3',
                    !isSameMonth(day, current) && 'opacity-30',
                    isSelected && 'bg-violet-900/20',
                    reschedule && 'hover:bg-violet-900/30 cursor-crosshair',
                  )}
                >
                  <span className={cn(
                    'inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1',
                    isToday(day) ? 'bg-violet-600 text-white' : 'text-gray-400'
                  )}>
                    {format(day, 'd')}
                  </span>

                  {/* Task pills — max 3, then +N */}
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t._id}
                        onClick={e => {
                          e.stopPropagation();
                          if (reschedule) {
                            handleReschedule(reschedule.taskId, day);
                          } else {
                            navigate(`/tasks/${t._id}`);
                          }
                        }}
                        className="flex items-center gap-1 text-[10px] text-gray-300 bg-white/5 rounded px-1.5 py-0.5 truncate hover:bg-white/10">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_DOT[t.priority])} />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-gray-600 px-1.5">+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day panel */}
        {selectedDay && (
          <div className="w-72 shrink-0 bg-white/3 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">{format(selectedDay, 'EEE, MMM d')}</h3>
              <button onClick={() => setSelectedDay(null)} className="text-gray-500 hover:text-white transition">
                <X size={16} />
              </button>
            </div>
            {selectedTasks.length === 0 ? (
              <p className="text-gray-600 text-sm">No tasks this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedTasks.map(t => (
                  <div key={t._id} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('w-2 h-2 rounded-full', PRIORITY_DOT[t.priority])} />
                      <span className="text-white text-sm font-medium flex-1 truncate">{t.title}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/tasks/${t._id}`)}
                        className="text-xs text-violet-400 hover:text-violet-300 transition">Edit</button>
                      <button
                        id={`reschedule-${t._id}`}
                        onClick={() => setReschedule({ taskId: t._id, date: t.dueDate })}
                        className="text-xs text-gray-500 hover:text-white transition">Reschedule</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {reschedule && (
              <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                Click any day on the calendar to move this task there.
                <button onClick={() => setReschedule(null)} className="ml-2 underline">Cancel</button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
