import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Flame } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

type Summary = {
  completionRate: Record<string, number>;
  perWeek: { _id: number; year: number; count: number }[];
  byPriority: Record<string, number>;
  streak: number;
};

const PRIORITY_COLORS: Record<string, string> = { low: '#3b82f6', medium: '#f59e0b', high: '#ef4444' };
const DONUT_COLORS = ['#6366f1', '#374151'];

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/summary')
      .then(({ data }) => setSummary(data))
      .finally(() => setLoading(false));
  }, []);

  // Prep chart data
  const done = summary?.completionRate?.done ?? 0;
  const pending = (summary?.completionRate?.todo ?? 0) + (summary?.completionRate?.['in-progress'] ?? 0);
  const donutData = [{ name: 'Done', value: done }, { name: 'Pending', value: pending }];
  const weekData = summary?.perWeek.map(w => ({ week: `W${w._id}`, count: w.count })) ?? [];
  const priorityData = Object.entries(summary?.byPriority ?? {}).map(([k, v]) => ({ name: k, count: v }));

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      {/* Stats row */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Done', value: done, color: 'text-violet-400' },
              { label: 'Pending', value: pending, color: 'text-amber-400' },
              { label: 'Total', value: done + pending, color: 'text-white' },
              { label: 'Streak', value: summary.streak, suffix: ' days', color: 'text-orange-400', icon: Flame },
            ].map(({ label, value, color, suffix = '', icon: Icon }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                {Icon && <Icon size={24} className={cn('mx-auto mb-2', color)} />}
                <p className={cn('text-3xl font-bold', color)}>{value}{suffix}</p>
                <p className="text-gray-500 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Completion donut */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Completion rate</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donutData} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                    {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                  <Legend formatter={v => <span className="text-gray-300 text-sm">{v}</span>} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Priority breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">By priority</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityData} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} width={60} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={PRIORITY_COLORS[entry.name] ?? '#6366f1'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly bar */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Tasks completed per week (last 8 weeks)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekData}>
                <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
