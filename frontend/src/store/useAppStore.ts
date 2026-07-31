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
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/me', {
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
