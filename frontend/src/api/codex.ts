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
  getAll: async (): Promise<CodexEntry[]> => {
    const response = await apiClient.get<CodexEntry[]>('/codex/')
    return response.data
  }
}
