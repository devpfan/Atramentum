import { apiClient } from './client'

export interface Scene {
  id: number;
  chapter_id: number;
  title: string;
  order: number;
  content: string | null;
  beats: string[] | null;
  pov: string | null;
  status: string;
}

export interface Chapter {
  id: number;
  act_id: number;
  title: string;
  order: number;
  scenes: Scene[];
}

export interface Book {
  id: number;
  title: string;
  synopsis?: string;
  previous_titles?: string[];
  target_word_count: number;
  user_id: number;
  created_at: string;
}

export interface ManuscriptTree {
  book_id: number;
  title: string;
  chapters: Chapter[];
}

export const manuscriptApi = {
  getBooks: async (): Promise<Book[]> => {
    const response = await apiClient.get<Book[]>('/manuscript/books')
    return response.data
  },

  createBook: async (title: string, synopsis?: string): Promise<Book> => {
    const response = await apiClient.post<Book>('/manuscript/books', { title, synopsis })
    return response.data
  },

  updateBook: async (id: number, data: Partial<Book>): Promise<Book> => {
    const response = await apiClient.put<Book>(`/manuscript/books/${id}`, data)
    return response.data
  },

  deleteBook: async (id: number): Promise<void> => {
    await apiClient.delete(`/manuscript/books/${id}`)
  },

  getTree: async (bookId?: number): Promise<ManuscriptTree> => {
    const response = await apiClient.get<ManuscriptTree>('/manuscript/tree', {
      params: bookId ? { book_id: bookId } : {}
    })
    return response.data
  },
  
  createChapter: async (actId: number, title: string): Promise<Chapter> => {
    const response = await apiClient.post<Chapter>('/manuscript/chapters', { act_id: actId, title })
    return response.data
  },

  updateChapter: async (id: number, data: Partial<Chapter>): Promise<Chapter> => {
    const response = await apiClient.put<Chapter>(`/manuscript/chapters/${id}`, data)
    return response.data
  },

  createScene: async (chapterId: number, title: string): Promise<Scene> => {
    const response = await apiClient.post<Scene>('/manuscript/scenes', { chapter_id: chapterId, title })
    return response.data
  },

  updateScene: async (id: number, data: Partial<Scene>): Promise<Scene> => {
    const response = await apiClient.put<Scene>(`/scenes/${id}`, data)
    return response.data
  }
}
