import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'

import AuthLayout from './features/auth/AuthLayout'
import LoginView from './features/auth/LoginView'
import RegisterView from './features/auth/RegisterView'
import AppLayout from './features/layout/AppLayout'

import ManuscriptEditor from './features/editor/ManuscriptEditor'
import CodexView from './features/codex/CodexView'

function App() {
  const token = useAppStore(state => state.token)

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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
