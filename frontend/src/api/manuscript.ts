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

export interface ManuscriptTree {
  book_id: number;
  title: string;
  chapters: Chapter[];
}

export const manuscriptApi = {
  getTree: async (): Promise<ManuscriptTree> => {
    const response = await apiClient.get<ManuscriptTree>('/manuscript/tree')
    return response.data
  },
  
  createChapter: async (actId: number, title: string): Promise<Chapter> => {
    const response = await apiClient.post<Chapter>('/manuscript/chapters', { act_id: actId, title })
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
