import { apiClient } from './client'
import type { LoginCredentials, RegisterCredentials, AuthResponse, RegisterResponse } from '../types/auth'

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
  }
}
