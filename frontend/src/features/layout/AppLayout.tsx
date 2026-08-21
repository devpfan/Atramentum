import { Outlet, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useAppStore } from '../../store/useAppStore';
import AssistantChat from '../ai/AssistantChat';
import { Bot, Menu } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import CommandPalette from './CommandPalette';

export default function AppLayout() {
  const token = useAppStore(state => state.token);
  const isFocusMode = useAppStore(state => state.isFocusMode);
  const toggleChat = useChatStore(state => state.toggleChat);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        const currentFocus = useAppStore.getState().isFocusMode;
        if (!currentFocus) {
          document.documentElement.requestFullscreen().catch(err => console.error(err));
          useAppStore.getState().toggleFocusMode(true);
        } else {
          if (document.fullscreenElement) document.exitFullscreen();
          useAppStore.getState().toggleFocusMode(false);
        }
      }
    };
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
         useAppStore.getState().toggleFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('focus-mode-retro');
    } else {
      document.body.classList.remove('focus-mode-retro');
    }
  }, [isFocusMode]);

  // Si no hay token, lo devolvemos al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`flex h-screen bg-[var(--color-background)] overflow-hidden text-[var(--color-text-primary)] ${isFocusMode ? 'focus-mode-active' : ''}`}>
      <CommandPalette />
      {!isFocusMode && <Sidebar mobileOpen={isMobileMenuOpen} setMobileOpen={setIsMobileMenuOpen} />}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Aquí va el header superior del área de trabajo */}
        {!isFocusMode && (
          <header className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-6 bg-[var(--color-background)]/95 backdrop-blur z-10 shrink-0">
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-sm font-medium text-[var(--color-text-secondary)] truncate max-w-[150px] md:max-w-none">Proyecto Activo / <span className="text-[var(--color-text-primary)]">Cap. 1</span></h2>
            </div>
            <button
              onClick={toggleChat}
              className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 md:px-3 py-1.5 rounded-lg shrink-0"
            >
              <Bot size={16} />
              <span className="hidden md:inline">Chat AtrIA</span>
            </button>
          </header>
        )}

        {/* Aquí se renderiza la vista activa (Manuscrito, Codex, etc) */}
        <div className={`flex-1 overflow-hidden relative ${isFocusMode ? 'p-0 flex justify-center bg-blue-900' : ''}`}>
          <Outlet />
        </div>
      </main>

      {/* Panel Asistente Lateral */}
      {!isFocusMode && <AssistantChat />}
    </div>
  );
}
