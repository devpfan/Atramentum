import { apiClient } from './client'

export interface AiPersona {
  id: string;
  name: string;
  prompt: string;
}

export interface AiSettings {
  provider?: string;
  openai_api_key?: string;
  gemini_api_key?: string;
  local_url?: string;
  local_model?: string;
  custom_personas?: AiPersona[];
}

export const aiApi = {
  getSettings: async (): Promise<AiSettings> => {
    const response = await apiClient.get<AiSettings>('/ai/settings');
    return response.data;
  },
  updateSettings: async (settings: AiSettings): Promise<AiSettings> => {
    const response = await apiClient.put<AiSettings>('/ai/settings', settings);
    return response.data;
  },
  getLocalModels: async (url?: string): Promise<{ models: string[]; error?: string }> => {
    const response = await apiClient.get<{ models: string[]; error?: string }>(`/ai/local-models`, {
      params: url ? { url } : undefined
    });
    return response.data;
  }
}
