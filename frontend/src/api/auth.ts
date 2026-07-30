import { apiClient } from './client'
import type { LoginCredentials, RegisterCredentials, AuthResponse, RegisterResponse } from '../types/auth'

export interface AISettings {
  provider: string;
  gemini_key?: string;
  openai_key?: string;
  anthropic_key?: string;
  local_url?: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // OAuth2 requiere x-www-form-urlencoded
    const formData = new URLSearchParams()
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)
    
    const response = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    return response.data
  },

  register: async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', credentials)
    return response.data
  },

  getAISettings: async (): Promise<AISettings> => {
    const response = await apiClient.get<AISettings>('/auth/me/ai-settings')
    return response.data
  },

  updateAISettings: async (settings: AISettings): Promise<AISettings> => {
    const response = await apiClient.put<AISettings>('/auth/me/ai-settings', settings)
    return response.data
  }
}
