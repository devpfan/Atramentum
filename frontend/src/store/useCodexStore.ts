import { create } from 'zustand'
import { codexApi } from '../api/codex'
import type { CodexEntry } from '../api/codex'

interface CodexState {
  entries: CodexEntry[];
  isLoading: boolean;
  error: string | null;
  fetchEntries: () => Promise<void>;
  createEntry: (data: any) => Promise<void>;
  updateEntry: (id: number, data: any) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  // Helper to extract all names/aliases mapping back to entries
  getAliasMap: () => Record<string, CodexEntry>;
}

export const useCodexStore = create<CodexState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,
  
  fetchEntries: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await codexApi.getAll()
      set({ entries: data, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  createEntry: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const newEntry = await codexApi.create(data)
      set({ entries: [...get().entries, newEntry], isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      throw err;
    }
  },

  updateEntry: async (id: number, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedEntry = await codexApi.update(id, data)
      set({ 
        entries: get().entries.map(e => e.id === id ? updatedEntry : e), 
        isLoading: false 
      })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      throw err;
    }
  },

  deleteEntry: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await codexApi.delete(id)
      set({ 
        entries: get().entries.filter(e => e.id !== id), 
        isLoading: false 
      })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      throw err;
    }
  },

  getAliasMap: () => {
    const map: Record<string, CodexEntry> = {}
    get().entries.forEach(entry => {
      if(entry.name) map[entry.name.toLowerCase()] = entry;
      if(entry.aliases) {
        entry.aliases.forEach(aliasObj => {
          if(aliasObj.alias_name) {
            map[aliasObj.alias_name.toLowerCase()] = entry;
          }
        })
      }
    })
    return map;
  }
}))
