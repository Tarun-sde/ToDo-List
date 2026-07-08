import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User as UserIcon, Mail, Calendar, CheckSquare, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuthStore } from '@/features/auth/authStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be at most 50 characters"),
  avatarUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});
const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type Summary = {
  completionRate: Record<string, number>;
};

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [profileSaving, setProfileSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  
  const [totalTasks, setTotalTasks] = useState<number | null>(null);

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name ?? '', avatarUrl: user?.avatarUrl ?? '' } });
  const pwForm = useForm({ resolver: zodResolver(pwSchema) });

  useEffect(() => {
    // Fetch summary to get total tasks created
    api.get('/analytics/summary')
      .then(({ data }) => {
        const done = data?.completionRate?.done ?? 0;
        const pending = (data?.completionRate?.todo ?? 0) + (data?.completionRate?.['in-progress'] ?? 0);
        setTotalTasks(done + pending);
      })
      .catch(() => setTotalTasks(0));
  }, []);

  const onProfile = async (data: { name: string; avatarUrl?: string }) => {
    setProfileSaving(true);
    try {
      const res = await api.put('/auth/profile', data);
      useAuthStore.setState({ user: res.data });
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Server error.');
    } finally {
      setProfileSaving(false);
    }
  };

  const onPw = async (data: any) => {
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.password
      });
      toast.success('Password updated successfully.');
      pwForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Server error.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition text-sm';
  
  const creationDate = user?.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : 'Unknown';

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold text-white">Profile</h1>
      
      {/* Profile Overview */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-violet-600/30 flex items-center justify-center text-violet-300 text-3xl font-bold shrink-0 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <p className="text-gray-400 flex items-center justify-center sm:justify-start gap-2 mt-1">
                <Mail size={16} /> {user?.email}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <Calendar size={16} className="text-violet-400" />
                <span>Joined {creationDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <CheckSquare size={16} className="text-violet-400" />
                <span>{totalTasks !== null ? totalTasks : '...'} Tasks Created</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-lg text-sm font-medium transition">
              <LogOut size={16} /> Logout
            </button>
            <button onClick={() => { toggleTheme(); toast.success('Theme updated.'); }} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-sm font-medium transition" title="Toggle theme">
              {theme === 'dark' ? <><Sun size={16} /> Light Theme</> : <><Moon size={16} /> Dark Theme</>}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile & Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <UserIcon size={18} className="text-violet-400" /> Edit Profile
          </h2>
          <form onSubmit={profileForm.handleSubmit(onProfile as Parameters<typeof profileForm.handleSubmit>[0])} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 font-medium block mb-1.5">Name</label>
              <input id="profile-name" {...profileForm.register('name')} className={inputCls} />
            </div>
            <div>
              <label className="text-sm text-gray-300 font-medium block mb-1.5">Avatar URL</label>
              <input id="profile-avatar" {...profileForm.register('avatarUrl')} className={inputCls} placeholder="https://…" />
            </div>
            {profileForm.formState.errors.name && <p className="text-red-400 text-xs mt-1">{profileForm.formState.errors.name.message as string}</p>}
            {profileForm.formState.errors.avatarUrl && <p className="text-red-400 text-xs mt-1">{profileForm.formState.errors.avatarUrl.message as string}</p>}
            <button id="save-profile-btn" type="submit" disabled={profileSaving}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
              {profileSaving && <Loader2 size={14} className="animate-spin" />}
              {profileSaving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Change password</h2>
          <form onSubmit={pwForm.handleSubmit(onPw as Parameters<typeof pwForm.handleSubmit>[0])} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 font-medium block mb-1.5">Current password</label>
              <input id="current-password" type="password" {...pwForm.register('currentPassword')} className={inputCls} />
              {pwForm.formState.errors.currentPassword && <p className="text-red-400 text-xs mt-1">{pwForm.formState.errors.currentPassword.message}</p>}
            </div>
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
            <button id="change-password-btn" type="submit" disabled={pwSaving}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
              {pwSaving && <Loader2 size={14} className="animate-spin" />}
              {pwSaving ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
