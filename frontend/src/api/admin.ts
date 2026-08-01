import { apiClient } from './client';
import type { User } from '../store/useAppStore';

export interface GlobalSetting {
  key: string;
  value: string;
  description: string;
}

export interface AIProviderStatus {
  name: string;
  configured: boolean;
  source: 'db' | 'env' | 'none';
  masked_key?: string | null;
  model?: string;
  url?: string;
}

export interface AIStatusResponse {
  active_provider: string;
  active_model: string;
  providers: {
    gemini: AIProviderStatus;
    openai: AIProviderStatus;
    anthropic: AIProviderStatus;
    local: AIProviderStatus;
  };
}

export interface AITestResponse {
  ok: boolean;
  provider: string;
  model: string;
  latency_ms: number;
  message?: string;
  error?: string;
}

export const adminService = {
  // Users
  getUsers: async () => {
    const res = await apiClient.get<User[]>('/admin/users');
    return res.data;
  },
  createUser: async (data: any) => {
    const res = await apiClient.post<User>('/admin/users', data);
    return res.data;
  },
  toggleUserStatus: async (userId: number) => {
    const res = await apiClient.patch<User>(`/admin/users/${userId}/status`);
    return res.data;
  },
  
  // Settings
  getSettings: async () => {
    const res = await apiClient.get<GlobalSetting[]>('/admin/settings');
    return res.data;
  },
  updateSetting: async (data: Partial<GlobalSetting>) => {
    const res = await apiClient.put<GlobalSetting>('/admin/settings', data);
    return res.data;
  },

  // AI Status & Test
  getAiStatus: async () => {
    const res = await apiClient.get<AIStatusResponse>('/admin/ai-status');
    return res.data;
  },
  testAiConnection: async (data?: { provider?: string; api_key?: string; local_url?: string; local_model?: string }) => {
    const res = await apiClient.post<AITestResponse>('/admin/ai-test', data || {});
    return res.data;
  }
};
