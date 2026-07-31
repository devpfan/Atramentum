import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppStore } from '../../store/useAppStore';
import AssistantChat from '../ai/AssistantChat';
import { Bot } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

export default function AppLayout() {
  const token = useAppStore(state => state.token);
  const toggleChat = useChatStore(state => state.toggleChat);

  // Si no hay token, lo devolvemos al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden text-[var(--color-text-primary)]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Aquí va el header superior del área de trabajo */}
        <header className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-6 bg-[var(--color-background)]/95 backdrop-blur z-10">
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)]">Proyecto Activo / <span className="text-[var(--color-text-primary)]">Capítulo 1</span></h2>
          <button
            onClick={toggleChat}
            className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg"
          >
            <Bot size={16} />
            Chat AtrIA
          </button>
        </header>

        {/* Aquí se renderiza la vista activa (Manuscrito, Codex, etc) */}
        <div className="flex-1 overflow-auto p-6 relative">
          <Outlet />
        </div>
      </main>

      {/* Panel Asistente Lateral */}
      <AssistantChat />
    </div>
  );
}
