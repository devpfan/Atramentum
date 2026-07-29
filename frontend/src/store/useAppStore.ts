import { create } from 'zustand'

interface AppState {
  token: string | null;
  activeProjectId: number | null;
  activeSceneId: number | null;
  setToken: (token: string | null) => void;
  setActiveProject: (id: number | null) => void;
  setActiveScene: (id: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: localStorage.getItem('token') || null,
  activeProjectId: null,
  activeSceneId: null,
  
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
}))
