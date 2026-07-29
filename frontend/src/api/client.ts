import axios from 'axios'
import { useAppStore } from '../store/useAppStore'

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
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
