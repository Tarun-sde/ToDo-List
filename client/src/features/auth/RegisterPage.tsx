import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { useState } from 'react';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await registerUser(data.name, data.email, data.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setServerError(msg ?? 'Registration failed. Please try again.');
    }
  };

  const Field = ({ id, label, type = 'text', placeholder, reg, error }: {
    id: string; label: string; type?: string; placeholder: string;
    reg: ReturnType<typeof register>; error?: string;
  }) => (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm text-gray-300 font-medium">{label}</label>
      <input id={id} type={type} placeholder={placeholder} autoComplete={type === 'password' ? 'new-password' : undefined}
        {...reg}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-lg">T</div>
            <span className="text-2xl font-bold text-white">TaskFlow</span>
          </div>
          <p className="text-gray-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-5">
          {serverError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{serverError}</div>
          )}
          <Field id="reg-name" label="Name" placeholder="Ada Lovelace" reg={register('name')} error={errors.name?.message} />
          <Field id="reg-email" label="Email" type="email" placeholder="you@example.com" reg={register('email')} error={errors.email?.message} />
          <Field id="reg-password" label="Password" type="password" placeholder="min. 8 characters" reg={register('password')} error={errors.password?.message} />
          <Field id="reg-confirm" label="Confirm password" type="password" placeholder="••••••••" reg={register('confirm')} error={errors.confirm?.message} />

          <button id="register-submit" type="submit" disabled={isSubmitting}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
            {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
