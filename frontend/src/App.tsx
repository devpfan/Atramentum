import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { useSettingsStore } from './store/useSettingsStore'

import AuthLayout from './features/auth/AuthLayout'
import LoginView from './features/auth/LoginView'
import RegisterView from './features/auth/RegisterView'
import AppLayout from './features/layout/AppLayout'

import ManuscriptEditor from './features/editor/ManuscriptEditor'
import CodexView from './features/codex/CodexView'
import HelpView from './features/help/HelpView'

import AdminLayout from './features/admin/AdminLayout'
import AdminUsersView from './features/admin/AdminUsersView'
import AdminSettingsView from './features/admin/AdminSettingsView'

function App() {
  const token = useAppStore(state => state.token)
  const fetchUser = useAppStore(state => state.fetchUser)
  const theme = useSettingsStore(state => state.theme)

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'sepia', 'ocean', 'forest', 'rose', 'lavender');
    if (theme !== 'light') {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token, fetchUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirección Base */}
        <Route path="/" element={<Navigate to={token ? "/app" : "/login"} replace />} />

        {/* Rutas de Autenticación */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
        </Route>

        {/* Rutas Protegidas de la Aplicación */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<ManuscriptEditor />} />
          <Route path="codex" element={<CodexView />} />
          <Route path="help" element={<HelpView />} />
        </Route>

        {/* Rutas del Administrador */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminUsersView />} />
          <Route path="settings" element={<AdminSettingsView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
