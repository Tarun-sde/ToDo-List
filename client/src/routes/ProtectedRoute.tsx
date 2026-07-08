import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import api from '@/lib/api';

export function ProtectedRoute() {
  const { user, setAccessToken, logout } = useAuthStore();
  const [checking, setChecking] = useState(!user);

  useEffect(() => {
    if (user) return;
    // Try to get a new access token via the httpOnly refresh cookie
    api.post('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return api.get('/auth/me');
      })
      .then(({ data }) => useAuthStore.setState({ user: data }))
      .catch(() => logout())
      .finally(() => setChecking(false));
  }, []); // eslint-disable-line

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
