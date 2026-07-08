import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Flame, CheckCircle2, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/features/auth/authStore';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(1),
  avatarUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});
const pwSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type Summary = {
  completionRate: Record<string, number>;
  perWeek: { _id: number; year: number; count: number }[];
  byPriority: Record<string, number>;
  streak: number;
};

const PRIORITY_COLORS: Record<string, string> = { low: '#3b82f6', medium: '#f59e0b', high: '#ef4444' };
const DONUT_COLORS = ['#6366f1', '#374151'];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name ?? '', avatarUrl: user?.avatarUrl ?? '' } });
  const pwForm = useForm({ resolver: zodResolver(pwSchema) });

  useEffect(() => {
    api.get('/analytics/summary')
      .then(({ data }) => setSummary(data))
      .finally(() => setLoading(false));
  }, []);

  const onProfile = async (data: { name: string; avatarUrl?: string }) => {
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const res = await api.put('/api/auth/me', data).catch(() => api.patch('/auth/me', data));
      useAuthStore.setState({ user: res.data });
      setProfileMsg('Saved!');
    } catch {
      setProfileMsg('Failed to save.');
    } finally {
      setProfileSaving(false);
    }
  };

  const onPw = async (data: { password: string }) => {
    setPwSaving(true);
    setPwMsg('');
    try {
      await api.patch('/auth/me/password', { password: data.password });
      setPwMsg('Password updated!');
      pwForm.reset();
    } catch {
      setPwMsg('Failed to update password.');
    } finally {
      setPwSaving(false);
    }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-sm';

  // Prep chart data
  const done = summary?.completionRate?.done ?? 0;
  const pending = (summary?.completionRate?.todo ?? 0) + (summary?.completionRate?.['in-progress'] ?? 0);
  const donutData = [{ name: 'Done', value: done }, { name: 'Pending', value: pending }];
  const weekData = summary?.perWeek.map(w => ({ week: `W${w._id}`, count: w.count })) ?? [];
  const priorityData = Object.entries(summary?.byPriority ?? {}).map(([k, v]) => ({ name: k, count: v }));

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold text-white">Analytics & Profile</h1>

      {/* Profile section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Profile</h2>
          <form onSubmit={profileForm.handleSubmit(onProfile as Parameters<typeof profileForm.handleSubmit>[0])} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 font-medium block mb-1.5">Name</label>
              <input id="profile-name" {...profileForm.register('name')} className={inputCls} />
            </div>
            <div>
              <label className="text-sm text-gray-300 font-medium block mb-1.5">Avatar URL</label>
              <input id="profile-avatar" {...profileForm.register('avatarUrl')} className={inputCls} placeholder="https://…" />
            </div>
            {profileMsg && <p className={cn('text-sm', profileMsg.includes('!') ? 'text-green-400' : 'text-red-400')}>{profileMsg}</p>}
            <button id="save-profile-btn" type="submit" disabled={profileSaving}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
              {profileSaving && <Loader2 size={14} className="animate-spin" />}
              Save profile
            </button>
          </form>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Change password</h2>
          <form onSubmit={pwForm.handleSubmit(onPw as Parameters<typeof pwForm.handleSubmit>[0])} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 font-medium block mb-1.5">New password</label>
              <input id="new-password" type="password" {...pwForm.register('password')} className={inputCls} />
              {pwForm.formState.errors.password && <p className="text-red-400 text-xs mt-1">{pwForm.formState.errors.password.message}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-300 font-medium block mb-1.5">Confirm password</label>
              <input id="confirm-password" type="password" {...pwForm.register('confirm')} className={inputCls} />
              {pwForm.formState.errors.confirm && <p className="text-red-400 text-xs mt-1">{pwForm.formState.errors.confirm.message}</p>}
            </div>
            {pwMsg && <p className={cn('text-sm', pwMsg.includes('!') ? 'text-green-400' : 'text-red-400')}>{pwMsg}</p>}
            <button id="change-password-btn" type="submit" disabled={pwSaving}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
              {pwSaving && <Loader2 size={14} className="animate-spin" />}
              Update password
            </button>
          </form>
        </div>
      </div>

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
