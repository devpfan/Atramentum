import { apiClient } from './client'

export type ProjectType = 'novel' | 'screenplay' | 'manga';

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
  project_type: ProjectType;
  user_id: number;
  created_at: string;
  series_id?: number;
}

export interface ManuscriptTree {
  book_id: number;
  title: string;
  project_type: ProjectType;
  chapters: Chapter[];
}

export const manuscriptApi = {
  getBooks: async (): Promise<Book[]> => {
    const response = await apiClient.get<Book[]>('/manuscript/books')
    return response.data
  },

  createBook: async (title: string, synopsis?: string, project_type: ProjectType = 'novel', series_id?: number): Promise<Book> => {
    const response = await apiClient.post<Book>('/manuscript/books', { title, synopsis, project_type, series_id })
    return response.data
  },

  exportBook: async (id: number, format: 'md' | 'docx' | 'pdf' | 'epub'): Promise<Blob> => {
    const response = await apiClient.get(`/manuscript/books/${id}/export`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },
  
  importBook: async (file: File): Promise<ManuscriptTree> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<ManuscriptTree>('/manuscript/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  updateBook: async (id: number, data: Partial<Book>): Promise<Book> => {
    const response = await apiClient.put<Book>(`/manuscript/books/${id}`, data)
    return response.data
  },

  deleteBook: async (id: number): Promise<void> => {
    await apiClient.delete(`/manuscript/books/${id}`)
  },

  reorderTree: async (bookId: number, items: { id: number, type: string, order: number, parent_id?: number }[]): Promise<void> => {
    await apiClient.put(`/manuscript/books/${bookId}/reorder`, { items })
  },

  getTree: async (bookId?: number): Promise<ManuscriptTree> => {
    const response = await apiClient.get<ManuscriptTree>('/manuscript/tree', {
      params: bookId ? { book_id: bookId } : {}
    })
    return response.data
  },
  
  createChapter: async (params: { actId?: number, bookId?: number, title: string }): Promise<Chapter> => {
    const response = await apiClient.post<Chapter>('/manuscript/chapters', {
      act_id: params.actId,
      book_id: params.bookId,
      title: params.title
    })
    return response.data
  },

  updateChapter: async (id: number, data: Partial<Chapter>): Promise<Chapter> => {
    const response = await apiClient.put<Chapter>(`/manuscript/chapters/${id}`, data)
    return response.data
  },

  deleteChapter: async (id: number): Promise<void> => {
    await apiClient.delete(`/manuscript/chapters/${id}`)
  },

  createScene: async (chapterId: number, title: string): Promise<Scene> => {
    const response = await apiClient.post<Scene>('/manuscript/scenes', { chapter_id: chapterId, title })
    return response.data
  },

  updateScene: async (id: number, data: Partial<Scene>): Promise<Scene> => {
    const response = await apiClient.put<Scene>(`/manuscript/scenes/${id}`, data)
    return response.data
  },

  deleteScene: async (id: number): Promise<void> => {
    await apiClient.delete(`/manuscript/scenes/${id}`)
  },

  uploadSceneImage: async (sceneId: number, file: File): Promise<{ image_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ image_url: string }>(`/manuscript/scenes/${sceneId}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
}
