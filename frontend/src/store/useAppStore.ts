import { create } from 'zustand'

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
}

interface AppState {
  token: string | null;
  user: User | null;
  activeProjectId: number | null;
  activeSceneId: number | null;
  isFocusMode: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  setActiveProject: (id: number | null) => void;
  setActiveScene: (id: number | null) => void;
  toggleFocusMode: (force?: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  activeProjectId: null,
  activeSceneId: null,
  isFocusMode: false,
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
      set({ user: null })
    }
    set({ token })
  },
  
  setUser: (user) => set({ user }),
  
  fetchUser: async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`;
      const response = await fetch(`${baseUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const userData = await response.json();
        set({ user: userData });
      } else if (response.status === 401) {
        set({ token: null, user: null });
        localStorage.removeItem('token');
      }
    } catch (e) {
      console.error("Error fetching user", e);
    }
  },
  
  
  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveScene: (id) => set({ activeSceneId: id }),
  toggleFocusMode: (force?: boolean) => set((state) => ({ 
    isFocusMode: force !== undefined ? force : !state.isFocusMode 
  })),
}))
