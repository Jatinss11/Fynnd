import { create } from 'zustand';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'client';
  company?: string;
  city?: string;
  phone?: string;
  avatar?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('fynnd_token', token);
    localStorage.setItem('fynnd_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('fynnd_token');
    localStorage.removeItem('fynnd_user');
    set({ user: null, token: null });
  },
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('fynnd_token');
    const userStr = localStorage.getItem('fynnd_user');
    if (token && userStr) {
      try { set({ token, user: JSON.parse(userStr) }); } catch {}
    }
  },
}));
