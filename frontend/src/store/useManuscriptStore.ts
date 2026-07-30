import { create } from 'zustand'
import { manuscriptApi } from '../api/manuscript'
import type { ManuscriptTree, Scene, Book, Chapter } from '../api/manuscript'

interface ManuscriptState {
  books: Book[];
  activeBookId: number | null;
  tree: ManuscriptTree | null;
  activeSceneId: number | null;
  isLoading: boolean;
  error: string | null;
  
  fetchBooks: () => Promise<void>;
  setActiveBookId: (id: number | null) => void;
  fetchTree: () => Promise<void>;
  createBook: (title: string, synopsis?: string) => Promise<void>;
  updateBook: (id: number, data: Partial<Book>) => Promise<void>;
  deleteBook: (id: number) => Promise<void>;
  setActiveSceneId: (id: number | null) => void;
  createChapter: () => Promise<void>;
  updateChapter: (id: number, data: Partial<Chapter>) => Promise<void>;
  createScene: (chapterId: number, title: string) => Promise<void>;
  updateActiveScene: (data: Partial<Scene>) => Promise<void>;
  updateScene: (id: number, data: Partial<Scene>) => Promise<void>;
}

export const useManuscriptStore = create<ManuscriptState>((set, get) => ({
  books: [],
  activeBookId: null,
  tree: null,
  activeSceneId: null,
  isLoading: false,
  error: null,
  
  fetchBooks: async () => {
    try {
      const books = await manuscriptApi.getBooks();
      set({ books });
      if (books.length > 0 && !get().activeBookId) {
        set({ activeBookId: books[0].id });
      }
    } catch (err: any) {
      console.error(err);
    }
  },

  setActiveBookId: (id: number | null) => {
    set({ activeBookId: id, tree: null, activeSceneId: null });
    if (id) get().fetchTree();
  },

  createBook: async (title: string, synopsis?: string) => {
    try {
      const newBook = await manuscriptApi.createBook(title, synopsis);
      set({ books: [newBook, ...get().books], activeBookId: newBook.id, tree: null, activeSceneId: null });
      get().fetchTree();
    } catch (err: any) {
      console.error(err);
    }
  },

  fetchTree: async () => {
    set({ isLoading: true, error: null })
    try {
      const activeBookId = get().activeBookId;
      const tree = await manuscriptApi.getTree(activeBookId || undefined)
      let activeId = get().activeSceneId;
      if (!activeId && tree.chapters.length > 0 && tree.chapters[0].scenes.length > 0) {
        activeId = tree.chapters[0].scenes[0].id;
      }
      set({ tree, activeSceneId: activeId, isLoading: false })
      if (!get().activeBookId) {
        set({ activeBookId: tree.book_id });
      }
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

  updateBook: async (id: number, data: Partial<Book>) => {
    try {
      const updatedBook = await manuscriptApi.updateBook(id, data);
      const newBooks = get().books.map(b => b.id === id ? updatedBook : b);
      set({ books: newBooks });
      if (get().activeBookId === id && get().tree) {
        set({ tree: { ...get().tree!, title: updatedBook.title } });
      }
    } catch (err: any) {
      console.error("Error updating book:", err);
    }
  },

  deleteBook: async (id: number) => {
    try {
      await manuscriptApi.deleteBook(id);
      const newBooks = get().books.filter(b => b.id !== id);
      set({ books: newBooks });
      if (get().activeBookId === id) {
        if (newBooks.length > 0) {
          get().setActiveBookId(newBooks[0].id);
        } else {
          get().setActiveBookId(null);
        }
      }
    } catch (err: any) {
      console.error("Error deleting book:", err);
    }
  },

  updateChapter: async (id: number, data: Partial<Chapter>) => {
    try {
      await manuscriptApi.updateChapter(id, data);
      await get().fetchTree(); // Refresh tree
    } catch (err: any) {
      console.error("Error updating chapter:", err);
    }
  },

  updateScene: async (id: number, data: Partial<Scene>) => {
    try {
      await manuscriptApi.updateScene(id, data);
      await get().fetchTree(); // Refresh tree
    } catch (err: any) {
      console.error("Error updating scene:", err);
    }
  },

  updateActiveScene: async (data: Partial<Scene>) => {
    const { activeSceneId, tree } = get();
    if (!activeSceneId || !tree) return;
    
    // Optimistic update
    const newTree = { ...tree };
    let found = false;
    for (const chapter of newTree.chapters) {
      for (const scene of chapter.scenes) {
        if (scene.id === activeSceneId) {
          Object.assign(scene, data);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    set({ tree: newTree });

    // Background sync
    try {
      await manuscriptApi.updateScene(activeSceneId, data);
    } catch (err: any) {
      console.error("Error saving scene:", err);
    }
  }
}))
