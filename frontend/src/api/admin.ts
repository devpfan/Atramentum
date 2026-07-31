import { apiClient } from './client';
import type { User } from '../store/useAppStore';

export interface GlobalSetting {
  key: string;
  value: string;
  description: string;
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
  }
};
