import { create } from 'zustand'
import { manuscriptApi } from '../api/manuscript'
import type { ManuscriptTree } from '../api/manuscript'

interface ManuscriptState {
  tree: ManuscriptTree | null;
  activeSceneId: number | null;
  isLoading: boolean;
  error: string | null;
  
  fetchTree: () => Promise<void>;
  setActiveSceneId: (id: number | null) => void;
  createChapter: () => Promise<void>;
  createScene: (chapterId: number, title: string) => Promise<void>;
  updateActiveSceneContent: (content: string) => Promise<void>;
}

export const useManuscriptStore = create<ManuscriptState>((set, get) => ({
  tree: null,
  activeSceneId: null,
  isLoading: false,
  error: null,
  
  fetchTree: async () => {
    set({ isLoading: true, error: null })
    try {
      const tree = await manuscriptApi.getTree()
      let activeId = get().activeSceneId;
      if (!activeId && tree.chapters.length > 0 && tree.chapters[0].scenes.length > 0) {
        activeId = tree.chapters[0].scenes[0].id;
      }
      set({ tree, activeSceneId: activeId, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  setActiveSceneId: (id: number | null) => {
    set({ activeSceneId: id });
  },

  createChapter: async () => {
    const { tree } = get();
    if (!tree) return;
    try {
      console.warn("Chapter creation not fully implemented without act_id");
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  createScene: async (chapterId: number, title: string) => {
    try {
      await manuscriptApi.createScene(chapterId, title);
      await get().fetchTree(); // Refresh tree
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  updateActiveSceneContent: async (content: string) => {
    const { activeSceneId, tree } = get();
    if (!activeSceneId || !tree) return;
    
    // Optimistic update
    const newTree = { ...tree };
    let found = false;
    for (const chapter of newTree.chapters) {
      for (const scene of chapter.scenes) {
        if (scene.id === activeSceneId) {
          scene.content = content;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    set({ tree: newTree });

    // Background sync
    try {
      await manuscriptApi.updateScene(activeSceneId, { content });
    } catch (err: any) {
      console.error("Error saving scene:", err);
    }
  }
}))
