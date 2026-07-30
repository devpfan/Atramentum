import { apiClient } from './client'

export interface Series {
  id: number;
  title: string;
  description?: string;
  user_id: number;
  created_at: string;
}

export const seriesApi = {
  getSeries: async (): Promise<Series[]> => {
    const response = await apiClient.get<Series[]>('/series')
    return response.data
  },

  createSeries: async (title: string, description?: string): Promise<Series> => {
    const response = await apiClient.post<Series>('/series', { title, description })
    return response.data
  },

  updateSeries: async (id: number, data: Partial<Series>): Promise<Series> => {
    const response = await apiClient.put<Series>(`/series/${id}`, data)
    return response.data
  },

  deleteSeries: async (id: number): Promise<void> => {
    await apiClient.delete(`/series/${id}`)
  }
}
