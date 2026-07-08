import { create } from 'zustand';
import api from '@/lib/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setAccessToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,

  setAccessToken: (token) => set({ accessToken: token }),

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    set({ user: data.user, accessToken: data.accessToken });
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    set({ user: data.user, accessToken: data.accessToken });
  },

  logout: async () => {
    await api.post('/auth/logout').catch(() => {});
    set({ user: null, accessToken: null });
  },

  fetchMe: async () => {
    const { data } = await api.get('/auth/me');
    set({ user: data });
  },
}));
