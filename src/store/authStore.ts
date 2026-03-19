import { create } from 'zustand';
import api from '../services/api';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  landline?: string;
  email?: string;
  role: string;
  pharmacyName?: string;
  pharmacyLocation?: string;
  pharmacyLocationDetails?: string;
  licenseImage?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loaded: boolean;
  login: (identity: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null, token: null, loaded: false,

  loadFromStorage: () => {
    const token = localStorage.getItem('token');
    const user  = localStorage.getItem('user');
    set({ token: token || null, user: user ? JSON.parse(user) : null, loaded: true });
  },

  login: async (identity, password) => {
    const { data } = await api.post('/auth/login', { identity, password, role: 'pharmacist' });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
  },

  register: async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  updateProfile: async (formData) => {
    const { data } = await api.put('/auth/profile', formData);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user });
  },
}));