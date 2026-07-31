import { fetchAPI } from './base';
import { User } from '../store/useAppStore';

export interface GlobalSetting {
  key: string;
  value: string;
  description: string;
}

export const adminService = {
  // Users
  getUsers: () => fetchAPI<User[]>('/admin/users'),
  createUser: (data: any) => fetchAPI<User>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  toggleUserStatus: (userId: number) => fetchAPI<User>(`/admin/users/${userId}/status`, {
    method: 'PATCH'
  }),
  
  // Settings
  getSettings: () => fetchAPI<GlobalSetting[]>('/admin/settings'),
  updateSetting: (data: Partial<GlobalSetting>) => fetchAPI<GlobalSetting>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};
