import { create } from 'zustand'
import { codexApi } from '../api/codex'
import type { CodexEntry } from '../api/codex'

interface CodexState {
  entries: CodexEntry[];
  isLoading: boolean;
  error: string | null;
  fetchEntries: () => Promise<void>;
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
