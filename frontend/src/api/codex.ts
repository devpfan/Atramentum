import { apiClient } from './client'

export interface CodexAlias {
  id: number;
  entry_id: number;
  alias_name: string;
}

export interface CodexEntry {
  id: number;
  name: string;
  category: string;
  description: string | null;
  attributes: Record<string, any>;
  aliases: CodexAlias[];
}

export const codexApi = {
  getAll: async (bookId: number): Promise<CodexEntry[]> => {
    const response = await apiClient.get<CodexEntry[]>('/codex/', { params: { book_id: bookId } })
    return response.data
  },
  getById: async (id: number): Promise<CodexEntry> => {
    const response = await apiClient.get<CodexEntry>(`/codex/${id}`)
    return response.data
  },
  create: async (data: any): Promise<CodexEntry> => {
    const response = await apiClient.post<CodexEntry>('/codex/', data)
    return response.data
  },
  update: async (id: number, data: any): Promise<CodexEntry> => {
    const response = await apiClient.put<CodexEntry>(`/codex/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/codex/${id}`)
  }
}
