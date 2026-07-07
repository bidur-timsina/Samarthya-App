import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string>; // returns role
  logout: () => void;
  setUser: (user: User) => void;
  fetchMe: () => Promise<void>;
}

const TOKEN_OPTS = { secure: false, sameSite: 'Lax' as const };

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        Cookies.set('accessToken',  data.accessToken,  { ...TOKEN_OPTS, expires: 1 / 96 });
        Cookies.set('refreshToken', data.refreshToken, { ...TOKEN_OPTS, expires: 7 });
        const me = await api.get('/users/me');
        set({ user: me.data, isAuthenticated: true });
        return me.data.role as string;
      },

      logout: () => {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) api.post('/auth/logout', { refreshToken }).catch(() => {});
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        set({ user: null, isAuthenticated: false });
        window.location.href = '/login';
      },

      setUser: (user) => set({ user, isAuthenticated: true }),

      fetchMe: async () => {
        try {
          const { data } = await api.get('/users/me');
          set({ user: data, isAuthenticated: true });
        } catch {
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'shubhayatra-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
);
