import { create } from 'zustand'

interface AppState {
  token: string | null;
  activeProjectId: number | null;
  activeSceneId: number | null;
  isFocusMode: boolean;
  setToken: (token: string | null) => void;
  setActiveProject: (id: number | null) => void;
  setActiveScene: (id: number | null) => void;
  toggleFocusMode: (force?: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: localStorage.getItem('token') || null,
  activeProjectId: null,
  activeSceneId: null,
  isFocusMode: false,
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token })
  },
  
  
  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveScene: (id) => set({ activeSceneId: id }),
  toggleFocusMode: (force?: boolean) => set((state) => ({ 
    isFocusMode: force !== undefined ? force : !state.isFocusMode 
  })),
}))
