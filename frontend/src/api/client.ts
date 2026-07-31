import axios from 'axios'
import { useAppStore } from '../store/useAppStore'

export const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inyectar el token JWT automáticamente en todas las peticiones
apiClient.interceptors.request.use((config) => {
  const token = useAppStore.getState().token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
